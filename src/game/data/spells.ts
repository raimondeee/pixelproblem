import type { Spell, SpellElement } from '@/game/types';

export const SPELL_CATALOG: Spell[] = [
  {
    id: 'fireball',
    element: 'fire',
    name: 'Fireball',
    color: '#e74c3c',
    power: 18,
    mathDifficulty: 2,
    cardUrl: '/assets/spells/fire/spell_fireball_card.png',
    projectileUrl: '/assets/spells/fire/spell_fireball.png',
    targetScope: 'single',
  },
  {
    id: 'firebird',
    element: 'fire',
    name: 'Firebird',
    color: '#ff6b6b',
    power: 24,
    mathDifficulty: 3,
    cardUrl: '/assets/spells/fire/spell_firebird_card.png',
    projectileUrl: '/assets/spells/fire/spell_firebird.png',
    targetScope: 'single',
  },
  {
    id: 'meteor',
    element: 'fire',
    name: 'Meteor',
    color: '#c9184a',
    power: 30,
    mathDifficulty: 4,
    cardUrl: '/assets/spells/fire/spell_meteor_card.png',
    projectileUrl: '/assets/spells/fire/spell_meteor.png',
    targetScope: 'single',
  },
  {
    id: 'bubble',
    element: 'water',
    name: 'Bubble',
    color: '#48cae4',
    power: 14,
    mathDifficulty: 1,
    cardUrl: '/assets/spells/water/spell_bubble_card.png',
    projectileUrl: '/assets/spells/water/spell_bubble.png',
    targetScope: 'single',
  },
  {
    id: 'ice-lance',
    element: 'water',
    name: 'Ice Lance',
    color: '#3498db',
    power: 20,
    mathDifficulty: 2,
    cardUrl: '/assets/spells/water/spell_iceLance_card.png',
    projectileUrl: '/assets/spells/water/spell_iceLance.png',
    targetScope: 'single',
  },
  {
    id: 'whirlpool',
    element: 'water',
    name: 'Whirlpool',
    color: '#0077b6',
    power: 26,
    mathDifficulty: 3,
    cardUrl: '/assets/spells/water/spell_whirlpool_card.png',
    projectileUrl: '/assets/spells/water/spell_whirlpool.png',
    targetScope: 'single',
  },
  {
    id: 'earth-fist',
    element: 'earth',
    name: 'Earth Fist',
    color: '#52b788',
    power: 22,
    mathDifficulty: 2,
    cardUrl: '/assets/spells/earth/spell_earthfist_card.png',
    projectileUrl: '/assets/spells/earth/spell_earthfist.png',
    targetScope: 'single',
  },
  {
    id: 'spike',
    element: 'earth',
    name: 'Spike',
    color: '#40916c',
    power: 18,
    mathDifficulty: 2,
    cardUrl: '/assets/spells/earth/spell_spike_card.png',
    projectileUrl: '/assets/spells/earth/spell_spike.png',
    targetScope: 'single',
  },
  {
    id: 'boulder',
    element: 'earth',
    name: 'Boulder',
    color: '#27ae60',
    power: 28,
    mathDifficulty: 3,
    cardUrl: '/assets/spells/earth/spell_boulder_card.png',
    projectileUrl: '/assets/spells/earth/spell_boulder.png',
    targetScope: 'single',
  },
  {
    id: 'air-blast',
    element: 'wind',
    name: 'Air Blast',
    color: '#bdb2ff',
    power: 16,
    mathDifficulty: 2,
    cardUrl: '/assets/spells/wind/spell_airBlast_card.png',
    projectileUrl: '/assets/spells/wind/spell_airBlast.png',
    targetScope: 'single',
  },
  {
    id: 'air-lance',
    element: 'wind',
    name: 'Air Lance',
    color: '#9d4edd',
    power: 21,
    mathDifficulty: 2,
    cardUrl: '/assets/spells/wind/spell_airLance_card.png',
    projectileUrl: '/assets/spells/wind/spell_airLance.png',
    targetScope: 'single',
  },
  {
    id: 'tornado',
    element: 'wind',
    name: 'Tornado',
    color: '#7b2cbf',
    power: 27,
    mathDifficulty: 3,
    cardUrl: '/assets/spells/wind/spell_tornado_card.png',
    projectileUrl: '/assets/spells/wind/spell_tornado.png',
    targetScope: 'single',
  },
];

/** Three spells each party member learns for their element */
export const ELEMENT_SPELL_IDS: Record<SpellElement, readonly string[]> = {
  fire: ['fireball', 'firebird', 'meteor'],
  water: ['bubble', 'ice-lance', 'whirlpool'],
  earth: ['earth-fist', 'spike', 'boulder'],
  wind: ['air-blast', 'air-lance', 'tornado'],
};

export const ULTIMATE_COMBO_REQUIREMENT = 5;

export function getSpellById(id: string): Spell | undefined {
  return SPELL_CATALOG.find((spell) => spell.id === id);
}

export function getSpellsForElement(element: SpellElement): Spell[] {
  return ELEMENT_SPELL_IDS[element].map((id) => getSpellById(id)!);
}
