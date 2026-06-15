import Phaser from 'phaser';
import { createPhaserConfig } from '@/game/config/phaserConfig';

/**
 * Encapsulates the Phaser runtime so React only mounts/destroys a canvas host.
 * Game loop, scenes, and physics stay inside this class.
 */
export class GameEngine {
  private game: Phaser.Game | null = null;

  mount(container: HTMLElement): void {
    if (this.game) {
      return;
    }

    this.game = new Phaser.Game(createPhaserConfig(container));
  }

  destroy(): void {
    this.game?.destroy(true);
    this.game = null;
  }

  pause(): void {
    this.game?.scene.pause('GameScene');
  }

  resume(): void {
    this.game?.scene.resume('GameScene');
  }

  isRunning(): boolean {
    return this.game !== null;
  }
}

export const gameEngine = new GameEngine();
