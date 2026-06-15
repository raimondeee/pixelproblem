export type GameMode = 'EXPLORE' | 'BATTLE';

export type FormationRow = 'back' | 'mid' | 'front';

export type BattlePhase = 'field' | 'math' | 'casting';

export type SpellElement = 'fire' | 'water' | 'earth' | 'wind';

export type SpellTargetScope = 'single' | 'all';

export interface Spell {
  id: string;
  element: SpellElement;
  name: string;
  color: string;
  power: number;
  mathDifficulty: number;
  cardUrl: string;
  projectileUrl: string;
  /** Normal spells hit one foe; future ultimates can hit all */
  targetScope: SpellTargetScope;
}

export interface MathEquation {
  prompt: string;
  answer: number;
  difficulty: number;
}

/** Tamed creature — uses enemy sprites, flipped to face right in battle */
export interface Pet {
  id: string;
  name: string;
  element: SpellElement;
  maxHp: number;
  hp: number;
  row: 'back' | 'mid' | 'front';
  spriteUrl: string;
}

export interface BattleHero {
  id: string;
  name: string;
  title: string;
  accentColor: string;
  spriteUrl: string;
  element: SpellElement;
  maxHp: number;
  hp: number;
  row: 'back' | 'mid' | 'front';
}

export interface BattleEnemy {
  id: string;
  name: string;
  element: SpellElement;
  spriteUrl: string;
  maxHp: number;
  hp: number;
  gridSlot: number;
}

export type Effectiveness = 'weak' | 'neutral' | 'resist';

export interface SpellHit {
  enemyId: string;
  damage: number;
  effectiveness: Effectiveness;
}

export interface PendingCast {
  spell: Spell;
  hits: SpellHit[];
  casterId: string;
}

export interface BattleState {
  mode: GameMode;
  phase: BattlePhase;
  hero: BattleHero | null;
  pets: Pet[];
  enemies: BattleEnemy[];
  targetEnemyId: string | null;
  /** Party member casting spells — hero or pet id */
  activeCasterId: string | null;
  /** Correct-answer streak — fuels a future ultimate spell */
  comboStreak: number;
  activeSpell: Spell | null;
  equation: MathEquation | null;
  pendingCast: PendingCast | null;
  message: string | null;
  formationMode: boolean;
  /** Increments on fizzle — drives screen effect */
  fizzleTick: number;
}

export type GameEventMap = {
  'mode-changed': GameMode;
  'battle-trigger': { enemyId: string };
  'spell-selected': Spell;
  'spell-cast': { spell: Spell; hits: SpellHit[] };
};

export type GameEventName = keyof GameEventMap;

export const ENEMY_GRID_SIZE = 9;

export const ENEMY_NAMES: Record<SpellElement, string[]> = {
  fire: ['Ember Fox', 'Flame Imp', 'Cinder Beast'],
  water: ['Tide Sprite', 'Ripple Serpent', 'Glacier Cub'],
  earth: ['Stone Golem', 'Moss Troll', 'Boulder Crab'],
  wind: ['Gale Phantom', 'Zephyr Hawk', 'Tempest Wisp'],
};

export function getEnemySpriteUrl(element: SpellElement, variant: number): string {
  const suffix = variant.toString().padStart(3, '0');
  return `/assets/pixels/${element}Pixels/${element}_${suffix}.png`;
}
