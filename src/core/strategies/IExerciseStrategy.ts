import type { Exercise, GameConfig, Operation } from '../../types';

/**
 * Contract every exercise strategy must fulfill.
 *
 * To add a new operation (e.g. Fractions, Square roots):
 *   1. Create a new file implementing this interface.
 *   2. Register the instance with ExerciseEngine in main.ts.
 *   3. Done — no other file needs to change.
 */
export interface IExerciseStrategy {
  /** Identifies which operation this strategy handles. */
  readonly operation: Operation;

  /** Generate a fresh, random exercise based on the current config. */
  generate(config: GameConfig): Exercise;
}
