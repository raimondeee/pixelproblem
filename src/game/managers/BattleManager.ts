import { createBattleHero } from '@/game/data/hero';
import { cycleFormationRow } from '@/game/data/formation';
import { getSpellsForElement } from '@/game/data/spells';
import type {
  BattleActorRef,
  BattlePhase,
  BattleState,
  FormationRow,
  GameMode,
  Spell,
  SpellElement,
} from '@/game/types';
import { gameEvents } from '@/game/events/GameEventBus';
import { playerSession } from '@/game/session/PlayerSession';
import {
  applyAllyHits,
  applySpellHits,
  areAllEnemiesDefeated,
  buildSpellHits,
  getEnemyById,
  getLivingEnemies,
  isValidTarget,
  pickDefaultTargetId,
  resolveNextTargetId,
  summarizeCast,
  summarizeEnemyCast,
} from '@/logic/combat';
import { enemyToPet, isCapturable } from '@/logic/capture';
import { buildEnemyPendingCast } from '@/logic/enemyAI';
import { generateEncounter } from '@/logic/encounterGenerator';
import { buildTurnOrder, isPartyActor } from '@/logic/initiative';
import { checkAnswer, generateMathEquation } from '@/logic/mathEquations';

type BattleListener = (state: BattleState) => void;

const ENEMY_TURN_DELAY_MS = 800;

class BattleManager {
  private state: BattleState = this.createInitialState();

  private listeners = new Set<BattleListener>();

  private turnTimer: number | null = null;

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

  isPartyTurn(): boolean {
    const actor = this.getCurrentActor();
    return actor !== null && isPartyActor(actor);
  }

  canCaptureSelectedTarget(): boolean {
    if (!this.isPartyTurn() || this.state.phase !== 'field' || this.state.formationMode) {
      return false;
    }

    const enemy = getEnemyById(this.state.enemies, this.state.targetEnemyId);
    return enemy !== undefined && isCapturable(enemy);
  }

  getCurrentActor(): BattleActorRef | null {
    return this.state.turnOrder[this.state.turnIndex] ?? null;
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
    const pets = playerSession.getPetsForBattle();
    const enemies = generateEncounter();
    const targetEnemyId = pickDefaultTargetId(enemies);
    const turnOrder = buildTurnOrder(hero, pets, enemies);

    this.setState({
      mode: 'BATTLE',
      phase: 'field',
      hero,
      pets,
      enemies,
      targetEnemyId,
      activeCasterId: null,
      turnOrder,
      turnIndex: 0,
      roundNumber: 1,
      battleOutcome: 'ongoing',
      comboStreak: 0,
      activeSpell: null,
      equation: null,
      pendingCast: null,
      formationMode: false,
      fizzleTick: 0,
      message: 'Battle start! Initiative decides who moves first.',
    });

    this.beginActorTurn();
  }

  exitBattle(): void {
    this.clearTurnTimer();
    this.state = this.createInitialState();
    this.listeners.forEach((listener) => listener(this.state));
    gameEvents.emit('mode-changed', 'EXPLORE');
  }

  toggleFormationMode(): void {
    if (this.state.phase !== 'field' || !this.isPartyTurn()) {
      return;
    }

    const next = !this.state.formationMode;

    this.setState({
      formationMode: next,
      message: next
        ? 'Formation mode — tap an ally to move them between rows.'
        : `${this.getActorDisplayName(this.state.activeCasterId)} — choose a target and spell!`,
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
    if (this.state.phase !== 'field' || this.state.formationMode || !this.isPartyTurn()) {
      return;
    }

    if (!isValidTarget(this.state.enemies, enemyId)) {
      return;
    }

    const enemy = getEnemyById(this.state.enemies, enemyId)!;
    const captureHint = isCapturable(enemy) ? ' You can try to capture!' : '';

    this.setState({
      targetEnemyId: enemyId,
      message: `Targeting ${enemy.name}.${captureHint} Choose a spell!`,
    });
  }

  tryCapture(enemyId: string): void {
    if (!this.canCaptureSelectedTarget() || this.state.targetEnemyId !== enemyId) {
      return;
    }

    const enemy = getEnemyById(this.state.enemies, enemyId);
    if (!enemy || !isCapturable(enemy)) {
      return;
    }

    const pet = enemyToPet(enemy);
    playerSession.addCapturedPet(pet);

    const enemies = this.state.enemies.filter((entry) => entry.id !== enemyId);
    const nextTargetId = resolveNextTargetId(enemies, null);
    const allGone = getLivingEnemies(enemies).length === 0;

    this.setState({
      enemies,
      targetEnemyId: nextTargetId,
      activeSpell: null,
      equation: null,
      pendingCast: null,
      message: `Captured ${enemy.name}! ${pet.name} joined your party.`,
      battleOutcome: allGone ? 'victory' : this.state.battleOutcome,
    });

    if (allGone) {
      return;
    }

    this.advanceTurn();
  }

  beginSpellCast(spell: Spell): void {
    if (this.state.formationMode || !this.isPartyTurn() || this.state.phase !== 'field') {
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
      this.advanceTurn();
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
      this.advanceTurn();
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
    const { pendingCast, enemies, hero, pets, comboStreak } = this.state;
    if (!pendingCast) {
      return;
    }

    let nextHero = hero;
    let nextPets = pets;
    let nextEnemies = enemies;
    let nextCombo = comboStreak;
    let message: string;

    if (pendingCast.hits && pendingCast.hits.length > 0) {
      nextEnemies = applySpellHits(enemies, pendingCast.hits);
      nextCombo = comboStreak + 1;
      const allDefeated = areAllEnemiesDefeated(nextEnemies);
      message = summarizeCast(pendingCast.spell, pendingCast.hits, nextEnemies, allDefeated);

      gameEvents.emit('spell-cast', {
        spell: pendingCast.spell,
        hits: pendingCast.hits,
      });
    } else if (pendingCast.allyHits && pendingCast.allyHits.length > 0) {
      const result = applyAllyHits(hero, pets, pendingCast.allyHits);
      nextHero = result.hero;
      nextPets = result.pets;
      message = summarizeEnemyCast(pendingCast.spell, pendingCast.allyHits, nextHero, nextPets);
    } else {
      message = `${pendingCast.spell.name} missed!`;
    }

    const outcome = this.resolveBattleOutcome(nextHero, nextEnemies);
    const nextTargetId = resolveNextTargetId(nextEnemies, this.state.targetEnemyId);

    this.setState({
      phase: 'field',
      hero: nextHero,
      pets: nextPets,
      enemies: nextEnemies,
      targetEnemyId: nextTargetId,
      comboStreak: nextCombo,
      activeSpell: null,
      pendingCast: null,
      message,
      battleOutcome: outcome,
    });

    if (outcome !== 'ongoing') {
      this.clearTurnTimer();
      return;
    }

    this.advanceTurn();
  }

  private resolveBattleOutcome(
    hero: BattleState['hero'],
    enemies: BattleState['enemies'],
  ): BattleState['battleOutcome'] {
    if (!hero || hero.hp <= 0) {
      return 'defeat';
    }

    if (getLivingEnemies(enemies).length === 0) {
      return 'victory';
    }

    return 'ongoing';
  }

  private isActorAlive(actor: BattleActorRef): boolean {
    const { hero, pets, enemies } = this.state;

    if (actor.kind === 'hero') {
      return hero !== null && hero.hp > 0;
    }

    if (actor.kind === 'pet') {
      return pets.some((pet) => pet.id === actor.id && pet.hp > 0);
    }

    const enemy = getEnemyById(enemies, actor.id);
    return enemy !== undefined && enemy.hp > 0;
  }

  private getActorDisplayName(actorId: string | null): string {
    if (!actorId) {
      return 'Unknown';
    }

    if (this.state.hero?.id === actorId) {
      return this.state.hero.name;
    }

    const pet = this.state.pets.find((entry) => entry.id === actorId);
    if (pet) {
      return pet.name;
    }

    const enemy = getEnemyById(this.state.enemies, actorId);
    return enemy?.name ?? 'Unknown';
  }

  private beginActorTurn(): void {
    if (this.state.battleOutcome !== 'ongoing') {
      return;
    }

    const actor = this.getCurrentActor();
    if (!actor) {
      return;
    }

    if (!this.isActorAlive(actor)) {
      this.advanceTurn();
      return;
    }

    if (actor.kind === 'enemy') {
      const enemy = getEnemyById(this.state.enemies, actor.id);
      this.setState({
        phase: 'field',
        activeCasterId: actor.id,
        activeSpell: null,
        equation: null,
        pendingCast: null,
        formationMode: false,
        message: `${enemy?.name ?? 'Enemy'} is casting…`,
      });
      this.scheduleEnemyTurn();
      return;
    }

    this.setState({
      phase: 'field',
      activeCasterId: actor.id,
      activeSpell: null,
      equation: null,
      pendingCast: null,
      formationMode: false,
      message: `${this.getActorDisplayName(actor.id)}'s turn — choose a target and spell!`,
    });
  }

  private scheduleEnemyTurn(): void {
    this.clearTurnTimer();
    this.turnTimer = window.setTimeout(() => {
      this.executeEnemyTurn();
    }, ENEMY_TURN_DELAY_MS);
  }

  private executeEnemyTurn(): void {
    if (this.state.battleOutcome !== 'ongoing' || this.state.phase !== 'field') {
      return;
    }

    const actor = this.getCurrentActor();
    if (!actor || actor.kind !== 'enemy') {
      return;
    }

    const enemy = getEnemyById(this.state.enemies, actor.id);
    if (!enemy || enemy.hp <= 0) {
      this.advanceTurn();
      return;
    }

    const pendingCast = buildEnemyPendingCast(enemy, this.state.hero, this.state.pets);

    if (!pendingCast.allyHits || pendingCast.allyHits.length === 0) {
      this.setState({ message: `${enemy.name} couldn't find a target.` });
      this.advanceTurn();
      return;
    }

    this.setState({
      phase: 'casting',
      activeSpell: pendingCast.spell,
      pendingCast,
      message: null,
    });
  }

  private advanceTurn(): void {
    this.clearTurnTimer();

    if (this.state.battleOutcome !== 'ongoing') {
      return;
    }

    const { hero, pets, enemies, turnOrder, turnIndex, roundNumber } = this.state;
    let nextOrder = turnOrder;
    let nextIndex = turnIndex + 1;
    let nextRound = roundNumber;

    if (nextIndex >= turnOrder.length) {
      nextOrder = buildTurnOrder(hero, pets, enemies);
      nextIndex = 0;
      nextRound = roundNumber + 1;
    }

    if (nextOrder.length === 0) {
      return;
    }

    let attempts = 0;
    while (attempts < nextOrder.length && !this.isActorAlive(nextOrder[nextIndex])) {
      nextIndex += 1;
      if (nextIndex >= nextOrder.length) {
        nextOrder = buildTurnOrder(hero, pets, enemies);
        nextIndex = 0;
        nextRound += 1;
      }
      attempts += 1;
    }

    if (attempts >= nextOrder.length) {
      return;
    }

    this.setState({
      turnOrder: nextOrder,
      turnIndex: nextIndex,
      roundNumber: nextRound,
    });
    this.beginActorTurn();
  }

  private clearTurnTimer(): void {
    if (this.turnTimer !== null) {
      window.clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
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
      turnOrder: [],
      turnIndex: 0,
      roundNumber: 0,
      battleOutcome: 'ongoing',
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
