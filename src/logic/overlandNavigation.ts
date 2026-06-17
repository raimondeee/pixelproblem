import type { MapDirection, OverlandScreen, ScreenConnection } from '@/game/types/overlandMap';
import { textureToVisualDirection } from '@/logic/mapConnections';
import { isWalkable, normalizedToImage } from '@/logic/overlandCollision';

export type MoveDirection = 'up' | 'down' | 'left' | 'right';

export const MOVE_DIRECTION_TO_MAP: Record<MoveDirection, MapDirection> = {
  up: 'north',
  down: 'south',
  left: 'west',
  right: 'east',
};

export const MOVE_STEP = 32;
export const EDGE_MARGIN = 28;

/** Where the player spawns on the target screen after exiting an edge. */
export const DEFAULT_ENTRY_BY_EXIT: Record<MapDirection, { x: number; y: number }> = {
  north: { x: 0.5, y: 0.92 },
  south: { x: 0.5, y: 0.08 },
  west: { x: 0.92, y: 0.5 },
  east: { x: 0.08, y: 0.5 },
};

export function getEdgeMargin(screen: OverlandScreen): number {
  return Math.round(Math.min(screen.imageWidth, screen.imageHeight) * 0.03);
}

export interface OverlandPlayerScale {
  playerSize: number;
  moveStep: number;
}

/** Scale movement and sprite size relative to the map image. */
export function getOverlandPlayerScale(imageHeight: number): OverlandPlayerScale {
  const playerSize = Math.round(Math.min(140, Math.max(80, imageHeight * 0.065)));
  return {
    playerSize,
    moveStep: Math.round(Math.min(48, Math.max(28, imageHeight * 0.021))),
  };
}

const DIRECTION_VECTORS: Record<MoveDirection, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function getDirectionVector(direction: MoveDirection): { x: number; y: number } {
  return DIRECTION_VECTORS[direction];
}

export function getNextPosition(
  x: number,
  y: number,
  direction: MoveDirection,
  step = MOVE_STEP,
): { x: number; y: number } {
  const vector = DIRECTION_VECTORS[direction];
  return {
    x: x + vector.x * step,
    y: y + vector.y * step,
  };
}

/** Sample points for the bottom third of the player sprite (feet hitbox). */
export function getPlayerFeetCollisionPoints(
  centerX: number,
  centerY: number,
  playerSize: number,
): { x: number; y: number }[] {
  const feetBandCenterY = centerY + playerSize / 3;
  const feetBottomY = centerY + playerSize * 0.45;
  const feetHalfWidth = playerSize * 0.22;

  return [
    { x: centerX, y: feetBandCenterY },
    { x: centerX - feetHalfWidth, y: feetBandCenterY },
    { x: centerX + feetHalfWidth, y: feetBandCenterY },
    { x: centerX, y: feetBottomY },
    { x: centerX - feetHalfWidth, y: feetBottomY },
    { x: centerX + feetHalfWidth, y: feetBottomY },
  ];
}

export function canWalkTo(
  screen: OverlandScreen,
  x: number,
  y: number,
  playerSize: number,
): boolean {
  return getPlayerFeetCollisionPoints(x, y, playerSize).every((point) =>
    isWalkable(screen, point.x, point.y),
  );
}

export function getEdgeConnection(
  screen: OverlandScreen,
  x: number,
  y: number,
  direction: MoveDirection,
): ScreenConnection | undefined {
  const flipped = screen.flipHorizontal ?? false;
  const textureDirection = MOVE_DIRECTION_TO_MAP[direction];
  const visualDirection = textureToVisualDirection(textureDirection, flipped);
  const connection = screen.connections[visualDirection];
  if (!connection) return undefined;

  switch (textureDirection) {
    case 'north':
      return y <= getEdgeMargin(screen) ? connection : undefined;
    case 'south':
      return y >= screen.imageHeight - getEdgeMargin(screen) ? connection : undefined;
    case 'west':
      return x <= getEdgeMargin(screen) ? connection : undefined;
    case 'east':
      return x >= screen.imageWidth - getEdgeMargin(screen) ? connection : undefined;
  }
}

export function entryPointToWorld(
  entryPoint: { x: number; y: number },
  screen: OverlandScreen,
): { x: number; y: number } {
  return normalizedToImage(entryPoint, screen.imageWidth, screen.imageHeight);
}

/** Push the spawn slightly inward so the player does not immediately re-trigger the edge. */
export function nudgeEntryPoint(
  entryPoint: { x: number; y: number },
  arrivedFrom: MapDirection,
): { x: number; y: number } {
  const nudge = 0.04;
  const delta: Record<MapDirection, { x: number; y: number }> = {
    north: { x: 0, y: nudge },
    south: { x: 0, y: -nudge },
    west: { x: nudge, y: 0 },
    east: { x: -nudge, y: 0 },
  };
  const offset = delta[arrivedFrom];

  return {
    x: Math.min(0.98, Math.max(0.02, entryPoint.x + offset.x)),
    y: Math.min(0.98, Math.max(0.02, entryPoint.y + offset.y)),
  };
}
