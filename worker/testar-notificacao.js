// Teste do aviso por e-mail: manda UM e-mail, só para a conta informada, com a
// oportunidade mais recente do banco entre os modelos que ela acompanha. Não
// grava em notificacoes_enviadas (o aviso de verdade desse anúncio continua
// valendo) e ignora os interruptores de nível, para sempre ter o que mandar.
//
// Uso (da raiz do repositório, com RESEND_API_KEY no .env):
//   node worker/testar-notificacao.js voce@email.com

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { carregarModeloDoVariant, montarEmail, enviarEmail } = require('./notificacoes');

async function main() {
    const email = (process.argv[2] || '').trim().toLowerCase();
    if (!email) throw new Error('Informe o e-mail da conta: node worker/testar-notificacao.js voce@email.com');
    if (!process.env.RESEND_API_KEY) throw new Error('Falta RESEND_API_KEY no .env da raiz.');

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: lista, error: erroUsuarios } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (erroUsuarios) throw new Error(`Erro ao listar usuários: ${erroUsuarios.message}`);
    const usuario = lista.users.find((u) => (u.email || '').toLowerCase() === email);
    if (!usuario) throw new Error(`Nenhuma conta com o e-mail ${email}.`);

    const { data: interesses, error: erroInteresses } = await supabase
        .from('interesses_notificacao')
        .select('modelo')
        .eq('user_id', usuario.id);
    if (erroInteresses) throw new Error(`Erro ao ler interesses_notificacao: ${erroInteresses.message}`);
    const modelos = new Set(interesses.map((i) => i.modelo));
    if (modelos.size === 0) throw new Error('Essa conta não acompanha nenhum modelo (Perfil → Notificações).');

    const { data: anuncios, error: erroAnuncios } = await supabase
        .from('anuncios_ativos')
        .select('url, title, category, variant, price, opportunity_level, profit_pct, image_url, defeito, location_neighborhood, first_seen_at')
        .neq('opportunity_level', 'nenhuma')
        .order('first_seen_at', { ascending: false })
        .limit(500);
    if (erroAnuncios) throw new Error(`Erro ao ler anuncios_ativos: ${erroAnuncios.message}`);

    const modeloDoVariant = await carregarModeloDoVariant();
    const anuncio = anuncios.find((a) => modelos.has(modeloDoVariant(a.category, a.variant)));
    if (!anuncio) throw new Error(`Nenhuma oportunidade no banco para os ${modelos.size} modelo(s) dessa conta.`);

    const conteudo = montarEmail(anuncio);
    conteudo.assunto = `[Teste] ${conteudo.assunto}`;
    await enviarEmail(usuario.email, conteudo);
    console.log(`E-mail de teste enviado para ${usuario.email}: ${conteudo.assunto}`);
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
