import type { BattleHero } from '@/game/types';
import type { PlayableCharacter } from '@/game/data/players';

const DEFAULT_HERO_HP = 100;

export function createBattleHero(character: PlayableCharacter): BattleHero {
  return {
    id: character.id,
    name: character.name,
    title: character.title,
    accentColor: character.accentColor,
    spriteUrl: character.spriteUrl,
    element: character.element,
    maxHp: DEFAULT_HERO_HP,
    hp: DEFAULT_HERO_HP,
    row: 'front',
  };
}
