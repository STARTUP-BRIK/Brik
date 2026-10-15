// Avisos por e-mail de oportunidades novas (um e-mail por anúncio).
//
// Quem recebe: quem acompanha o modelo do anúncio (public.interesses_notificacao,
// ids de Front-end/src/config/modelos.js) e ligou o nível dele na tela de
// Notificações (public.configuracoes.notificacoes: chaves boa, otima,
// extraordinaria). No plano Free, só das ofertas que o feed dele mostra
// (ofertas_liberadas). Cada pessoa recebe no máximo um e-mail por anúncio
// (public.notificacoes_enviadas).
//
// Envio pelo Resend (RESEND_API_KEY). Sem a chave, o passo é pulado. Falha aqui
// nunca derruba a raspagem: o worker só registra no log.

const path = require('path');
const { pathToFileURL } = require('url');

const RESEND_API_URL = 'https://api.resend.com/emails';
const REMETENTE = process.env.NOTIFICACAO_REMETENTE || 'Brik <alertas@alertas.brik.app.br>';
const SITE = 'https://brik.app.br';
// O Resend aceita poucas requisições por segundo; um envio a cada 600 ms fica abaixo.
const INTERVALO_ENVIO_MS = 600;
const LOTE_IN = 40; // mesmo limite de .in() do worker (headers overflow acima disso)

// Mesmo padrão da tela de Notificações (usePreferenciasStore): quem nunca mexeu
// recebe ótimo e extraordinário; bom negócio é volume alto demais para e-mail.
const NIVEIS_PADRAO = { boa: false, otima: true, extraordinaria: true };
const PLANOS_PAGOS = ['pro', 'intermedium'];
const ROTULO_NIVEL = { boa: 'Bom negócio', otima: 'Ótimo negócio', extraordinaria: 'Negócio extraordinário' };

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function emLotes(lista, tamanho = LOTE_IN) {
    const lotes = [];
    for (let i = 0; i < lista.length; i += tamanho) lotes.push(lista.slice(i, i + tamanho));
    return lotes;
}

// variant do banco -> id do modelo em config/modelos.js. iPhone: o modelo é o
// prefixo mais longo seguido da capacidade ('iphone-13-pro-max-256gb' ->
// 'iphone-13-pro-max'; 'iphone-16e-128gb' não casa com 'iphone-16'). Console:
// a lista `variantes` de cada modelo.
let modeloDoVariantPromise;
function carregarModeloDoVariant() {
    if (!modeloDoVariantPromise) {
        const arquivo = path.join(__dirname, '..', 'Front-end', 'src', 'config', 'modelos.js');
        modeloDoVariantPromise = import(pathToFileURL(arquivo).href).then(({ MODELOS, idsDaCategoria }) => {
            const consoles = new Map();
            for (const grupo of MODELOS.videogame_console ?? []) {
                for (const modelo of grupo.modelos) {
                    for (const variante of modelo.variantes ?? []) consoles.set(variante, modelo.id);
                }
            }
            const iphones = idsDaCategoria('iphone').sort((a, b) => b.length - a.length);

            return (category, variant) => {
                if (!variant) return null;
                if (category === 'videogame_console') return consoles.get(variant) ?? null;
                if (category === 'iphone') {
                    return iphones.find((id) => variant === id || (variant.startsWith(`${id}-`) && /^\d/.test(variant.slice(id.length + 1)))) ?? null;
                }
                return null;
            };
        });
    }
    return modeloDoVariantPromise;
}

const formatarPreco = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const escaparHtml = (texto) => String(texto ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function montarEmail(anuncio) {
    const nivel = ROTULO_NIVEL[anuncio.opportunity_level];
    const preco = formatarPreco(anuncio.price);
    // profit_pct: lucro sobre o preço pago, revendendo pela mediana de mercado.
    const lucro = anuncio.profit_pct != null ? `Lucro estimado de ${Math.round(Number(anuncio.profit_pct))}% na revenda` : null;
    const assunto = `${nivel}: ${anuncio.title} por ${preco}`;

    const linhas = [lucro, anuncio.location_neighborhood, anuncio.defeito ? 'Anúncio com defeito informado' : null].filter(Boolean);
    const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#0a3540">
  <p style="font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#0f4c5c;margin:0 0 8px">${escaparHtml(nivel)}</p>
  <h1 style="font-size:20px;margin:0 0 12px">${escaparHtml(anuncio.title)}</h1>
  ${anuncio.image_url ? `<img src="${escaparHtml(anuncio.image_url)}" alt="" style="width:100%;max-height:320px;object-fit:cover;border-radius:12px;margin:0 0 12px">` : ''}
  <p style="font-size:24px;font-weight:bold;margin:0 0 4px">${preco}</p>
  ${linhas.map((l) => `<p style="font-size:14px;margin:0 0 4px;color:#3d5a63">${escaparHtml(l)}</p>`).join('')}
  <p style="margin:20px 0">
    <a href="${escaparHtml(anuncio.url)}" style="background:#0f4c5c;color:#f8f7f4;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:10px;display:inline-block">Ver anúncio na OLX</a>
  </p>
  <p style="font-size:12px;color:#6b8088;margin:24px 0 0">
    Você recebeu este aviso porque acompanha este modelo no Brik.
    <a href="${SITE}/perfil/notificacoes" style="color:#0f4c5c">Mudar notificações</a>
  </p>
</div>`;
    const texto = [nivel, anuncio.title, preco, ...linhas, '', `Ver anúncio: ${anuncio.url}`, '', `Mudar notificações: ${SITE}/perfil/notificacoes`].join('\n');

    return { assunto, html, texto };
}

async function enviarEmail(para, { assunto, html, texto }) {
    const resposta = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: REMETENTE, to: [para], subject: assunto, html, text: texto }),
    });
    if (resposta.ok) return;
    const corpo = await resposta.text().catch(() => '');
    const erro = new Error(`Resend ${resposta.status}: ${corpo.slice(0, 300)}`);
    erro.status = resposta.status;
    throw erro;
}

// urls: anúncios novos (ou que mudaram de preço) nesta raspagem. Relê as linhas
// do banco porque a verificação de descrição (passo 5b) pode ter mudado o nível.
async function notificarAnuncios(supabase, urls) {
    if (urls.length === 0) return;
    if (!process.env.RESEND_API_KEY) {
        console.log('   Avisos por e-mail pulados (sem RESEND_API_KEY).');
        return;
    }

    const anuncios = [];
    for (const lote of emLotes(urls)) {
        const { data, error } = await supabase
            .from('anuncios_ativos')
            .select('url, title, category, variant, price, opportunity_level, profit_pct, image_url, defeito, location_neighborhood')
            .in('url', lote)
            .neq('opportunity_level', 'nenhuma');
        if (error) throw new Error(`Erro ao ler anúncios para avisar: ${error.message}`);
        anuncios.push(...data);
    }

    const modeloDoVariant = await carregarModeloDoVariant();
    const porModelo = new Map();
    for (const anuncio of anuncios) {
        const modelo = modeloDoVariant(anuncio.category, anuncio.variant);
        if (!modelo) continue;
        if (!porModelo.has(modelo)) porModelo.set(modelo, []);
        porModelo.get(modelo).push(anuncio);
    }
    if (porModelo.size === 0) return;

    const { data: interesses, error: erroInteresses } = await supabase
        .from('interesses_notificacao')
        .select('user_id, modelo')
        .in('modelo', [...porModelo.keys()]);
    if (erroInteresses) throw new Error(`Erro ao ler interesses_notificacao: ${erroInteresses.message}`);
    if (interesses.length === 0) return;

    const usuarios = [...new Set(interesses.map((i) => i.user_id))];
    const niveisDe = new Map();
    for (const lote of emLotes(usuarios)) {
        const { data, error } = await supabase.from('configuracoes').select('user_id, notificacoes').in('user_id', lote);
        if (error) throw new Error(`Erro ao ler configuracoes: ${error.message}`);
        data.forEach((linha) => niveisDe.set(linha.user_id, { ...NIVEIS_PADRAO, ...(linha.notificacoes ?? {}) }));
    }

    // Plano: o Free só é avisado do que pode ver no feed (mesma regra do banco,
    // ofertas_liberadas; ver Front-end/src/config/planos.js). Sem linha em
    // preferencias, Free.
    const pagos = new Set();
    for (const lote of emLotes(usuarios)) {
        const { data, error } = await supabase.from('preferencias').select('user_id, plano').in('user_id', lote);
        if (error) throw new Error(`Erro ao ler os planos: ${error.message}`);
        data.forEach((linha) => {
            if (PLANOS_PAGOS.includes(linha.plano)) pagos.add(linha.user_id);
        });
    }
    const liberadasNoFree = new Set();
    if (usuarios.some((id) => !pagos.has(id))) {
        for (const lote of emLotes(anuncios.map((a) => a.url))) {
            const { data, error } = await supabase.rpc('ofertas_liberadas', { p_plano: 'gratis', p_urls: lote });
            if (error) throw new Error(`Erro ao ler as ofertas do plano Free: ${error.message}`);
            data.forEach((oferta) => liberadasNoFree.add(oferta.url));
        }
    }

    const jaEnviados = new Set();
    for (const lote of emLotes(anuncios.map((a) => a.url))) {
        const { data, error } = await supabase.from('notificacoes_enviadas').select('user_id, anuncio_url').in('anuncio_url', lote);
        if (error) throw new Error(`Erro ao ler notificacoes_enviadas: ${error.message}`);
        data.forEach((linha) => jaEnviados.add(`${linha.user_id}|${linha.anuncio_url}`));
    }

    const envios = [];
    for (const { user_id: userId, modelo } of interesses) {
        const niveis = niveisDe.get(userId) ?? NIVEIS_PADRAO;
        for (const anuncio of porModelo.get(modelo)) {
            if (niveis[anuncio.opportunity_level] !== true) continue;
            if (!pagos.has(userId) && !liberadasNoFree.has(anuncio.url)) continue;
            if (jaEnviados.has(`${userId}|${anuncio.url}`)) continue;
            envios.push({ userId, anuncio });
        }
    }
    if (envios.length === 0) return;

    const emailDe = new Map();
    let enviados = 0;
    for (const { userId, anuncio } of envios) {
        if (!emailDe.has(userId)) {
            const { data, error } = await supabase.auth.admin.getUserById(userId);
            emailDe.set(userId, error ? null : data.user?.email ?? null);
        }
        const email = emailDe.get(userId);
        if (!email) continue;

        try {
            await enviarEmail(email, montarEmail(anuncio));
        } catch (err) {
            console.warn(`   Aviso não enviado (${anuncio.url}): ${err.message}`);
            // 429 = limite do Resend (por segundo ou cota do dia): para por aqui.
            if (err.status === 429) break;
            continue;
        }
        enviados++;
        const { error } = await supabase
            .from('notificacoes_enviadas')
            .insert({ user_id: userId, anuncio_url: anuncio.url, nivel: anuncio.opportunity_level });
        if (error) console.warn(`   E-mail enviado, mas não registrado em notificacoes_enviadas: ${error.message}`);
        await esperar(INTERVALO_ENVIO_MS);
    }
    console.log(`   ${enviados} aviso(s) por e-mail enviado(s) (${envios.length} previsto(s)).`);
}

module.exports = { notificarAnuncios, carregarModeloDoVariant, montarEmail, enviarEmail, NIVEIS_PADRAO };
