export interface SpellTrajectoryPoint {
  x: number;
  y: number;
}

export interface SpellTrajectory {
  origin: SpellTrajectoryPoint;
  target: SpellTrajectoryPoint;
  rotationDeg: number;
  impactXPercent: number;
  impactYPercent: number;
}

/** Align the top of an upright spell image toward the target (bottom sits on origin). */
export function computeSpellRotationDeg(from: SpellTrajectoryPoint, to: SpellTrajectoryPoint): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return (Math.atan2(dy, dx) * 180) / Math.PI + 90;
}

export function measureSpellTrajectory(
  container: HTMLElement,
  casterId: string,
  targetEnemyId: string,
): SpellTrajectory | null {
  const containerRect = container.getBoundingClientRect();
  const casterImage = container.querySelector(
    `[data-battle-unit-id="${casterId}"] .party-sprite__image`,
  );
  const targetImage = container.querySelector(
    `[data-battle-unit-id="${targetEnemyId}"] .enemy-sprite__image`,
  );

  if (!(casterImage instanceof HTMLElement) || !(targetImage instanceof HTMLElement)) {
    return null;
  }

  const casterRect = casterImage.getBoundingClientRect();
  const targetRect = targetImage.getBoundingClientRect();

  const origin = {
    x: casterRect.left + casterRect.width / 2 - containerRect.left,
    y: casterRect.bottom - containerRect.top,
  };
  const target = {
    x: targetRect.left + targetRect.width / 2 - containerRect.left,
    y: targetRect.top + targetRect.height * 0.45 - containerRect.top,
  };

  return {
    origin,
    target,
    rotationDeg: computeSpellRotationDeg(origin, target),
    impactXPercent: (target.x / containerRect.width) * 100,
    impactYPercent: (target.y / containerRect.height) * 100,
  };
}
