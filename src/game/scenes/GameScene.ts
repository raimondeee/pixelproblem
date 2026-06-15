import Phaser from 'phaser';
import {
  BATTLE_TRIGGER_TILE,
  MAP_LAYOUT,
  PLAYER_START_TILE,
  TILE_SIZE,
} from '@/game/config/worldConfig';
import { gameEvents } from '@/game/events/GameEventBus';
import { battleManager } from '@/game/managers/BattleManager';
import { playerSession } from '@/game/session/PlayerSession';

type Direction = 'up' | 'down' | 'left' | 'right';

const DIRECTION_VECTORS: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private battleZoneArmed = true;
  private isMoving = false;
  private currentTile = { ...PLAYER_START_TILE };
  private inputEnabled = true;
  private unsubscribeMode?: () => void;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    const character = playerSession.getSelectedCharacter();
    if (character?.spriteUrl) {
      this.load.image('player-char', character.spriteUrl);
    }
  }

  create(): void {
    this.createMap();
    this.createPlayer();
    this.createBattleTrigger();
    this.setupInput();
    this.setupModeListener();
  }

  update(): void {
    this.updateBattleZoneArming();

    if (!this.inputEnabled || this.isMoving || battleManager.getMode() === 'BATTLE') {
      return;
    }

    const direction = this.getPressedDirection();
    if (direction) {
      this.tryMove(direction);
    }
  }

  private createMap(): void {
    this.walls = this.physics.add.staticGroup();

    for (let row = 0; row < MAP_LAYOUT.length; row++) {
      for (let col = 0; col < MAP_LAYOUT[row].length; col++) {
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;

        if (MAP_LAYOUT[row][col] === 1) {
          const wall = this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0x4a4e69);
          this.physics.add.existing(wall, true);
          this.walls.add(wall);
        } else {
          this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0x22223b).setStrokeStyle(1, 0x2a2a40);
        }
      }
    }
  }

  private createPlayer(): void {
    const startX = PLAYER_START_TILE.x * TILE_SIZE + TILE_SIZE / 2;
    const startY = PLAYER_START_TILE.y * TILE_SIZE + TILE_SIZE / 2;

    if (this.textures.exists('player-char')) {
      this.player = this.physics.add.sprite(startX, startY, 'player-char');
      this.player.setDisplaySize(TILE_SIZE - 4, TILE_SIZE - 4);
    } else {
      const size = TILE_SIZE - 8;
      const gfx = this.make.graphics({}, false);
      gfx.fillStyle(0xf2e9e4, 1);
      gfx.fillRect(0, 0, size, size);
      gfx.generateTexture('player', size, size);
      gfx.destroy();

      this.player = this.physics.add.sprite(startX, startY, 'player');
    }

    this.player.setCollideWorldBounds(true);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(TILE_SIZE - 12, TILE_SIZE - 12);
    body.setOffset(6, 6);

    this.physics.add.collider(this.player, this.walls);
  }

  private createBattleTrigger(): void {
    const x = BATTLE_TRIGGER_TILE.x * TILE_SIZE + TILE_SIZE / 2;
    const y = BATTLE_TRIGGER_TILE.y * TILE_SIZE + TILE_SIZE / 2;

    this.add.rectangle(x, y, TILE_SIZE - 4, TILE_SIZE - 4, 0xc9184a, 0.35)
      .setStrokeStyle(2, 0xff4d6d);
  }

  private updateBattleZoneArming(): void {
    if (!this.isOnBattleTriggerTile()) {
      this.battleZoneArmed = true;
    }
  }

  private isOnBattleTriggerTile(): boolean {
    return (
      this.currentTile.x === BATTLE_TRIGGER_TILE.x &&
      this.currentTile.y === BATTLE_TRIGGER_TILE.y
    );
  }

  private checkBattleTrigger(): void {
    if (
      !this.battleZoneArmed ||
      battleManager.getMode() !== 'EXPLORE' ||
      !this.isOnBattleTriggerTile()
    ) {
      return;
    }

    this.battleZoneArmed = false;
    this.disableInput();
    gameEvents.emit('battle-trigger', { enemyId: 'ene-fire' });
  }

  private setupInput(): void {
    if (!this.input.keyboard) {
      return;
    }

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D') as GameScene['wasd'];
  }

  private setupModeListener(): void {
    this.unsubscribeMode = gameEvents.on('mode-changed', (mode) => {
      if (mode === 'EXPLORE') {
        this.enableInput();
      } else {
        this.disableInput();
      }
    });
  }

  private getPressedDirection(): Direction | null {
    if (this.cursors.up.isDown || this.wasd.W.isDown) return 'up';
    if (this.cursors.down.isDown || this.wasd.S.isDown) return 'down';
    if (this.cursors.left.isDown || this.wasd.A.isDown) return 'left';
    if (this.cursors.right.isDown || this.wasd.D.isDown) return 'right';
    return null;
  }

  private tryMove(direction: Direction): void {
    const vector = DIRECTION_VECTORS[direction];
    const nextTile = {
      x: this.currentTile.x + vector.x,
      y: this.currentTile.y + vector.y,
    };

    if (!this.isWalkable(nextTile.x, nextTile.y)) {
      return;
    }

    this.isMoving = true;
    this.currentTile = nextTile;

    const targetX = nextTile.x * TILE_SIZE + TILE_SIZE / 2;
    const targetY = nextTile.y * TILE_SIZE + TILE_SIZE / 2;

    this.tweens.add({
      targets: this.player,
      x: targetX,
      y: targetY,
      duration: 120,
      ease: 'Linear',
      onComplete: () => {
        this.isMoving = false;
        this.checkBattleTrigger();
      },
    });
  }

  private isWalkable(tileX: number, tileY: number): boolean {
    if (
      tileY < 0 ||
      tileY >= MAP_LAYOUT.length ||
      tileX < 0 ||
      tileX >= MAP_LAYOUT[0].length
    ) {
      return false;
    }

    return MAP_LAYOUT[tileY][tileX] === 0;
  }

  private disableInput(): void {
    this.inputEnabled = false;
  }

  private enableInput(): void {
    this.inputEnabled = true;
  }

  shutdown(): void {
    this.unsubscribeMode?.();
  }
}
