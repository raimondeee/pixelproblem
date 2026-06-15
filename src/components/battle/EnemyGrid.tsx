import type { BattleEnemy } from '@/game/types';
import { ENEMY_FORMATION_SLOTS, getFormationRowClass } from '@/game/data/enemyFormation';
import { ELEMENT_COLORS, ELEMENT_LABELS, getWeaknessLabel } from '@/logic/elements';
import './EnemyGrid.css';

interface EnemyGridProps {
  enemies: BattleEnemy[];
  targetEnemyId?: string | null;
  hitEnemyIds?: string[];
  selectable?: boolean;
  onSelectTarget?: (enemyId: string) => void;
}

export function EnemyGrid({
  enemies,
  targetEnemyId = null,
  hitEnemyIds = [],
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
  selectable,
  onSelect,
}: {
  enemy: BattleEnemy;
  isTarget: boolean;
  isHit: boolean;
  selectable: boolean;
  onSelect: () => void;
}) {
  const isDefeated = enemy.hp <= 0;
  const hpPercent = Math.round((enemy.hp / enemy.maxHp) * 100);

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
      </div>
    </>
  );

  if (selectable) {
    return (
      <button
        type="button"
        className={`enemy-sprite enemy-sprite--selectable ${isTarget ? 'enemy-sprite--targeted' : ''} ${isDefeated ? 'enemy-sprite--defeated' : ''} ${isHit ? 'enemy-sprite--hit' : ''}`}
        onClick={onSelect}
        aria-label={`Target ${enemy.name}`}
        aria-pressed={isTarget}
      >
        {content}
      </button>
    );
  }

  return (
    <figure
      className={`enemy-sprite ${isDefeated ? 'enemy-sprite--defeated' : ''} ${isHit ? 'enemy-sprite--hit' : ''} ${isTarget ? 'enemy-sprite--targeted' : ''}`}
    >
      {content}
    </figure>
  );
}