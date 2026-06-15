import { useEffect, useState, type CSSProperties } from 'react';
import type { Spell } from '@/game/types';
import './SpellCastAnimation.css';

interface SpellCastAnimationProps {
  spell: Spell;
  onImpact: () => void;
  onComplete: () => void;
}

const TRAVEL_MS = 900;
const IMPACT_MS = 350;

export function SpellCastAnimation({
  spell,
  onImpact,
  onComplete,
}: SpellCastAnimationProps) {
  const [phase, setPhase] = useState<'travel' | 'impact'>('travel');

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

  return (
    <div className="spell-cast-animation" aria-hidden="true">
      <div className={`spell-cast-animation__flash ${phase === 'impact' ? 'is-active' : ''}`} />

      <img
        className={`spell-cast-animation__projectile ${phase === 'travel' ? 'is-traveling' : 'is-impact'}`}
        src={spell.projectileUrl}
        alt=""
        draggable={false}
        style={{
          '--spell-rotation': '45deg',
        } as CSSProperties}
      />
    </div>
  );
}
