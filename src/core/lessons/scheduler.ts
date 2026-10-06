import type { ReviewRecord } from '../../types/lesson';

const STORAGE_KEY = 'entrainement-math:reviews';

function load(): Record<string, ReviewRecord> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, ReviewRecord>;
  } catch {
    return {};
  }
}

function save(records: Record<string, ReviewRecord>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch { /* Storage quota — silently degrade */ }
}

/**
 * LessonScheduler — SM-2 spaced repetition (Wozniak 1987).
 *
 * Grade q is derived from session accuracy (0–5 scale):
 *   5 = perfect recall   → long interval
 *   0 = complete failure → reset to day 1
 *
 * Ease factor EF controls how fast the interval grows.
 * New items start at EF = 2.5.
 *
 * Interval schedule:
 *   Rep 1 → 1 day
 *   Rep 2 → 3 days
 *   Rep n → round(prev_interval × EF)
 */
export const LessonScheduler = {
  record(lessonId: string, accuracy: number): void {
    const records = load();
    const prev = records[lessonId];

    // Map accuracy (0–1) to SM-2 quality grade (0–5)
    const q = Math.round(accuracy * 5);

    // Update ease factor (EF stays ≥ 1.3)
    const ef = prev
      ? Math.max(1.3, prev.easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
      : 2.5;

    const reps = prev ? prev.repetitions + 1 : 1;
    const prevInterval = prev?.interval ?? 1;
    const interval =
      reps === 1 ? 1
      : reps === 2 ? 3
      : Math.round(prevInterval * ef);

    const now = Date.now();
    records[lessonId] = {
      lessonId,
      lastReview: now,
      nextReview: now + interval * 86_400_000,
      interval,
      easeFactor: ef,
      repetitions: reps,
      accuracy,
    };
    save(records);
  },

  get(lessonId: string): ReviewRecord | null {
    return load()[lessonId] ?? null;
  },

  hasCompleted(lessonId: string): boolean {
    return !!load()[lessonId];
  },

  /** Returns days until next review, or null if never completed. */
  daysUntilReview(lessonId: string): number | null {
    const r = LessonScheduler.get(lessonId);
    if (!r) return null;
    return Math.max(0, Math.ceil((r.nextReview - Date.now()) / 86_400_000));
  },

  isDue(lessonId: string): boolean {
    const r = LessonScheduler.get(lessonId);
    return r ? Date.now() >= r.nextReview : true;
  },
};
