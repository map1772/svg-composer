import type {
  CanvasDimensions,
  CompositionManifest,
  ManifestObject,
  SceneObjectModel,
} from '../types';

export type SceneFit = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export type RenderedObjectGeometry = {
  x: number;
  y: number;
  width: number;
};

export function getSceneFit(
  dimensions: Pick<CanvasDimensions, 'width' | 'height'>,
  baseSize: CompositionManifest['baseSize'],
): SceneFit {
  const scale = Math.min(
    dimensions.width / baseSize.width,
    dimensions.height / baseSize.height,
  );
  return {
    scale,
    offsetX: (dimensions.width - baseSize.width * scale) / 2,
    offsetY: (dimensions.height - baseSize.height * scale) / 2,
  };
}

export function toRenderedGeometry(
  object: Pick<SceneObjectModel, 'x' | 'y' | 'width'>,
  dimensions: Pick<CanvasDimensions, 'width' | 'height'>,
  baseSize: CompositionManifest['baseSize'],
): RenderedObjectGeometry {
  const fit = getSceneFit(dimensions, baseSize);
  return {
    x: fit.offsetX + object.x * baseSize.width * fit.scale,
    y: fit.offsetY + object.y * baseSize.height * fit.scale,
    width: object.width * baseSize.width * fit.scale,
  };
}

export function pointerToNormalized(
  point: { x: number; y: number },
  dimensions: Pick<CanvasDimensions, 'width' | 'height'>,
  baseSize: CompositionManifest['baseSize'],
) {
  const fit = getSceneFit(dimensions, baseSize);
  return {
    x: (point.x - fit.offsetX) / (baseSize.width * fit.scale),
    y: (point.y - fit.offsetY) / (baseSize.height * fit.scale),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function findCurrentObject(items: SceneObjectModel[], expected: ManifestObject) {
  return (
    items.find((item) => item.presetObjectId === expected.id) ??
    items.find((item) => item.assetId === expected.assetId && item.role === expected.role)
  );
}

export type CompositionScore = {
  total: number;
  position: number;
  size: number;
  matched: number;
  expected: number;
};

export function calculateCompositionScore(
  items: SceneObjectModel[],
  manifest: CompositionManifest,
): CompositionScore {
  if (manifest.objects.length === 0) {
    return { total: 100, position: 100, size: 100, matched: 0, expected: 0 };
  }

  let positionTotal = 0;
  let sizeTotal = 0;
  let matched = 0;

  manifest.objects.forEach((expected) => {
    const current = findCurrentObject(items, expected);
    if (!current) return;

    matched += 1;
    const distance = Math.hypot(current.x - expected.x, current.y - expected.y);
    const positionScore = clamp(1 - distance / 0.5, 0, 1);
    const widthError = Math.abs(current.width - expected.width) / Math.max(expected.width, 0.01);
    const sizeScore = clamp(1 - widthError, 0, 1);
    positionTotal += positionScore;
    sizeTotal += sizeScore;
  });

  const expectedCount = manifest.objects.length;
  const position = (positionTotal / expectedCount) * 100;
  const size = (sizeTotal / expectedCount) * 100;
  const extraPenalty = expectedCount / Math.max(expectedCount, items.length);
  const total = (position * 0.65 + size * 0.35) * extraPenalty;

  return {
    total: Math.round(total),
    position: Math.round(position),
    size: Math.round(size),
    matched,
    expected: expectedCount,
  };
}
