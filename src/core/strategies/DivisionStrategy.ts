import type { Exercise, GameConfig } from '../../types';
import type { IExerciseStrategy } from './IExerciseStrategy';
import { randInt } from './utils';

export class DivisionStrategy implements IExerciseStrategy {
  readonly operation = '/' as const;

  generate(config: GameConfig): Exercise {
    // Build a guaranteed whole-number division:
    //   dividend = quotient × divisor
    //   question : dividend ÷ divisor = ?
    //   answer   : quotient
    const divisor = randInt(1, config.maxTable);
    const quotient = randInt(1, config.maxTable);
    const dividend = quotient * divisor;
    return {
      id: crypto.randomUUID(),
      operandA: dividend,
      operandB: divisor,
      operation: '/',
      correctAnswer: quotient,
    };
  }
}
