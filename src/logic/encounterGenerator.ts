import type { BattleEnemy, SpellElement } from '@/game/types';
import {
  ENEMY_NAMES,
  getEnemySpriteUrl,
} from '@/game/types';
import { pickFormationSlots } from '@/game/data/enemyFormation';

const ELEMENTS: SpellElement[] = ['fire', 'water', 'earth', 'wind'];

const MIN_ENEMIES_PER_BATTLE = 2;
const MAX_ENEMIES_PER_BATTLE = 3;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandomSlots(count: number): number[] {
  return pickFormationSlots(count);
}

function pickElement(): SpellElement {
  return ELEMENTS[randomInt(0, ELEMENTS.length - 1)];
}

function pickEnemyName(element: SpellElement): string {
  const names = ENEMY_NAMES[element];
  return names[randomInt(0, names.length - 1)];
}

export function generateEncounter(): BattleEnemy[] {
  const enemyCount = randomInt(MIN_ENEMIES_PER_BATTLE, MAX_ENEMIES_PER_BATTLE);
  const slots = pickRandomSlots(enemyCount);

  return slots.map((gridSlot, index) => {
    const element = pickElement();
    const maxHp = randomInt(40, 80);
    const variant = randomInt(1, 6);

    return {
      id: `enemy-${index}-${element}`,
      name: pickEnemyName(element),
      element,
      spriteUrl: getEnemySpriteUrl(element, variant),
      maxHp,
      hp: maxHp,
      gridSlot,
      initiative: randomInt(8, 14),
    };
  });
}
