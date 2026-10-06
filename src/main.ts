import './styles/main.css';

import { ExerciseEngine } from './core/ExerciseEngine';
import { AdditionStrategy } from './core/strategies/AdditionStrategy';
import { SubtractionStrategy } from './core/strategies/SubtractionStrategy';
import { MultiplicationStrategy } from './core/strategies/MultiplicationStrategy';
import { DivisionStrategy } from './core/strategies/DivisionStrategy';
import { GameStore } from './store/GameStore';
import { Router } from './ui/Router';
import type { GameState } from './types';

// ─── 1. Compose the engine ───────────────────────────────────────────────────
// To add "Fractions": engine.register(new FractionStrategy())  ← that's it.

const engine = new ExerciseEngine()
  .register(new AdditionStrategy())
  .register(new SubtractionStrategy())
  .register(new MultiplicationStrategy())
  .register(new DivisionStrategy());

// ─── 2. Define the initial state ─────────────────────────────────────────────

const initialState: GameState = {
  screen: 'home',
  mode: 'free',
  currentExercise: null,
  score: { correct: 0, total: 0 },
  config: {
    operations: ['+', '-', '*', '/'],
    maxTable: 10,
  },
  feedback: 'idle',
  lastSprintResult: null,
  activeLessonId: null,
};

// ─── 3. Boot ──────────────────────────────────────────────────────────────────

const store = new GameStore(initialState);

const appRoot = document.getElementById('app');
if (!appRoot) throw new Error('Root element #app not found in index.html.');

new Router(appRoot, store, engine);
