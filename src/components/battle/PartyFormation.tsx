import type { ReactNode } from 'react';
import type { BattleHero, FormationRow, Pet } from '@/game/types';
import {
  DEPTH_LABELS,
  FORMATION_ROW_ORDER,
} from '@/game/data/formation';
import './PartyFormation.css';

interface PartyFormationProps {
  hero: BattleHero | null;
  pets: Pet[];
  formationMode?: boolean;
  activeActorId?: string | null;
  hitAllyIds?: string[];
  onCycleUnitRow?: (unitId: string) => void;
  onSetUnitRow?: (unitId: string, row: FormationRow) => void;
}

const COMPANION_ROW_ORDER: Record<FormationRow, number> = {
  back: 0,
  mid: 1,
  front: 2,
};

function sortCompanions(pets: Pet[]): Pet[] {
  return [...pets].sort(
    (left, right) => COMPANION_ROW_ORDER[left.row] - COMPANION_ROW_ORDER[right.row],
  );
}

export function PartyFormation({
  hero,
  pets,
  formationMode = false,
  activeActorId = null,
  hitAllyIds = [],
  onCycleUnitRow,
  onSetUnitRow,
}: PartyFormationProps) {
  const companions = sortCompanions(pets);

  return (
    <>
      {hero ? (
        <div className="party-formation__hero-anchor party-formation__hero-anchor--field">
          <HeroSprite
            hero={hero}
            formationMode={formationMode}
            isActive={hero.id === activeActorId}
            isHit={hitAllyIds.includes(hero.id)}
            onCycle={() => onCycleUnitRow?.(hero.id)}
            onSetRow={(nextRow) => onSetUnitRow?.(hero.id, nextRow)}
          />
        </div>
      ) : null}

      <div
        className={`party-formation party-formation--companions ${formationMode ? 'party-formation--edit' : ''}`}
        aria-label="Party companions"
      >
        {formationMode ? (
          <div className="party-formation__hint">
            Tap a companion to shuffle front-to-back order, or use row buttons.
          </div>
        ) : null}

        {companions.length > 0 ? (
          <div className="party-formation__companions" aria-label="Companions">
            {companions.map((pet) => (
              <div key={pet.id} className="party-formation__companion-slot">
                <PetSprite
                  pet={pet}
                  formationMode={formationMode}
                  isActive={pet.id === activeActorId}
                  isHit={hitAllyIds.includes(pet.id)}
                  onCycle={() => onCycleUnitRow?.(pet.id)}
                  onSetRow={(nextRow) => onSetUnitRow?.(pet.id, nextRow)}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}

interface UnitSpriteProps {
  formationMode: boolean;
  isActive: boolean;
  isHit: boolean;
  onCycle: () => void;
  onSetRow: (row: FormationRow) => void;
}

function spriteClassName(base: string, isActive: boolean, isHit: boolean): string {
  return [
    base,
    isActive ? 'party-sprite--active-turn' : '',
    isHit ? 'party-sprite--hit' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function HeroSprite({
  hero,
  formationMode,
  isActive,
  isHit,
  onCycle,
  onSetRow,
}: {
  hero: BattleHero;
} & UnitSpriteProps) {
  const hpPercent = Math.round((hero.hp / hero.maxHp) * 100);

  const body = (
    <>
      <div className="party-sprite__body">
        <div className="party-sprite__hp-bar" aria-hidden="true">
          <span
            className="party-sprite__hp-fill party-sprite__hp-fill--hero"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
        <img
          className="party-sprite__image party-sprite__image--hero"
          src={hero.spriteUrl}
          alt={hero.name}
          draggable={false}
        />
      </div>
    </>
  );

  if (formationMode) {
    return (
      <FormationUnit
        unitId={hero.id}
        row={hero.row}
        className={spriteClassName('party-sprite party-sprite--hero', isActive, isHit)}
        onCycle={onCycle}
        onSetRow={onSetRow}
      >
        {body}
      </FormationUnit>
    );
  }

  return (
    <figure
      className={spriteClassName('party-sprite party-sprite--hero', isActive, isHit)}
      data-battle-unit-id={hero.id}
    >
      {body}
    </figure>
  );
}

function PetSprite({
  pet,
  formationMode,
  isActive,
  isHit,
  onCycle,
  onSetRow,
}: {
  pet: Pet;
} & UnitSpriteProps) {
  const hpPercent = Math.round((pet.hp / pet.maxHp) * 100);

  const body = (
    <>
      <div className="party-sprite__body">
        <div className="party-sprite__hp-bar" aria-hidden="true">
          <span
            className="party-sprite__hp-fill"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
        <img
          className="party-sprite__image party-sprite__image--pet"
          src={pet.spriteUrl}
          alt={pet.name}
          draggable={false}
        />
      </div>
    </>
  );

  if (formationMode) {
    return (
      <FormationUnit
        unitId={pet.id}
        row={pet.row}
        className={spriteClassName('party-sprite', isActive, isHit)}
        onCycle={onCycle}
        onSetRow={onSetRow}
      >
        {body}
      </FormationUnit>
    );
  }

  return (
    <figure className={spriteClassName('party-sprite', isActive, isHit)} data-battle-unit-id={pet.id}>
      {body}
    </figure>
  );
}

function FormationUnit({
  unitId,
  row,
  className,
  onCycle,
  onSetRow,
  children,
}: {
  unitId: string;
  row: FormationRow;
  className: string;
  onCycle: () => void;
  onSetRow: (row: FormationRow) => void;
  children: ReactNode;
}) {
  return (
    <div className={`${className} party-sprite--editable`} data-battle-unit-id={unitId}>
      <button
        type="button"
        className="party-sprite__select"
        onClick={onCycle}
        aria-label={`Cycle row for ${unitId}`}
      >
        {children}
      </button>
      <div className="party-sprite__row-controls">
        {FORMATION_ROW_ORDER.map((option) => (
          <button
            key={`${unitId}-${option}`}
            type="button"
            className={`party-sprite__row-btn ${row === option ? 'is-active' : ''}`}
            onClick={() => onSetRow(option)}
          >
            {DEPTH_LABELS[option]}
          </button>
        ))}
      </div>
    </div>
  );
}
