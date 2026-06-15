import type { SpellElement } from '@/game/types';

export type Effectiveness = 'weak' | 'neutral' | 'resist';

/** Attacker element → element it is strong against */
export const ELEMENT_BEATS: Record<SpellElement, SpellElement> = {
  fire: 'wind',
  wind: 'earth',
  earth: 'water',
  water: 'fire',
};

export const EFFECTIVENESS_MULTIPLIER: Record<Effectiveness, number> = {
  weak: 2,
  neutral: 1,
  resist: 0.5,
};

export const ELEMENT_LABELS: Record<SpellElement, string> = {
  fire: 'Fire',
  water: 'Water',
  earth: 'Earth',
  wind: 'Wind',
};

export const ELEMENT_COLORS: Record<SpellElement, string> = {
  fire: '#e74c3c',
  water: '#3498db',
  earth: '#27ae60',
  wind: '#9d4edd',
};

/**
 * Fire → Wind → Earth → Water → Fire
 * Same element attacks are resisted.
 */
export function getEffectiveness(
  attackElement: SpellElement,
  defenseElement: SpellElement,
): Effectiveness {
  if (attackElement === defenseElement) {
    return 'resist';
  }

  if (ELEMENT_BEATS[attackElement] === defenseElement) {
    return 'weak';
  }

  if (ELEMENT_BEATS[defenseElement] === attackElement) {
    return 'resist';
  }

  return 'neutral';
}

export function getEffectivenessLabel(effectiveness: Effectiveness): string {
  switch (effectiveness) {
    case 'weak':
      return 'Super effective!';
    case 'resist':
      return 'Not very effective…';
    default:
      return '';
  }
}

export function getWeaknessElement(defenseElement: SpellElement): SpellElement {
  const entry = (
    Object.entries(ELEMENT_BEATS) as Array<[SpellElement, SpellElement]>
  ).find(([, beaten]) => beaten === defenseElement);

  return entry?.[0] ?? defenseElement;
}

export function getWeaknessLabel(element: SpellElement): string {
  return `Weak to ${ELEMENT_LABELS[getWeaknessElement(element)]}`;
}
