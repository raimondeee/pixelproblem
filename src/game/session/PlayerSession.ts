import type { PlayableCharacter } from '@/game/data/players';
import type { Pet } from '@/game/types';
import { DEFAULT_PETS } from '@/game/data/pets';

type SessionListener = (character: PlayableCharacter | null) => void;

class PlayerSession {
  private selectedCharacter: PlayableCharacter | null = null;

  private pets: Pet[] = DEFAULT_PETS.map((pet) => ({ ...pet }));

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

  getPets(): Pet[] {
    return this.pets.map((pet) => ({ ...pet }));
  }

  getPetsForBattle(): Pet[] {
    return this.pets.map((pet) => ({ ...pet, hp: pet.maxHp }));
  }

  addCapturedPet(pet: Pet): void {
    this.pets = [...this.pets, pet];
  }

  selectCharacter(character: PlayableCharacter): void {
    this.selectedCharacter = character;
    this.listeners.forEach((listener) => listener(this.selectedCharacter));
  }

  clear(): void {
    this.selectedCharacter = null;
    this.pets = DEFAULT_PETS.map((pet) => ({ ...pet }));
    this.listeners.forEach((listener) => listener(null));
  }
}

export const playerSession = new PlayerSession();
