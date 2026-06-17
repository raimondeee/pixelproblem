import Phaser from 'phaser';
import {
  getScreenById,
  getStartScreen,
  loadOverlandMapData,
  overlandTextureKey,
} from '@/game/data/overlandMapStore';
import { gameEvents } from '@/game/events/GameEventBus';
import { battleManager } from '@/game/managers/BattleManager';
import { playerSession } from '@/game/session/PlayerSession';
import type { MapDirection, OverlandMapData, OverlandScreen } from '@/game/types/overlandMap';
import { normalizedToImage } from '@/logic/overlandCollision';
import { getEncounterZoneAt } from '@/logic/encounterZones';
import {
  applyPhaserHorizontalFlip,
  getVisualMoveDirection,
} from '@/logic/mapFlip';
import {
  nudgeVisualEntryPoint,
  OPPOSITE_DIRECTION,
  visualEntryToTexture,
} from '@/logic/mapConnections';
import {
  canWalkTo,
  getEdgeConnection,
  getNextPosition,
  getOverlandPlayerScale,
  MOVE_DIRECTION_TO_MAP,
  type MoveDirection,
  type OverlandPlayerScale,
} from '@/logic/overlandNavigation';

const MOVE_DURATION_MS = 110;
const TRANSITION_FADE_MS = 160;

const DEPTH_BACKGROUND = 0;
const DEPTH_PLAYER = 10;
const DEPTH_FOREGROUND = 20;
const DEPTH_HUD = 30;

export class GameScene extends Phaser.Scene {
  private mapData!: OverlandMapData;
  private currentScreen!: OverlandScreen;
  private playerScale!: OverlandPlayerScale;
  private player!: Phaser.GameObjects.Sprite;
  private playerLogicalX = 0;
  private playerLogicalY = 0;
  private background!: Phaser.GameObjects.Image;
  private foregroundLayer?: Phaser.GameObjects.Image;
  private foregroundMaskGraphics?: Phaser.GameObjects.Graphics;
  private screenLabel!: Phaser.GameObjects.Text;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  private isMoving = false;
  private inputEnabled = true;
  private disarmedEncounterIds = new Set<string>();
  private unsubscribeMode?: () => void;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    this.mapData = loadOverlandMapData();

    for (const screen of this.mapData.screens) {
      this.load.image(overlandTextureKey(screen.id), screen.backgroundUrl);
    }

    const character = playerSession.getSelectedCharacter();
    if (character?.spriteUrl) {
      this.load.image('player-char', character.spriteUrl);
    }
  }

  create(): void {
    const startScreen = getStartScreen(this.mapData);
    this.loadScreen(startScreen, startScreen.playerStart);
    this.createPlayer();
    this.setupInput();
    this.setupModeListener();
  }

  update(): void {
    this.updateEncounterArming();

    if (!this.inputEnabled || this.isMoving || battleManager.getMode() === 'BATTLE') {
      return;
    }

    const direction = this.getPressedDirection();
    if (direction) {
      this.tryMove(direction);
    }
  }

  private loadScreen(screen: OverlandScreen, spawn: { x: number; y: number }): void {
    this.currentScreen = screen;
    this.playerScale = getOverlandPlayerScale(screen.imageHeight);

    this.background?.destroy();
    this.destroyForegroundLayer();
    this.screenLabel?.destroy();

    this.scale.setGameSize(screen.imageWidth, screen.imageHeight);
    this.cameras.main.setBounds(0, 0, screen.imageWidth, screen.imageHeight);

    this.background = this.add
      .image(0, 0, overlandTextureKey(screen.id))
      .setOrigin(0, 0)
      .setDepth(DEPTH_BACKGROUND);
    applyPhaserHorizontalFlip(this.background, screen.imageWidth, screen.flipHorizontal ?? false);

    this.buildForegroundLayer(screen);

    this.screenLabel = this.add
      .text(16, 16, screen.name, {
        fontFamily: 'monospace',
        fontSize: `${Math.round(screen.imageHeight * 0.016)}px`,
        color: '#f8f9fa',
        backgroundColor: '#000000aa',
        padding: { x: 8, y: 4 },
      })
      .setDepth(DEPTH_HUD)
      .setScrollFactor(0);

    const spawnPoint = normalizedToImage(spawn, screen.imageWidth, screen.imageHeight);

    if (this.player) {
      this.applyPlayerScale();
      this.setPlayerLogicalPosition(spawnPoint.x, spawnPoint.y);
      this.player.setDepth(DEPTH_PLAYER);
    }
  }

  private buildForegroundLayer(screen: OverlandScreen): void {
    const grid = screen.foregroundGrid;
    const cellSize = screen.collisionCellSize;
    const hasForeground = grid.some((row) => row.some((cell) => cell === 1));
    if (!hasForeground) {
      return;
    }

    const maskGraphics = this.make.graphics({ x: 0, y: 0 }, false);
    maskGraphics.fillStyle(0xffffff, 1);

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col] === 1) {
          maskGraphics.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }

    const mask = maskGraphics.createGeometryMask();
    this.foregroundMaskGraphics = maskGraphics;

    if (screen.flipHorizontal) {
      maskGraphics.setScale(-1, 1);
      maskGraphics.setPosition(screen.imageWidth, 0);
    }

    this.foregroundLayer = this.add
      .image(0, 0, overlandTextureKey(screen.id))
      .setOrigin(0, 0)
      .setDepth(DEPTH_FOREGROUND)
      .setMask(mask);
    applyPhaserHorizontalFlip(this.foregroundLayer, screen.imageWidth, screen.flipHorizontal ?? false);
  }

  private destroyForegroundLayer(): void {
    this.foregroundLayer?.destroy();
    this.foregroundMaskGraphics?.destroy();
    this.foregroundLayer = undefined;
    this.foregroundMaskGraphics = undefined;
  }

  private createPlayer(): void {
    const startScreen = getStartScreen(this.mapData);
    this.playerScale = getOverlandPlayerScale(startScreen.imageHeight);
    const spawn = normalizedToImage(
      startScreen.playerStart,
      startScreen.imageWidth,
      startScreen.imageHeight,
    );

    if (this.textures.exists('player-char')) {
      this.player = this.add.sprite(spawn.x, spawn.y, 'player-char');
    } else {
      const size = this.playerScale.playerSize - 8;
      const gfx = this.make.graphics({}, false);
      gfx.fillStyle(0xf2e9e4, 1);
      gfx.fillRect(0, 0, size, size);
      gfx.generateTexture('player', size, size);
      gfx.destroy();

      this.player = this.add.sprite(spawn.x, spawn.y, 'player');
    }

    this.applyPlayerScale();
    this.setPlayerLogicalPosition(spawn.x, spawn.y);
    this.player.setDepth(DEPTH_PLAYER);
  }

  private isScreenFlipped(): boolean {
    return this.currentScreen.flipHorizontal ?? false;
  }

  private setPlayerLogicalPosition(x: number, y: number): void {
    this.playerLogicalX = x;
    this.playerLogicalY = y;
    this.syncPlayerDisplay();
  }

  private syncPlayerDisplay(): void {
    const flipped = this.isScreenFlipped();
    const { imageWidth } = this.currentScreen;
    this.player.setPosition(
      flipped ? imageWidth - this.playerLogicalX : this.playerLogicalX,
      this.playerLogicalY,
    );
  }

  private applyPlayerScale(): void {
    const { playerSize } = this.playerScale;
    this.player.setDisplaySize(playerSize, playerSize);
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

  private getPressedDirection(): MoveDirection | null {
    if (this.cursors.up.isDown || this.wasd.W.isDown) return 'up';
    if (this.cursors.down.isDown || this.wasd.S.isDown) return 'down';
    if (this.cursors.left.isDown || this.wasd.A.isDown) return 'left';
    if (this.cursors.right.isDown || this.wasd.D.isDown) return 'right';
    return null;
  }

  private tryMove(direction: MoveDirection): void {
    const { moveStep, playerSize } = this.playerScale;
    const flipped = this.isScreenFlipped();
    const moveDirection = getVisualMoveDirection(direction, flipped);
    const next = getNextPosition(
      this.playerLogicalX,
      this.playerLogicalY,
      moveDirection,
      moveStep,
    );
    const edgeConnection = getEdgeConnection(
      this.currentScreen,
      next.x,
      next.y,
      moveDirection,
    );

    if (edgeConnection) {
      const visualExit = MOVE_DIRECTION_TO_MAP[direction];
      this.transitionToScreen(
        edgeConnection.targetScreenId,
        edgeConnection.entryPoint,
        OPPOSITE_DIRECTION[visualExit],
      );
      return;
    }

    if (!canWalkTo(this.currentScreen, next.x, next.y, playerSize)) {
      return;
    }

    this.isMoving = true;

    const tweenTarget = { x: this.playerLogicalX, y: this.playerLogicalY };

    this.tweens.add({
      targets: tweenTarget,
      x: next.x,
      y: next.y,
      duration: MOVE_DURATION_MS,
      ease: 'Linear',
      onUpdate: () => {
        this.setPlayerLogicalPosition(tweenTarget.x, tweenTarget.y);
      },
      onComplete: () => {
        this.isMoving = false;
        this.checkEncounterTrigger();
      },
    });
  }

  private updateEncounterArming(): void {
    const zones = this.currentScreen.encounterZones ?? [];
    if (!zones.length || !this.player) {
      return;
    }

    const { imageWidth, imageHeight } = this.currentScreen;

    for (const zone of zones) {
      const inside =
        getEncounterZoneAt(
          zones,
          this.playerLogicalX,
          this.playerLogicalY,
          imageWidth,
          imageHeight,
        )?.id === zone.id;

      if (!inside) {
        this.disarmedEncounterIds.delete(zone.id);
      }
    }
  }

  private checkEncounterTrigger(): void {
    if (battleManager.getMode() !== 'EXPLORE' || !this.player) {
      return;
    }

    const { imageWidth, imageHeight, encounterZones } = this.currentScreen;
    const zone = getEncounterZoneAt(
      encounterZones,
      this.playerLogicalX,
      this.playerLogicalY,
      imageWidth,
      imageHeight,
    );

    if (!zone || this.disarmedEncounterIds.has(zone.id)) {
      return;
    }

    this.disarmedEncounterIds.add(zone.id);
    this.disableInput();
    gameEvents.emit('battle-trigger', { enemyId: zone.id });
  }

  private transitionToScreen(
    targetScreenId: string,
    entryPoint: { x: number; y: number },
    exitDirection: MapDirection,
  ): void {
    const targetScreen = getScreenById(this.mapData, targetScreenId);
    if (!targetScreen) return;

    const spawn = nudgeVisualEntryPoint(entryPoint, exitDirection);
    const textureSpawn = visualEntryToTexture(spawn, targetScreen.flipHorizontal ?? false);

    this.isMoving = true;
    this.disableInput();

    this.cameras.main.fadeOut(TRANSITION_FADE_MS, 0, 0, 0);

    this.time.delayedCall(TRANSITION_FADE_MS, () => {
      this.loadScreen(targetScreen, textureSpawn);

      if (this.player) {
        const worldPoint = normalizedToImage(
          textureSpawn,
          targetScreen.imageWidth,
          targetScreen.imageHeight,
        );
        this.setPlayerLogicalPosition(worldPoint.x, worldPoint.y);
      }

      this.cameras.main.fadeIn(TRANSITION_FADE_MS, 0, 0, 0);

      this.time.delayedCall(TRANSITION_FADE_MS, () => {
        this.isMoving = false;
        if (battleManager.getMode() === 'EXPLORE') {
          this.enableInput();
        }
      });
    });
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
