import type { SaveModel } from '../core/save';
import type { EditStore } from '../core/edits';
import type { HashStatus } from '../core/hash';
import type { NameTable, NamesState } from '../core/names';

export type SealState = { kind: 'ok' | 'bad' | 'fixed'; status: HashStatus } | { kind: 'none' } | { kind: 'pending' };

export interface AppState {
  model: SaveModel | null;
  other: SaveModel | null;
  edits: EditStore | null;
  names: NameTable;
  namesStatus: NamesState['status'];
  seal: SealState;
  error: string | null;
}

export const state: AppState = {
  model: null,
  other: null,
  edits: null,
  names: new Map(),
  namesStatus: 'loading',
  seal: { kind: 'pending' },
  error: null,
};

type Listener = (reason: string) => void;
const listeners = new Set<Listener>();
export const subscribe = (fn: Listener) => { listeners.add(fn); return () => listeners.delete(fn); };
export const notify = (reason: string) => { for (const fn of listeners) fn(reason); };
