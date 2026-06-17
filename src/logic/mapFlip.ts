import type { OverlandMapData, OverlandScreen } from '@/game/types/overlandMap';
export function flipScreenHorizontally(screen: OverlandScreen): OverlandScreen {
  return {
    ...screen,
    flipHorizontal: !screen.flipHorizontal,
  };
}

export function flipMapScreenHorizontally(
  mapData: OverlandMapData,
  screenId: string,
): OverlandMapData {
  return {
    ...mapData,
    screens: mapData.screens.map((screen) =>
      screen.id === screenId ? flipScreenHorizontally(screen) : screen,
    ),
  };
}

export function applyPhaserHorizontalFlip(
  image: Phaser.GameObjects.Image,
  imageWidth: number,
  flipped: boolean,
): void {
  image.setOrigin(0, 0);

  if (flipped) {
    image.setScale(-1, 1);
    image.setPosition(imageWidth, 0);
  } else {
    image.setScale(1, 1);
    image.setPosition(0, 0);
  }
}

/** Mirror horizontal movement when the screen image is flipped. */
export function mirrorHorizontalDirection(
  direction: 'left' | 'right',
): 'left' | 'right' {
  return direction === 'left' ? 'right' : 'left';
}

export function getVisualMoveDirection(
  direction: 'up' | 'down' | 'left' | 'right',
  flipped: boolean,
): 'up' | 'down' | 'left' | 'right' {
  if (!flipped || (direction !== 'left' && direction !== 'right')) {
    return direction;
  }
  return mirrorHorizontalDirection(direction);
}
