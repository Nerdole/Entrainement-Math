import type { GameState, Operation } from '../types';
import type { ExerciseEngine } from '../core/ExerciseEngine';
import type { GameStore } from '../store/GameStore';

const SPRINT_DURATION_S = 120;

const OP_SYMBOL: Record<Operation, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
};

export class SprintScreen {
  private remaining = SPRINT_DURATION_S;
  private ticker: ReturnType<typeof setInterval> | null = null;
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly store: GameStore,
    private readonly engine: ExerciseEngine,
  ) {
    this.mount();
    this.unsubscribe = this.store.subscribe(state => this.update(state));
    this.nextExercise();
    this.startTimer();
  }

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  private mount(): void {
    this.root.innerHTML = `
      <button class="back-btn" id="back-btn" aria-label="Accueil" title="Retour à l'accueil">←</button>
      <header class="score" id="score" aria-live="polite">0 / 0</header>

      <div class="sprint-timer" id="timer" aria-live="polite" aria-label="Temps restant">2:00</div>

      <main class="exercise-card">
        <span class="feedback-badge" id="badge" aria-hidden="true"></span>
        <p class="exercise-expression" id="expression" aria-live="assertive">—</p>
        <div class="input-row">
          <input
            id="answer-input"
            class="answer-input"
            type="number"
            inputmode="numeric"
            placeholder="?"
            autocomplete="off"
            aria-label="Votre réponse"
          />
          <button class="submit-btn" id="submit-btn" aria-label="Valider">→</button>
        </div>
      </main>
    `;
    this.bindEvents();
  }

  private bindEvents(): void {
    const input = this.q<HTMLInputElement>('#answer-input');

    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') this.handleSubmit();
    });

    input.addEventListener('input', () => {
      if (this.store.getState().feedback === 'wrong') {
        this.store.setState({ feedback: 'idle' });
      }
    });

    this.q<HTMLButtonElement>('#submit-btn').addEventListener('click', () => this.handleSubmit());

    this.q<HTMLButtonElement>('#back-btn').addEventListener('click', () => {
      this.cleanup();
      this.store.setState({
        screen: 'home',
        feedback: 'idle',
        score: { correct: 0, total: 0 },
        currentExercise: null,
      });
    });
  }

  // ── Timer ─────────────────────────────────────────────────────────────────

  private startTimer(): void {
    this.ticker = setInterval(() => {
      this.remaining -= 1;
      this.renderTimer();
      if (this.remaining <= 0) this.endSprint();
    }, 1000);
  }

  private renderTimer(): void {
    const el = this.root.querySelector<HTMLElement>('#timer');
    if (!el) return;
    const m = Math.floor(this.remaining / 60);
    const s = this.remaining % 60;
    el.textContent = `${m}:${String(s).padStart(2, '0')}`;
    el.classList.toggle('sprint-timer--urgent', this.remaining <= 30);
  }

  private endSprint(): void {
    this.cleanup();
    const { score } = this.store.getState();
    this.store.setState({
      screen: 'results',
      feedback: 'idle',
      lastSprintResult: {
        correct: score.correct,
        total: score.total,
        date: new Date().toISOString(),
      },
    });
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  private handleSubmit(): void {
    if (this.remaining <= 0) return;
    const input = this.q<HTMLInputElement>('#answer-input');
    const raw = input.value.trim();
    if (raw === '') return;
    const userAnswer = parseInt(raw, 10);
    if (isNaN(userAnswer)) return;

    const { currentExercise } = this.store.getState();
    if (!currentExercise) return;

    const isCorrect = this.engine.validate(currentExercise, userAnswer);

    this.store.setState(s => ({
      feedback: isCorrect ? 'correct' : 'wrong',
      score: {
        correct: s.score.correct + (isCorrect ? 1 : 0),
        total: s.score.total + 1,
      },
    }));

    input.value = '';

    if (isCorrect) {
      if (this.feedbackTimer !== null) clearTimeout(this.feedbackTimer);
      this.feedbackTimer = setTimeout(() => {
        this.feedbackTimer = null;
        this.store.setState({ feedback: 'idle' });
        this.nextExercise();
      }, 400);
    } else {
      input.focus();
    }
  }

  private nextExercise(): void {
    try {
      const exercise = this.engine.generate(this.store.getState().config);
      this.store.setState({ currentExercise: exercise, feedback: 'idle' });
      this.q<HTMLInputElement>('#answer-input').focus();
    } catch { /* noop — config guard prevents this */ }
  }

  // ── Reactive update ───────────────────────────────────────────────────────

  private update(state: GameState): void {
    const scoreEl = this.root.querySelector<HTMLElement>('#score');
    if (scoreEl) scoreEl.textContent = `${state.score.correct} / ${state.score.total}`;

    const badgeEl = this.root.querySelector<HTMLElement>('#badge');
    if (badgeEl) {
      if (state.feedback === 'correct') {
        badgeEl.textContent = 'V'; badgeEl.className = 'feedback-badge correct';
      } else if (state.feedback === 'wrong') {
        badgeEl.textContent = 'R'; badgeEl.className = 'feedback-badge wrong';
      } else {
        badgeEl.textContent = ''; badgeEl.className = 'feedback-badge';
      }
    }

    const exprEl = this.root.querySelector<HTMLElement>('#expression');
    if (exprEl && state.currentExercise) {
      const { operandA, operandB, operation } = state.currentExercise;
      exprEl.textContent = `${operandA} ${OP_SYMBOL[operation]} ${operandB} = ?`;
      exprEl.className = `exercise-expression${state.feedback !== 'idle' ? ` ${state.feedback}` : ''}`;
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  private cleanup(): void {
    if (this.ticker !== null) { clearInterval(this.ticker); this.ticker = null; }
    if (this.feedbackTimer !== null) { clearTimeout(this.feedbackTimer); this.feedbackTimer = null; }
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  destroy(): void { this.cleanup(); }

  private q<T extends Element>(selector: string): T {
    const el = this.root.querySelector<T>(selector);
    if (!el) throw new Error(`"${selector}" not found in SprintScreen`);
    return el;
  }
}
