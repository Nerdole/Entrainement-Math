import type { GameStore } from '../store/GameStore';

type DecoItem = {
  text: string;
  x: number;    // left %
  y: number;    // top %
  rem: number;  // font-size in rem
  opacity: number;
};

const DECO: DecoItem[] = [
  { text: '∑',             x:  4,  y:  8,  rem: 5.0, opacity: 0.06 },
  { text: 'π',             x: 88,  y:  6,  rem: 5.5, opacity: 0.05 },
  { text: '∞',             x:  6,  y: 72,  rem: 4.5, opacity: 0.07 },
  { text: '√x',            x: 84,  y: 68,  rem: 4.0, opacity: 0.06 },
  { text: '7 × 8 = 56',    x: 10,  y: 32,  rem: 1.3, opacity: 0.09 },
  { text: 'a² + b² = c²',  x: 62,  y: 28,  rem: 1.1, opacity: 0.08 },
  { text: '÷',             x: 93,  y: 42,  rem: 4.0, opacity: 0.05 },
  { text: '6 + 9 = 15',    x:  7,  y: 53,  rem: 1.2, opacity: 0.09 },
  { text: '9 × 9 = 81',    x: 68,  y: 84,  rem: 1.2, opacity: 0.08 },
  { text: '×',             x: 44,  y:  3,  rem: 3.5, opacity: 0.05 },
  { text: '100 ÷ 4 = 25',  x: 52,  y: 91,  rem: 1.1, opacity: 0.07 },
  { text: '3²',            x: 28,  y: 87,  rem: 2.8, opacity: 0.07 },
  { text: 'n!',            x: 76,  y: 52,  rem: 2.8, opacity: 0.06 },
  { text: '12 − 7 = 5',   x: 18,  y: 14,  rem: 1.2, opacity: 0.08 },
];

export class HomeScreen {
  constructor(
    private readonly root: HTMLElement,
    private readonly store: GameStore,
  ) {
    this.render();
  }

  private render(): void {
    const { lastSprintResult } = this.store.getState();

    const decoHTML = DECO.map(
      d =>
        `<span class="deco" style="left:${d.x}%;top:${d.y}%;font-size:${d.rem}rem;opacity:${d.opacity}">${d.text}</span>`,
    ).join('');

    const lastResultHTML = lastSprintResult
      ? `<div class="last-result-bar">
          <span class="last-result-text">
            Dernier sprint&nbsp;:
            <strong>${lastSprintResult.correct} bonnes réponses</strong>
            &mdash;
            ${lastSprintResult.total > 0 ? Math.round((lastSprintResult.correct / lastSprintResult.total) * 100) : 0}&thinsp;%
          </span>
          <button class="last-result-link" id="see-results-btn">Voir les résultats →</button>
        </div>`
      : '';

    this.root.innerHTML = `
      <div class="home">
        <div class="deco-layer" aria-hidden="true">${decoHTML}</div>

        <div class="home-content">
          <h1 class="home-title">Entraînement<br>Mathématique</h1>
          <p class="home-sub">Choisissez votre mode d'entraînement</p>

          <div class="mode-grid">
            <button class="mode-card" data-mode="free">
              <span class="mode-icon">∞</span>
              <span class="mode-name">Libre</span>
              <span class="mode-desc">Entraînement sans limite de temps</span>
            </button>

            <button class="mode-card" data-mode="sprint">
              <span class="mode-icon">⏱</span>
              <span class="mode-name">Sprint 2 min</span>
              <span class="mode-desc">Le maximum de réponses en 2 minutes</span>
            </button>

            <button class="mode-card" data-mode="learn">
              <span class="mode-icon">📐</span>
              <span class="mode-name">Apprendre</span>
              <span class="mode-desc">Leçons guidées par thème</span>
            </button>
          </div>

          ${lastResultHTML}
        </div>
      </div>
    `;

    this.root
      .querySelector<HTMLButtonElement>('[data-mode="free"]')!
      .addEventListener('click', () => {
        this.store.setState({ screen: 'game', mode: 'free' });
      });

    this.root
      .querySelector<HTMLButtonElement>('[data-mode="sprint"]')!
      .addEventListener('click', () => {
        this.store.setState({
          screen: 'sprint',
          mode: 'sprint',
          score: { correct: 0, total: 0 },
          feedback: 'idle',
          currentExercise: null,
        });
      });

    this.root
      .querySelector<HTMLButtonElement>('[data-mode="learn"]')!
      .addEventListener('click', () => {
        this.store.setState({ screen: 'learn', mode: 'learn' });
      });

    this.root.querySelector<HTMLButtonElement>('#see-results-btn')
      ?.addEventListener('click', () => {
        this.store.setState({ screen: 'results' });
      });
  }

  destroy(): void {
    // No timer or subscription to release
  }
}
