import type { AssetId, AssetRole, DetailSize } from '../types';

export type AssetVariant = {
  href: string;
  pixelWidth: number;
  pixelHeight: number;
  sourceFile: string;
  derived: boolean;
};

export type AssetDefinition = {
  id: AssetId;
  label: string;
  defaultWidth: number;
  tags: string[];
  variants: Record<AssetRole, Record<DetailSize, AssetVariant>>;
};

type VariantSource = {
  width: number;
  height: number;
  mainSource: string;
  backgroundSource: string;
  mainDerived?: boolean;
  backgroundDerived?: boolean;
};

const libraryRoot = '/assets/library';

function variants(id: AssetId, source: VariantSource): AssetDefinition['variants'] {
  const makeVariant = (
    role: AssetRole,
    size: DetailSize,
    sourceFile: string,
    derived: boolean,
  ): AssetVariant => ({
    href: `${libraryRoot}/${id}-${role}-${size.toLowerCase()}.png`,
    pixelWidth: source.width,
    pixelHeight: source.height,
    sourceFile,
    derived,
  });

  return {
    main: {
      L: makeVariant('main', 'L', source.mainSource, Boolean(source.mainDerived)),
      S: makeVariant('main', 'S', source.mainSource, true),
    },
    background: {
      L: makeVariant(
        'background',
        'L',
        source.backgroundSource,
        Boolean(source.backgroundDerived),
      ),
      S: makeVariant('background', 'S', source.backgroundSource, true),
    },
  };
}

export const assetLibrary: Record<AssetId, AssetDefinition> = {
  book: {
    id: 'book',
    label: 'Книга',
    defaultWidth: 0.78,
    tags: ['обучение', 'знания', 'чтение'],
    variants: variants('book', {
      width: 2892,
      height: 1954,
      mainSource: 'codex-clipboard-1689d034-2781-44d1-9110-0792069545fe.png',
      backgroundSource: 'codex-clipboard-1689d034-2781-44d1-9110-0792069545fe.png',
      backgroundDerived: true,
    }),
  },
  smartphone: {
    id: 'smartphone',
    label: 'Смартфон',
    defaultWidth: 0.62,
    tags: ['приложение', 'мобильный', 'технологии'],
    variants: variants('smartphone', {
      width: 1594,
      height: 924,
      mainSource: 'codex-clipboard-573148e2-5111-4f0e-897f-8a118b8859fb.png',
      backgroundSource: 'codex-clipboard-8a739162-2de5-4422-8399-2d7a1cb2dd51.png',
    }),
  },
  puzzle: {
    id: 'puzzle',
    label: 'Пазл',
    defaultWidth: 0.48,
    tags: ['решение', 'интеграция', 'логика'],
    variants: variants('puzzle', {
      width: 1089,
      height: 628,
      mainSource: 'codex-clipboard-877e7dd4-f49b-469c-aca2-4a1ec15a545b.png',
      backgroundSource: 'codex-clipboard-877e7dd4-f49b-469c-aca2-4a1ec15a545b.png',
      mainDerived: true,
    }),
  },
  coin: {
    id: 'coin',
    label: 'Монета',
    defaultWidth: 0.3,
    tags: ['безопасность', 'финансы', 'защита', 'токен'],
    variants: variants('coin', {
      width: 574,
      height: 377,
      mainSource: 'codex-clipboard-63d7df0b-dea4-4152-bf16-70d0ef32ca6d.png',
      backgroundSource: 'codex-clipboard-63d7df0b-dea4-4152-bf16-70d0ef32ca6d.png',
      backgroundDerived: true,
    }),
  },
  headphones: {
    id: 'headphones',
    label: 'Наушники',
    defaultWidth: 0.72,
    tags: ['музыка', 'аудио', 'фокус'],
    variants: variants('headphones', {
      width: 1777,
      height: 1384,
      mainSource: 'codex-clipboard-02247e74-0c3d-427b-9128-6cfde7f0c48f.png',
      backgroundSource: 'codex-clipboard-5b56e5ef-625f-4152-9d4b-6b7baca47e91.png',
    }),
  },
  lamp: {
    id: 'lamp',
    label: 'Лампа',
    defaultWidth: 0.58,
    tags: ['идея', 'работа', 'свет'],
    variants: variants('lamp', {
      width: 1892,
      height: 2258,
      mainSource: 'codex-clipboard-050bf256-549a-419a-a3a5-86d5d0e7290b.png',
      backgroundSource: 'codex-clipboard-dd925581-d3ea-4f97-ad49-7883ca584500.png',
    }),
  },
  flowers: {
    id: 'flowers',
    label: 'Цветы',
    defaultWidth: 0.42,
    tags: ['рост', 'весна', 'красота'],
    variants: variants('flowers', {
      width: 1182,
      height: 1495,
      mainSource: 'codex-clipboard-e19a76ec-8f9d-4869-ab0f-b442701c4644.png',
      backgroundSource: 'codex-clipboard-e76607ac-2358-4255-9c70-8461b9462b45.png',
    }),
  },
  wallet: {
    id: 'wallet',
    label: 'Кошелёк',
    defaultWidth: 0.5,
    tags: ['финансы', 'бюджет', 'сбережения'],
    variants: variants('wallet', {
      width: 631,
      height: 397,
      mainSource: 'codex-clipboard-2f49e38f-cde1-4826-b9cb-af918677eedf.png',
      backgroundSource: 'codex-clipboard-11f8e200-c967-4895-82da-33971b41650a.png',
    }),
  },
  folder: {
    id: 'folder',
    label: 'Папка',
    defaultWidth: 0.76,
    tags: ['документы', 'архив', 'отчёт'],
    variants: variants('folder', {
      width: 2482,
      height: 1318,
      mainSource: 'codex-clipboard-0dc5d35d-a775-416b-96cd-f430687ef9e2.png',
      backgroundSource: 'codex-clipboard-64ca4496-d8d4-41ba-bbe0-e2bc39d0f1a6.png',
    }),
  },
  pen: {
    id: 'pen',
    label: 'Ручка',
    defaultWidth: 0.52,
    tags: ['подпись', 'текст', 'заметки'],
    variants: variants('pen', {
      width: 1017,
      height: 571,
      mainSource: 'codex-clipboard-956eb99c-d690-4002-b00d-0f76087dbcdf.png',
      backgroundSource: 'codex-clipboard-6bf6255f-6889-4cfa-be8d-475f9cda0a7c.png',
    }),
  },
};

export const assetIds = Object.keys(assetLibrary) as AssetId[];

export function getAssetVariant(assetId: AssetId, role: AssetRole, size: DetailSize) {
  return assetLibrary[assetId].variants[role][size];
}
