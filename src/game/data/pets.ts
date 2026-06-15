import type { Pet } from '@/game/types';
import { ENEMY_NAMES, getEnemySpriteUrl } from '@/game/types';

export const DEFAULT_PETS: Pet[] = [
  {
    id: 'pet-fire',
    name: ENEMY_NAMES.fire[0],
    element: 'fire',
    maxHp: 100,
    hp: 100,
    row: 'front',
    spriteUrl: getEnemySpriteUrl('fire', 1),
  },
  {
    id: 'pet-water',
    name: ENEMY_NAMES.water[1],
    element: 'water',
    maxHp: 90,
    hp: 90,
    row: 'mid',
    spriteUrl: getEnemySpriteUrl('water', 2),
  },
  {
    id: 'pet-wind',
    name: ENEMY_NAMES.wind[1],
    element: 'wind',
    maxHp: 85,
    hp: 85,
    row: 'back',
    spriteUrl: getEnemySpriteUrl('wind', 3),
  },
];

export function clonePets(source: Pet[] = DEFAULT_PETS): Pet[] {
  return source.map((pet) => ({ ...pet }));
}
