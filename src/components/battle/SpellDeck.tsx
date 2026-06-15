import type { CSSProperties } from 'react';
import type { Spell } from '@/game/types';
import './SpellDeck.css';

interface SpellDeckProps {
  spells: Spell[];
  activeSpellId?: string | null;
  disabled?: boolean;
  layout?: 'horizontal' | 'vertical';
  onSelect: (spell: Spell) => void;
}

export function SpellDeck({
  spells,
  activeSpellId = null,
  disabled = false,
  layout = 'horizontal',
  onSelect,
}: SpellDeckProps) {
  return (
    <div
      className={`spell-deck spell-deck--${layout} ${disabled ? 'spell-deck--disabled' : ''}`}
      role="toolbar"
      aria-label="Spell deck"
    >
      {spells.map((spell) => (
        <button
          key={spell.id}
          type="button"
          className={`spell-card ${activeSpellId === spell.id ? 'is-active' : ''}`}
          style={{ '--spell-color': spell.color } as CSSProperties}
          disabled={disabled}
          onClick={() => onSelect(spell)}
          aria-label={`${spell.name} (${spell.element})`}
        >
          <img
            className="spell-card__art"
            src={spell.cardUrl}
            alt=""
            draggable={false}
          />
          <span className="spell-card__name">{spell.name}</span>
        </button>
      ))}
    </div>
  );
}
