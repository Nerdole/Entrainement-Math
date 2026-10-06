import type { ILessonDef, LessonExercise } from '../../../types/lesson';
import { randInt } from '../../strategies/utils';

/**
 * Proportionnalité — rule of three and percentages
 *
 * Difficulty levels:
 *   1 →  Rule of three (word problem, small unit price)
 *   2 →  Percentage with "round" values: 10%, 20%, 25%, 50%
 *   3 →  Rule of three (larger numbers) or harder percentage
 *
 * All answers are positive integers.
 */
export const proportionnaliteLesson: ILessonDef = {
  id: 'proportionnalite',
  title: 'Proportionnalité',
  icon: '∝',
  description: 'Règle de trois et calculs de pourcentages',
  estimatedMin: 12,

  concepts: [
    {
      title: 'Situation de proportionnalité',
      body: "Deux grandeurs sont proportionnelles si leur rapport est constant.\nLe coefficient de proportionnalité k relie les deux colonnes du tableau.",
      formula: 'y = k × x   (k constant)',
      example: 'Vitesse constante : 60 km/h\n1 h → 60 km\n2 h → 120 km\n3 h → 180 km\nCoefficient k = 60',
    },
    {
      title: 'La règle de trois',
      body: "Quand on connaît la valeur unitaire, on peut calculer n'importe quelle valeur.\n\n① Trouver la valeur pour 1 unité (diviser).\n② Multiplier pour la quantité cherchée.",
      formula: 'Si  a → b,  alors  c → c × (b ÷ a)',
      example: '3 stylos coûtent 9 €\n① Prix unitaire : 9 ÷ 3 = 3 €\n② 7 stylos : 7 × 3 = 21 €',
    },
    {
      title: 'Les pourcentages',
      body: "Un pourcentage est un rapport ramené à 100.\np% d'une quantité x s'obtient en multipliant x par p/100.\n\nAstuces mémo :\n• 50% = moitié\n• 25% = quart\n• 10% = diviser par 10",
      formula: 'p% de x = (p × x) ÷ 100',
      example: '20% de 60\n= 20 × 60 ÷ 100\n= 1200 ÷ 100 = 12',
    },
  ],

  workedExample: {
    problem: '4 tickets coûtent 14 €. Combien coûtent 7 tickets ?',
    steps: [
      {
        action: '① Trouver le prix d\'un ticket',
        result: '14 € ÷ 4 = 3,50 € par ticket',
      },
      {
        action: '② Calculer le prix de 7 tickets',
        result: '7 × 3,50 = 24,50 €',
      },
    ],
    check: 'Vérification : 4 × 3,50 = 14 ✓   et   7 × 3,50 = 24,50 ✓',
  },

  generateExercise(difficulty: 1 | 2 | 3): LessonExercise {
    if (difficulty === 1) {
      return generateRuleOfThree('small');
    } else if (difficulty === 2) {
      return generatePercentage('round');
    } else {
      return generateRuleOfThree('large');
    }
  },

  validate(exercise: LessonExercise, rawAnswer: string): boolean {
    const n = parseInt(rawAnswer.trim(), 10);
    return !isNaN(n) && n === exercise.answer;
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const ITEMS_SMALL = ['stylos', 'cahiers', 'crayons', 'gommes', 'livres'];
const ITEMS_LARGE = ['kg de pommes', 'litres de lait', 'mètres de tissu', 'kg de farine'];

function generateRuleOfThree(scale: 'small' | 'large'): LessonExercise {
  const isSmall = scale === 'small';
  const items = isSmall ? ITEMS_SMALL : ITEMS_LARGE;
  const item = items[randInt(0, items.length - 1)];

  // Unit price as an integer so the answer is always exact
  const unitPrice = isSmall ? randInt(2, 6) : randInt(3, 9);
  const qty1 = isSmall ? randInt(2, 5) : randInt(3, 7);
  const qty2 = randInt(qty1 + 1, qty1 + (isSmall ? 5 : 7));

  const total1 = unitPrice * qty1;
  const answer  = unitPrice * qty2;

  return {
    id: crypto.randomUUID(),
    difficulty: isSmall ? 1 : 3,
    prompt: `${qty1} ${item} coûtent ${total1} €. Combien coûtent ${qty2} ${item} ?`,
    answer,
    hint:
      `① Prix unitaire : ${total1} ÷ ${qty1} = ${unitPrice} €\n` +
      `② Prix pour ${qty2} : ${qty2} × ${unitPrice}`,
    solutionSteps: [
      `Prix unitaire = ${total1} ÷ ${qty1} = ${unitPrice} €`,
      `Prix pour ${qty2} ${item} = ${qty2} × ${unitPrice} = ${answer} €`,
    ],
  };
}

function generatePercentage(_mode: 'round'): LessonExercise {
  // Use "round" percentages and bases that guarantee integer results
  const PERCENTS = [10, 20, 25, 50] as const;
  const pct = PERCENTS[randInt(0, PERCENTS.length - 1)];

  // Base must be a multiple of (100 / pct) so the result is an integer
  const divisor = 100 / pct;           // e.g. pct=25 → divisor=4
  const multiplier = randInt(2, 10);   // how many multiples
  const base = divisor * multiplier;   // guaranteed integer result

  const answer = (pct * base) / 100;

  return {
    id: crypto.randomUUID(),
    difficulty: 2,
    prompt: `${pct}% de ${base} = ?`,
    answer,
    hint:
      `Formule : p% de x = p × x ÷ 100\n` +
      `= ${pct} × ${base} ÷ 100 = ${pct * base} ÷ 100`,
    solutionSteps: [
      `${pct}% de ${base} = ${pct} × ${base} ÷ 100`,
      `= ${pct * base} ÷ 100`,
      `= ${answer}`,
    ],
  };
}
