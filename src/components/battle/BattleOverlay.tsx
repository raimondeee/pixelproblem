import { useCallback, useState } from 'react';
import { battleManager } from '@/game/managers/BattleManager';
import { BattleField } from '@/components/battle/BattleField';
import { MathChallengeOverlay } from '@/components/battle/MathChallengeOverlay';
import { SpellCastAnimation } from '@/components/battle/SpellCastAnimation';
import { SpellFizzleEffect } from '@/components/battle/SpellFizzleEffect';
import { TurnOrderBar } from '@/components/battle/TurnOrderBar';
import { useBattleState } from '@/hooks/useBattleState';
import './BattleOverlay.css';

export function BattleOverlay() {
  const state = useBattleState();
  const spells = battleManager.getSpells();
  const [hitEnemyIds, setHitEnemyIds] = useState<string[]>([]);
  const [hitAllyIds, setHitAllyIds] = useState<string[]>([]);

  const handleCastImpact = useCallback(() => {
    const pendingCast = battleManager.getState().pendingCast;
    if (pendingCast?.hits) {
      setHitEnemyIds(pendingCast.hits.map((hit) => hit.enemyId));
    }
    if (pendingCast?.allyHits) {
      setHitAllyIds(pendingCast.allyHits.map((hit) => hit.allyId));
    }
  }, []);

  const handleCastComplete = useCallback(() => {
    battleManager.completeSpellCast();
    window.setTimeout(() => {
      setHitEnemyIds([]);
      setHitAllyIds([]);
    }, 400);
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

  const pendingCast = state.pendingCast;
  const animationTargetId =
    pendingCast?.hits?.[0]?.enemyId ??
    pendingCast?.allyHits?.[0]?.allyId ??
    state.targetEnemyId ??
    '';

  return (
    <div className="battle-overlay" role="dialog" aria-modal="true" aria-label="Battle">
      <div className="battle-overlay__frame">
        <TurnOrderBar state={state} />

        <BattleField
          state={state}
          spells={spells}
          hitEnemyIds={hitEnemyIds}
          hitAllyIds={hitAllyIds}
          isPartyTurn={battleManager.isPartyTurn()}
          canCapture={battleManager.canCaptureSelectedTarget()}
          onSelectTarget={(enemyId) => battleManager.selectTarget(enemyId)}
          onSpellSelect={handleSpellSelect}
          onCapture={(enemyId) => battleManager.tryCapture(enemyId)}
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

        {showCastAnimation && state.activeSpell && pendingCast ? (
          <SpellCastAnimation
            spell={state.activeSpell}
            casterId={pendingCast.casterId}
            targetId={animationTargetId}
            onImpact={handleCastImpact}
            onComplete={handleCastComplete}
          />
        ) : null}

        <SpellFizzleEffect tick={state.fizzleTick} />
      </div>

      {state.battleOutcome === 'victory' && state.phase === 'field' ? (
        <div className="battle-overlay__victory-flash" aria-hidden="true" />
      ) : null}

      {state.battleOutcome === 'defeat' && state.phase === 'field' ? (
        <div className="battle-overlay__defeat-flash" aria-hidden="true" />
      ) : null}
    </div>
  );
}
