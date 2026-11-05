import { useId, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { BackgroundTemplate } from './BackgroundTemplate';
import { SceneObject } from './SceneObject';
import { pointerToNormalized, toRenderedGeometry } from '../lib/sceneGeometry';
import type {
  BackgroundTemplateId,
  CanvasDimensions,
  CompositionManifest,
  DetailSize,
  Palette,
  SceneObjectModel,
} from '../types';

type SceneCanvasProps = {
  dimensions: CanvasDimensions;
  baseSize: CompositionManifest['baseSize'];
  backgroundTemplate: BackgroundTemplateId;
  palette: Palette;
  objects: SceneObjectModel[];
  detailSize: DetailSize;
  selectedId?: string | null;
  interactive?: boolean;
  className?: string;
  onSelect?: (id: string) => void;
  onChange?: (id: string, patch: Partial<SceneObjectModel>) => void;
};

type DragState = {
  id: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
};

export function SceneCanvas({
  dimensions,
  baseSize,
  backgroundTemplate,
  palette,
  objects,
  detailSize,
  selectedId,
  interactive = true,
  className = '',
  onSelect,
  onChange,
}: SceneCanvasProps) {
  const clipId = `scene-clip-${useId().replace(/:/g, '')}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);

  function eventToCanvas(event: ReactPointerEvent<SVGGElement>) {
    const svg = svgRef.current;
    if (!svg) return null;
    const rectangle = svg.getBoundingClientRect();
    return {
      x: ((event.clientX - rectangle.left) / rectangle.width) * dimensions.width,
      y: ((event.clientY - rectangle.top) / rectangle.height) * dimensions.height,
    };
  }

  function handlePointerDown(
    event: ReactPointerEvent<SVGGElement>,
    object: SceneObjectModel,
  ) {
    event.preventDefault();
    event.stopPropagation();
    const canvasPoint = eventToCanvas(event);
    if (!canvasPoint) return;
    const point = pointerToNormalized(canvasPoint, dimensions, baseSize);
    dragRef.current = {
      id: object.id,
      pointerId: event.pointerId,
      offsetX: object.x - point.x,
      offsetY: object.y - point.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    onSelect?.(object.id);
  }

  function handlePointerMove(event: ReactPointerEvent<SVGGElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const canvasPoint = eventToCanvas(event);
    if (!canvasPoint) return;
    const point = pointerToNormalized(canvasPoint, dimensions, baseSize);
    onChange?.(drag.id, {
      x: Math.min(1.5, Math.max(-0.5, point.x + drag.offsetX)),
      y: Math.min(1.5, Math.max(-0.5, point.y + drag.offsetY)),
    });
  }

  function handlePointerUp(event: ReactPointerEvent<SVGGElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  }

  const sortedObjects = [...objects].sort((left, right) => left.zIndex - right.zIndex);

  return (
    <svg
      ref={svgRef}
      className={`scene-canvas ${className}`}
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      preserveAspectRatio="xMidYMid meet"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) dragRef.current = null;
      }}
      aria-label="Холст композиции"
    >
      <defs>
        <clipPath id={clipId}>
          <rect width={dimensions.width} height={dimensions.height} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <BackgroundTemplate
          template={backgroundTemplate}
          palette={palette}
          width={dimensions.width}
          height={dimensions.height}
        />
        {sortedObjects.map((object) => (
          <SceneObject
            key={object.id}
            object={object}
            detailSize={detailSize}
            geometry={toRenderedGeometry(object, dimensions, baseSize)}
            selected={selectedId === object.id}
            interactive={interactive}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
        ))}
      </g>
    </svg>
  );
}
