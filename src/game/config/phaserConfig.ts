import Phaser from 'phaser';
import { GameScene } from '@/game/scenes/GameScene';
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  TILE_SIZE,
} from '@/game/config/worldConfig';

export function createPhaserConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: MAP_WIDTH * TILE_SIZE,
    height: MAP_HEIGHT * TILE_SIZE,
    backgroundColor: '#1a1a2e',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [GameScene],
    input: {
      activePointers: 3,
      touch: {
        capture: true,
      },
    },
    render: {
      pixelArt: true,
      antialias: false,
    },
  };
}
