import type { MapDirection, OverlandScreen } from '@/game/types/overlandMap';
import { DEFAULT_ENTRY_BY_EXIT } from '@/logic/overlandNavigation';

export const OPPOSITE_DIRECTION: Record<MapDirection, MapDirection> = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
};

/** Map texture edge direction to the cardinal direction shown on screen. */
export function textureToVisualDirection(
  direction: MapDirection,
  flipped: boolean,
): MapDirection {
  if (!flipped) {
    return direction;
  }

  if (direction === 'east') return 'west';
  if (direction === 'west') return 'east';
  return direction;
}

/** Connection entry points are stored in visual space (west = low x on screen). */
export function visualEntryToTexture(
  entry: { x: number; y: number },
  flipped: boolean,
): { x: number; y: number } {
  if (!flipped) {
    return entry;
  }

  return { x: 1 - entry.x, y: entry.y };
}

export function textureEntryToVisual(
  entry: { x: number; y: number },
  flipped: boolean,
): { x: number; y: number } {
  return visualEntryToTexture(entry, flipped);
}

/** Push the spawn slightly inward from the visual edge the player arrived on. */
export function nudgeVisualEntryPoint(
  entry: { x: number; y: number },
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
    x: Math.min(0.98, Math.max(0.02, entry.x + offset.x)),
    y: Math.min(0.98, Math.max(0.02, entry.y + offset.y)),
  };
}

function clearReciprocalConnection(
  screens: OverlandScreen[],
  sourceId: string,
  direction: MapDirection,
  targetId: string,
): OverlandScreen[] {
  const opposite = OPPOSITE_DIRECTION[direction];

  return screens.map((screen) => {
    if (screen.id !== targetId) {
      return screen;
    }

    const reciprocal = screen.connections[opposite];
    if (reciprocal?.targetScreenId !== sourceId) {
      return screen;
    }

    const connections = { ...screen.connections };
    delete connections[opposite];
    return { ...screen, connections };
  });
}

/** Set an outbound connection and keep the reciprocal inbound link on the target screen. */
export function updateScreenConnection(
  screens: OverlandScreen[],
  sourceId: string,
  direction: MapDirection,
  newTargetId: string | null,
): OverlandScreen[] {
  const source = screens.find((screen) => screen.id === sourceId);
  if (!source) {
    return screens;
  }

  const previousTargetId = source.connections[direction]?.targetScreenId;
  let next = screens;

  if (previousTargetId) {
    next = clearReciprocalConnection(next, sourceId, direction, previousTargetId);
  }

  next = next.map((screen) => {
    if (screen.id !== sourceId) {
      return screen;
    }

    const connections = { ...screen.connections };
    if (!newTargetId) {
      delete connections[direction];
    } else {
      connections[direction] = {
        targetScreenId: newTargetId,
        entryPoint:
          screen.connections[direction]?.entryPoint ?? DEFAULT_ENTRY_BY_EXIT[direction],
      };
    }

    return { ...screen, connections };
  });

  if (!newTargetId) {
    return next;
  }

  const opposite = OPPOSITE_DIRECTION[direction];
  return next.map((screen) => {
    if (screen.id !== newTargetId) {
      return screen;
    }

    const connections = { ...screen.connections };
    connections[opposite] = {
      targetScreenId: sourceId,
      entryPoint: screen.connections[opposite]?.entryPoint ?? DEFAULT_ENTRY_BY_EXIT[opposite],
    };

    return { ...screen, connections };
  });
}

/** Add missing return links when loading older map data. */
export function ensureReciprocalConnections(screens: OverlandScreen[]): OverlandScreen[] {
  let next = screens.map((screen) => ({
    ...screen,
    connections: { ...screen.connections },
  }));

  for (const screen of screens) {
    for (const direction of Object.keys(screen.connections) as MapDirection[]) {
      const connection = screen.connections[direction];
      if (!connection) {
        continue;
      }

      const opposite = OPPOSITE_DIRECTION[direction];
      const targetIndex = next.findIndex((entry) => entry.id === connection.targetScreenId);
      if (targetIndex === -1) {
        continue;
      }

      const target = next[targetIndex];
      const reciprocal = target.connections[opposite];
      if (reciprocal?.targetScreenId === screen.id) {
        continue;
      }

      const updatedConnections = { ...target.connections };
      updatedConnections[opposite] = {
        targetScreenId: screen.id,
        entryPoint: reciprocal?.entryPoint ?? DEFAULT_ENTRY_BY_EXIT[opposite],
      };

      next[targetIndex] = {
        ...target,
        connections: updatedConnections,
      };
    }
  }

  return next;
}
