import type { BattleEnemy } from '@/game/types';
import { ENEMY_FORMATION_SLOTS, getFormationRowClass } from '@/game/data/enemyFormation';
import { ELEMENT_COLORS, ELEMENT_LABELS, getWeaknessLabel } from '@/logic/elements';
import './EnemyGrid.css';

interface EnemyGridProps {
  enemies: BattleEnemy[];
  targetEnemyId?: string | null;
  hitEnemyIds?: string[];
  capturableEnemyIds?: string[];
  activeActorId?: string | null;
  selectable?: boolean;
  onSelectTarget?: (enemyId: string) => void;
}

export function EnemyGrid({
  enemies,
  targetEnemyId = null,
  hitEnemyIds = [],
  capturableEnemyIds = [],
  activeActorId = null,
  selectable = false,
  onSelectTarget,
}: EnemyGridProps) {
  const slots = ENEMY_FORMATION_SLOTS.map((slotIndex) => {
    return {
      slotIndex,
      enemy: enemies.find((entry) => entry.gridSlot === slotIndex) ?? null,
    };
  });

  return (
    <div className="enemy-grid" aria-label="Enemy formation">
      {slots.map(({ slotIndex, enemy }) => (
        <div
          key={`slot-${slotIndex}`}
          className={`enemy-grid__slot enemy-grid__slot--formation ${enemy ? 'enemy-grid__slot--filled' : ''}`}
          data-slot={slotIndex}
          data-row={getFormationRowClass(slotIndex) ?? 'mid'}
        >
          {enemy ? (
            <EnemySprite
              enemy={enemy}
              isTarget={enemy.id === targetEnemyId}
              isHit={hitEnemyIds.includes(enemy.id)}
              isCapturable={capturableEnemyIds.includes(enemy.id)}
              isActive={enemy.id === activeActorId}
              selectable={selectable && enemy.hp > 0}
              onSelect={() => onSelectTarget?.(enemy.id)}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function EnemySprite({
  enemy,
  isTarget,
  isHit,
  isCapturable,
  isActive,
  selectable,
  onSelect,
}: {
  enemy: BattleEnemy;
  isTarget: boolean;
  isHit: boolean;
  isCapturable: boolean;
  isActive: boolean;
  selectable: boolean;
  onSelect: () => void;
}) {
  const isDefeated = enemy.hp <= 0;
  const hpPercent = Math.round((enemy.hp / enemy.maxHp) * 100);

  const className = [
    'enemy-sprite',
    selectable ? 'enemy-sprite--selectable' : '',
    isTarget ? 'enemy-sprite--targeted' : '',
    isDefeated ? 'enemy-sprite--defeated' : '',
    isHit ? 'enemy-sprite--hit' : '',
    isCapturable ? 'enemy-sprite--capturable' : '',
    isActive ? 'enemy-sprite--active-turn' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <div className="enemy-sprite__body">
        <div className="enemy-sprite__hp-bar" aria-hidden="true">
          <span
            className="enemy-sprite__hp-fill"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
        <img
          className="enemy-sprite__image"
          src={enemy.spriteUrl}
          alt={enemy.name}
          draggable={false}
        />
      </div>
      <div className="enemy-sprite__label">
        <span
          className="enemy-sprite__element"
          style={{ color: ELEMENT_COLORS[enemy.element] }}
        >
          {ELEMENT_LABELS[enemy.element]}
        </span>
        <span className="enemy-sprite__name">{enemy.name}</span>
        <span className="enemy-sprite__weakness">{getWeaknessLabel(enemy.element)}</span>
        {isCapturable ? <span className="enemy-sprite__capture-tag">Capture!</span> : null}
      </div>
    </>
  );

  if (selectable) {
    return (
      <button
        type="button"
        className={className}
        data-battle-unit-id={enemy.id}
        onClick={onSelect}
        aria-label={`Target ${enemy.name}`}
        aria-pressed={isTarget}
      >
        {content}
      </button>
    );
  }

  return (
    <figure className={className} data-battle-unit-id={enemy.id}>
      {content}
    </figure>
  );
}
