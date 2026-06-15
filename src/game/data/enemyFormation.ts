/**
 * Staggered enemy slots near the right edge (party on the left):
 *
 * . . E   ← slot 2  (-x)
 * . E .   ← slot 4  (x-)
 * . . E   ← slot 8  (-x)
 */
export const ENEMY_FORMATION_SLOTS = [2, 4, 8] as const;

/** Fill top → middle → bottom so partial groups keep the zigzag readable. */
export const ENEMY_FORMATION_FILL_ORDER = [2, 4, 8] as const;

export type EnemyFormationSlot = (typeof ENEMY_FORMATION_SLOTS)[number];

export function isFormationSlot(slotIndex: number): slotIndex is EnemyFormationSlot {
  return (ENEMY_FORMATION_SLOTS as readonly number[]).includes(slotIndex);
}

export function pickFormationSlots(count: number): EnemyFormationSlot[] {
  return ENEMY_FORMATION_FILL_ORDER.slice(0, count) as EnemyFormationSlot[];
}

/** @deprecated Use pickFormationSlots */
export const pickChevronSlots = pickFormationSlots;

/** @deprecated Use ENEMY_FORMATION_SLOTS */
export const ENEMY_CHEVRON_SLOTS = ENEMY_FORMATION_SLOTS;

export function getFormationRowClass(slotIndex: number): 'top' | 'mid' | 'bottom' | null {
  if (slotIndex === 2) {
    return 'top';
  }
  if (slotIndex === 4) {
    return 'mid';
  }
  if (slotIndex === 8) {
    return 'bottom';
  }
  return null;
}

/** @deprecated Use getFormationRowClass */
export const getChevronDepthClass = getFormationRowClass;
