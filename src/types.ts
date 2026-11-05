export type AssetId =
  | 'book'
  | 'smartphone'
  | 'puzzle'
  | 'coin'
  | 'headphones'
  | 'lamp'
  | 'flowers'
  | 'wallet'
  | 'folder'
  | 'pen';

export type AssetRole = 'main' | 'background';
export type DetailSize = 'L' | 'S';
export type CanvasFormat = 'square' | 'wide' | 'tall';
export type BackgroundTemplateId = 'lines' | 'corner' | 'clean';
export type PaletteName = 'Lavender' | 'Peach' | 'Mint';

export type Palette = {
  bgSurface: string;
  bgSecondary: string;
  bgAccent: string;
  inkBlack: string;
  objAccent1: string;
  objAccent2: string;
  objAccent3: string;
  pureWhite: string;
};

export type CustomAsset = {
  href: string;
  name: string;
  pixelWidth: number;
  pixelHeight: number;
};

export type SceneObjectModel = {
  id: string;
  assetId: AssetId;
  role: AssetRole;
  x: number;
  y: number;
  width: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  flipX: boolean;
  presetObjectId?: string;
  customAsset?: CustomAsset;
};

export type ManifestObject = {
  id: string;
  assetId: AssetId;
  role: AssetRole;
  x: number;
  y: number;
  width: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  flipX?: boolean;
};

export type CompositionManifest = {
  id: string;
  name: string;
  description: string;
  format: CanvasFormat;
  baseSize: { width: number; height: number };
  backgroundTemplate: BackgroundTemplateId;
  backgroundColor: string;
  palette: PaletteName;
  referenceImage: string;
  objects: ManifestObject[];
};

export type CanvasDimensions = {
  width: number;
  height: number;
  label: string;
};
