import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { Spell } from '@/game/types';
import { measureSpellTrajectory, type SpellTrajectory } from '@/logic/spellTrajectory';
import './SpellCastAnimation.css';

interface SpellCastAnimationProps {
  spell: Spell;
  casterId: string;
  targetId: string;
  onImpact: () => void;
  onComplete: () => void;
}

const TRAVEL_MS = 900;
const IMPACT_MS = 350;

function trajectoryStyle(trajectory: SpellTrajectory): CSSProperties {
  const { origin, target, rotationDeg, flipX, projectileSize } = trajectory;

  return {
    '--spell-rotation': `${rotationDeg}deg`,
    '--spell-flip': flipX ? '-1' : '1',
    '--spell-size': `${projectileSize}px`,
    '--spell-origin-x': `${origin.x}px`,
    '--spell-origin-y': `${origin.y}px`,
    '--spell-target-x': `${target.x}px`,
    '--spell-target-y': `${target.y}px`,
  } as CSSProperties;
}

export function SpellCastAnimation({
  spell,
  casterId,
  targetId,
  onImpact,
  onComplete,
}: SpellCastAnimationProps) {
  const [phase, setPhase] = useState<'travel' | 'impact'>('travel');
  const [trajectory, setTrajectory] = useState<SpellTrajectory | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const frame = containerRef.current?.parentElement;
    if (!frame) {
      return;
    }

    const measured = measureSpellTrajectory(frame, casterId, targetId);
    setTrajectory(measured);
  }, [casterId, targetId]);

  useEffect(() => {
    const impactTimer = window.setTimeout(() => {
      setPhase('impact');
      onImpact();
    }, TRAVEL_MS);

    const completeTimer = window.setTimeout(() => {
      onComplete();
    }, TRAVEL_MS + IMPACT_MS);

    return () => {
      window.clearTimeout(impactTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete, onImpact]);

  const projectileStyle = trajectory ? trajectoryStyle(trajectory) : undefined;

  return (
    <div ref={containerRef} className="spell-cast-animation" aria-hidden="true">
      <div
        className={`spell-cast-animation__flash ${phase === 'impact' ? 'is-active' : ''}`}
        style={projectileStyle}
      />

      <img
        className={`spell-cast-animation__projectile ${phase === 'travel' ? 'is-traveling' : 'is-impact'} ${trajectory ? 'is-ready' : ''}`}
        src={spell.projectileUrl}
        alt=""
        draggable={false}
        style={projectileStyle}
      />
    </div>
  );
}
