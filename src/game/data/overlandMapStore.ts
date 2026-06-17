import { OVERLAND_MAP_IMAGES } from '@/game/data/overlandAssets';
import type { OverlandMapData, OverlandScreen } from '@/game/types/overlandMap';
import { COLLISION_CELL_SIZE } from '@/game/types/overlandMap';
import { createGridForImage, createScreenId, migrateScreenGridResolution } from '@/logic/overlandCollision';
import { ensureReciprocalConnections } from '@/logic/mapConnections';

export const OVERLAND_MAP_STORAGE_KEY = 'pixel-problems-overland-map';

function createDefaultScreen(
  imageUrl: string,
  imageWidth: number,
  imageHeight: number,
): OverlandScreen {
  return {
    id: createScreenId(),
    name: 'New Screen',
    backgroundUrl: imageUrl,
    imageWidth,
    imageHeight,
    collisionGrid: createGridForImage(imageWidth, imageHeight),
    foregroundGrid: createGridForImage(imageWidth, imageHeight),
    collisionCellSize: COLLISION_CELL_SIZE,
    playerStart: { x: 0.5, y: 0.5 },
    connections: {},
    encounterZones: [],
  };
}

export function createInitialOverlandMapData(): OverlandMapData {
  const firstImage = OVERLAND_MAP_IMAGES[0];
  const screen = createDefaultScreen(firstImage.url, 2752, 1536);
  screen.name = 'Starting Area';

  return {
    version: 1,
    screens: [screen],
    startScreenId: screen.id,
  };
}

export function loadOverlandMapData(): OverlandMapData {
  try {
    const raw = localStorage.getItem(OVERLAND_MAP_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as OverlandMapData;
      if (parsed.version === 1 && parsed.screens.length > 0) {
        return normalizeOverlandMapData(parsed);
      }
    }
  } catch {
    // fall through to default
  }
  return createInitialOverlandMapData();
}

export function normalizeOverlandMapData(data: OverlandMapData): OverlandMapData {
  const screens = ensureReciprocalConnections(
    data.screens.map((screen) => {
      const migrated = migrateScreenGridResolution({
        ...screen,
        encounterZones: screen.encounterZones ?? [],
        foregroundGrid:
          screen.foregroundGrid ??
          createGridForImage(screen.imageWidth, screen.imageHeight, screen.collisionCellSize),
      });

      return {
        ...migrated,
        flipHorizontal: screen.flipHorizontal ?? false,
      };
    }),
  );

  return {
    ...data,
    screens,
  };
}

export function saveOverlandMapData(data: OverlandMapData): void {
  localStorage.setItem(OVERLAND_MAP_STORAGE_KEY, JSON.stringify(data));
}

export function getScreenById(
  mapData: OverlandMapData,
  screenId: string,
): OverlandScreen | undefined {
  return mapData.screens.find((screen) => screen.id === screenId);
}

export function getStartScreen(mapData: OverlandMapData): OverlandScreen {
  return (
    getScreenById(mapData, mapData.startScreenId) ?? mapData.screens[0]
  );
}

export function overlandTextureKey(screenId: string): string {
  return `overland-${screenId}`;
}
