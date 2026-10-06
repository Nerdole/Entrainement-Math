import type { GameStore } from '../store/GameStore';
import { LessonScheduler } from '../core/lessons/scheduler';

// ─── Topic catalogue ─────────────────────────────────────────────────────────
// To implement a topic: set `available: true` and attach a screen/handler.

interface Topic {
  id: string;
  icon: string;
  name: string;
  desc: string;
  available: boolean;
}

const TOPICS: Topic[] = [
  {
    id: 'factorisation',
    icon: '✕',
    name: 'Factorisation',
    desc: 'Factoriser des expressions algébriques',
    available: true,
  },
  {
    id: 'equations-1',
    icon: '=',
    name: 'Équations du 1er degré',
    desc: 'Résoudre ax + b = c',
    available: true,
  },
  {
    id: 'fractions',
    icon: '½',
    name: 'Fractions',
    desc: 'Simplifier, additionner, multiplier',
    available: true,
  },
  {
    id: 'puissances',
    icon: 'xⁿ',
    name: 'Puissances',
    desc: 'Calcul et règles des exposants',
    available: true,
  },
  {
    id: 'pgcd',
    icon: '÷',
    name: 'PGCD / PPCM',
    desc: 'Plus grand commun diviseur',
    available: true,
  },
  {
    id: 'proportionnalite',
    icon: '∝',
    name: 'Proportionnalité',
    desc: 'Règle de trois, pourcentages',
    available: true,
  },
];

// ─── LearnMenuScreen ──────────────────────────────────────────────────────────

export class LearnMenuScreen {
  constructor(
    private readonly root: HTMLElement,
    private readonly store: GameStore,
  ) {
    this.render();
  }

  private render(): void {
    const topicsHTML = TOPICS.map(t => {
      if (!t.available) {
        return `<button class="topic-card" data-topic="${t.id}" aria-disabled="true" tabindex="-1">
          <span class="topic-badge">Bientôt</span>
          <span class="topic-icon">${t.icon}</span>
          <span class="topic-name">${t.name}</span>
          <span class="topic-desc">${t.desc}</span>
        </button>`;
      }

      const completed = LessonScheduler.hasCompleted(t.id);
      const due = completed && LessonScheduler.isDue(t.id);
      const days = LessonScheduler.daysUntilReview(t.id);

      let statusHTML = '';
      if (due) {
        statusHTML = '<span class="topic-status topic-status--due">↻ Révision</span>';
      } else if (completed && days !== null && days > 0) {
        statusHTML = `<span class="topic-status topic-status--done">✓ Révision dans ${days}j</span>`;
      } else if (completed) {
        statusHTML = '<span class="topic-status topic-status--done">✓ Acquis</span>';
      }

      return `<button class="topic-card" data-topic="${t.id}">
          ${statusHTML}
          <span class="topic-icon">${t.icon}</span>
          <span class="topic-name">${t.name}</span>
          <span class="topic-desc">${t.desc}</span>
        </button>`;
    }).join('');

    this.root.innerHTML = `
      <button class="back-btn" id="back-btn" aria-label="Accueil" title="Retour à l'accueil">←</button>

      <div class="learn-menu">
        <div class="learn-content">
          <h1 class="learn-title">Apprendre</h1>
          <p class="learn-sub">Choisissez un thème pour commencer</p>
          <div class="topic-grid">${topicsHTML}</div>
        </div>
      </div>
    `;

    this.root
      .querySelector<HTMLButtonElement>('#back-btn')!
      .addEventListener('click', () => {
        this.store.setState({ screen: 'home' });
      });

    // Bind available topics
    TOPICS.filter(t => t.available).forEach(t => {
      this.root
        .querySelector<HTMLButtonElement>(`[data-topic="${t.id}"]`)
        ?.addEventListener('click', () => {
          this.store.setState({ screen: 'lesson', activeLessonId: t.id });
        });
    });
  }

  destroy(): void { /* nothing to clean up */ }
}
