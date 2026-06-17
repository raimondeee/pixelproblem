import type { SpellElement } from '@/game/types';

export type MapDirection = 'north' | 'south' | 'east' | 'west';

export type MapEditorTool =
  | 'block'
  | 'walk'
  | 'foreground'
  | 'clearForeground'
  | 'playerStart'
  | 'connection'
  | 'encounter'
  | 'removeEncounter';

/** 0 = walkable, 1 = blocked */
export type CollisionCell = 0 | 1;

export interface EncounterZone {
  id: string;
  /** Normalized center on the map image. */
  position: { x: number; y: number };
  /** Radius as a fraction of the shorter map edge. */
  radius: number;
  element: SpellElement;
  variant: number;
}

export interface ScreenConnection {
  targetScreenId: string;
  /** Normalized position on the target screen in visual space (west = low x on screen). */
  entryPoint: { x: number; y: number };
}

export interface OverlandScreen {
  id: string;
  name: string;
  backgroundUrl: string;
  /** When true, the background is mirrored horizontally at runtime. */
  flipHorizontal?: boolean;
  imageWidth: number;
  imageHeight: number;
  /** Row-major collision grid aligned to collisionCellSize pixels. */
  collisionGrid: CollisionCell[][];
  /** Regions drawn above the player (canopies, arches, etc.). */
  foregroundGrid: CollisionCell[][];
  collisionCellSize: number;
  /** Normalized player spawn for this screen (used when entering without a connection). */
  playerStart: { x: number; y: number };
  connections: Partial<Record<MapDirection, ScreenConnection>>;
  encounterZones: EncounterZone[];
}

export interface OverlandMapData {
  version: 1;
  screens: OverlandScreen[];
  startScreenId: string;
}

export const COLLISION_CELL_SIZE = 4;
export const LEGACY_COLLISION_CELL_SIZE = 16;
export const DEFAULT_BRUSH_RADIUS_PX = 48;
export const MIN_BRUSH_RADIUS_PX = 12;
export const MAX_BRUSH_RADIUS_PX = 128;

export const MAP_DIRECTIONS: MapDirection[] = ['north', 'south', 'east', 'west'];

export const DIRECTION_LABELS: Record<MapDirection, string> = {
  north: 'North ↑',
  south: 'South ↓',
  east: 'East →',
  west: 'West ←',
};
