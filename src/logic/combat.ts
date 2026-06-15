import type { AllyHit, BattleEnemy, BattleHero, Pet, Spell, SpellElement, SpellHit } from '@/game/types';
import type { FormationRow } from '@/game/types';
import {
  EFFECTIVENESS_MULTIPLIER,
  getEffectiveness,
  getEffectivenessLabel,
} from '@/logic/elements';

const ROW_TARGET_PRIORITY: Record<FormationRow, number> = {
  front: 3,
  mid: 2,
  back: 1,
};

export function getLivingEnemies(enemies: BattleEnemy[]): BattleEnemy[] {
  return enemies.filter((enemy) => enemy.hp > 0);
}

export function pickDefaultTargetId(enemies: BattleEnemy[]): string | null {
  return getLivingEnemies(enemies)[0]?.id ?? null;
}

export function getEnemyById(
  enemies: BattleEnemy[],
  enemyId: string | null,
): BattleEnemy | undefined {
  if (!enemyId) {
    return undefined;
  }

  return enemies.find((enemy) => enemy.id === enemyId);
}

export function isValidTarget(enemies: BattleEnemy[], enemyId: string): boolean {
  const enemy = getEnemyById(enemies, enemyId);
  return enemy !== undefined && enemy.hp > 0;
}

export function calculateSpellDamage(
  spell: Spell,
  difficulty: number,
  enemyElement: SpellElement,
): number {
  const base = spell.power + difficulty * 6;
  const effectiveness = getEffectiveness(spell.element, enemyElement);
  const multiplier = EFFECTIVENESS_MULTIPLIER[effectiveness];
  return Math.round(base * multiplier);
}

function buildHit(spell: Spell, difficulty: number, enemy: BattleEnemy): SpellHit {
  return {
    enemyId: enemy.id,
    damage: calculateSpellDamage(spell, difficulty, enemy.element),
    effectiveness: getEffectiveness(spell.element, enemy.element),
  };
}

/** Resolves spell hits based on target scope — single foe or all (ultimate) */
export function buildSpellHits(
  spell: Spell,
  difficulty: number,
  enemies: BattleEnemy[],
  targetEnemyId: string | null,
): SpellHit[] {
  if (spell.targetScope === 'all') {
    return getLivingEnemies(enemies).map((enemy) => buildHit(spell, difficulty, enemy));
  }

  const target = getEnemyById(enemies, targetEnemyId);
  if (!target || target.hp <= 0) {
    return [];
  }

  return [buildHit(spell, difficulty, target)];
}

export function applySpellHits(
  enemies: BattleEnemy[],
  hits: SpellHit[],
): BattleEnemy[] {
  const damageById = new Map(hits.map((hit) => [hit.enemyId, hit.damage]));

  return enemies.map((enemy) => {
    const damage = damageById.get(enemy.id);
    if (damage === undefined || enemy.hp <= 0) {
      return enemy;
    }

    return {
      ...enemy,
      hp: Math.max(0, enemy.hp - damage),
    };
  });
}

export function areAllEnemiesDefeated(enemies: BattleEnemy[]): boolean {
  return enemies.every((enemy) => enemy.hp <= 0);
}

export function summarizeCast(
  spell: Spell,
  hits: SpellHit[],
  enemies: BattleEnemy[],
  allDefeated: boolean,
): string {
  if (hits.length === 0) {
    return `${spell.name} missed — no valid target!`;
  }

  if (spell.targetScope === 'all') {
    const totalDamage = hits.reduce((sum, hit) => sum + hit.damage, 0);
    const note = formatEffectivenessNote(hits);

    if (allDefeated) {
      return `${spell.name} hits everyone for ${totalDamage}!${note} All enemies defeated!`;
    }

    return `${spell.name} hits all foes for ${totalDamage}!${note}`;
  }

  const hit = hits[0];
  const target = getEnemyById(enemies, hit.enemyId);
  const targetName = target?.name ?? 'the enemy';
  const note = getEffectivenessLabel(hit.effectiveness);
  const noteSuffix = note ? ` ${note}` : '';

  if (allDefeated) {
    return `${spell.name} hits ${targetName} for ${hit.damage}!${noteSuffix} All enemies defeated!`;
  }

  return `${spell.name} hits ${targetName} for ${hit.damage}!${noteSuffix}`;
}

function formatEffectivenessNote(hits: SpellHit[]): string {
  const hasWeak = hits.some((hit) => hit.effectiveness === 'weak');
  const hasResist = hits.some((hit) => hit.effectiveness === 'resist');

  if (hasWeak) return ' Super effective!';
  if (hasResist) return ' Not very effective…';
  return '';
}

export function resolveNextTargetId(
  enemies: BattleEnemy[],
  currentTargetId: string | null,
): string | null {
  if (currentTargetId && isValidTarget(enemies, currentTargetId)) {
    return currentTargetId;
  }

  return pickDefaultTargetId(enemies);
}

export interface LivingAlly {
  id: string;
  name: string;
  element: SpellElement;
  row: FormationRow;
  hp: number;
}

export function getLivingAllies(hero: BattleHero | null, pets: Pet[]): LivingAlly[] {
  const allies: LivingAlly[] = [];

  if (hero && hero.hp > 0) {
    allies.push({
      id: hero.id,
      name: hero.name,
      element: hero.element,
      row: hero.row,
      hp: hero.hp,
    });
  }

  for (const pet of pets) {
    if (pet.hp > 0) {
      allies.push({
        id: pet.id,
        name: pet.name,
        element: pet.element,
        row: pet.row,
        hp: pet.hp,
      });
    }
  }

  return allies;
}

export function pickEnemyTarget(hero: BattleHero | null, pets: Pet[]): string | null {
  const living = getLivingAllies(hero, pets);
  if (living.length === 0) {
    return null;
  }

  const maxPriority = Math.max(...living.map((ally) => ROW_TARGET_PRIORITY[ally.row]));
  const candidates = living.filter((ally) => ROW_TARGET_PRIORITY[ally.row] === maxPriority);
  return candidates[Math.floor(Math.random() * candidates.length)]?.id ?? null;
}

function getAllyElement(
  hero: BattleHero | null,
  pets: Pet[],
  allyId: string,
): SpellElement | null {
  if (hero?.id === allyId) {
    return hero.element;
  }

  return pets.find((pet) => pet.id === allyId)?.element ?? null;
}

export function buildAllyHits(
  spell: Spell,
  difficulty: number,
  hero: BattleHero | null,
  pets: Pet[],
  targetAllyId: string,
): AllyHit[] {
  const element = getAllyElement(hero, pets, targetAllyId);
  if (!element) {
    return [];
  }

  const living = getLivingAllies(hero, pets);
  if (!living.some((ally) => ally.id === targetAllyId)) {
    return [];
  }

  return [
    {
      allyId: targetAllyId,
      damage: calculateSpellDamage(spell, difficulty, element),
      effectiveness: getEffectiveness(spell.element, element),
    },
  ];
}

export function applyAllyHits(
  hero: BattleHero | null,
  pets: Pet[],
  hits: AllyHit[],
): { hero: BattleHero | null; pets: Pet[] } {
  const damageById = new Map(hits.map((hit) => [hit.allyId, hit.damage]));
  let nextHero = hero;
  let nextPets = pets;

  if (hero) {
    const damage = damageById.get(hero.id);
    if (damage !== undefined && hero.hp > 0) {
      nextHero = { ...hero, hp: Math.max(0, hero.hp - damage) };
    }
  }

  nextPets = pets.map((pet) => {
    const damage = damageById.get(pet.id);
    if (damage === undefined || pet.hp <= 0) {
      return pet;
    }

    return { ...pet, hp: Math.max(0, pet.hp - damage) };
  });

  return { hero: nextHero, pets: nextPets };
}

export function summarizeEnemyCast(
  spell: Spell,
  hits: AllyHit[],
  hero: BattleHero | null,
  pets: Pet[],
): string {
  if (hits.length === 0) {
    return `${spell.name} missed!`;
  }

  const hit = hits[0];
  const allyName =
    hero?.id === hit.allyId
      ? hero.name
      : pets.find((pet) => pet.id === hit.allyId)?.name ?? 'an ally';
  const note = getEffectivenessLabel(hit.effectiveness);
  const noteSuffix = note ? ` ${note}` : '';

  return `${spell.name} hits ${allyName} for ${hit.damage}!${noteSuffix}`;
}
