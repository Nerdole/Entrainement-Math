import type { GameStore } from '../store/GameStore';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }) + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function accuracyPct(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

function grade(pct: number): string {
  if (pct >= 90) return 'Excellent';
  if (pct >= 70) return 'Très bien';
  if (pct >= 50) return 'Bien';
  return 'Continue !';
}

// ─── ResultsScreen ────────────────────────────────────────────────────────────

export class ResultsScreen {
  constructor(
    private readonly root: HTMLElement,
    private readonly store: GameStore,
  ) {
    this.render();
  }

  private render(): void {
    const { lastSprintResult } = this.store.getState();

    if (!lastSprintResult) {
      // Shouldn't happen, but defensive fallback
      this.root.innerHTML = `
        <div class="results">
          <div class="results-content">
            <p class="results-date">Aucune session disponible.</p>
            <button class="results-btn" id="home-btn">Accueil</button>
          </div>
        </div>`;
      this.root.querySelector('#home-btn')!
        .addEventListener('click', () => this.store.setState({ screen: 'home' }));
      return;
    }

    const { correct, total, date } = lastSprintResult;
    const wrong = total - correct;
    const pct = accuracyPct(correct, total);
    const label = grade(pct);

    this.root.innerHTML = `
      <div class="results">
        <div class="results-content">
          <p class="results-date">${formatDateTime(date)}</p>

          <div class="results-grade" aria-label="${label}">${label}</div>

          <div class="results-big">
            <span class="results-num">${correct}</span>
            <span class="results-label">bonnes réponses en 2 min</span>
          </div>

          <div class="results-stats">
            <div class="stat-item">
              <span class="stat-value">${total}</span>
              <span class="stat-label">tentatives</span>
            </div>
            <div class="stat-divider" aria-hidden="true"></div>
            <div class="stat-item">
              <span class="stat-value">${wrong}</span>
              <span class="stat-label">erreurs</span>
            </div>
            <div class="stat-divider" aria-hidden="true"></div>
            <div class="stat-item">
              <span class="stat-value">${pct}&thinsp;%</span>
              <span class="stat-label">précision</span>
            </div>
          </div>

          <div class="results-actions">
            <button class="results-btn results-btn--primary" id="retry-btn">Rejouer</button>
            <button class="results-btn" id="home-btn">Accueil</button>
          </div>
        </div>
      </div>
    `;

    this.root.querySelector('#retry-btn')!.addEventListener('click', () => {
      this.store.setState({
        screen: 'sprint',
        score: { correct: 0, total: 0 },
        feedback: 'idle',
        currentExercise: null,
      });
    });

    this.root.querySelector('#home-btn')!.addEventListener('click', () => {
      this.store.setState({
        screen: 'home',
        score: { correct: 0, total: 0 },
        feedback: 'idle',
        currentExercise: null,
      });
    });
  }

  destroy(): void { /* nothing to clean up */ }
}
