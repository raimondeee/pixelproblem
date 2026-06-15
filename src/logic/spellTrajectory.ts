export interface SpellTrajectoryPoint {
  x: number;
  y: number;
}

export interface SpellTrajectory {
  origin: SpellTrajectoryPoint;
  target: SpellTrajectoryPoint;
  rotationDeg: number;
  flipX: boolean;
  projectileSize: number;
}

/** Align the top of an upright spell image toward the target (bottom sits on origin). */
export function computeSpellRotationDeg(from: SpellTrajectoryPoint, to: SpellTrajectoryPoint): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return (Math.atan2(dy, dx) * 180) / Math.PI + 90;
}

/** Mirror spell art when traveling leftward so asymmetric sprites face the right way. */
export function computeSpellFlipX(from: SpellTrajectoryPoint, to: SpellTrajectoryPoint): boolean {
  return to.x - from.x < 0;
}

export function getProjectileSize(containerWidth: number): number {
  return Math.min(120, Math.max(72, containerWidth * 0.14));
}

function getBattleUnitImage(container: HTMLElement, unitId: string): HTMLElement | null {
  const unit = container.querySelector(`[data-battle-unit-id="${unitId}"]`);
  if (!unit) {
    return null;
  }

  const image = unit.querySelector('.party-sprite__image, .enemy-sprite__image');
  return image instanceof HTMLElement ? image : null;
}

function getCasterOrigin(imageRect: DOMRect, containerRect: DOMRect): SpellTrajectoryPoint {
  return {
    x: imageRect.left + imageRect.width / 2 - containerRect.left,
    y: imageRect.bottom - containerRect.top,
  };
}

function getTargetPoint(imageRect: DOMRect, containerRect: DOMRect): SpellTrajectoryPoint {
  return {
    x: imageRect.left + imageRect.width / 2 - containerRect.left,
    y: imageRect.top + imageRect.height * 0.45 - containerRect.top,
  };
}

export function measureSpellTrajectory(
  container: HTMLElement,
  casterId: string,
  targetId: string,
): SpellTrajectory | null {
  const containerRect = container.getBoundingClientRect();
  const casterImage = getBattleUnitImage(container, casterId);
  const targetImage = getBattleUnitImage(container, targetId);

  if (!casterImage || !targetImage) {
    return null;
  }

  const origin = getCasterOrigin(casterImage.getBoundingClientRect(), containerRect);
  const target = getTargetPoint(targetImage.getBoundingClientRect(), containerRect);

  return {
    origin,
    target,
    rotationDeg: computeSpellRotationDeg(origin, target),
    flipX: computeSpellFlipX(origin, target),
    projectileSize: getProjectileSize(containerRect.width),
  };
}
