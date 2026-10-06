# Entraînement Math — Guide de démarrage

## Prérequis

- Node.js ≥ 18
- npm ≥ 9

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

Ouvre **http://localhost:5173** dans le navigateur.

## Build de production

```bash
npm run build
```

Le résultat est dans `dist/`.

## Prévisualiser le build

```bash
npm run preview
```

---

## Architecture

```
src/
├── main.ts                          # Point d'entrée — composition root
├── types/
│   ├── index.ts                     # GameState, Screen, Exercise, GameConfig…
│   └── lesson.ts                    # ConceptCard, LessonProgress, ReviewRecord…
├── core/
│   ├── ExerciseEngine.ts            # Factory + validation (aucune dépendance UI)
│   ├── strategies/                  # Une classe par opération arithmétique
│   │   ├── IExerciseStrategy.ts
│   │   ├── AdditionStrategy.ts
│   │   ├── SubtractionStrategy.ts
│   │   ├── MultiplicationStrategy.ts
│   │   ├── DivisionStrategy.ts
│   │   └── utils.ts
│   └── lessons/
│       ├── LessonEngine.ts          # Orchestrateur (phases, difficulté, maîtrise)
│       ├── scheduler.ts             # Répétition espacée SM-2 (localStorage)
│       └── definitions/
│           └── equations1.ts        # Définition : Équations du 1er degré
├── store/
│   └── GameStore.ts                 # State management réactif (subscribe/setState)
└── ui/
    ├── Router.ts                    # Routeur basé sur store.screen
    ├── HomeScreen.ts                # Page d'accueil + sélection du mode
    ├── App.ts                       # Mode Libre (exercices infinis)
    ├── SprintScreen.ts              # Mode Sprint (2 minutes)
    ├── ResultsScreen.ts             # Feuille de résultats post-sprint
    ├── LearnMenuScreen.ts           # Menu Apprendre (grille de sujets)
    └── LessonScreen.ts              # Leçon guidée (4 phases)
```

---

## Modes d'entraînement

| Mode | Description | Statut |
|---|---|---|
| **Libre** | Exercices infinis, config opérations + table | ✅ |
| **Sprint 2 min** | Maximum de bonnes réponses en 2 minutes | ✅ |
| **Apprendre** | Leçons guidées avec répétition espacée | ✅ |

---

## Système de leçons guidées

Chaque leçon suit 4 phases :

1. **Concepts** — cartes explicatives (une notion par carte, charge cognitive minimale)
2. **Exemple résolu** — révélation étape par étape (effet worked example, Sweller 1988)
3. **Pratique adaptive** — difficulté 1→2→3 selon la série et la précision (ZPD, Vygotsky)
4. **Maîtrise** — déclarée à 5 bonnes réponses consécutives (mastery learning, Bloom 1968)

Les sessions sont planifiées par l'algorithme SM-2 (répétition espacée, Wozniak 1987),  
stocké dans `localStorage` sous la clé `entrainement-math:reviews`.

Les indices ne sont révélés qu'après ≥ 2 erreurs (difficultés désirables, Bjork 1994).

---

## Ajouter une nouvelle opération

1. Créer `src/core/strategies/MaStrategie.ts` qui implémente `IExerciseStrategy`.
2. Dans `src/main.ts`, ajouter `engine.register(new MaStrategie())`.

Aucun autre fichier à modifier.

## Ajouter une nouvelle leçon

1. Créer `src/core/lessons/definitions/maLecon.ts` qui exporte un objet `ILessonDef`.
2. L'ajouter dans `LESSON_REGISTRY` dans `src/ui/LessonScreen.ts`.
3. L'ajouter dans le tableau `TOPICS` dans `src/ui/LearnMenuScreen.ts` avec `available: true`.

## Ajouter un nouveau mode

1. Ajouter la valeur dans `GameMode` (`src/types/index.ts`).
2. Créer `src/ui/ModeScreen.ts` avec une méthode `destroy()`.
3. Ajouter la carte sur `HomeScreen.ts`.
4. Brancher dans `Router.ts`.
