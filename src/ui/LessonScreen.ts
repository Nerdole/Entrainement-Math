import type { GameStore } from '../store/GameStore';
import type { LessonProgress } from '../types/lesson';
import { LessonEngine } from '../core/lessons/LessonEngine';
import { LessonScheduler } from '../core/lessons/scheduler';
import { equations1Lesson }       from '../core/lessons/definitions/equations1';
import { factorisationLesson }     from '../core/lessons/definitions/factorisation';
import { fractionsLesson }         from '../core/lessons/definitions/fractions';
import { puissancesLesson }        from '../core/lessons/definitions/puissances';
import { pgcdLesson }              from '../core/lessons/definitions/pgcd';
import { proportionnaliteLesson }  from '../core/lessons/definitions/proportionnalite';
import type { ILessonDef } from '../types/lesson';

// ─── Lesson registry ──────────────────────────────────────────────────────────
// Add new lessons here — no other file needs to change.

const LESSON_REGISTRY: Record<string, ILessonDef> = {
  'equations-1':       equations1Lesson,
  'factorisation':     factorisationLesson,
  'fractions':         fractionsLesson,
  'puissances':        puissancesLesson,
  'pgcd':              pgcdLesson,
  'proportionnalite':  proportionnaliteLesson,
};

const MASTERY_STREAK = 5;

// ─── LessonScreen ─────────────────────────────────────────────────────────────

/**
 * LessonScreen — renders all four lesson phases in a single container.
 *
 * Rendering strategy:
 *   • Full re-render when the phase, concept card, or exercise changes.
 *   • Surgical DOM update (within practice phase) for feedback/hint/streak.
 *
 * Phase flow:
 *   concepts  →  worked  →  practice  →  complete
 *   (explain)    (model)    (retrieve)   (reward)
 */
export class LessonScreen {
  private engine: LessonEngine;
  private unsubEngine: (() => void) | null = null;

  // Tracks the last rendered structural state to decide full vs. partial render
  private lastPhase: string | null = null;
  private lastConceptIndex = -1;
  private lastRevealedSteps = -1;
  private lastExerciseId: string | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly store: GameStore,
  ) {
    const lessonId = store.getState().activeLessonId ?? 'equations-1';
    const def = LESSON_REGISTRY[lessonId] ?? equations1Lesson;
    this.engine = new LessonEngine(def);
    this.mountShell();
    this.unsubEngine = this.engine.subscribe(p => this.onProgress(p));
    this.onProgress(this.engine.getProgress());
  }

  // ── Shell (mounted once) ──────────────────────────────────────────────────

  private mountShell(): void {
    this.root.innerHTML = `
      <button class="back-btn" id="back-btn" aria-label="Retour" title="Retour aux leçons">←</button>
      <div class="lesson-wrapper">
        <div class="lesson-outer">
          <div class="lesson-phase-track" id="lesson-phase-track"></div>
          <div id="lesson-main"></div>
        </div>
      </div>
    `;
    this.root
      .querySelector<HTMLButtonElement>('#back-btn')!
      .addEventListener('click', () => this.store.setState({ screen: 'learn' }));
  }

  // ── Progress handler ──────────────────────────────────────────────────────

  private onProgress(p: LessonProgress): void {
    this.renderPhaseTrack(p);

    const structureChanged =
      p.phase !== this.lastPhase ||
      p.conceptIndex !== this.lastConceptIndex ||
      p.revealedSteps !== this.lastRevealedSteps ||
      p.currentExercise?.id !== this.lastExerciseId;

    this.lastPhase = p.phase;
    this.lastConceptIndex = p.conceptIndex;
    this.lastRevealedSteps = p.revealedSteps;
    this.lastExerciseId = p.currentExercise?.id ?? null;

    if (structureChanged) {
      this.renderPhaseContent(p);
    } else if (p.phase === 'practice') {
      this.patchPractice(p);
    }
  }

  // ── Phase track (top progress indicator) ─────────────────────────────────

  private renderPhaseTrack(p: LessonProgress): void {
    const el = this.root.querySelector<HTMLElement>('#lesson-phase-track');
    if (!el) return;

    const phases = ['concepts', 'worked', 'practice'] as const;
    const labels = ['Concepts', 'Exemple', 'Pratique'];
    const currentIdx = phases.indexOf(p.phase as typeof phases[number]);

    el.innerHTML = phases.map((_ph, i) => `
      <div class="phase-step ${i < currentIdx ? 'done' : i === currentIdx ? 'active' : ''}">
        <div class="phase-dot-outer">
          <span class="phase-dot-inner">${i < currentIdx ? '✓' : i + 1}</span>
        </div>
        <span class="phase-label">${labels[i]}</span>
      </div>
      ${i < phases.length - 1
        ? `<div class="phase-connector${i < currentIdx ? ' done' : ''}"></div>`
        : ''}
    `).join('');
  }

  // ── Phase content router ──────────────────────────────────────────────────

  private renderPhaseContent(p: LessonProgress): void {
    const main = this.root.querySelector<HTMLElement>('#lesson-main');
    if (!main) return;
    const def = this.engine.getDef();

    switch (p.phase) {
      case 'concepts':   this.renderConcepts(main, p, def);   break;
      case 'worked':     this.renderWorked(main, p, def);     break;
      case 'practice':   this.renderPractice(main, p);        break;
      case 'complete':   this.renderComplete(main, p);        break;
    }
  }

  // ── Phase: Concepts ───────────────────────────────────────────────────────

  private renderConcepts(
    main: HTMLElement,
    p: LessonProgress,
    def: Readonly<ILessonDef>,
  ): void {
    const card = def.concepts[p.conceptIndex];
    const isLast = p.conceptIndex === def.concepts.length - 1;

    main.innerHTML = `
      <div class="concept-card animate-in">
        <div class="concept-counter">${p.conceptIndex + 1} / ${def.concepts.length}</div>
        <h2 class="concept-title">${card.title}</h2>
        <p class="concept-body">${card.body.replace(/\n/g, '<br>')}</p>
        ${card.formula ? `<div class="concept-formula">${card.formula}</div>` : ''}
        ${card.example ? `<pre class="concept-example">${card.example}</pre>` : ''}
      </div>
      <div class="lesson-nav">
        ${p.conceptIndex > 0
          ? '<button class="lesson-btn" id="prev-btn">← Précédent</button>'
          : '<span></span>'}
        <button class="lesson-btn lesson-btn--primary" id="next-btn">
          ${isLast ? "Voir l'exemple →" : 'Suivant →'}
        </button>
      </div>
    `;

    main.querySelector('#next-btn')!.addEventListener('click', () => this.engine.nextConcept());
    main.querySelector('#prev-btn')?.addEventListener('click', () => this.engine.prevConcept());
  }

  // ── Phase: Worked example ─────────────────────────────────────────────────

  private renderWorked(
    main: HTMLElement,
    p: LessonProgress,
    def: Readonly<ILessonDef>,
  ): void {
    const { steps, problem, check } = def.workedExample;
    const totalSlots = steps.length + (check ? 1 : 0);
    const allRevealed = p.revealedSteps >= totalSlots;

    const stepsHTML = steps
      .slice(0, p.revealedSteps)
      .map(s => `
        <div class="worked-step animate-in">
          <div class="worked-action">${s.action}</div>
          <div class="worked-result">${s.result}</div>
        </div>
      `)
      .join('');

    const checkHTML =
      check && p.revealedSteps > steps.length
        ? `<div class="worked-check animate-in">${check}</div>`
        : '';

    main.innerHTML = `
      <div class="worked-card animate-in">
        <p class="worked-subtitle">Exemple résolu étape par étape</p>
        <div class="worked-problem">${problem}</div>
        <div class="worked-steps">${stepsHTML}${checkHTML}</div>
        <button class="lesson-btn lesson-btn--primary" id="reveal-btn">
          ${allRevealed
            ? 'Commencer la pratique →'
            : `Révéler l'étape ${p.revealedSteps + 1} / ${totalSlots}`}
        </button>
      </div>
    `;

    main.querySelector('#reveal-btn')!.addEventListener('click', () =>
      this.engine.revealNextStep(),
    );
  }

  // ── Phase: Practice ───────────────────────────────────────────────────────

  private renderPractice(main: HTMLElement, p: LessonProgress): void {
    main.innerHTML = this.buildPracticeHTML(p);
    this.bindPracticeEvents(main);
  }

  private buildPracticeHTML(p: LessonProgress): string {
    const exercise = p.currentExercise!;

    const streakDots = Array.from({ length: MASTERY_STREAK }, (_, i) =>
      `<span class="streak-dot${i < p.streak ? ' filled' : ''}">${i < p.streak ? '●' : '○'}</span>`,
    ).join('');

    const diffLabels: Record<number, string> = { 1: 'Niveau 1', 2: 'Niveau 2', 3: 'Niveau 3' };

    const solutionHTML =
      p.showSolution && exercise.solutionSteps?.length
        ? `<div class="solution-box animate-in">
            ${exercise.solutionSteps.map(s => `<div class="solution-step">${s}</div>`).join('')}
          </div>`
        : '';

    const hintHTML =
      p.showHint && exercise.hint
        ? `<div class="hint-box animate-in">${exercise.hint.replace(/\n/g, '<br>')}</div>`
        : '';

    const hintBtnHTML =
      !p.showHint && !p.showSolution
        ? `<button class="hint-link" id="hint-btn">💡 Voir un indice</button>`
        : '';

    const disabled = p.feedback !== 'idle';

    return `
      <div class="practice-area">
        <div class="practice-meta">
          <span class="streak-track" aria-label="Série ${p.streak}/${MASTERY_STREAK}">
            ${streakDots}
          </span>
          <span class="diff-label">${diffLabels[p.difficulty]}</span>
        </div>

        <div class="practice-prompt">
          <span class="prompt-label">Résous</span>
          <span class="practice-equation${p.feedback !== 'idle' ? ` ${p.feedback}` : ''}" id="practice-eq">
            ${exercise.prompt}
          </span>
        </div>

        <div class="input-row practice-input-row">
          <span class="x-label">x =</span>
          <input
            id="answer-input"
            class="answer-input"
            type="number"
            inputmode="numeric"
            placeholder="?"
            autocomplete="off"
            aria-label="Votre réponse"
            ${disabled ? 'disabled' : ''}
          />
          <button class="submit-btn" id="submit-btn" aria-label="Valider" ${disabled ? 'disabled' : ''}>→</button>
        </div>

        ${solutionHTML}
        ${hintHTML}
        ${hintBtnHTML}
      </div>
    `;
  }

  private bindPracticeEvents(container: HTMLElement): void {
    const input = container.querySelector<HTMLInputElement>('#answer-input');
    if (!input) return;
    if (!input.disabled) input.focus();

    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') this.submitAnswer();
    });

    container
      .querySelector('#submit-btn')!
      .addEventListener('click', () => this.submitAnswer());

    container
      .querySelector('#hint-btn')
      ?.addEventListener('click', () => this.engine.requestHint());
  }

  private submitAnswer(): void {
    const input = this.root.querySelector<HTMLInputElement>('#answer-input');
    if (!input) return;
    const raw = input.value.trim();
    if (raw === '') return;
    this.engine.submitAnswer(raw);
    input.value = '';
  }

  /**
   * Surgical DOM patch for practice phase.
   * Only called when the exercise hasn't changed (feedback/hint/streak update).
   */
  private patchPractice(p: LessonProgress): void {
    const main = this.root.querySelector<HTMLElement>('#lesson-main');
    if (!main) return;

    // Equation color
    const eqEl = main.querySelector<HTMLElement>('#practice-eq');
    if (eqEl) {
      eqEl.className = `practice-equation${p.feedback !== 'idle' ? ` ${p.feedback}` : ''}`;
    }

    // Streak dots
    const streakEl = main.querySelector<HTMLElement>('.streak-track');
    if (streakEl) {
      streakEl.innerHTML = Array.from({ length: MASTERY_STREAK }, (_, i) =>
        `<span class="streak-dot${i < p.streak ? ' filled' : ''}">${i < p.streak ? '●' : '○'}</span>`,
      ).join('');
    }

    // Input / button enabled state
    const input = main.querySelector<HTMLInputElement>('#answer-input');
    const submitBtn = main.querySelector<HTMLButtonElement>('#submit-btn');
    const isIdle = p.feedback === 'idle';
    if (input) input.disabled = !isIdle;
    if (submitBtn) submitBtn.disabled = !isIdle;
    if (isIdle) input?.focus();

    const practiceArea = main.querySelector<HTMLElement>('.practice-area');
    if (!practiceArea) return;

    const inputRow = practiceArea.querySelector<HTMLElement>('.practice-input-row');

    // Solution box (insert after input row on correct answer)
    if (p.showSolution && !practiceArea.querySelector('.solution-box') && p.currentExercise?.solutionSteps?.length) {
      const box = document.createElement('div');
      box.className = 'solution-box animate-in';
      box.innerHTML = p.currentExercise.solutionSteps
        .map(s => `<div class="solution-step">${s}</div>`)
        .join('');
      inputRow?.insertAdjacentElement('afterend', box);
      practiceArea.querySelector('#hint-btn')?.remove();
    }

    // Hint box (insert after input row on wrong answer ≥ 2)
    if (p.showHint && !practiceArea.querySelector('.hint-box') && p.currentExercise?.hint) {
      const box = document.createElement('div');
      box.className = 'hint-box animate-in';
      box.innerHTML = p.currentExercise.hint.replace(/\n/g, '<br>');
      // Insert after solution-box if present, else after input row
      const anchor = practiceArea.querySelector('.solution-box') ?? inputRow;
      anchor?.insertAdjacentElement('afterend', box);
      practiceArea.querySelector('#hint-btn')?.remove();
    }
  }

  // ── Phase: Complete ───────────────────────────────────────────────────────

  private renderComplete(main: HTMLElement, p: LessonProgress): void {
    const accuracy = p.totalAttempts > 0 ? p.totalCorrect / p.totalAttempts : 1;
    const pct = Math.round(accuracy * 100);
    const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1;
    const grade = pct >= 90 ? 'Excellent !' : pct >= 70 ? 'Très bien !' : pct >= 50 ? 'Bien !' : 'Continue !';

    const review = LessonScheduler.get(p.lessonId);
    const nextDays = review
      ? Math.max(0, Math.ceil((review.nextReview - Date.now()) / 86_400_000))
      : 1;
    const reviewLabel =
      nextDays <= 0
        ? 'Révision disponible maintenant'
        : `Prochaine révision dans ${nextDays} jour${nextDays > 1 ? 's' : ''}`;

    const starsHTML = Array.from({ length: 3 }, (_, i) =>
      `<span class="mastery-star${i < stars ? ' lit' : ''}">${i < stars ? '★' : '☆'}</span>`,
    ).join('');

    main.innerHTML = `
      <div class="mastery-card animate-in">
        <div class="mastery-stars">${starsHTML}</div>
        <div class="mastery-grade">${grade}</div>
        <div class="mastery-big">
          ${p.totalCorrect}<span class="mastery-denom"> / ${p.totalAttempts}</span>
        </div>
        <div class="mastery-label">${pct}&thinsp;% de précision</div>
        <div class="mastery-review">${reviewLabel}</div>
        <div class="mastery-actions">
          <button class="results-btn results-btn--primary" id="retry-btn">Recommencer</button>
          <button class="results-btn" id="back-lessons-btn">Retour aux leçons</button>
        </div>
      </div>
    `;

    const def = this.engine.getDef();

    main.querySelector('#retry-btn')!.addEventListener('click', () => {
      this.engine.destroy();
      this.engine = new LessonEngine(def);
      this.unsubEngine?.();
      // Reset render state
      this.lastPhase = null;
      this.lastConceptIndex = -1;
      this.lastRevealedSteps = -1;
      this.lastExerciseId = null;
      this.unsubEngine = this.engine.subscribe(pr => this.onProgress(pr));
      this.onProgress(this.engine.getProgress());
    });

    main.querySelector('#back-lessons-btn')!.addEventListener('click', () => {
      this.store.setState({ screen: 'learn' });
    });
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  destroy(): void {
    this.unsubEngine?.();
    this.unsubEngine = null;
    this.engine.destroy();
  }
}
