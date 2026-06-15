export interface GameSettings {
  requireConfirmAnswer: boolean;
}

const STORAGE_KEY = 'pixel-problems-settings';

const DEFAULT_SETTINGS: GameSettings = {
  requireConfirmAnswer: false,
};

type SettingsListener = (settings: GameSettings) => void;

class GameSettingsStore {
  private settings: GameSettings;

  private listeners = new Set<SettingsListener>();

  constructor() {
    this.settings = this.readFromStorage();
  }

  private readFromStorage(): GameSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { ...DEFAULT_SETTINGS };
      }

      const parsed = JSON.parse(raw) as Partial<GameSettings>;
      return {
        requireConfirmAnswer:
          typeof parsed.requireConfirmAnswer === 'boolean'
            ? parsed.requireConfirmAnswer
            : DEFAULT_SETTINGS.requireConfirmAnswer,
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
  }

  getSettings(): GameSettings {
    return this.settings;
  }

  setSetting<K extends keyof GameSettings>(key: K, value: GameSettings[K]): void {
    if (this.settings[key] === value) {
      return;
    }

    this.settings = { ...this.settings, [key]: value };
    this.persist();
    this.listeners.forEach((listener) => listener(this.settings));
  }

  subscribe(listener: SettingsListener): () => void {
    this.listeners.add(listener);
    listener(this.settings);

    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const gameSettings = new GameSettingsStore();
