// Animações: classe ob-anima (desliga com movimento reduzido) + `animation`
// inline com a duração, a curva e o atraso do canvas.

// Cor do destaque com transparência, para gradientes e sombras inline.
export const destaque = (pct) => `color-mix(in srgb, var(--color-ob-destaque) ${pct}%, transparent)`
export const brilho = (pct) => `color-mix(in srgb, var(--color-ob-brilho) ${pct}%, transparent)`

// Curvas do canvas.
export const SAIDA = 'cubic-bezier(.22,1,.36,1)'
