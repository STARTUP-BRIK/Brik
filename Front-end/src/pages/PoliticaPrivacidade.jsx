import BrandHeader from '../components/BrandHeader.jsx'

// Política de Privacidade pública (sem login): é o link cadastrado na tela de
// consentimento do Google, que precisa abrir para qualquer visitante. Não
// confundir com /perfil/privacidade, que são as configurações da conta.
// Ao mudar o que o app guarda, atualizar o texto e a data.

const ATUALIZADA_EM = '10 de outubro de 2026'

// E-mail mostrado na seção de contato. Vazio, a seção fica sem e-mail.
const EMAIL_CONTATO = 'startupbrik@gmail.com'

function Secao({ titulo, children }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-bold text-ink lg:text-lg">{titulo}</h2>
      {children}
    </section>
  )
}

function Lista({ itens }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5">
      {itens.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

function PoliticaPrivacidade() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-surface pb-16 shadow-xl lg:max-w-2xl lg:shadow-none">
      <BrandHeader />

      <main className="flex flex-col gap-6 px-5 pt-6 text-sm leading-relaxed text-ink/80 lg:pt-12">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink lg:text-[28px]">Política de Privacidade</h1>
          <p className="mt-1 text-xs text-ink/50">Última atualização: {ATUALIZADA_EM}</p>
        </div>

        <p>
          O Brik mostra anúncios de produtos abaixo do preço médio e ajuda você a organizar seus briques: estoque,
          cálculos de lucro e anúncios salvos. Esta política explica quais dados o Brik guarda, para que usa e quais
          são os seus direitos, de acordo com a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018).
        </p>

        <Secao titulo="Dados que coletamos">
          <Lista
            itens={[
              'Conta: nome, e-mail e senha. A senha é guardada criptografada; nem a equipe do Brik tem acesso a ela.',
              'Login com o Google: nome, e-mail e foto do perfil da sua conta Google. Não temos acesso à sua senha do Google nem a outros dados da conta.',
              'Perfil (opcional): nome de usuário, telefone, data de nascimento, localização e foto.',
              'Preferências do questionário inicial: orçamento, cidade, distância de busca e categoria de interesse.',
              'O que você cria no app: anúncios salvos, produtos do estoque (com fotos, preços e status) e cálculos.',
            ]}
          />
          <p>
            Algumas preferências de exibição, como ocultar valores no Dashboard, ficam salvas só no seu aparelho.
          </p>
        </Secao>

        <Secao titulo="Para que usamos">
          <Lista
            itens={[
              'Criar sua conta e manter você conectado.',
              'Mostrar oportunidades de acordo com sua cidade, orçamento e interesses.',
              'Guardar seu estoque, cálculos e anúncios salvos para você acessar de qualquer aparelho.',
              'Exibir seu nome e foto no seu perfil.',
            ]}
          />
          <p>
            Não vendemos seus dados, não os usamos para publicidade e não os compartilhamos com anunciantes.
          </p>
        </Secao>

        <Secao titulo="Dados da sua conta Google">
          <p>
            Os dados recebidos do Google (nome, e-mail e foto) servem apenas para criar e identificar sua conta no
            Brik. O uso e a transferência dessas informações seguem a{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noreferrer"
              className="text-brik underline underline-offset-2"
            >
              Política de Dados do Usuário dos Serviços de API do Google
            </a>
            , incluindo os requisitos de uso limitado.
          </p>
        </Secao>

        <Secao titulo="Com quem compartilhamos">
          <p>Usamos serviços de terceiros para hospedar o app e guardar os dados, apenas para o funcionamento do Brik:</p>
          <Lista
            itens={[
              'Supabase: banco de dados e autenticação.',
              'Cloudflare R2: armazenamento das fotos do estoque e do perfil.',
              'Vercel: hospedagem do site.',
              'Google: login com a conta Google, quando você escolhe essa opção.',
            ]}
          />
        </Secao>

        <Secao titulo="Por quanto tempo guardamos">
          <p>
            Seus dados ficam guardados enquanto sua conta existir. Ao pedir a exclusão da conta, apagamos seus dados e
            fotos, exceto o que a lei nos obrigue a manter.
          </p>
        </Secao>

        <Secao titulo="Seus direitos">
          <p>
            Você pode, a qualquer momento, pedir acesso aos seus dados, corrigi-los, receber uma cópia, pedir a
            exclusão da conta ou revogar o acesso do Brik à sua conta Google (em myaccount.google.com, na seção
            Segurança). Boa parte dos dados do perfil pode ser editada direto no app, em Meu Perfil.
          </p>
        </Secao>

        <Secao titulo="Segurança">
          <p>
            A comunicação com o Brik é criptografada (HTTPS) e cada usuário só tem acesso aos próprios dados. Nenhum
            sistema é totalmente imune a falhas; se houver um incidente que afete seus dados, avisaremos você.
          </p>
        </Secao>

        <Secao titulo="Contato">
          <p>
            Para dúvidas sobre esta política ou para exercer seus direitos, fale com a equipe do Brik
            {EMAIL_CONTATO ? (
              <>
                {' '}
                pelo e-mail{' '}
                <a href={`mailto:${EMAIL_CONTATO}`} className="text-brik underline underline-offset-2">
                  {EMAIL_CONTATO}
                </a>
                .
              </>
            ) : (
              '.'
            )}
          </p>
          <p>Se esta política mudar, a data no topo da página será atualizada.</p>
        </Secao>
      </main>
    </div>
  )
}

export default PoliticaPrivacidade
