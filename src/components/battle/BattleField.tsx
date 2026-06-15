import { areAllEnemiesDefeated } from '@/logic/combat';
import type { BattleState, FormationRow, Spell } from '@/game/types';
import { ULTIMATE_COMBO_REQUIREMENT } from '@/game/data/spells';
import { BATTLE_MAP_URL } from '@/game/data/assets';
import { EnemyGrid } from '@/components/battle/EnemyGrid';
import { PartyFormation } from '@/components/battle/PartyFormation';
import { TeamStatusPanel } from '@/components/battle/TeamStatusPanel';
import { SpellDeck } from '@/components/battle/SpellDeck';
import './BattleField.css';

interface BattleFieldProps {
  state: BattleState;
  spells: Spell[];
  hitEnemyIds?: string[];
  onSelectTarget: (enemyId: string) => void;
  onSpellSelect: (spell: Spell) => void;
  onToggleFormation: () => void;
  onCycleUnitRow: (unitId: string) => void;
  onSetUnitRow: (unitId: string, row: FormationRow) => void;
  onFlee: () => void;
  onContinue: () => void;
}

export function BattleField({
  state,
  spells,
  hitEnemyIds = [],
  onSelectTarget,
  onSpellSelect,
  onToggleFormation,
  onCycleUnitRow,
  onSetUnitRow,
  onFlee,
  onContinue,
}: BattleFieldProps) {
  const victory = areAllEnemiesDefeated(state.enemies);
  const canInteract = !victory && state.phase === 'field' && !state.formationMode;

  return (
    <div className="battle-field">
      <img
        className="battle-field__background"
        src={BATTLE_MAP_URL}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <div className="battle-field__scrim" aria-hidden="true" />

      <div className="battle-field__content">
        <div className="battle-field__main">
          {!victory ? (
            <aside className="battle-field__spell-rail">
              <SpellDeck
                spells={spells}
                layout="vertical"
                disabled={!canInteract}
                onSelect={onSpellSelect}
              />
            </aside>
          ) : null}

          <div className="battle-field__arena">
            <div className="battle-field__party">
              <TeamStatusPanel hero={state.hero} pets={state.pets} />
              <PartyFormation
                hero={state.hero}
                pets={state.pets}
                formationMode={state.formationMode}
                onCycleUnitRow={onCycleUnitRow}
                onSetUnitRow={onSetUnitRow}
              />
            </div>

            <div className="battle-field__enemies">
              <EnemyGrid
                enemies={state.enemies}
                targetEnemyId={state.targetEnemyId}
                hitEnemyIds={hitEnemyIds}
                selectable={canInteract}
                onSelectTarget={onSelectTarget}
              />
            </div>
          </div>
        </div>

        <div className="battle-field__command" aria-live="polite">
          <div className="battle-field__status">
            <p className="battle-field__message">
              {state.message ??
                (victory
                  ? 'Victory!'
                  : state.formationMode
                    ? 'Formation mode — rearrange your party.'
                    : 'Tap an enemy to target, then choose a spell.')}
            </p>
            {!victory ? (
              <p className="battle-field__combo" aria-label="Combo streak">
                Combo {state.comboStreak}/{ULTIMATE_COMBO_REQUIREMENT}
              </p>
            ) : null}
          </div>

          <div className="battle-field__actions">
            {victory ? (
              <button type="button" className="battle-field__continue" onClick={onContinue}>
                Continue
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={`battle-field__formation ${state.formationMode ? 'is-active' : ''}`}
                  onClick={onToggleFormation}
                >
                  {state.formationMode ? 'Done' : 'Formation'}
                </button>
                <button type="button" className="battle-field__flee" onClick={onFlee}>
                  Flee
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
