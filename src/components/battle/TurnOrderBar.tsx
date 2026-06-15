import type { BattleActorRef, BattleEnemy, BattleHero, BattleState, Pet } from '@/game/types';
import './TurnOrderBar.css';

interface TurnOrderBarProps {
  state: BattleState;
}

function getActorLabel(
  actor: BattleActorRef,
  hero: BattleHero | null,
  pets: Pet[],
  enemies: BattleEnemy[],
): string {
  if (actor.kind === 'hero') {
    return hero?.name ?? 'Hero';
  }

  if (actor.kind === 'pet') {
    return pets.find((pet) => pet.id === actor.id)?.name ?? 'Pet';
  }

  return enemies.find((enemy) => enemy.id === actor.id)?.name ?? 'Enemy';
}

function isActorAlive(
  actor: BattleActorRef,
  hero: BattleHero | null,
  pets: Pet[],
  enemies: BattleEnemy[],
): boolean {
  if (actor.kind === 'hero') {
    return hero !== null && hero.hp > 0;
  }

  if (actor.kind === 'pet') {
    return pets.some((pet) => pet.id === actor.id && pet.hp > 0);
  }

  return enemies.some((enemy) => enemy.id === actor.id && enemy.hp > 0);
}

export function TurnOrderBar({ state }: TurnOrderBarProps) {
  if (state.turnOrder.length === 0) {
    return null;
  }

  const currentActor = state.turnOrder[state.turnIndex];

  return (
    <div className="turn-order-bar" aria-label={`Round ${state.roundNumber} turn order`}>
      <span className="turn-order-bar__round">R{state.roundNumber}</span>
      <ol className="turn-order-bar__list">
        {state.turnOrder.map((actor) => {
          const alive = isActorAlive(actor, state.hero, state.pets, state.enemies);
          const isCurrent = currentActor?.id === actor.id && currentActor.kind === actor.kind;

          return (
            <li
              key={`${actor.kind}-${actor.id}`}
              className={`turn-order-bar__item turn-order-bar__item--${actor.kind} ${isCurrent ? 'is-current' : ''} ${alive ? '' : 'is-defeated'}`}
            >
              {getActorLabel(actor, state.hero, state.pets, state.enemies)}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
