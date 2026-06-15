import type { BattleEnemy, BattleHero, PendingCast, Pet, Spell } from '@/game/types';
import { getSpellsForElement } from '@/game/data/spells';
import { buildAllyHits, pickEnemyTarget } from '@/logic/combat';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickEnemySpell(enemy: BattleEnemy): Spell {
  const spells = getSpellsForElement(enemy.element);
  return spells[randomInt(0, spells.length - 1)];
}

export function buildEnemyPendingCast(
  enemy: BattleEnemy,
  hero: BattleHero | null,
  pets: Pet[],
): PendingCast {
  const spell = pickEnemySpell(enemy);
  const targetAllyId = pickEnemyTarget(hero, pets);
  const allyHits = targetAllyId
    ? buildAllyHits(spell, spell.mathDifficulty, hero, pets, targetAllyId)
    : [];

  return {
    spell,
    casterId: enemy.id,
    allyHits,
  };
}
