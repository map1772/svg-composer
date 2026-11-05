import type { CanvasDimensions, CanvasFormat, Palette, PaletteName } from '../types';

export const palettes: Record<PaletteName, Palette> = {
  Lavender: {
    bgSurface: '#D7CDF5',
    bgSecondary: '#AA9BF0',
    bgAccent: '#7864D7',
    inkBlack: '#181817',
    objAccent1: '#F9ECB0',
    objAccent2: '#F9A3AA',
    objAccent3: '#FFE3E1',
    pureWhite: '#FFFFFF',
  },
  Peach: {
    bgSurface: '#FDD7B9',
    bgSecondary: '#FAC896',
    bgAccent: '#D27532',
    inkBlack: '#181817',
    objAccent1: '#F9ECB0',
    objAccent2: '#80DADA',
    objAccent3: '#BEEBEB',
    pureWhite: '#FFFFFF',
  },
  Mint: {
    bgSurface: '#BEEBEB',
    bgSecondary: '#80DADA',
    bgAccent: '#5ABEBE',
    inkBlack: '#181817',
    objAccent1: '#FFD4F2',
    objAccent2: '#6D7BFC',
    objAccent3: '#B6C6FE',
    pureWhite: '#FFFFFF',
  },
};

export const canvasFormats: Record<CanvasFormat, CanvasDimensions> = {
  square: { width: 600, height: 600, label: '1:1' },
  wide: { width: 800, height: 450, label: '16:9' },
  tall: { width: 450, height: 720, label: '9:16' },
};
