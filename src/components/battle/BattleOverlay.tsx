import { useCallback, useState } from 'react';
import { battleManager } from '@/game/managers/BattleManager';
import { areAllEnemiesDefeated } from '@/logic/combat';
import { BattleField } from '@/components/battle/BattleField';
import { MathChallengeOverlay } from '@/components/battle/MathChallengeOverlay';
import { SpellCastAnimation } from '@/components/battle/SpellCastAnimation';
import { SpellFizzleEffect } from '@/components/battle/SpellFizzleEffect';
import { useBattleState } from '@/hooks/useBattleState';
import './BattleOverlay.css';

export function BattleOverlay() {
  const state = useBattleState();
  const spells = battleManager.getSpells();
  const [hitEnemyIds, setHitEnemyIds] = useState<string[]>([]);

  const handleCastImpact = useCallback(() => {
    const hits = battleManager.getState().pendingCast?.hits ?? [];
    setHitEnemyIds(hits.map((hit) => hit.enemyId));
  }, []);

  const handleCastComplete = useCallback(() => {
    battleManager.completeSpellCast();
    window.setTimeout(() => setHitEnemyIds([]), 400);
  }, []);

  if (state.mode !== 'BATTLE') {
    return null;
  }

  const handleSpellSelect = (spell: (typeof spells)[number]) => {
    battleManager.beginSpellCast(spell);
  };

  const handleAnswerSubmit = (answer: string) => {
    battleManager.submitAnswer(answer);
  };

  const showMathOverlay =
    state.phase === 'math' && state.activeSpell !== null && state.equation !== null;

  const showCastAnimation =
    state.phase === 'casting' && state.activeSpell !== null && state.pendingCast !== null;

  return (
    <div className="battle-overlay" role="dialog" aria-modal="true" aria-label="Battle">
      <div className="battle-overlay__frame">
        <BattleField
          state={state}
          spells={spells}
          hitEnemyIds={hitEnemyIds}
          onSelectTarget={(enemyId) => battleManager.selectTarget(enemyId)}
          onSpellSelect={handleSpellSelect}
          onToggleFormation={() => battleManager.toggleFormationMode()}
          onCycleUnitRow={(unitId) => battleManager.cycleUnitRow(unitId)}
          onSetUnitRow={(unitId, row) => battleManager.setUnitRow(unitId, row)}
          onFlee={() => battleManager.exitBattle()}
          onContinue={() => battleManager.exitBattle()}
        />

        {showMathOverlay && state.activeSpell && state.equation ? (
          <MathChallengeOverlay
            spell={state.activeSpell}
            equation={state.equation}
            feedback={null}
            onSubmit={handleAnswerSubmit}
            onCancel={() => battleManager.cancelSpellCast()}
          />
        ) : null}

        {showCastAnimation && state.activeSpell ? (
          <SpellCastAnimation
            spell={state.activeSpell}
            onImpact={handleCastImpact}
            onComplete={handleCastComplete}
          />
        ) : null}

        <SpellFizzleEffect tick={state.fizzleTick} />
      </div>

      {areAllEnemiesDefeated(state.enemies) && state.phase === 'field' ? (
        <div className="battle-overlay__victory-flash" aria-hidden="true" />
      ) : null}
    </div>
  );
}
