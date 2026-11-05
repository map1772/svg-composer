import type { PointerEvent as ReactPointerEvent } from 'react';
import { assetLibrary, getAssetVariant } from '../data/assetLibrary';
import type { DetailSize, SceneObjectModel } from '../types';
import type { RenderedObjectGeometry } from '../lib/sceneGeometry';

type SceneObjectProps = {
  object: SceneObjectModel;
  detailSize: DetailSize;
  geometry: RenderedObjectGeometry;
  selected: boolean;
  interactive: boolean;
  onPointerDown: (event: ReactPointerEvent<SVGGElement>, object: SceneObjectModel) => void;
  onPointerMove: (event: ReactPointerEvent<SVGGElement>) => void;
  onPointerUp: (event: ReactPointerEvent<SVGGElement>) => void;
};

export function SceneObject({
  object,
  detailSize,
  geometry,
  selected,
  interactive,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: SceneObjectProps) {
  const libraryAsset = assetLibrary[object.assetId];
  const variant = getAssetVariant(object.assetId, object.role, detailSize);
  const href = object.customAsset?.href ?? variant.href;
  const pixelWidth = object.customAsset?.pixelWidth ?? variant.pixelWidth;
  const pixelHeight = object.customAsset?.pixelHeight ?? variant.pixelHeight;
  const height = geometry.width * (pixelHeight / pixelWidth);
  const transform = `translate(${geometry.x} ${geometry.y}) rotate(${object.rotation}) scale(${object.flipX ? -1 : 1} 1)`;

  return (
    <g
      transform={transform}
      opacity={object.opacity}
      className={`scene-object ${selected ? 'is-selected' : ''}`}
      data-object-id={object.id}
      onPointerDown={interactive ? (event) => onPointerDown(event, object) : undefined}
      onPointerMove={interactive ? onPointerMove : undefined}
      onPointerUp={interactive ? onPointerUp : undefined}
      onPointerCancel={interactive ? onPointerUp : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `${libraryAsset.label}, ${object.role === 'main' ? 'главный' : 'фоновый'}` : undefined}
    >
      <title>{object.customAsset?.name ?? libraryAsset.label}</title>
      <image
        href={href}
        x={-geometry.width / 2}
        y={-height / 2}
        width={geometry.width}
        height={height}
        preserveAspectRatio="xMidYMid meet"
      />
      {selected && interactive && (
        <rect
          className="selection-outline"
          x={-geometry.width / 2}
          y={-height / 2}
          width={geometry.width}
          height={height}
          rx={6}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </g>
  );
}
