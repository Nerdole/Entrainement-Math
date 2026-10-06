import type { Exercise, GameConfig } from '../../types';
import type { IExerciseStrategy } from './IExerciseStrategy';
import { randInt } from './utils';

export class SubtractionStrategy implements IExerciseStrategy {
  readonly operation = '-' as const;

  generate(config: GameConfig): Exercise {
    let a = randInt(1, config.maxTable);
    let b = randInt(1, config.maxTable);
    // Ensure result is always non-negative
    if (b > a) [a, b] = [b, a];
    return {
      id: crypto.randomUUID(),
      operandA: a,
      operandB: b,
      operation: '-',
      correctAnswer: a - b,
    };
  }
}
