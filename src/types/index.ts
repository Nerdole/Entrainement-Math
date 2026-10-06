// ─── Primitives ──────────────────────────────────────────────────────────────

/** The four basic arithmetic operations. Add new operations here to extend. */
export type Operation = '+' | '-' | '*' | '/';

/** Training mode selected on the home screen. */
export type GameMode = 'free' | 'sprint' | 'learn';

/** Which screen is currently displayed. */
export type Screen = 'home' | 'game' | 'sprint' | 'results' | 'learn' | 'lesson';

/** Result of a finished sprint session. */
export interface SprintResult {
  readonly correct: number;
  readonly total: number;
  /** ISO 8601 date string. */
  readonly date: string;
}

// ─── Domain model ────────────────────────────────────────────────────────────

/**
 * A single exercise presented to the user.
 * Immutable by design: generate a new one rather than mutating.
 */
export interface Exercise {
  readonly id: string;
  readonly operandA: number;
  readonly operandB: number;
  readonly operation: Operation;
  readonly correctAnswer: number;
}

// ─── Configuration ───────────────────────────────────────────────────────────

/**
 * Runtime configuration chosen by the user.
 * Pure data — no methods.
 */
export interface GameConfig {
  /** Operations currently active. At least one must be present. */
  readonly operations: readonly Operation[];
  /** Upper bound for operands (1 … maxTable). Range: 1–10. */
  readonly maxTable: number;
}

// ─── Application state ───────────────────────────────────────────────────────

export interface Score {
  readonly correct: number;
  readonly total: number;
}

/** Immediate feedback shown after the user submits an answer. */
export type Feedback = 'idle' | 'correct' | 'wrong';

/**
 * Single source of truth for the whole application.
 * All fields are read-only; produce a new state object to update.
 */
export interface GameState {
  readonly screen: Screen;
  readonly mode: GameMode;
  readonly currentExercise: Exercise | null;
  readonly score: Score;
  readonly config: GameConfig;
  readonly feedback: Feedback;
  readonly lastSprintResult: SprintResult | null;
  /** ID of the lesson currently being studied. */
  readonly activeLessonId: string | null;
}
