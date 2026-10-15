// Proteção das rotas: com true, o app pede login (RotaProtegida) e o onboarding
// só abre a criação da conta sem sessão (pages/onboarding/Onboarding.jsx).
// Desligada durante o desenvolvimento, para navegar pelas telas, e pelo
// onboarding inteiro, sem login. Mesmo desligada, uma conta logada que ainda
// não fez o onboarding é levada a ele. Voltar para true antes de publicar o site.
export const PROTECAO_ATIVA = true
