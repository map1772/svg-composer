import { assetLibrary, getAssetVariant } from '../data/assetLibrary';
import { backgroundTemplateMarkup } from '../components/BackgroundTemplate';
import { toRenderedGeometry } from './sceneGeometry';
import type {
  BackgroundTemplateId,
  CanvasDimensions,
  CompositionManifest,
  DetailSize,
  Palette,
  SceneObjectModel,
} from '../types';

type ExportOptions = {
  dimensions: CanvasDimensions;
  baseSize: CompositionManifest['baseSize'];
  backgroundTemplate: BackgroundTemplateId;
  palette: Palette;
  objects: SceneObjectModel[];
  detailSize: DetailSize;
  selfContained: boolean;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function blobToDataUrl(blob: Blob) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Не удалось прочитать PNG'));
    reader.readAsDataURL(blob);
  });
}

async function resolveHref(href: string, selfContained: boolean) {
  if (!selfContained || href.startsWith('data:')) return href;
  const response = await fetch(href);
  if (!response.ok) {
    throw new Error(`PNG недоступен: ${href} (${response.status})`);
  }
  return blobToDataUrl(await response.blob());
}

export async function buildSceneSvg(options: ExportOptions) {
  const {
    dimensions,
    baseSize,
    backgroundTemplate,
    palette,
    objects,
    detailSize,
    selfContained,
  } = options;
  const sortedObjects = [...objects].sort((left, right) => left.zIndex - right.zIndex);
  const objectMarkup = await Promise.all(
    sortedObjects.map(async (object) => {
      const variant = getAssetVariant(object.assetId, object.role, detailSize);
      const href = await resolveHref(object.customAsset?.href ?? variant.href, selfContained);
      const pixelWidth = object.customAsset?.pixelWidth ?? variant.pixelWidth;
      const pixelHeight = object.customAsset?.pixelHeight ?? variant.pixelHeight;
      const geometry = toRenderedGeometry(object, dimensions, baseSize);
      const height = geometry.width * (pixelHeight / pixelWidth);
      const label = object.customAsset?.name ?? assetLibrary[object.assetId].label;
      const transform = `translate(${geometry.x} ${geometry.y}) rotate(${object.rotation}) scale(${object.flipX ? -1 : 1} 1)`;
      return `<g transform="${transform}" opacity="${object.opacity}" data-object="${escapeXml(label)}" data-role="${object.role}" data-z-index="${object.zIndex}"><image href="${escapeXml(href)}" x="${-geometry.width / 2}" y="${-height / 2}" width="${geometry.width}" height="${height}" preserveAspectRatio="xMidYMid meet"/></g>`;
    }),
  );

  const width = dimensions.width;
  const height = dimensions.height;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Изометрическая композиция"><defs><clipPath id="scene-clip"><rect width="${width}" height="${height}"/></clipPath></defs><g clip-path="url(#scene-clip)">${backgroundTemplateMarkup(backgroundTemplate, palette, width, height)}${objectMarkup.join('')}</g></svg>`;
}

export function downloadSvg(svg: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
