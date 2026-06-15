import { useSyncExternalStore } from 'react';
import { gameSettings, type GameSettings } from '@/game/settings/gameSettings';

export function useGameSettings(): GameSettings {
  return useSyncExternalStore(
    (listener) => gameSettings.subscribe(listener),
    () => gameSettings.getSettings(),
    () => gameSettings.getSettings(),
  );
}
