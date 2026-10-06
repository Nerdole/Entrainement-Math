import type { ILessonDef, LessonExercise } from '../../../types/lesson';
import { randInt } from '../../strategies/utils';

/**
 * Puissances — rules of exponents
 *
 * Three distinct question types, one per difficulty level:
 *   1 →  Calculate base^exp     (builds intuition for what a power IS)
 *   2 →  a^n × a^m = a^?        (product rule: add exponents)
 *   3 →  (a^n)^m  = a^?         (power rule: multiply exponents)
 *
 * All answers are positive integers, validated with parseInt.
 */
export const puissancesLesson: ILessonDef = {
  id: 'puissances',
  title: 'Puissances',
  icon: 'xⁿ',
  description: "Calcul et règles de simplification des exposants",
  estimatedMin: 10,

  concepts: [
    {
      title: 'Définition de la puissance',
      body: "aⁿ signifie « a multiplié par lui-même n fois ».\n• a est la base\n• n est l'exposant\n\nCas particuliers : a⁰ = 1 et a¹ = a.",
      formula: 'aⁿ = a × a × … × a   (n facteurs)',
      example: '2⁴ = 2 × 2 × 2 × 2 = 16\n3³ = 3 × 3 × 3 = 27\n5⁰ = 1',
    },
    {
      title: 'Règle du produit (même base)',
      body: "Pour multiplier deux puissances de même base, on additionne les exposants.\nPour diviser, on soustrait les exposants.\n\nATTENTION : les bases doivent être identiques.",
      formula: 'aⁿ × aᵐ = aⁿ⁺ᵐ\naⁿ ÷ aᵐ = aⁿ⁻ᵐ',
      example: '2³ × 2⁴ = 2⁷ = 128\n3⁵ ÷ 3² = 3³ = 27',
    },
    {
      title: 'Puissance d\'une puissance',
      body: "Pour élever une puissance à une autre puissance, on multiplie les exposants.",
      formula: '(aⁿ)ᵐ = aⁿ × ᵐ',
      example: '(2³)⁴ = 2¹²\n(x²)⁵ = x¹⁰\n(3²)³ = 3⁶ = 729',
    },
  ],

  workedExample: {
    problem: 'Simplifier (2³)² × 2⁴',
    steps: [
      {
        action: '① Appliquer la règle de la puissance d\'une puissance',
        result: '(2³)² = 2^(3 × 2) = 2⁶',
      },
      {
        action: '② Appliquer la règle du produit',
        result: '2⁶ × 2⁴ = 2^(6 + 4) = 2¹⁰',
      },
      {
        action: '③ Calculer la valeur numérique',
        result: '2¹⁰ = 1 024',
      },
    ],
    check: 'Vérification : 2³ = 8 → 8² = 64 → 2⁴ = 16 → 64 × 16 = 1 024  ✓',
  },

  generateExercise(difficulty: 1 | 2 | 3): LessonExercise {
    if (difficulty === 1) {
      // Compute base^exp numerically
      const base = randInt(2, 4);
      const exp  = randInt(2, 4);
      const result = base ** exp;
      const expansion = Array.from({ length: exp }, () => String(base)).join(' × ');
      return {
        id: crypto.randomUUID(),
        difficulty,
        prompt: `Calcule  ${base}^${exp} = ?`,
        answer: result,
        hint: `${base}^${exp} = ${expansion}`,
        solutionSteps: [`${base}^${exp} = ${expansion} = ${result}`],
      };

    } else if (difficulty === 2) {
      // Product rule: a^n × a^m = a^?
      const n = randInt(2, 6);
      const m = randInt(2, 6);
      return {
        id: crypto.randomUUID(),
        difficulty,
        prompt: `a^${n} × a^${m} = a^?`,
        answer: n + m,
        hint: `Règle : aⁿ × aᵐ = aⁿ⁺ᵐ\nAdditionne les exposants : ${n} + ${m}`,
        solutionSteps: [
          `Règle produit (même base) : aⁿ × aᵐ = aⁿ⁺ᵐ`,
          `a^${n} × a^${m} = a^(${n} + ${m}) = a^${n + m}`,
        ],
      };

    } else {
      // Power-of-power rule: (a^n)^m = a^?
      const n = randInt(2, 5);
      const m = randInt(2, 4);
      return {
        id: crypto.randomUUID(),
        difficulty,
        prompt: `(a^${n})^${m} = a^?`,
        answer: n * m,
        hint: `Règle : (aⁿ)ᵐ = aⁿˣᵐ\nMultiplie les exposants : ${n} × ${m}`,
        solutionSteps: [
          `Règle puissance d'une puissance : (aⁿ)ᵐ = aⁿ × ᵐ`,
          `(a^${n})^${m} = a^(${n} × ${m}) = a^${n * m}`,
        ],
      };
    }
  },

  validate(exercise: LessonExercise, rawAnswer: string): boolean {
    const n = parseInt(rawAnswer.trim(), 10);
    return !isNaN(n) && n === exercise.answer;
  },
};
