import { Nota, SubPagina } from '../../components/SubPagina.jsx'

const CONTATO_EMAIL = 'startupbrik@gmail.com'

// Termos de Uso. Versão preliminar, escrita pela equipe: antes do lançamento
// precisa da revisão de um advogado. Se mudar a regra do app (planos, selos,
// fonte dos anúncios), atualize a seção correspondente.
const SECOES = [
  {
    titulo: '1. O que é o Brik',
    texto: (
      <>
        O Brik é uma ferramenta que encontra anúncios públicos de produtos usados na OLX e mostra
        quais estão com preço abaixo do mercado, para você comprar para uso próprio ou para revenda.
        O app também oferece a calculadora de lucro e o Dashboard para acompanhar suas compras e
        vendas.
      </>
    ),
  },
  {
    titulo: '2. O Brik não participa da negociação',
    destaque: true,
    texto: (
      <>
        O Brik apenas indica anúncios para ajudar você a achar uma oferta melhor. Não somos donos dos
        produtos, não vendemos nada e não participamos da negociação, do pagamento ou da entrega: tudo
        isso acontece diretamente entre você e o vendedor, fora do Brik. Por isso, o Brik não se
        responsabiliza por golpes, fraudes, produtos com defeito ou diferentes do anunciado, atrasos,
        prejuízos ou qualquer outro problema na compra feita com o vendedor. Qualquer reclamação sobre
        o anúncio ou o vendedor deve ser feita a ele ou à plataforma onde o anúncio foi publicado.
      </>
    ),
  },
  {
    titulo: '3. Cuidados para não cair em golpes',
    texto: (
      <>
        Desconfie de preços bons demais, veja o produto pessoalmente antes de pagar, prefira encontros
        em locais públicos, confira se o aparelho funciona e não faça pagamentos adiantados para
        desconhecidos. A decisão de comprar é sempre sua.
      </>
    ),
  },
  {
    titulo: '4. Os anúncios são de terceiros',
    texto: (
      <>
        As informações dos anúncios (fotos, descrição, preço, estado do produto) são publicadas pelos
        vendedores. O Brik não confere se o produto existe, se está como descrito ou se o vendedor é
        confiável. Um anúncio pode ser vendido, alterado ou removido a qualquer momento.
      </>
    ),
  },
  {
    titulo: '5. Preços e lucros são estimativas',
    texto: (
      <>
        O preço de mercado, os selos (Bom, Ótimo e Extraordinário) e o lucro estimado são calculados
        automaticamente a partir dos anúncios disponíveis. São estimativas, não garantia de preço de
        revenda ou de lucro, e não são orientação financeira.
      </>
    ),
  },
  {
    titulo: '6. Sua conta',
    texto: (
      <>
        Você é responsável pelos dados que informa e por manter sua senha em segurança. Não é permitido
        usar o Brik para golpes ou atividades ilegais, copiar ou revender os dados do app, nem acessá-lo
        de forma automatizada. Contas que descumprirem estes termos podem ser suspensas ou encerradas.
      </>
    ),
  },
  {
    titulo: '7. Planos',
    texto: (
      <>
        O Brik tem um plano gratuito e planos pagos com mais recursos. Preços e forma de cobrança
        são informados na tela de planos antes da contratação. Os pagamentos são processados pelo
        Asaas, e a assinatura renova sozinha a cada período até ser cancelada. Você pode cancelar
        quando quiser em Meu Perfil → Meu plano: o plano pago continua até o fim do período já pago
        e não há novas cobranças. Nas compras pela internet, você pode desistir em até 7 dias, como
        garante o Código de Defesa do Consumidor; nesse caso, devolvemos o valor pago.
      </>
    ),
  },
  {
    titulo: '8. Disponibilidade',
    texto: (
      <>
        Trabalhamos para manter o Brik no ar, mas o app pode ficar indisponível, ter erros ou mudar
        funções. Também podemos deixar de mostrar anúncios de alguma fonte ou região.
      </>
    ),
  },
  {
    titulo: '9. Privacidade',
    texto: (
      <>
        O uso dos seus dados é explicado na{' '}
        <a href="/privacidade.html" target="_blank" rel="noreferrer" className="font-medium text-brik underline">
          Política de Privacidade
        </a>
        .
      </>
    ),
  },
  {
    titulo: '10. Mudanças e contato',
    texto: (
      <>
        Estes termos podem ser atualizados; avisaremos no app quando houver mudança importante. Eles
        seguem as leis do Brasil. Dúvidas:{' '}
        <a href={`mailto:${CONTATO_EMAIL}`} className="font-medium text-brik underline">
          {CONTATO_EMAIL}
        </a>
        .
      </>
    ),
  },
]

function Termos() {
  return (
    <SubPagina titulo="Termos de Uso" descricao="Versão preliminar.">
      <div className="flex flex-col gap-2.5">
        {SECOES.map(({ titulo, texto, destaque }) => (
          <section
            key={titulo}
            className={`rounded-2xl bg-surface-card px-4 py-4 ring-1 ${destaque ? 'ring-brik/40' : 'ring-line'}`}
          >
            <h2 className="text-sm font-bold text-ink">{titulo}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{texto}</p>
          </section>
        ))}
      </div>
      <Nota>Ao usar o Brik, você concorda com estes termos.</Nota>
    </SubPagina>
  )
}

export default Termos
