import { read, writeRaw, type SaveModel, type Unit, type Value } from './save';

export interface Edit { u: Unit; i: number; before: Value; after: Value }

/** Tracks in-place edits so each can be listed and undone before download. */
export class EditStore {
  private map = new Map<number, Edit>();
  private listeners = new Set<() => void>();

  constructor(private m: SaveModel) {}

  get size() { return this.map.size; }
  list() { return [...this.map.values()]; }
  has(u: Unit, i = 0) { return this.map.has(u.off + i * u.size); }
  onChange(fn: () => void) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  private emit() { for (const fn of this.listeners) fn(); }

  apply(u: Unit, i: number, val: Value) {
    const key = u.off + i * u.size;
    const prev = this.map.get(key);
    const before = prev ? prev.before : read(this.m, u, i);
    writeRaw(this.m, u, i, val);
    const after = read(this.m, u, i);
    if (String(before) === String(after)) this.map.delete(key);
    else this.map.set(key, { u, i, before, after });
    this.emit();
  }

  /** Applies several values to one unit (e.g. a string) as one change notification. */
  applyMany(u: Unit, values: Value[]) {
    values.forEach((v, i) => {
      if (String(read(this.m, u, i)) === String(v)) return;
      const key = u.off + i * u.size;
      const prev = this.map.get(key);
      const before = prev ? prev.before : read(this.m, u, i);
      writeRaw(this.m, u, i, v);
      if (String(before) === String(v)) this.map.delete(key);
      else this.map.set(key, { u, i, before, after: read(this.m, u, i) });
    });
    this.emit();
  }

  undo(e: Edit) {
    writeRaw(this.m, e.u, e.i, e.before);
    this.map.delete(e.u.off + e.i * e.u.size);
    this.emit();
  }

  undoAll() {
    for (const e of this.map.values()) writeRaw(this.m, e.u, e.i, e.before);
    this.map.clear();
    this.emit();
  }
}
