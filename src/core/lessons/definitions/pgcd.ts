import type { ILessonDef, LessonExercise } from '../../../types/lesson';
import { randInt, gcd } from '../../strategies/utils';

/**
 * PGCD — Plus grand commun diviseur
 *
 * Core skill: compute GCD(A, B) using divisor lists (D1–D2)
 * and the Euclidean algorithm (D3).
 *
 * Exercise format: "PGCD( A ,  B ) = ?"
 *
 * Generation strategy:
 *   Pick g (the answer), then coprime a and b.
 *   A = g × a,  B = g × b  →  GCD(A, B) = g  ✓
 *
 * Difficulty levels:
 *   1 →  g = 2–4, small A and B (divisors easy to list)
 *   2 →  g = 3–8, medium A and B (a bit more work)
 *   3 →  g = 4–12, larger numbers (Euclidean algorithm pays off)
 */
export const pgcdLesson: ILessonDef = {
  id: 'pgcd',
  title: 'PGCD / PPCM',
  icon: '÷',
  description: 'Calculer le PGCD par la liste des diviseurs ou l\'algorithme d\'Euclide',
  estimatedMin: 12,

  concepts: [
    {
      title: 'Diviseurs et PGCD',
      body: "Un diviseur de n est un entier qui divise n sans reste.\nLe Plus Grand Commun Diviseur (PGCD) de deux entiers a et b est le plus grand entier qui divise à la fois a et b.",
      formula: 'PGCD(a, b) = plus grand diviseur commun',
      example: 'Diviseurs de 12 : 1, 2, 3, 4, 6, 12\nDiviseurs de 18 : 1, 2, 3, 6, 9, 18\nDiviseurs communs : 1, 2, 3, 6\nPGCD(12, 18) = 6',
    },
    {
      title: 'Méthode : liste des diviseurs communs',
      body: '① Lister tous les diviseurs du premier nombre.\n② Lister tous les diviseurs du second.\n③ Identifier les diviseurs communs.\n④ Prendre le plus grand.',
      formula: 'PGCD(a, b) = max{ d : d|a  et  d|b }',
      example: 'PGCD(20, 30)\nDiviseurs de 20 : 1, 2, 4, 5, 10, 20\nDiviseurs de 30 : 1, 2, 3, 5, 6, 10, 15, 30\nCommuns : 1, 2, 5, 10  →  PGCD = 10',
    },
    {
      title: "Algorithme d'Euclide (méthode rapide)",
      body: "L'algorithme d'Euclide est une méthode rapide basée sur la division euclidienne :\nTant que le reste est non nul, remplacer (a, b) par (b, reste de a÷b).\nQuand le reste est 0, le PGCD est le dernier diviseur non nul.",
      formula: 'PGCD(a, b) = PGCD(b, a mod b)  jusqu\'à  b = 0',
      example: 'PGCD(48, 18)\n48 = 2 × 18 + 12\n18 = 1 × 12 + 6\n12 = 2 × 6 + 0\n→ PGCD(48, 18) = 6',
    },
  ],

  workedExample: {
    problem: 'PGCD(36, 24)',
    steps: [
      {
        action: '① Première division euclidienne',
        result: '36 = 1 × 24 + 12   →   reste = 12',
      },
      {
        action: '② Deuxième division euclidienne',
        result: '24 = 2 × 12 + 0   →   reste = 0',
      },
      {
        action: '③ Le reste est 0 : le PGCD est le dernier diviseur',
        result: 'PGCD(36, 24) = 12',
      },
    ],
    check: 'Vérification : 36 ÷ 12 = 3  ✓   24 ÷ 12 = 2  ✓   PGCD(3, 2) = 1  ✓',
  },

  generateExercise(difficulty: 1 | 2 | 3): LessonExercise {
    let g: number, a: number, b: number;

    // Pick g (the GCF answer), then coprime a < b so gcd(A,B) = g exactly
    do {
      if (difficulty === 1) {
        g = randInt(2, 4);
        a = randInt(2, 5);
        b = randInt(a + 1, a + 4);
      } else if (difficulty === 2) {
        g = randInt(3, 8);
        a = randInt(2, 6);
        b = randInt(a + 1, a + 6);
      } else {
        g = randInt(4, 12);
        a = randInt(3, 8);
        b = randInt(a + 1, a + 8);
      }
    } while (gcd(a, b) !== 1);

    const A = g * a;
    const B = g * b;

    // Build Euclidean algorithm steps for the solution
    const euclidSteps = euclidTrace(A, B);

    return {
      id: crypto.randomUUID(),
      difficulty,
      prompt: `PGCD( ${A} ,  ${B} ) = ?`,
      answer: g,
      hint:
        difficulty === 1
          ? `Liste les diviseurs de ${A} et de ${B}, puis cherche le plus grand commun.`
          : `Algorithme d'Euclide :\n${A} ÷ ${B} = ${Math.floor(A / B)}  reste  ${A % B}`,
      solutionSteps: euclidSteps,
    };
  },

  validate(exercise: LessonExercise, rawAnswer: string): boolean {
    const n = parseInt(rawAnswer.trim(), 10);
    return !isNaN(n) && n === exercise.answer;
  },
};

/** Generate step-by-step Euclidean algorithm trace. */
function euclidTrace(a: number, b: number): string[] {
  const steps: string[] = [];
  let x = a, y = b;
  while (y !== 0) {
    const q = Math.floor(x / y);
    const r = x % y;
    steps.push(`${x} = ${q} × ${y} + ${r}`);
    x = y;
    y = r;
  }
  steps.push(`PGCD(${a}, ${b}) = ${x}`);
  return steps;
}
