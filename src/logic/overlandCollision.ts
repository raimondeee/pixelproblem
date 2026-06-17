import type { CollisionCell, OverlandScreen } from '@/game/types/overlandMap';
import {
  COLLISION_CELL_SIZE,
  LEGACY_COLLISION_CELL_SIZE,
} from '@/game/types/overlandMap';

export function gridDimensions(
  imageWidth: number,
  imageHeight: number,
  cellSize = COLLISION_CELL_SIZE,
): { cols: number; rows: number } {
  return {
    cols: Math.ceil(imageWidth / cellSize),
    rows: Math.ceil(imageHeight / cellSize),
  };
}

export function createEmptyGrid(cols: number, rows: number): CollisionCell[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
}

export function createGridForImage(
  imageWidth: number,
  imageHeight: number,
  cellSize = COLLISION_CELL_SIZE,
): CollisionCell[][] {
  const { cols, rows } = gridDimensions(imageWidth, imageHeight, cellSize);
  return createEmptyGrid(cols, rows);
}

export function upscaleGrid(grid: CollisionCell[][], factor: number): CollisionCell[][] {
  if (factor <= 1) {
    return grid;
  }

  const newRows: CollisionCell[][] = [];

  for (const row of grid) {
    for (let fy = 0; fy < factor; fy++) {
      const newRow: CollisionCell[] = [];
      for (const cell of row) {
        for (let fx = 0; fx < factor; fx++) {
          newRow.push(cell);
        }
      }
      newRows.push(newRow);
    }
  }

  return newRows;
}

export function migrateScreenGridResolution(screen: OverlandScreen): OverlandScreen {
  if (screen.collisionCellSize !== LEGACY_COLLISION_CELL_SIZE) {
    return screen;
  }

  const factor = LEGACY_COLLISION_CELL_SIZE / COLLISION_CELL_SIZE;

  return {
    ...screen,
    collisionGrid: upscaleGrid(screen.collisionGrid, factor),
    foregroundGrid: upscaleGrid(
      screen.foregroundGrid ?? createGridForImage(screen.imageWidth, screen.imageHeight, LEGACY_COLLISION_CELL_SIZE),
      factor,
    ),
    collisionCellSize: COLLISION_CELL_SIZE,
  };
}

/** Smooth circular brush in image pixel space. */
export function paintCircleOnGrid(
  grid: CollisionCell[][],
  centerX: number,
  centerY: number,
  radiusPixels: number,
  cellSize: number,
  value: CollisionCell,
): CollisionCell[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (cols === 0 || radiusPixels <= 0) {
    return grid;
  }

  const next = grid.map((row) => [...row]);
  const radiusSq = radiusPixels * radiusPixels;

  const minCol = Math.max(0, Math.floor((centerX - radiusPixels) / cellSize));
  const maxCol = Math.min(cols - 1, Math.floor((centerX + radiusPixels) / cellSize));
  const minRow = Math.max(0, Math.floor((centerY - radiusPixels) / cellSize));
  const maxRow = Math.min(rows - 1, Math.floor((centerY + radiusPixels) / cellSize));

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const cellCenterX = col * cellSize + cellSize * 0.5;
      const cellCenterY = row * cellSize + cellSize * 0.5;
      const dx = cellCenterX - centerX;
      const dy = cellCenterY - centerY;

      if (dx * dx + dy * dy <= radiusSq) {
        next[row][col] = value;
      }
    }
  }

  return next;
}

/** Interpolate circles along a drag stroke so fast moves do not leave gaps. */
export function paintStrokeOnGrid(
  grid: CollisionCell[][],
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  radiusPixels: number,
  cellSize: number,
  value: CollisionCell,
): CollisionCell[][] {
  const distance = Math.hypot(toX - fromX, toY - fromY);
  const spacing = Math.max(1, radiusPixels * 0.35);
  const steps = Math.max(1, Math.ceil(distance / spacing));

  let result = grid;
  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    const x = fromX + (toX - fromX) * t;
    const y = fromY + (toY - fromY) * t;
    result = paintCircleOnGrid(result, x, y, radiusPixels, cellSize, value);
  }

  return result;
}

export function imageToGridCoords(
  imageX: number,
  imageY: number,
  cellSize = COLLISION_CELL_SIZE,
): { col: number; row: number } {
  return {
    col: Math.floor(imageX / cellSize),
    row: Math.floor(imageY / cellSize),
  };
}

export function normalizedToImage(
  point: { x: number; y: number },
  imageWidth: number,
  imageHeight: number,
): { x: number; y: number } {
  return {
    x: point.x * imageWidth,
    y: point.y * imageHeight,
  };
}

export function imageToNormalized(
  x: number,
  y: number,
  imageWidth: number,
  imageHeight: number,
): { x: number; y: number } {
  return {
    x: Math.min(1, Math.max(0, x / imageWidth)),
    y: Math.min(1, Math.max(0, y / imageHeight)),
  };
}

export function isWalkable(screen: OverlandScreen, imageX: number, imageY: number): boolean {
  const { col, row } = imageToGridCoords(imageX, imageY, screen.collisionCellSize);
  if (row < 0 || row >= screen.collisionGrid.length) return false;
  if (col < 0 || col >= screen.collisionGrid[row].length) return false;
  return screen.collisionGrid[row][col] === 0;
}

export function createScreenId(): string {
  return `screen-${crypto.randomUUID().slice(0, 8)}`;
}
