import type { BattleActorRef, BattleEnemy, BattleHero, FormationRow, Pet } from '@/game/types';

const ROW_INITIATIVE_BONUS: Record<FormationRow, number> = {
  front: 2,
  mid: 0,
  back: -1,
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollInitiative(base: number): number {
  return base + randomInt(1, 20);
}

export function getHeroInitiativeBonus(hero: BattleHero): number {
  return 12 + ROW_INITIATIVE_BONUS[hero.row];
}

export function getPetInitiativeBonus(pet: Pet): number {
  return 10 + ROW_INITIATIVE_BONUS[pet.row];
}

interface InitiativeEntry extends BattleActorRef {
  roll: number;
}

export function buildTurnOrder(
  hero: BattleHero | null,
  pets: Pet[],
  enemies: BattleEnemy[],
): BattleActorRef[] {
  const entries: InitiativeEntry[] = [];

  if (hero && hero.hp > 0) {
    entries.push({
      id: hero.id,
      kind: 'hero',
      roll: rollInitiative(getHeroInitiativeBonus(hero)),
    });
  }

  for (const pet of pets) {
    if (pet.hp > 0) {
      entries.push({
        id: pet.id,
        kind: 'pet',
        roll: rollInitiative(getPetInitiativeBonus(pet)),
      });
    }
  }

  for (const enemy of enemies) {
    if (enemy.hp > 0) {
      entries.push({
        id: enemy.id,
        kind: 'enemy',
        roll: rollInitiative(enemy.initiative),
      });
    }
  }

  entries.sort((left, right) => right.roll - left.roll);
  return entries.map(({ id, kind }) => ({ id, kind }));
}

export function isPartyActor(actor: BattleActorRef): boolean {
  return actor.kind === 'hero' || actor.kind === 'pet';
}

export function isEnemyActor(actor: BattleActorRef): boolean {
  return actor.kind === 'enemy';
}
