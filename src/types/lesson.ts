// ─── Lesson content blocks ────────────────────────────────────────────────────

/**
 * A single concept card shown during the Explain phase.
 * Based on CLT (Cognitive Load Theory): one concept per card, minimal split-attention.
 */
export interface ConceptCard {
  title: string;
  /** Main explanation text. Use \n for line breaks. */
  body: string;
  /** Displayed prominently — the rule or formula. */
  formula?: string;
  /** Concrete illustration shown below the formula. */
  example?: string;
}

/**
 * One step of a fully worked example.
 * Mirrors the "worked example effect" from Sweller (1988).
 */
export interface WorkedStep {
  /** What we do: "Soustraire 6 des deux membres" */
  action: string;
  /** The resulting expression: "4x = 16" */
  result: string;
}

export interface WorkedExample {
  /** The problem statement: "4x + 6 = 22" */
  problem: string;
  steps: WorkedStep[];
  /** Optional verification shown after all steps. */
  check?: string;
}

// ─── Exercise ─────────────────────────────────────────────────────────────────

export interface LessonExercise {
  id: string;
  difficulty: 1 | 2 | 3;
  /** The equation / expression displayed to the user. */
  prompt: string;
  /** The numeric answer. */
  answer: number;
  /**
   * Scaffolding hint — only shown after ≥ 2 wrong attempts.
   * Implements "desirable difficulties" (Bjork, 1994).
   */
  hint?: string;
  /** Step-by-step solution shown after a correct answer (confirmation). */
  solutionSteps?: string[];
}

// ─── Lesson definition contract ───────────────────────────────────────────────

export interface ILessonDef {
  readonly id: string;
  readonly title: string;
  readonly icon: string;
  readonly description: string;
  /** Estimated minutes for a first session. */
  readonly estimatedMin: number;
  readonly concepts: ConceptCard[];
  readonly workedExample: WorkedExample;
  generateExercise(difficulty: 1 | 2 | 3): LessonExercise;
  validate(exercise: LessonExercise, rawAnswer: string): boolean;
}

// ─── Runtime lesson state ─────────────────────────────────────────────────────

/** Four phases — mirrors Merrill's First Principles of Instruction. */
export type LessonPhase = 'concepts' | 'worked' | 'practice' | 'complete';

export interface LessonProgress {
  readonly lessonId: string;
  readonly phase: LessonPhase;
  /** Current concept card index (phase = 'concepts'). */
  readonly conceptIndex: number;
  /** How many worked-example steps have been revealed. */
  readonly revealedSteps: number;
  readonly currentExercise: LessonExercise | null;
  /**
   * Consecutive correct answers — mastery is declared at MASTERY_STREAK.
   * Implements "mastery learning" (Bloom, 1968).
   */
  readonly streak: number;
  /** Wrong attempts on the current exercise (drives hint reveal). */
  readonly wrongAttempts: number;
  readonly totalCorrect: number;
  readonly totalAttempts: number;
  /** Current adaptive difficulty level. */
  readonly difficulty: 1 | 2 | 3;
  readonly feedback: 'idle' | 'correct' | 'wrong';
  readonly showHint: boolean;
  /** Show solution steps after a correct answer. */
  readonly showSolution: boolean;
}

// ─── Spaced repetition ────────────────────────────────────────────────────────

/**
 * Persisted review record — one per lesson.
 * Drives the SM-2 algorithm (Wozniak, 1987).
 */
export interface ReviewRecord {
  lessonId: string;
  /** Unix ms of last completed session. */
  lastReview: number;
  /** Unix ms of the next scheduled review. */
  nextReview: number;
  /** Interval in days before next review. */
  interval: number;
  /** SM-2 ease factor (starts at 2.5, floors at 1.3). */
  easeFactor: number;
  /** Total completed sessions. */
  repetitions: number;
  /** Accuracy of the last session (0–1). */
  accuracy: number;
}
