import { useCallback, useEffect, useRef, useState } from 'react';
import type { CollisionCell, EncounterZone, MapDirection, MapEditorTool } from '@/game/types/overlandMap';
import { COLLISION_CELL_SIZE } from '@/game/types/overlandMap';
import { getEncounterSpriteUrl } from '@/logic/encounterZones';
import { imageToNormalized } from '@/logic/overlandCollision';

export interface MapCanvasLayout {
  offsetX: number;
  offsetY: number;
  drawWidth: number;
  drawHeight: number;
  scale: number;
}

interface MapCanvasProps {
  backgroundUrl: string;
  imageWidth: number;
  imageHeight: number;
  flipHorizontal?: boolean;
  collisionGrid: CollisionCell[][];
  foregroundGrid: CollisionCell[][];
  collisionCellSize: number;
  tool: MapEditorTool;
  brushRadius: number;
  playerStart: { x: number; y: number };
  connections: Partial<Record<MapDirection, { targetScreenId: string }>>;
  entryPointMarkers?: { x: number; y: number; label: string }[];
  encounterZones?: EncounterZone[];
  showEncounterZones: boolean;
  showCollision: boolean;
  showForeground: boolean;
  grayscaleMap: boolean;
  activeConnectionDirection: MapDirection | null;
  onPaintAt: (imageX: number, imageY: number, value: CollisionCell) => void;
  onPaintForegroundAt: (imageX: number, imageY: number, value: CollisionCell) => void;
  onStrokeEnd: () => void;
  onSetPlayerStart: (point: { x: number; y: number }) => void;
  onSetConnectionEntry: (point: { x: number; y: number }) => void;
  onPlaceEncounter: (point: { x: number; y: number }) => void;
  onRemoveEncounter: (zoneId: string) => void;
}

function computeLayout(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): MapCanvasLayout {
  const scale = Math.min(containerWidth / imageWidth, containerHeight / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const offsetX = (containerWidth - drawWidth) / 2;
  const offsetY = (containerHeight - drawHeight) / 2;

  return { offsetX, offsetY, drawWidth, drawHeight, scale };
}

function pointerToImageCoords(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  layout: MapCanvasLayout,
  flipHorizontal: boolean,
): { x: number; y: number } | null {
  const layerLeft = layout.offsetX;
  const localX = clientX - rect.left - layerLeft;
  const localY = clientY - rect.top - layout.offsetY;

  if (localX < 0 || localY < 0 || localX > layout.drawWidth || localY > layout.drawHeight) {
    return null;
  }

  const textureLocalX = flipHorizontal ? layout.drawWidth - localX : localX;

  return {
    x: textureLocalX / layout.scale,
    y: localY / layout.scale,
  };
}

function normalizedToDisplayX(x: number, drawWidth: number, flipHorizontal: boolean): number {
  return (flipHorizontal ? 1 - x : x) * drawWidth;
}

function imageToDisplayPoint(
  imageX: number,
  imageY: number,
  layout: MapCanvasLayout,
  flipHorizontal: boolean,
): { x: number; y: number } {
  const localX = flipHorizontal ? layout.drawWidth - imageX * layout.scale : imageX * layout.scale;
  return {
    x: layout.offsetX + localX,
    y: layout.offsetY + imageY * layout.scale,
  };
}

export function MapCanvas({
  backgroundUrl,
  imageWidth,
  imageHeight,
  flipHorizontal = false,
  collisionGrid,
  foregroundGrid,
  collisionCellSize,
  tool,
  brushRadius,
  playerStart,
  connections,
  entryPointMarkers = [],
  encounterZones = [],
  showEncounterZones,
  showCollision,
  showForeground,
  grayscaleMap,
  activeConnectionDirection,
  onPaintAt,
  onPaintForegroundAt,
  onStrokeEnd,
  onSetPlayerStart,
  onSetConnectionEntry,
  onPlaceEncounter,
  onRemoveEncounter,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [layout, setLayout] = useState<MapCanvasLayout>({
    offsetX: 0,
    offsetY: 0,
    drawWidth: 0,
    drawHeight: 0,
    scale: 1,
  });
  const isPaintingRef = useRef(false);
  const [brushCursor, setBrushCursor] = useState<{ x: number; y: number } | null>(null);

  const updateLayout = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    setLayout(computeLayout(container.clientWidth, container.clientHeight, imageWidth, imageHeight));
  }, [imageWidth, imageHeight]);

  useEffect(() => {
    updateLayout();
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(updateLayout);
    observer.observe(container);
    return () => observer.disconnect();
  }, [updateLayout]);

  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = layout.drawWidth;
    canvas.height = layout.drawHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cellDrawSize = collisionCellSize * layout.scale;

    if (showCollision) {
      for (let row = 0; row < collisionGrid.length; row++) {
        for (let col = 0; col < collisionGrid[row].length; col++) {
          if (collisionGrid[row][col] === 1) {
            ctx.fillStyle = 'rgba(255, 235, 59, 0.72)';
            ctx.fillRect(col * cellDrawSize, row * cellDrawSize, cellDrawSize, cellDrawSize);
            ctx.strokeStyle = 'rgba(255, 214, 0, 0.95)';
            ctx.lineWidth = 1;
            ctx.strokeRect(col * cellDrawSize, row * cellDrawSize, cellDrawSize, cellDrawSize);
          }
        }
      }
    }

    if (showForeground) {
      const fgFill = grayscaleMap ? 'rgba(250, 59, 240, 0.52)' : 'rgba(255, 20, 147, 0.68)';
      const fgStroke = grayscaleMap ? 'rgba(250, 59, 240, 0.98)' : 'rgba(255, 105, 180, 1)';

      for (let row = 0; row < foregroundGrid.length; row++) {
        for (let col = 0; col < foregroundGrid[row].length; col++) {
          if (foregroundGrid[row][col] === 1) {
            ctx.fillStyle = fgFill;
            ctx.fillRect(col * cellDrawSize, row * cellDrawSize, cellDrawSize, cellDrawSize);
            ctx.strokeStyle = fgStroke;
            ctx.lineWidth = 1;
            ctx.strokeRect(col * cellDrawSize, row * cellDrawSize, cellDrawSize, cellDrawSize);
          }
        }
      }
    }
  }, [collisionGrid, collisionCellSize, foregroundGrid, grayscaleMap, layout, showCollision, showForeground]);

  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const imageCoords = pointerToImageCoords(clientX, clientY, rect, layout, flipHorizontal);
      if (!imageCoords) return;

      if (tool === 'playerStart') {
        onSetPlayerStart(imageToNormalized(imageCoords.x, imageCoords.y, imageWidth, imageHeight));
        return;
      }

      if (tool === 'connection' && activeConnectionDirection) {
        onSetConnectionEntry(imageToNormalized(imageCoords.x, imageCoords.y, imageWidth, imageHeight));
        return;
      }

      if (tool === 'encounter') {
        onPlaceEncounter(imageToNormalized(imageCoords.x, imageCoords.y, imageWidth, imageHeight));
        return;
      }

      if (tool === 'removeEncounter') {
        const zone = encounterZones.find((entry) => {
          const centerX = entry.position.x * imageWidth;
          const centerY = entry.position.y * imageHeight;
          const radius = entry.radius * Math.min(imageWidth, imageHeight);
          const dx = imageCoords.x - centerX;
          const dy = imageCoords.y - centerY;
          return dx * dx + dy * dy <= radius * radius;
        });
        if (zone) {
          onRemoveEncounter(zone.id);
        }
        return;
      }

      if (tool === 'block' || tool === 'walk') {
        onPaintAt(imageCoords.x, imageCoords.y, tool === 'block' ? 1 : 0);
        return;
      }

      if (tool === 'foreground' || tool === 'clearForeground') {
        onPaintForegroundAt(imageCoords.x, imageCoords.y, tool === 'foreground' ? 1 : 0);
      }
    },
    [
      activeConnectionDirection,
      encounterZones,
      flipHorizontal,
      imageHeight,
      imageWidth,
      layout,
      onPaintAt,
      onPaintForegroundAt,
      onPlaceEncounter,
      onRemoveEncounter,
      onSetConnectionEntry,
      onSetPlayerStart,
      tool,
    ],
  );

  const isPaintTool =
    tool === 'block' ||
    tool === 'walk' ||
    tool === 'foreground' ||
    tool === 'clearForeground';
  const isPointerTool =
    tool === 'playerStart' ||
    tool === 'connection' ||
    tool === 'encounter' ||
    tool === 'removeEncounter';

  useEffect(() => {
    if (!isPaintTool) {
      setBrushCursor(null);
    }
  }, [isPaintTool, tool]);

  const updateBrushCursor = useCallback(
    (clientX: number, clientY: number) => {
      if (!isPaintTool) {
        setBrushCursor(null);
        return;
      }

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const imageCoords = pointerToImageCoords(clientX, clientY, rect, layout, flipHorizontal);
      if (!imageCoords) {
        setBrushCursor(null);
        return;
      }

      setBrushCursor(imageToDisplayPoint(imageCoords.x, imageCoords.y, layout, flipHorizontal));
    },
    [flipHorizontal, isPaintTool, layout],
  );

  const preventNativeDrag = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (tool === 'connection' && !activeConnectionDirection) {
      return;
    }

    if (isPaintTool || tool === 'removeEncounter') {
      event.preventDefault();
    }

    isPaintingRef.current = true;
    onStrokeEnd();
    event.currentTarget.setPointerCapture(event.pointerId);
    updateBrushCursor(event.clientX, event.clientY);
    handlePointer(event.clientX, event.clientY);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isPaintTool && isPaintingRef.current) {
      event.preventDefault();
    }
    updateBrushCursor(event.clientX, event.clientY);
    if (!isPaintingRef.current) return;
    if (isPointerTool) return;
    handlePointer(event.clientX, event.clientY);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    isPaintingRef.current = false;
    onStrokeEnd();
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const onPointerLeave = () => {
    setBrushCursor(null);
    if (isPaintingRef.current) {
      isPaintingRef.current = false;
      onStrokeEnd();
    }
  };

  const brushDisplayRadius = brushRadius * layout.scale;

  const playerMarkerStyle = {
    left: layout.offsetX + normalizedToDisplayX(playerStart.x, layout.drawWidth, flipHorizontal),
    top: layout.offsetY + playerStart.y * layout.drawHeight,
  };

  const flippedContentStyle: React.CSSProperties = flipHorizontal
    ? {
        transform: 'scaleX(-1)',
        transformOrigin: 'left top',
        left: layout.drawWidth,
      }
    : {
        left: 0,
      };

  const mapLayerStyle: React.CSSProperties = {
    left: layout.offsetX,
    top: layout.offsetY,
    width: layout.drawWidth,
    height: layout.drawHeight,
  };

  const edgeIndicators: { direction: MapDirection; style: React.CSSProperties }[] = [
  {
    direction: 'north',
    style: {
      left: 0,
      top: 0,
      width: layout.drawWidth,
      height: 6,
    },
  },
  {
    direction: 'south',
    style: {
      left: 0,
      top: layout.drawHeight - 6,
      width: layout.drawWidth,
      height: 6,
    },
  },
  {
    direction: 'west',
    style: {
      left: 0,
      top: 0,
      width: 6,
      height: layout.drawHeight,
    },
  },
  {
    direction: 'east',
    style: {
      left: layout.drawWidth - 6,
      top: 0,
      width: 6,
      height: layout.drawHeight,
    },
  },
];

  return (
    <div
      ref={containerRef}
      className={`map-canvas ${isPaintTool ? 'map-canvas--paint' : ''} ${tool === 'removeEncounter' ? 'map-canvas--erase' : ''} ${grayscaleMap ? 'map-canvas--grayscale' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerLeave}
      onDragStart={preventNativeDrag}
    >
      <div
        className="map-canvas__map-layer"
        style={mapLayerStyle}
        onDragStart={preventNativeDrag}
      >
        <img
          className="map-canvas__image"
          src={backgroundUrl}
          alt="Map background"
          draggable={false}
          onDragStart={preventNativeDrag}
          style={{
            ...flippedContentStyle,
            width: layout.drawWidth,
            height: layout.drawHeight,
            filter: grayscaleMap ? 'grayscale(100%)' : undefined,
          }}
        />

        <canvas
          ref={overlayRef}
          className="map-canvas__overlay"
          style={{
            ...flippedContentStyle,
            width: layout.drawWidth,
            height: layout.drawHeight,
          }}
        />

        {edgeIndicators.map(({ direction, style }) =>
          connections[direction] ? (
            <div
              key={direction}
              className={`map-canvas__edge map-canvas__edge--${direction}`}
              style={style}
              title={`Connects ${direction}`}
            />
          ) : null,
        )}
      </div>

      <div className="map-canvas__player-marker" style={playerMarkerStyle} title="Player start" />

      {entryPointMarkers.map((marker) => (
        <div
          key={marker.label}
          className="map-canvas__entry-marker"
          style={{
            left: layout.offsetX + marker.x * layout.drawWidth,
            top: layout.offsetY + marker.y * layout.drawHeight,
          }}
          title={marker.label}
        />
      ))}

      {showEncounterZones
        ? encounterZones.map((zone) => {
            const radiusPx = zone.radius * Math.min(imageWidth, imageHeight) * layout.scale;
            const markerSize = Math.max(40, Math.min(72, radiusPx * 1.6));

            return (
              <div
                key={zone.id}
                className="map-canvas__encounter"
                style={{
                  left:
                    layout.offsetX + normalizedToDisplayX(zone.position.x, layout.drawWidth, flipHorizontal),
                  top: layout.offsetY + zone.position.y * layout.drawHeight,
                  width: radiusPx * 2,
                  height: radiusPx * 2,
                  marginLeft: -radiusPx,
                  marginTop: -radiusPx,
                }}
                title={`${zone.element} encounter`}
              >
                <img
                  className="map-canvas__encounter-sprite"
                  src={getEncounterSpriteUrl(zone)}
                  alt=""
                  draggable={false}
                  style={{ width: markerSize, height: markerSize }}
                />
              </div>
            );
          })
        : null}

      {isPaintTool && brushCursor && brushDisplayRadius > 0 ? (
        <div
          className={`map-canvas__brush-preview map-canvas__brush-preview--${tool}`}
          style={{
            left: brushCursor.x,
            top: brushCursor.y,
            width: brushDisplayRadius * 2,
            height: brushDisplayRadius * 2,
            marginLeft: -brushDisplayRadius,
            marginTop: -brushDisplayRadius,
          }}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}

export { COLLISION_CELL_SIZE };
