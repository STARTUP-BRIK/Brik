// Modelos de cada categoria (config/categorias.js), para a pessoa marcar de
// quais quer ser avisada (onboarding, tela "modelos"). Sem divisão por
// capacidade: um modelo junta todas as variantes dele no banco.
//
// Os modelos são os que o worker reconhece: iPhones em worker/variantNormalizer.js
// (IPHONE_MODELS; o id é "iphone-" + a chave de lá) e videogames no catálogo
// fechado de worker/consoleCatalog.js (`variantes`: as chaves de lá que o modelo
// junta). Ao mudar um desses arquivos, atualize aqui.
//
// Por ora a escolha fica só no aparelho (useOnboardingStore.modelos).

const iphones = (grupo, modelos) => ({
  grupo,
  modelos: modelos.map(([chave, nome]) => ({ id: `iphone-${chave}`, nome })),
})

export const MODELOS = {
  iphone: [
    iphones('iPhone 17', [['17', '17'], ['air', 'Air'], ['17-pro', '17 Pro'], ['17-pro-max', '17 Pro Max']]),
    iphones('iPhone 16', [['16e', '16e'], ['16', '16'], ['16-plus', '16 Plus'], ['16-pro', '16 Pro'], ['16-pro-max', '16 Pro Max']]),
    iphones('iPhone 15', [['15', '15'], ['15-plus', '15 Plus'], ['15-pro', '15 Pro'], ['15-pro-max', '15 Pro Max']]),
    iphones('iPhone 14', [['14', '14'], ['14-plus', '14 Plus'], ['14-pro', '14 Pro'], ['14-pro-max', '14 Pro Max']]),
    iphones('iPhone 13', [['13-mini', '13 mini'], ['13', '13'], ['13-pro', '13 Pro'], ['13-pro-max', '13 Pro Max']]),
    iphones('iPhone 12', [['12-mini', '12 mini'], ['12', '12'], ['12-pro', '12 Pro'], ['12-pro-max', '12 Pro Max']]),
    iphones('iPhone 11', [['11', '11'], ['11-pro', '11 Pro'], ['11-pro-max', '11 Pro Max']]),
    iphones('iPhone X', [['x', 'X'], ['xr', 'XR'], ['xs', 'XS'], ['xs-max', 'XS Max']]),
    iphones('iPhone SE', [['se-2022', 'SE 2022'], ['se-2020', 'SE 2020'], ['se-2016', 'SE 2016']]),
    iphones('iPhone 8 e 7', [['8', '8'], ['8-plus', '8 Plus'], ['7', '7'], ['7-plus', '7 Plus']]),
    iphones('iPhone 6', [['6s', '6s'], ['6s-plus', '6s Plus'], ['6', '6'], ['6-plus', '6 Plus']]),
    iphones('Mais antigos', [['5s', '5s'], ['5c', '5c'], ['5', '5'], ['4s', '4s'], ['4', '4'], ['3gs', '3GS'], ['3g', '3G']]),
  ],
  videogame_console: [
    {
      grupo: 'PlayStation 5',
      modelos: [
        { id: 'ps5', nome: 'PS5', variantes: ['ps5-standard-825gb'] },
        { id: 'ps5-digital', nome: 'PS5 Digital', variantes: ['ps5-digital-825gb'] },
        { id: 'ps5-slim', nome: 'PS5 Slim', variantes: ['ps5-slim-1tb'] },
        { id: 'ps5-slim-digital', nome: 'PS5 Slim Digital', variantes: ['ps5-slim-digital-825gb', 'ps5-slim-digital-1tb'] },
        { id: 'ps5-pro', nome: 'PS5 Pro', variantes: ['ps5-pro-2tb-com-leitor', 'ps5-pro-2tb-sem-leitor'] },
        { id: 'ps5-edicao-especial', nome: 'PS5 Edição especial', variantes: ['ps5-special-edition'] },
      ],
    },
    {
      grupo: 'PlayStation 4',
      modelos: [
        { id: 'ps4-fat', nome: 'PS4 Fat', variantes: ['ps4-fat-500gb'] },
        { id: 'ps4-slim', nome: 'PS4 Slim', variantes: ['ps4-slim-500gb', 'ps4-slim-1tb'] },
        { id: 'ps4-pro', nome: 'PS4 Pro', variantes: ['ps4-pro-1tb'] },
      ],
    },
    {
      grupo: 'PlayStation 3',
      modelos: [
        { id: 'ps3-fat', nome: 'PS3 Fat', variantes: ['ps3-fat-120gb', 'ps3-fat-500gb'] },
        { id: 'ps3-slim', nome: 'PS3 Slim', variantes: ['ps3-slim-120gb', 'ps3-slim-250gb', 'ps3-slim-500gb'] },
        { id: 'ps3-super-slim', nome: 'PS3 Super Slim', variantes: ['ps3-super-slim-250gb', 'ps3-super-slim-500gb'] },
        { id: 'ps3-ultra-slim', nome: 'PS3 Ultra Slim', variantes: ['ps3-ultra-slim'] },
      ],
    },
    {
      grupo: 'PlayStation 2',
      modelos: [
        { id: 'ps2-fat', nome: 'PS2 Fat', variantes: ['ps2-fat'] },
        { id: 'ps2-slim', nome: 'PS2 Slim', variantes: ['ps2-slim'] },
      ],
    },
    {
      grupo: 'Xbox Series',
      modelos: [
        { id: 'xbox-series-x', nome: 'Series X', variantes: ['xbox-series-x-1tb'] },
        { id: 'xbox-series-x-galaxy', nome: 'Series X Galaxy', variantes: ['xbox-series-x-2tb-galaxy'] },
        { id: 'xbox-series-s', nome: 'Series S', variantes: ['xbox-series-s-512gb', 'xbox-series-s-1tb'] },
        { id: 'xbox-series-s-edicao-especial', nome: 'Series S Edição especial', variantes: ['xbox-series-s-edicao-especial'] },
      ],
    },
    {
      grupo: 'Xbox One e 360',
      modelos: [
        { id: 'xbox-one', nome: 'Xbox One', variantes: ['xbox-one-fat-500gb', 'xbox-one-fat-1tb'] },
        { id: 'xbox-one-s', nome: 'Xbox One S', variantes: ['xbox-one-s-500gb', 'xbox-one-s-1tb', 'xbox-one-s-2tb'] },
        { id: 'xbox-one-edicao-especial', nome: 'Xbox One Edição especial', variantes: ['xbox-one-edicao-especial'] },
        { id: 'xbox-360', nome: 'Xbox 360', variantes: ['xbox-360'] },
      ],
    },
  ],
}

// Todos os ids de modelo de uma categoria.
export const idsDaCategoria = (categoria) => (MODELOS[categoria] ?? []).flatMap((g) => g.modelos.map((m) => m.id))
