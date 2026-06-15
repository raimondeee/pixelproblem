import type { MathEquation } from '@/game/types';

const OPERATIONS = ['+', '-', '×'] as const;
type Operation = (typeof OPERATIONS)[number];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOperation(difficulty: number): Operation {
  if (difficulty <= 1) {
    return '+';
  }

  if (difficulty <= 3) {
    return OPERATIONS[randomInt(0, 1)];
  }

  return OPERATIONS[randomInt(0, OPERATIONS.length - 1)];
}

function compute(a: number, b: number, op: Operation): number {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
  }
}

/**
 * Generates a random math equation scaled by difficulty (1 = easiest).
 */
export function generateMathEquation(difficulty: number): MathEquation {
  const level = Math.max(1, Math.min(5, Math.round(difficulty)));
  const op = pickOperation(level);

  const maxOperand = 5 + level * 4;
  let a = randomInt(1, maxOperand);
  let b = randomInt(1, maxOperand);

  if (op === '-') {
    if (b > a) {
      [a, b] = [b, a];
    }
  }

  if (op === '×' && level >= 4) {
    b = randomInt(2, Math.min(12, 4 + level));
  }

  return {
    prompt: `${a} ${op} ${b} = ?`,
    answer: compute(a, b, op),
    difficulty: level,
  };
}

export function checkAnswer(equation: MathEquation, value: number): boolean {
  return equation.answer === value;
}
