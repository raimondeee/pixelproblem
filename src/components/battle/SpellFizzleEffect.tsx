import './SpellFizzleEffect.css';

interface SpellFizzleEffectProps {
  tick: number;
}

export function SpellFizzleEffect({ tick }: SpellFizzleEffectProps) {
  if (tick <= 0) {
    return null;
  }

  return (
    <div
      key={tick}
      className="spell-fizzle-effect"
      aria-hidden="true"
    >
      <div className="spell-fizzle-effect__flash" />
      <div className="spell-fizzle-effect__smoke" />
      <div className="spell-fizzle-effect__static" />
      <p className="spell-fizzle-effect__label">Fizzle!</p>
    </div>
  );
}
