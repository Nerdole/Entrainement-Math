import type { GameState } from '../types';

type Listener<S> = (state: S) => void;
type Updater<S> = (state: S) => Partial<S>;

/**
 * GameStore — minimal, framework-agnostic reactive state container.
 *
 * API deliberately mirrors the simplest subset of Redux / Zustand so
 * migrating to either (or to React context) requires only renaming calls.
 *
 * Usage:
 *   store.setState({ feedback: 'correct' });          // partial patch
 *   store.setState(s => ({ score: update(s.score) })); // functional update
 *   const unsub = store.subscribe(state => render(state));
 *   unsub(); // stop listening
 */
export class GameStore {
  private state: GameState;
  private listeners: Listener<GameState>[] = [];

  constructor(initialState: GameState) {
    this.state = initialState;
  }

  getState(): Readonly<GameState> {
    return this.state;
  }

  setState(updater: Partial<GameState> | Updater<GameState>): void {
    const patch =
      typeof updater === 'function' ? updater(this.state) : updater;
    this.state = { ...this.state, ...patch };
    this.notify();
  }

  /**
   * Subscribe to state changes.
   * @returns an unsubscribe function.
   */
  subscribe(listener: Listener<GameState>): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    // Snapshot prevents mid-iteration mutations (e.g. unsubscribe inside a listener)
    [...this.listeners].forEach(l => l(this.state));
  }
}
