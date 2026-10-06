import type { ILessonDef, LessonExercise } from '../../../types/lesson';
import { randInt, gcd } from '../../strategies/utils';

/**
 * Fractions — simplification
 *
 * Core skill: simplify a fraction to its irreducible form by dividing
 * numerator and denominator by their GCF.
 *
 * Exercise format: "Simplifie  N/D  →  ? / b"
 *   The student sees the target denominator b and must find the simplified numerator.
 *   Answer = a  where  N = g·a,  D = g·b,  gcd(a,b) = 1.
 *
 * Difficulty levels:
 *   1 →  GCF = 2–4, small numerators/denominators
 *   2 →  GCF = 3–7, medium range
 *   3 →  GCF = 5–12, less obvious simplification
 */
export const fractionsLesson: ILessonDef = {
  id: 'fractions',
  title: 'Fractions',
  icon: '½',
  description: 'Simplifier des fractions et trouver la forme irréductible',
  estimatedMin: 12,

  concepts: [
    {
      title: "Vocabulaire des fractions",
      body: "Une fraction a/b représente a parts d'un tout divisé en b parts égales.\n• a est le numérateur (parts prises)\n• b est le dénominateur (nombre total de parts)\n\nb ≠ 0 (on ne peut pas diviser par zéro).",
      formula: 'a / b',
      example: '3/4 = trois quarts\n2/5 = deux cinquièmes',
    },
    {
      title: 'Fractions équivalentes',
      body: "Deux fractions sont équivalentes si l'une s'obtient en multipliant (ou divisant) le numérateur et le dénominateur par le même entier non nul.\n\nCela ne change pas la valeur de la fraction.",
      formula: 'a/b = (a × k) / (b × k)',
      example: '1/3 = 2/6 = 3/9 = 4/12\nToutes ces fractions sont équivalentes.',
    },
    {
      title: 'Simplifier = forme irréductible',
      body: "Une fraction est irréductible quand numérateur et dénominateur n'ont aucun diviseur commun autre que 1 (leur PGCD vaut 1).\n\nPour simplifier : diviser les deux termes par leur PGCD.",
      formula: 'a/b  irréductible  ⟺  PGCD(a, b) = 1',
      example: '12/18 : PGCD(12,18) = 6\n12÷6 = 2,  18÷6 = 3\n→ 12/18 = 2/3  ✓',
    },
  ],

  workedExample: {
    problem: 'Simplifie 24/36',
    steps: [
      {
        action: '① Trouver le PGCD de 24 et 36',
        result:
          'Diviseurs de 24 : 1, 2, 3, 4, 6, 8, 12, 24\n' +
          'Diviseurs de 36 : 1, 2, 3, 4, 6, 9, 12, 18, 36\n' +
          'PGCD(24, 36) = 12',
      },
      {
        action: '② Diviser les deux termes par 12',
        result: '24 ÷ 12 = 2   et   36 ÷ 12 = 3\n→  24/36 = 2/3',
      },
    ],
    check: 'Vérification : PGCD(2, 3) = 1  → forme irréductible  ✓',
  },

  generateExercise(difficulty: 1 | 2 | 3): LessonExercise {
    let g: number, a: number, b: number;

    // Generate coprime pair (a, b) with a < b
    do {
      if (difficulty === 1) {
        g = randInt(2, 4);
        a = randInt(2, 5);
        b = randInt(a + 1, a + 5);
      } else if (difficulty === 2) {
        g = randInt(3, 7);
        a = randInt(2, 7);
        b = randInt(a + 1, a + 7);
      } else {
        g = randInt(5, 12);
        a = randInt(2, 9);
        b = randInt(a + 1, a + 9);
      }
    } while (gcd(a, b) !== 1);

    const num = g * a;
    const denom = g * b;

    return {
      id: crypto.randomUUID(),
      difficulty,
      prompt: `Simplifie  ${num}/${denom}  →  ? / ${b}`,
      answer: a,
      hint:
        `Cherche le PGCD de ${num} et ${denom}.\n` +
        `${num} ÷ ? = ${a}   →   ? = ${g}`,
      solutionSteps: [
        `PGCD(${num}, ${denom}) = ${g}`,
        `${num} ÷ ${g} = ${a}`,
        `${denom} ÷ ${g} = ${b}`,
        `${num}/${denom} = ${a}/${b}`,
      ],
    };
  },

  validate(exercise: LessonExercise, rawAnswer: string): boolean {
    const n = parseInt(rawAnswer.trim(), 10);
    return !isNaN(n) && n === exercise.answer;
  },
};
