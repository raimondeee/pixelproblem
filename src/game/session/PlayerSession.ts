import type { PlayableCharacter } from '@/game/data/players';

type SessionListener = (character: PlayableCharacter | null) => void;

class PlayerSession {
  private selectedCharacter: PlayableCharacter | null = null;

  private listeners = new Set<SessionListener>();

  subscribe(listener: SessionListener): () => void {
    this.listeners.add(listener);
    listener(this.selectedCharacter);

    return () => {
      this.listeners.delete(listener);
    };
  }

  getSelectedCharacter(): PlayableCharacter | null {
    return this.selectedCharacter;
  }

  selectCharacter(character: PlayableCharacter): void {
    this.selectedCharacter = character;
    this.listeners.forEach((listener) => listener(this.selectedCharacter));
  }

  clear(): void {
    this.selectedCharacter = null;
    this.listeners.forEach((listener) => listener(null));
  }
}

export const playerSession = new PlayerSession();
