import type { GameState, Operation } from '../types';
import type { ExerciseEngine } from '../core/ExerciseEngine';
import type { GameStore } from '../store/GameStore';

// ─── Display helpers ─────────────────────────────────────────────────────────

const OP_SYMBOL: Record<Operation, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
};

const ALL_OPS: Operation[] = ['+', '-', '*', '/'];

// ─── App ─────────────────────────────────────────────────────────────────────

/**
 * App — the only UI layer.
 *
 * Responsibilities:
 *   • Render the initial HTML skeleton into `root`.
 *   • Bind all DOM event listeners once (not on every re-render).
 *   • React to store updates by patching only the changed DOM nodes.
 *
 * It has zero knowledge of how exercises are generated or validated —
 * that lives in ExerciseEngine.
 */
export class App {
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
  }

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  private mount(): void {
    this.root.innerHTML = this.buildSkeleton();
    this.bindEvents();
  }

  private buildSkeleton(): string {
    const { config } = this.store.getState();

    const opButtons = ALL_OPS.map(
      op => `<button
          class="op-toggle${config.operations.includes(op) ? ' active' : ''}"
          data-op="${op}"
          aria-label="${op}"
          aria-pressed="${config.operations.includes(op)}"
        >${OP_SYMBOL[op]}</button>`,
    ).join('');

    const tableOptions = Array.from({ length: 10 }, (_, i) => i + 1)
      .map(
        n =>
          `<option value="${n}"${n === config.maxTable ? ' selected' : ''}>${n}</option>`,
      )
      .join('');

    return `
      <button class="back-btn" id="back-btn" aria-label="Accueil" title="Retour à l'accueil">←</button>
      <header class="score" id="score" aria-live="polite">0 / 0</header>

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

      <footer class="config" role="group" aria-label="Configuration">
        <div class="ops-group" id="ops-group">${opButtons}</div>
        <div class="range-group">
          <label class="range-label" for="max-table">Tables jusqu'à</label>
          <select class="range-select" id="max-table">${tableOptions}</select>
        </div>
      </footer>
    `;
  }

  // ── Event binding (once) ───────────────────────────────────────────────────

  private bindEvents(): void {
    const input = this.q<HTMLInputElement>('#answer-input');
    const submitBtn = this.q<HTMLButtonElement>('#submit-btn');
    const opsGroup = this.q<HTMLElement>('#ops-group');
    const maxTableSel = this.q<HTMLSelectElement>('#max-table');

    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') this.handleSubmit();
    });

    // Reset the badge as soon as the user starts typing after a wrong answer
    input.addEventListener('input', () => {
      if (this.store.getState().feedback === 'wrong') {
        this.store.setState({ feedback: 'idle' });
      }
    });

    submitBtn.addEventListener('click', () => this.handleSubmit());

    // Event delegation — handles all op buttons via one listener
    opsGroup.addEventListener('click', (e: Event) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.op-toggle');
      if (btn?.dataset.op) this.handleOpToggle(btn.dataset.op as Operation);
    });

    maxTableSel.addEventListener('change', () => {
      const value = parseInt(maxTableSel.value, 10);
      this.store.setState(s => ({ config: { ...s.config, maxTable: value } }));
      this.nextExercise();
    });

    this.q<HTMLButtonElement>('#back-btn').addEventListener('click', () => {
      if (this.feedbackTimer !== null) {
        clearTimeout(this.feedbackTimer);
        this.feedbackTimer = null;
      }
      this.store.setState({
        screen: 'home',
        feedback: 'idle',
        score: { correct: 0, total: 0 },
        currentExercise: null,
      });
    });
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  private handleSubmit(): void {
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
      // Correct: show green badge then advance
      if (this.feedbackTimer !== null) clearTimeout(this.feedbackTimer);
      this.feedbackTimer = setTimeout(() => {
        this.feedbackTimer = null;
        this.store.setState({ feedback: 'idle' });
        this.nextExercise();
      }, 600);
    } else {
      // Wrong: stay on the same exercise, let the user retry
      input.focus();
    }
  }

  private handleOpToggle(op: Operation): void {
    const { config } = this.store.getState();
    const current = config.operations;

    // Guard: always keep at least one operation active
    if (current.includes(op) && current.length === 1) return;

    const next = current.includes(op)
      ? current.filter(o => o !== op)
      : [...current, op];

    this.store.setState(s => ({ config: { ...s.config, operations: next } }));
    this.nextExercise();
  }

  destroy(): void {
    if (this.feedbackTimer !== null) {
      clearTimeout(this.feedbackTimer);
      this.feedbackTimer = null;
    }
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private nextExercise(): void {
    try {
      const exercise = this.engine.generate(this.store.getState().config);
      this.store.setState({ currentExercise: exercise, feedback: 'idle' });
      this.q<HTMLInputElement>('#answer-input').focus();
    } catch {
      // No strategy available — silently ignore (config guard prevents this)
    }
  }

  // ── Reactive update (called on every store change) ─────────────────────────

  private update(state: GameState): void {
    // Score counter
    const scoreEl = this.root.querySelector<HTMLElement>('#score');
    if (scoreEl) {
      scoreEl.textContent = `${state.score.correct} / ${state.score.total}`;
    }

    // Feedback badge (V / R)
    const badgeEl = this.root.querySelector<HTMLElement>('#badge');
    if (badgeEl) {
      if (state.feedback === 'correct') {
        badgeEl.textContent = 'V';
        badgeEl.className = 'feedback-badge correct';
      } else if (state.feedback === 'wrong') {
        badgeEl.textContent = 'R';
        badgeEl.className = 'feedback-badge wrong';
      } else {
        badgeEl.textContent = '';
        badgeEl.className = 'feedback-badge';
      }
    }

    // Exercise expression + feedback colour
    const exprEl = this.root.querySelector<HTMLElement>('#expression');
    if (exprEl && state.currentExercise) {
      const { operandA, operandB, operation } = state.currentExercise;
      exprEl.textContent =
        `${operandA} ${OP_SYMBOL[operation]} ${operandB} = ?`;
      exprEl.className =
        `exercise-expression${state.feedback !== 'idle' ? ` ${state.feedback}` : ''}`;
    }

    // Op toggle buttons
    this.root
      .querySelectorAll<HTMLButtonElement>('.op-toggle')
      .forEach(btn => {
        const active = state.config.operations.includes(
          btn.dataset.op as Operation,
        );
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
  }

  // ── Utility ────────────────────────────────────────────────────────────────

  private q<T extends Element>(selector: string): T {
    const el = this.root.querySelector<T>(selector);
    if (!el) throw new Error(`Element "${selector}" not found in App root.`);
    return el;
  }
}
