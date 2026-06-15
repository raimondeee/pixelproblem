import { useEffect, useState } from 'react';
import { battleManager } from '@/game/managers/BattleManager';
import type { BattleState } from '@/game/types';

export function useBattleState(): BattleState {
  const [state, setState] = useState<BattleState>(battleManager.getState());

  useEffect(() => battleManager.subscribe(setState), []);

  return state;
}
