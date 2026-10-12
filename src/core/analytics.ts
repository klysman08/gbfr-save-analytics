import { EMPTY_HASH, num, rec, unitsOf, readAll, type SaveModel, type Unit } from './save';
import type { NameTable } from './names';

export const MAX_LEVEL = 100;
export const MAX_EXP = 8_400_000;

export interface Character {
  unit: number; hash: number; id: string; name: string;
  level: number; exp: number; hp: number; atk: number; msp: number;
}

const nameFor = (names: NameTable, hash: number) => names.get(hash);
const isReal = (v: number) => v !== 0 && v !== EMPTY_HASH;

/** Playable characters with data (resolved via PLxxxx hash; unknown hashes only when level > 1). */
export function characters(m: SaveModel, names: NameTable): Character[] {
  const out: Character[] = [];
  for (const u of unitsOf(m, 1301)) {
    const hash = num(m, u);
    const n = nameFor(names, hash);
    const r = (id: number) => num(m, rec(m, id, u.unit));
    const level = r(1308);
    if (n && !/^PL\d{2}00$/.test(n.id)) continue;
    if (!n && level <= 1) continue;
    out.push({
      unit: u.unit, hash, id: n?.id ?? '', name: n?.name ?? '',
      level, exp: r(1303), hp: r(1309), atk: r(1310), msp: r(1321),
    });
  }
  return out.sort((a, b) => b.level - a.level || b.exp - a.exp || a.name.localeCompare(b.name));
}

export const recruited = (cs: Character[]) => cs.filter(c => c.level > 1 || c.exp > 0);

/** Current party from the load-screen summary (meta int 822). */
export function party(m: SaveModel, names: NameTable): string[] {
  const u = rec(m, 822, 0, 'meta');
  if (!u) return [];
  return readAll(m, u).map(v => Number(v) >>> 0).filter(isReal).map(h => nameFor(names, h)?.name ?? `#${h.toString(16)}`);
}

export interface Sigil { unit: number; hash: number; id: string; name: string; level: number; wornBy: string | null }

export function sigils(m: SaveModel, names: NameTable): Sigil[] {
  const out: Sigil[] = [];
  for (const u of unitsOf(m, 2703)) {
    const hash = num(m, u);
    if (!isReal(hash)) continue;
    const n = nameFor(names, hash);
    const worn = num(m, rec(m, 2706, u.unit));
    out.push({
      unit: u.unit, hash, id: n?.id ?? '', name: n?.name ?? `#${hash.toString(16)}`,
      level: num(m, rec(m, 2704, u.unit)),
      wornBy: isReal(worn) ? (nameFor(names, worn)?.name ?? `#${worn.toString(16)}`) : null,
    });
  }
  return out;
}

export interface Material { unit: number; hash: number; id: string; name: string; qty: number }

export function materials(m: SaveModel, names: NameTable): Material[] {
  const out: Material[] = [];
  for (const u of unitsOf(m, 1801)) {
    const hash = num(m, u);
    if (!isReal(hash)) continue;
    const n = nameFor(names, hash);
    out.push({ unit: u.unit, hash, id: n?.id ?? '', name: n?.name ?? `#${hash.toString(16)}`, qty: num(m, rec(m, 1802, u.unit)) });
  }
  return out;
}

export interface Weapon { unit: number; hash: number; id: string; name: string; owner: string; exp: number; uncap: number; awakening: number }

export function weapons(m: SaveModel, names: NameTable): Weapon[] {
  const out: Weapon[] = [];
  for (const u of unitsOf(m, 2803)) {
    const hash = num(m, u);
    if (!isReal(hash)) continue;
    const n = nameFor(names, hash);
    const pl = n?.id.match(/^WEP_(PL\d{4})/)?.[1];
    const owner = pl ? (nameFor(names, hashOf(names, pl))?.name ?? pl) : '';
    out.push({
      unit: u.unit, hash, id: n?.id ?? '', name: n?.name ?? `#${hash.toString(16)}`, owner,
      exp: num(m, rec(m, 2804, u.unit)), uncap: num(m, rec(m, 2805, u.unit)), awakening: num(m, rec(m, 2806, u.unit)),
    });
  }
  return out;
}

function hashOf(names: NameTable, id: string): number {
  for (const [h, e] of names) if (e.id === id) return h;
  return 0;
}

export interface Count { label: string; value: number }

export function countBy<T>(items: T[], key: (t: T) => string | null): Count[] {
  const map = new Map<string, number>();
  for (const it of items) {
    const k = key(it);
    if (k !== null) map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

export function levelHistogram(ss: Sigil[]): Count[] {
  const max = Math.max(15, ...ss.map(s => s.level));
  const bins = Array.from({ length: max }, (_, i) => ({ label: String(i + 1), value: 0 }));
  for (const s of ss) if (s.level >= 1) bins[s.level - 1].value++;
  return bins;
}

export interface Summary {
  playerName: string; rupies: number; characters: number; maxed: number;
  sigils: number; materials: number; weapons: number;
}

export function summary(m: SaveModel, names: NameTable, readName: (u: Unit) => string): Summary {
  const cs = recruited(characters(m, names));
  const nameUnit = rec(m, 1101);
  return {
    playerName: nameUnit ? readName(nameUnit) : '',
    rupies: num(m, rec(m, 1104)),
    characters: cs.length,
    maxed: cs.filter(c => c.level >= MAX_LEVEL).length,
    sigils: sigils(m, names).length,
    materials: materials(m, names).filter(x => x.qty > 0).length,
    weapons: weapons(m, names).length,
  };
}

// ---------- Evolution between two saves ----------
export interface Delta { label: string; before: number; after: number; diff: number }

export interface Evolution {
  rupies: Delta;
  levels: Delta[];
  materials: Delta[];
  sigilsGained: number;
  weaponsGained: number;
}

/** Changes from `older` to `newer`, matched by entity hash (not slot). */
export function evolution(older: SaveModel, newer: SaveModel, names: NameTable): Evolution {
  const d = (label: string, before: number, after: number): Delta => ({ label, before, after, diff: after - before });
  const lvA = new Map(characters(older, names).map(c => [c.hash, c]));
  const levels = characters(newer, names)
    .map(c => d(c.name || `#${c.hash.toString(16)}`, lvA.get(c.hash)?.level ?? 0, c.level))
    .filter(x => x.diff !== 0);
  const qty = (m: SaveModel) => {
    const map = new Map<number, Material>();
    for (const x of materials(m, names)) map.set(x.hash, { ...x, qty: (map.get(x.hash)?.qty ?? 0) + x.qty });
    return map;
  };
  const qa = qty(older), qb = qty(newer);
  const mats: Delta[] = [];
  for (const h of new Set([...qa.keys(), ...qb.keys()])) {
    const a = qa.get(h), b = qb.get(h);
    const delta = d((b ?? a)!.name, a?.qty ?? 0, b?.qty ?? 0);
    if (delta.diff !== 0) mats.push(delta);
  }
  mats.sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff));
  return {
    rupies: d('Rupies', num(older, rec(older, 1104)), num(newer, rec(newer, 1104))),
    levels,
    materials: mats,
    sigilsGained: sigils(newer, names).length - sigils(older, names).length,
    weaponsGained: weapons(newer, names).length - weapons(older, names).length,
  };
}
