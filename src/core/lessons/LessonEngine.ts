import type { ILessonDef, LessonProgress } from '../../types/lesson';
import { LessonScheduler } from './scheduler';

/**
 * Mastery criterion: N consecutive correct answers.
 * Based on Bloom's mastery learning (1968) and Ericsson's deliberate practice.
 */
const MASTERY_STREAK = 5;

/** Safety cap — declare mastery anyway after this many attempts. */
const MAX_EXERCISES = 30;

/**
 * LessonEngine — framework-agnostic orchestrator for a lesson session.
 *
 * Implements:
 *   • 4-phase sequence: Concepts → Worked Example → Practice → Complete
 *   • Adaptive difficulty (1 → 2 → 3) based on streak + accuracy
 *   • Hint gating: scaffolding only revealed after ≥ 2 wrong attempts
 *     (desirable difficulties, Bjork 1994)
 *   • Mastery-based advancement (Bloom 1968)
 *   • SM-2 spaced repetition scheduling on session complete
 *   • Observable state for UI binding (subscribe/emit)
 */
export class LessonEngine {
  private progress: LessonProgress;
  private listeners: Array<(p: LessonProgress) => void> = [];
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly def: ILessonDef) {
    this.progress = {
      lessonId: def.id,
      phase: 'concepts',
      conceptIndex: 0,
      revealedSteps: 0,
      currentExercise: null,
      streak: 0,
      wrongAttempts: 0,
      totalCorrect: 0,
      totalAttempts: 0,
      difficulty: 1,
      feedback: 'idle',
      showHint: false,
      showSolution: false,
    };
  }

  getProgress(): Readonly<LessonProgress> { return this.progress; }
  getDef(): Readonly<ILessonDef> { return this.def; }

  subscribe(fn: (p: LessonProgress) => void): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private patch(delta: Partial<LessonProgress>): void {
    this.progress = { ...this.progress, ...delta };
    [...this.listeners].forEach(l => l(this.progress));
  }

  // ── Phase: Concepts ───────────────────────────────────────────────────────

  nextConcept(): void {
    const { conceptIndex } = this.progress;
    if (conceptIndex < this.def.concepts.length - 1) {
      this.patch({ conceptIndex: conceptIndex + 1 });
    } else {
      // Transition to worked example phase
      this.patch({ phase: 'worked', revealedSteps: 0 });
    }
  }

  prevConcept(): void {
    if (this.progress.conceptIndex > 0) {
      this.patch({ conceptIndex: this.progress.conceptIndex - 1 });
    }
  }

  // ── Phase: Worked Example ─────────────────────────────────────────────────

  /**
   * Reveal one step at a time.
   * Step-by-step reveal leverages the worked example effect (Sweller 1988):
   * reduces extraneous cognitive load vs. presenting everything at once.
   */
  revealNextStep(): void {
    const { revealedSteps } = this.progress;
    const { steps, check } = this.def.workedExample;
    const totalSlots = steps.length + (check ? 1 : 0);

    if (revealedSteps < totalSlots) {
      this.patch({ revealedSteps: revealedSteps + 1 });
    } else {
      // All revealed — enter practice
      this.enterPractice();
    }
  }

  // ── Phase: Practice ───────────────────────────────────────────────────────

  private enterPractice(): void {
    const exercise = this.def.generateExercise(1);
    this.patch({
      phase: 'practice',
      currentExercise: exercise,
      streak: 0,
      difficulty: 1,
      feedback: 'idle',
      showHint: false,
      showSolution: false,
      totalCorrect: 0,
      totalAttempts: 0,
      wrongAttempts: 0,
    });
  }

  /**
   * Submit an answer.
   *
   * Correct path:
   *   feedback=correct → (800ms) → next exercise or complete
   *
   * Wrong path:
   *   feedback=wrong → stays on same exercise
   *   After ≥ 2 wrong: hint revealed automatically
   */
  submitAnswer(raw: string): void {
    const { currentExercise, feedback } = this.progress;
    if (!currentExercise || feedback !== 'idle') return;

    const isCorrect = this.def.validate(currentExercise, raw);
    const newAttempts = this.progress.totalAttempts + 1;
    const newCorrect = this.progress.totalCorrect + (isCorrect ? 1 : 0);
    const newWrong = isCorrect ? 0 : this.progress.wrongAttempts + 1;
    const newStreak = isCorrect ? this.progress.streak + 1 : 0;

    this.patch({
      feedback: isCorrect ? 'correct' : 'wrong',
      totalAttempts: newAttempts,
      totalCorrect: newCorrect,
      wrongAttempts: newWrong,
      streak: newStreak,
      // Hint auto-reveal: scaffolding only after repeated failure (desirable difficulty)
      showHint: !isCorrect && newWrong >= 2,
      showSolution: isCorrect,
    });

    if (!isCorrect) return;

    // Schedule next exercise or mastery completion
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    const mastered = newStreak >= MASTERY_STREAK || newAttempts >= MAX_EXERCISES;

    this.feedbackTimer = setTimeout(() => {
      this.feedbackTimer = null;
      if (mastered) {
        // Record session for SM-2 spaced repetition
        LessonScheduler.record(this.def.id, newCorrect / newAttempts);
        this.patch({ phase: 'complete', feedback: 'idle', showSolution: false });
      } else {
        // Adaptive difficulty: advance when performance warrants it
        const nextDiff = this.adaptDifficulty(newStreak, newCorrect, newAttempts);
        const next = this.def.generateExercise(nextDiff);
        this.patch({
          feedback: 'idle',
          currentExercise: next,
          difficulty: nextDiff,
          showHint: false,
          showSolution: false,
          wrongAttempts: 0,
        });
      }
    }, 800);
  }

  /** Manually request the hint before the 2-wrong-attempt threshold. */
  requestHint(): void {
    this.patch({ showHint: true });
  }

  /**
   * Adaptive difficulty (Zone of Proximal Development, Vygotsky 1978):
   *   Level 3: streak ≥ 4 AND accuracy ≥ 80%
   *   Level 2: streak ≥ 2 AND accuracy ≥ 65%
   *   Level 1: default
   */
  private adaptDifficulty(streak: number, correct: number, total: number): 1 | 2 | 3 {
    const acc = total > 0 ? correct / total : 1;
    if (streak >= 4 && acc >= 0.8) return 3;
    if (streak >= 2 && acc >= 0.65) return 2;
    return 1;
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  destroy(): void {
    if (this.feedbackTimer) {
      clearTimeout(this.feedbackTimer);
      this.feedbackTimer = null;
    }
    this.listeners = [];
  }
}
