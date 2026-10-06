import type { GameStore } from '../store/GameStore';
import type { ExerciseEngine } from '../core/ExerciseEngine';
import type { Screen } from '../types';
import { HomeScreen } from './HomeScreen';
import { App } from './App';
import { SprintScreen } from './SprintScreen';
import { ResultsScreen } from './ResultsScreen';
import { LearnMenuScreen } from './LearnMenuScreen';
import { LessonScreen } from './LessonScreen';

type IScreen = { destroy(): void };

export class Router {
  private currentScreen: Screen | null = null;
  private currentInstance: IScreen | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly store: GameStore,
    private readonly engine: ExerciseEngine,
  ) {
    store.subscribe(state => {
      if (state.screen !== this.currentScreen) {
        this.switch(state.screen);
      }
    });
    this.switch(store.getState().screen);
  }

  private switch(screen: Screen): void {
    this.currentInstance?.destroy();
    this.currentInstance = null;
    this.currentScreen = screen;

    switch (screen) {
      case 'home':
        this.currentInstance = new HomeScreen(this.root, this.store);
        break;
      case 'game':
        this.currentInstance = new App(this.root, this.store, this.engine);
        break;
      case 'sprint':
        this.currentInstance = new SprintScreen(this.root, this.store, this.engine);
        break;
      case 'results':
        this.currentInstance = new ResultsScreen(this.root, this.store);
        break;
      case 'learn':
        this.currentInstance = new LearnMenuScreen(this.root, this.store);
        break;
      case 'lesson':
        this.currentInstance = new LessonScreen(this.root, this.store);
        break;
    }
  }
}
