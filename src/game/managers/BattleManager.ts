import { clonePets } from '@/game/data/pets';
import { createBattleHero } from '@/game/data/hero';
import { cycleFormationRow } from '@/game/data/formation';
import { getSpellsForElement } from '@/game/data/spells';
import type { BattlePhase, BattleState, FormationRow, GameMode, Spell, SpellElement } from '@/game/types';
import { gameEvents } from '@/game/events/GameEventBus';
import { playerSession } from '@/game/session/PlayerSession';
import {
  applySpellHits,
  areAllEnemiesDefeated,
  buildSpellHits,
  getEnemyById,
  isValidTarget,
  pickDefaultTargetId,
  resolveNextTargetId,
  summarizeCast,
} from '@/logic/combat';
import { generateEncounter } from '@/logic/encounterGenerator';
import { checkAnswer, generateMathEquation } from '@/logic/mathEquations';

type BattleListener = (state: BattleState) => void;

class BattleManager {
  private state: BattleState = this.createInitialState();

  private listeners = new Set<BattleListener>();

  constructor() {
    gameEvents.on('battle-trigger', () => this.enterBattle());
  }

  subscribe(listener: BattleListener): () => void {
    this.listeners.add(listener);
    listener(this.state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): BattleState {
    return this.state;
  }

  getMode(): GameMode {
    return this.state.mode;
  }

  getPhase(): BattlePhase {
    return this.state.phase;
  }

  getSpells(): Spell[] {
    return getSpellsForElement(this.getCasterElement());
  }

  private getCasterElement(): SpellElement {
    const { activeCasterId, hero, pets } = this.state;
    if (hero && (!activeCasterId || hero.id === activeCasterId)) {
      return hero.element;
    }

    const pet = pets.find((entry) => entry.id === activeCasterId);
    return pet?.element ?? hero?.element ?? 'fire';
  }

  enterBattle(): void {
    const character = playerSession.getSelectedCharacter();
    const hero = character ? createBattleHero(character) : null;
    const enemies = generateEncounter();
    const targetEnemyId = pickDefaultTargetId(enemies);
    const target = getEnemyById(enemies, targetEnemyId);

    this.setState({
      mode: 'BATTLE',
      phase: 'field',
      hero,
      pets: clonePets(),
      enemies,
      targetEnemyId,
      activeCasterId: hero?.id ?? null,
      comboStreak: 0,
      activeSpell: null,
      equation: null,
      pendingCast: null,
      formationMode: false,
      fizzleTick: 0,
      message: hero
        ? `${hero.name}, tap an enemy to target, then cast a spell!`
        : target
          ? `Targeting ${target.name}. Choose a spell!`
          : 'Tap an enemy to target, then cast a spell!',
    });
  }

  exitBattle(): void {
    this.state = this.createInitialState();
    this.listeners.forEach((listener) => listener(this.state));
    gameEvents.emit('mode-changed', 'EXPLORE');
  }

  toggleFormationMode(): void {
    if (this.state.phase !== 'field') {
      return;
    }

    const next = !this.state.formationMode;

    this.setState({
      formationMode: next,
      message: next
        ? 'Formation mode — tap an ally to move them between rows.'
        : 'Formation set! Tap an enemy to target, then cast a spell.',
    });
  }

  cycleUnitRow(unitId: string): void {
    if (!this.state.formationMode || this.state.phase !== 'field') {
      return;
    }

    if (this.state.hero?.id === unitId) {
      const nextRow = cycleFormationRow(this.state.hero.row);
      this.setState({
        hero: { ...this.state.hero, row: nextRow },
        message: `${this.state.hero.name} moved to ${nextRow} row.`,
      });
      return;
    }

    const petIndex = this.state.pets.findIndex((pet) => pet.id === unitId);
    if (petIndex === -1) {
      return;
    }

    const pet = this.state.pets[petIndex];
    const nextRow = cycleFormationRow(pet.row);
    const pets = [...this.state.pets];
    pets[petIndex] = { ...pet, row: nextRow };

    this.setState({
      pets,
      message: `${pet.name} moved to ${nextRow} row.`,
    });
  }

  setUnitRow(unitId: string, row: FormationRow): void {
    if (!this.state.formationMode || this.state.phase !== 'field') {
      return;
    }

    if (this.state.hero?.id === unitId) {
      this.setState({
        hero: { ...this.state.hero, row },
        message: `${this.state.hero.name} moved to ${row} row.`,
      });
      return;
    }

    const petIndex = this.state.pets.findIndex((pet) => pet.id === unitId);
    if (petIndex === -1) {
      return;
    }

    const pet = this.state.pets[petIndex];
    const pets = [...this.state.pets];
    pets[petIndex] = { ...pet, row };

    this.setState({
      pets,
      message: `${pet.name} moved to ${row} row.`,
    });
  }

  selectTarget(enemyId: string): void {
    if (this.state.phase !== 'field' || this.state.formationMode) {
      return;
    }

    if (!isValidTarget(this.state.enemies, enemyId)) {
      return;
    }

    const enemy = getEnemyById(this.state.enemies, enemyId)!;

    this.setState({
      targetEnemyId: enemyId,
      message: `Targeting ${enemy.name}. Choose a spell!`,
    });
  }

  beginSpellCast(spell: Spell): void {
    if (this.state.formationMode) {
      return;
    }

    if (spell.targetScope === 'single') {
      const target = getEnemyById(this.state.enemies, this.state.targetEnemyId);
      if (!target || target.hp <= 0) {
        this.setState({ message: 'Select an enemy to attack first!' });
        return;
      }
    }

    const equation = generateMathEquation(spell.mathDifficulty);

    this.setState({
      phase: 'math',
      activeSpell: spell,
      equation,
      message: null,
    });
    gameEvents.emit('spell-selected', spell);
  }

  cancelSpellCast(): void {
    const target = getEnemyById(this.state.enemies, this.state.targetEnemyId);

    this.setState({
      phase: 'field',
      activeSpell: null,
      equation: null,
      message: target
        ? `Spell cancelled. Still targeting ${target.name}.`
        : 'Spell cancelled. Select a target and try again.',
    });
  }

  submitAnswer(rawValue: string): boolean {
    const { equation, activeSpell, enemies, targetEnemyId } = this.state;

    if (!equation || !activeSpell) {
      return false;
    }

    const parsed = Number.parseInt(rawValue.trim(), 10);
    if (Number.isNaN(parsed)) {
      this.setState({ message: 'Enter a valid number.' });
      return false;
    }

    if (!checkAnswer(equation, parsed)) {
      this.setState({
        phase: 'field',
        activeSpell: null,
        equation: null,
        comboStreak: 0,
        fizzleTick: this.state.fizzleTick + 1,
        message: 'Incorrect! Combo reset — the spell fizzles out…',
      });
      return false;
    }

    const hits = buildSpellHits(activeSpell, equation.difficulty, enemies, targetEnemyId);

    if (hits.length === 0) {
      this.setState({
        phase: 'field',
        activeSpell: null,
        equation: null,
        message: 'No valid target! Select a living enemy.',
      });
      return false;
    }

    this.setState({
      phase: 'casting',
      equation: null,
      pendingCast: {
        spell: activeSpell,
        hits,
        casterId: this.state.activeCasterId ?? this.state.hero?.id ?? 'hero',
      },
      message: null,
    });

    return true;
  }

  completeSpellCast(): void {
    const { pendingCast, enemies, comboStreak } = this.state;
    if (!pendingCast) {
      return;
    }

    const updatedEnemies = applySpellHits(enemies, pendingCast.hits);
    const defeated = areAllEnemiesDefeated(updatedEnemies);
    const nextTargetId = resolveNextTargetId(updatedEnemies, this.state.targetEnemyId);

    gameEvents.emit('spell-cast', {
      spell: pendingCast.spell,
      hits: pendingCast.hits,
    });

    this.setState({
      phase: 'field',
      enemies: updatedEnemies,
      targetEnemyId: nextTargetId,
      comboStreak: comboStreak + 1,
      activeSpell: null,
      pendingCast: null,
      message: summarizeCast(
        pendingCast.spell,
        pendingCast.hits,
        updatedEnemies,
        defeated,
      ),
    });
  }

  private createInitialState(): BattleState {
    return {
      mode: 'EXPLORE',
      phase: 'field',
      hero: null,
      pets: [],
      enemies: [],
      targetEnemyId: null,
      activeCasterId: null,
      comboStreak: 0,
      activeSpell: null,
      equation: null,
      pendingCast: null,
      message: null,
      formationMode: false,
      fizzleTick: 0,
    };
  }

  private setState(partial: Partial<BattleState>): void {
    this.state = { ...this.state, ...partial };

    if (partial.mode !== undefined) {
      gameEvents.emit('mode-changed', this.state.mode);
    }

    this.listeners.forEach((listener) => listener(this.state));
  }
}

export const battleManager = new BattleManager();
