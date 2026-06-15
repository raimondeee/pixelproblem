import type { BattleHero, Pet } from '@/game/types';
import { ELEMENT_COLORS, ELEMENT_LABELS } from '@/logic/elements';
import './TeamStatusPanel.css';

interface TeamStatusPanelProps {
  hero: BattleHero | null;
  pets: Pet[];
}

export function TeamStatusPanel({ hero, pets }: TeamStatusPanelProps) {
  if (!hero && pets.length === 0) {
    return null;
  }

  return (
    <aside className="team-status" aria-label="Team status">
      <h2 className="team-status__heading">Team</h2>
      <ul className="team-status__list">
        {hero ? (
          <li className="team-status__entry team-status__entry--hero">
            <div className="team-status__row">
              <span className="team-status__name" style={{ color: hero.accentColor }}>
                {hero.name}
              </span>
              <span className="team-status__hp">
                {hero.hp}/{hero.maxHp}
              </span>
            </div>
            <div className="team-status__bar" aria-hidden="true">
              <span
                className="team-status__fill team-status__fill--hero"
                style={{ width: `${Math.round((hero.hp / hero.maxHp) * 100)}%` }}
              />
            </div>
            <span className="team-status__meta">{hero.title}</span>
          </li>
        ) : null}
        {pets.map((pet) => (
          <li key={pet.id} className="team-status__entry">
            <div className="team-status__row">
              <span className="team-status__name">{pet.name}</span>
              <span className="team-status__hp">
                {pet.hp}/{pet.maxHp}
              </span>
            </div>
            <div className="team-status__bar" aria-hidden="true">
              <span
                className="team-status__fill"
                style={{ width: `${Math.round((pet.hp / pet.maxHp) * 100)}%` }}
              />
            </div>
            <span className="team-status__meta" style={{ color: ELEMENT_COLORS[pet.element] }}>
              {ELEMENT_LABELS[pet.element]}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
