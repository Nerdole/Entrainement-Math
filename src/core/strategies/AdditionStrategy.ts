import type { Exercise, GameConfig } from '../../types';
import type { IExerciseStrategy } from './IExerciseStrategy';
import { randInt } from './utils';

export class AdditionStrategy implements IExerciseStrategy {
  readonly operation = '+' as const;

  generate(config: GameConfig): Exercise {
    const a = randInt(1, config.maxTable);
    const b = randInt(1, config.maxTable);
    return {
      id: crypto.randomUUID(),
      operandA: a,
      operandB: b,
      operation: '+',
      correctAnswer: a + b,
    };
  }
}
