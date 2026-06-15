import type { GameEventMap, GameEventName } from '@/game/types';

type Listener<T> = (payload: T) => void;

/**
 * Lightweight pub/sub bridge between Phaser and React.
 * Keeps the game engine decoupled from UI state.
 */
class GameEventBus {
  private listeners = new Map<GameEventName, Set<Listener<unknown>>>();

  on<K extends GameEventName>(
    event: K,
    listener: Listener<GameEventMap[K]>,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(listener as Listener<unknown>);

    return () => {
      this.listeners.get(event)?.delete(listener as Listener<unknown>);
    };
  }

  emit<K extends GameEventName>(event: K, payload: GameEventMap[K]): void {
    this.listeners.get(event)?.forEach((listener) => {
      listener(payload);
    });
  }
}

export const gameEvents = new GameEventBus();
