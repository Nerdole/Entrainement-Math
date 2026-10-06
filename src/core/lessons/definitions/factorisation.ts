import type { ILessonDef, LessonExercise } from '../../../types/lesson';
import { randInt, gcd } from '../../strategies/utils';

/**
 * Factorisation — ax + b = k(px + q)
 *
 * Core skill: identify the greatest common factor of two terms and
 * write the expression as a product.
 *
 * Exercise format: "Px + Q = ?·(ax + b)" — student finds k = GCF(P, Q).
 *
 * Difficulty levels:
 *   1 →  kx + kb = ?·(x + b)       (a = 1, simple case)
 *   2 →  kax + kb = ?·(ax + b)     (a = 2–4, 2-digit products)
 *   3 →  kax + kb = ?·(ax + b)     (larger numbers, less obvious factor)
 */
export const factorisationLesson: ILessonDef = {
  id: 'factorisation',
  title: 'Factorisation',
  icon: '✕',
  description: 'Mettre en facteur une expression du 1er degré',
  estimatedMin: 12,

  concepts: [
    {
      title: 'Factoriser : définition',
      body: "Factoriser une expression, c'est l'écrire sous forme de produit.\nC'est l'opération inverse du développement.\n\nDévelopper : on distribue.\nFactoriser : on met en facteur.",
      formula: 'a(x + b) = ax + ab',
      example: 'Développer : 3(x + 4) = 3x + 12\nFactoriser : 3x + 12 = 3(x + 4)',
    },
    {
      title: 'Facteur commun',
      body: "Si tous les termes d'une somme contiennent un diviseur commun, on peut le \"sortir\" devant une parenthèse.\nLe facteur à choisir est le plus grand commun diviseur (PGCD) des coefficients.",
      formula: 'ax + ay = a(x + y)',
      example: '6x + 9 = 3·2x + 3·3 = 3(2x + 3)\n10x + 15 = 5(2x + 3)',
    },
    {
      title: 'Méthode en 3 étapes',
      body: '① Repérer les coefficients des termes.\n② Calculer le PGCD de ces coefficients.\n③ Diviser chaque terme par le PGCD et écrire le produit.',
      formula: 'PGCD(P, Q) = k   →   Px + Q = k(P/k · x + Q/k)',
      example: '12x + 8\n① Coefficients : 12 et 8\n② PGCD(12, 8) = 4\n③ 12x + 8 = 4(3x + 2)',
    },
  ],

  workedExample: {
    problem: '15x + 10',
    steps: [
      {
        action: '① Identifier les coefficients',
        result: 'Coefficient de x : 15   |   Terme constant : 10',
      },
      {
        action: '② Calculer PGCD(15, 10)',
        result: 'Diviseurs de 15 : 1, 3, 5, 15\nDiviseurs de 10 : 1, 2, 5, 10\nPGCD(15, 10) = 5',
      },
      {
        action: '③ Factoriser par 5',
        result: '15x + 10 = 5 × 3x + 5 × 2 = 5(3x + 2)',
      },
    ],
    check: 'Vérification : 5(3x + 2) = 15x + 10  ✓',
  },

  generateExercise(difficulty: 1 | 2 | 3): LessonExercise {
    let k: number, a: number, b: number;

    if (difficulty === 1) {
      k = randInt(2, 6);
      a = 1;
      b = randInt(2, 8);
    } else {
      // Ensure a and b are coprime so k is the true GCF of the full expression
      do {
        if (difficulty === 2) {
          k = randInt(2, 5); a = randInt(2, 4); b = randInt(2, 6);
        } else {
          k = randInt(3, 9); a = randInt(2, 6); b = randInt(2, 8);
        }
      } while (gcd(a, b) !== 1);
    }

    const P = k * a; // coefficient of x in the expanded form
    const Q = k * b; // constant term in the expanded form

    const factoredStr = a === 1 ? `(x + ${b})` : `(${a}x + ${b})`;

    return {
      id: crypto.randomUUID(),
      difficulty,
      prompt: `${P}x + ${Q} = ? · ${factoredStr}`,
      answer: k,
      hint:
        `Le facteur commun est le PGCD de ${P} et ${Q}.\n` +
        `Diviseurs de ${P} : ${divisors(P).join(', ')}\n` +
        `Diviseurs de ${Q} : ${divisors(Q).join(', ')}`,
      solutionSteps: [
        `PGCD(${P}, ${Q}) = ${k}`,
        `${P}x + ${Q} = ${k}(${a === 1 ? 'x' : `${a}x`} + ${b})`,
      ],
    };
  },

  validate(exercise: LessonExercise, rawAnswer: string): boolean {
    const n = parseInt(rawAnswer.trim(), 10);
    return !isNaN(n) && n === exercise.answer;
  },
};

/** Returns the sorted list of divisors of n (for hints). */
function divisors(n: number): number[] {
  const result: number[] = [];
  for (let i = 1; i <= n; i++) {
    if (n % i === 0) result.push(i);
  }
  return result;
}
