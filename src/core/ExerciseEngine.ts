import type { Exercise, GameConfig, Operation } from '../types';
import type { IExerciseStrategy } from './strategies/IExerciseStrategy';

/**
 * ExerciseEngine — the framework-agnostic core.
 *
 * Responsibilities:
 *   • Act as a registry (Factory) for IExerciseStrategy implementations.
 *   • Pick a strategy at random from those active in the current config.
 *   • Validate a user's answer against the correct one.
 *
 * Adding a new operation:
 *   engine.register(new FractionStrategy());   ← that's all.
 */
export class ExerciseEngine {
  private readonly strategies = new Map<Operation, IExerciseStrategy>();

  /**
   * Register a strategy. Supports method chaining.
   * Registering a duplicate operation overwrites the previous strategy.
   */
  register(strategy: IExerciseStrategy): this {
    this.strategies.set(strategy.operation, strategy);
    return this;
  }

  /**
   * Generate a random exercise using one of the active operations.
   * Throws if none of the config's operations have a registered strategy.
   */
  generate(config: GameConfig): Exercise {
    const available = config.operations.filter(op => this.strategies.has(op));
    if (available.length === 0) {
      throw new Error(
        `No registered strategy for the selected operations: ${config.operations.join(', ')}`,
      );
    }
    const op = available[Math.floor(Math.random() * available.length)];
    return this.strategies.get(op)!.generate(config);
  }

  /**
   * Pure validation — no side effects.
   * All answers in V1 are integers, so strict equality is appropriate.
   */
  validate(exercise: Exercise, userAnswer: number): boolean {
    return exercise.correctAnswer === userAnswer;
  }
}
