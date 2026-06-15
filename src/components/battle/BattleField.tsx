import { areAllEnemiesDefeated, getLivingEnemies } from '@/logic/combat';
import { isCapturable } from '@/logic/capture';
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
  hitAllyIds?: string[];
  isPartyTurn: boolean;
  canCapture: boolean;
  onSelectTarget: (enemyId: string) => void;
  onSpellSelect: (spell: Spell) => void;
  onCapture: (enemyId: string) => void;
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
  hitAllyIds = [],
  isPartyTurn,
  canCapture,
  onSelectTarget,
  onSpellSelect,
  onCapture,
  onToggleFormation,
  onCycleUnitRow,
  onSetUnitRow,
  onFlee,
  onContinue,
}: BattleFieldProps) {
  const victory = state.battleOutcome === 'victory' || areAllEnemiesDefeated(state.enemies);
  const defeat = state.battleOutcome === 'defeat';
  const battleEnded = victory || defeat;
  const canInteract =
    !battleEnded && state.phase === 'field' && !state.formationMode && isPartyTurn;
  const capturableEnemyIds = state.enemies
    .filter((enemy) => isCapturable(enemy))
    .map((enemy) => enemy.id);
  const livingEnemies = getLivingEnemies(state.enemies).length;

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
          {!battleEnded ? (
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
                activeActorId={state.activeCasterId}
                hitAllyIds={hitAllyIds}
                onCycleUnitRow={onCycleUnitRow}
                onSetUnitRow={onSetUnitRow}
              />
            </div>

            <div className="battle-field__enemies">
              <EnemyGrid
                enemies={state.enemies}
                targetEnemyId={state.targetEnemyId}
                hitEnemyIds={hitEnemyIds}
                capturableEnemyIds={capturableEnemyIds}
                activeActorId={state.activeCasterId}
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
                (defeat
                  ? 'Defeat… your hero has fallen.'
                  : victory
                    ? livingEnemies === 0
                      ? 'Victory!'
                      : 'All enemies cleared!'
                    : state.formationMode
                      ? 'Formation mode — rearrange your party.'
                      : isPartyTurn
                        ? 'Your turn — tap an enemy to target, then choose a spell.'
                        : 'Waiting for the enemy…')}
            </p>
            {!battleEnded ? (
              <p className="battle-field__combo" aria-label="Combo streak">
                Combo {state.comboStreak}/{ULTIMATE_COMBO_REQUIREMENT}
              </p>
            ) : null}
          </div>

          <div className="battle-field__actions">
            {battleEnded ? (
              <button type="button" className="battle-field__continue" onClick={onContinue}>
                Continue
              </button>
            ) : (
              <>
                {canCapture && state.targetEnemyId ? (
                  <button
                    type="button"
                    className="battle-field__capture"
                    onClick={() => onCapture(state.targetEnemyId!)}
                  >
                    Capture
                  </button>
                ) : null}
                <button
                  type="button"
                  className={`battle-field__formation ${state.formationMode ? 'is-active' : ''}`}
                  onClick={onToggleFormation}
                  disabled={!isPartyTurn || state.phase !== 'field'}
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
