import type { SpellElement } from '@/game/types';

export type AppScreen = 'loading' | 'player-select' | 'game';

export interface PlayableCharacter {
  id: string;
  name: string;
  title: string;
  description: string;
  accentColor: string;
  spriteUrl: string;
  element: SpellElement;
}

export const LOADING_SCREEN_URL = '/assets/loading-screen.png';

export const PLAYER_ROSTER: PlayableCharacter[] = [
  {
    id: 'player-001',
    name: 'Rowan',
    title: 'Verdant Sage',
    description: 'A nature mage who commands roots and leaf-light.',
    accentColor: '#52b788',
    spriteUrl: '/assets/players/player_001.png',
    element: 'earth',
  },
  {
    id: 'player-002',
    name: 'Lyra',
    title: 'Star Seer',
    description: 'Reads the night sky to weave celestial spells.',
    accentColor: '#9d4edd',
    spriteUrl: '/assets/players/player_002.png',
    element: 'wind',
  },
  {
    id: 'player-003',
    name: 'Kai',
    title: 'Flame Knight',
    description: 'Charges into battle with ember-forged courage.',
    accentColor: '#e74c3c',
    spriteUrl: '/assets/players/player_003.png',
    element: 'fire',
  },
  {
    id: 'player-004',
    name: 'Mira',
    title: 'Tide Caller',
    description: 'Summons crashing waves and icy currents.',
    accentColor: '#3498db',
    spriteUrl: '/assets/players/player_004.png',
    element: 'water',
  },
  {
    id: 'player-005',
    name: 'Finn',
    title: 'Stone Warden',
    description: 'Stands firm with earth-shaping defensive magic.',
    accentColor: '#40916c',
    spriteUrl: '/assets/players/player_005.png',
    element: 'earth',
  },
  {
    id: 'player-006',
    name: 'Zephyr',
    title: 'Gale Runner',
    description: 'Strikes fast with wind-laced agility.',
    accentColor: '#bdb2ff',
    spriteUrl: '/assets/players/player_006.png',
    element: 'wind',
  },
];

export function getCharacterById(id: string): PlayableCharacter | undefined {
  return PLAYER_ROSTER.find((character) => character.id === id);
}
