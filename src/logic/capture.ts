import type { BattleEnemy, Pet } from '@/game/types';

export const CAPTURE_HP_THRESHOLD = 0.1;

export function isCapturable(enemy: BattleEnemy): boolean {
  return enemy.hp > 0 && enemy.hp / enemy.maxHp < CAPTURE_HP_THRESHOLD;
}

export function enemyToPet(enemy: BattleEnemy): Pet {
  return {
    id: `pet-${enemy.id}-${Date.now()}`,
    name: enemy.name,
    element: enemy.element,
    maxHp: enemy.maxHp,
    hp: enemy.maxHp,
    row: 'back',
    spriteUrl: enemy.spriteUrl,
  };
}
