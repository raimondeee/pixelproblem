import Phaser from 'phaser';
import { getStartScreen, loadOverlandMapData } from '@/game/data/overlandMapStore';
import { GameScene } from '@/game/scenes/GameScene';

export function createPhaserConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  const mapData = loadOverlandMapData();
  const startScreen = getStartScreen(mapData);

  return {
    type: Phaser.AUTO,
    parent,
    width: startScreen.imageWidth,
    height: startScreen.imageHeight,
    backgroundColor: '#090b10',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.ENVELOP,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      parent,
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
