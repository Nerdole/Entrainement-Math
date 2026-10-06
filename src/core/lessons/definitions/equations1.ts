import type { ILessonDef, LessonExercise } from '../../../types/lesson';
import { randInt } from '../../strategies/utils';

/**
 * Équations du 1er degré — ax + b = c
 *
 * Difficulty levels:
 *   1 →  x + b = c          (a = 1, small numbers — builds automaticity)
 *   2 →  ax + b = c         (a 2–5, 2-step procedure — consolidates method)
 *   3 →  ax + b = c         (a 2–9, larger range — transfer + fluency)
 */
export const equations1Lesson: ILessonDef = {
  id: 'equations-1',
  title: 'Équations du 1er degré',
  icon: '=',
  description: 'Résoudre ax + b = c en isolant x',
  estimatedMin: 10,

  // ── Concept cards (Explain phase) ────────────────────────────────────────
  concepts: [
    {
      title: "Qu'est-ce qu'une équation ?",
      body: "Une équation est une égalité contenant une inconnue x. Résoudre l'équation, c'est trouver la valeur de x qui rend l'égalité vraie des deux côtés.",
      formula: 'ax + b = c',
      example: '2x + 3 = 11   →   x = ?',
    },
    {
      title: "Principe d'équivalence",
      body: "On peut effectuer la même opération des deux côtés d'une équation sans changer ses solutions. On \"isole\" x progressivement.\n\nRègle d'or : ce qu'on fait à gauche, on le fait à droite.",
      formula: 'A = B   ⟹   A ± k = B ± k',
      example: '2x + 3 = 11\n2x = 11 − 3\n2x = 8',
    },
    {
      title: 'Méthode en 2 étapes',
      body: '① Éliminer b : soustraire b des deux membres.\n② Trouver x : diviser les deux membres par a.\n\nVérification : remplacer x dans l\'équation de départ.',
      formula: 'x = (c − b) ÷ a',
      example: '3x + 5 = 14\n→ 3x = 14 − 5 = 9\n→ x = 9 ÷ 3 = 3\nVérif. : 3×3 + 5 = 14 ✓',
    },
  ],

  // ── Worked example (step-by-step reveal) ─────────────────────────────────
  workedExample: {
    problem: '4x + 6 = 22',
    steps: [
      {
        action: '① Soustraire 6 des deux membres',
        result: '4x + 6 − 6 = 22 − 6   →   4x = 16',
      },
      {
        action: '② Diviser les deux membres par 4',
        result: '4x ÷ 4 = 16 ÷ 4   →   x = 4',
      },
    ],
    check: 'Vérification : 4 × 4 + 6 = 16 + 6 = 22  ✓',
  },

  // ── Exercise generator ────────────────────────────────────────────────────
  generateExercise(difficulty: 1 | 2 | 3): LessonExercise {
    let a: number, b: number, x: number;

    if (difficulty === 1) {
      a = 1;
      x = randInt(1, 15);
      b = randInt(1, 10);
    } else if (difficulty === 2) {
      a = randInt(2, 5);
      x = randInt(1, 9);
      b = randInt(1, 12);
    } else {
      a = randInt(2, 9);
      x = randInt(1, 12);
      b = randInt(1, 20);
    }

    const c = a * x + b;
    const lhs = a === 1 ? `x + ${b}` : `${a}x + ${b}`;

    const solutionSteps: string[] =
      a === 1
        ? [`x = ${c} − ${b} = ${x}`]
        : [
            `① Soustraire ${b} : ${a}x = ${c} − ${b} = ${c - b}`,
            `② Diviser par ${a} : x = ${c - b} ÷ ${a} = ${x}`,
          ];

    const hint =
      a === 1
        ? `Soustrait ${b} des deux côtés : x = ${c} − ${b}`
        : `Étape 1 : soustrait ${b} → ${a}x = ${c - b}\nÉtape 2 : divise par ${a}`;

    return {
      id: crypto.randomUUID(),
      difficulty,
      prompt: `${lhs} = ${c}`,
      answer: x,
      hint,
      solutionSteps,
    };
  },

  validate(exercise: LessonExercise, rawAnswer: string): boolean {
    const n = parseInt(rawAnswer.trim(), 10);
    return !isNaN(n) && n === exercise.answer;
  },
};
