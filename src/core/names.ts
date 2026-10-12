// Item / sigil / weapon / character names. Fetched at runtime from the public
// Nenkai/relink-modding repository (not redistributed here) and keyed by the game's
// XXHash32 (seed 20180211) of each internal ID.

const SEED = 20180211;
const BASE = 'https://raw.githubusercontent.com/Nenkai/relink-modding/main/docs/resources/';
const SOURCES = { items: BASE + 'item_id.csv', sigils: BASE + 'sigil_id.csv', models: BASE + 'model_ids.md' };
const CACHE_KEY = 'gbfr-names-v1';
const CACHE_MS = 7 * 24 * 3600 * 1000;

export interface NameEntry { id: string; name: string }
export type NameTable = Map<number, NameEntry>;

const P1 = 2654435761, P2 = 2246822519, P3 = 3266489917, P4 = 668265263, P5 = 374761393;
const mul = (a: number, b: number) => Math.imul(a, b) >>> 0;
const rotl = (x: number, r: number) => ((x << r) | (x >>> (32 - r))) >>> 0;

/** Standard XXHash32. */
export function xxh32(bytes: Uint8Array, seed = SEED): number {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const len = bytes.length;
  let i = 0, h: number;
  const lane = (acc: number, o: number) => mul(rotl((acc + mul(dv.getUint32(o, true), P2)) >>> 0, 13), P1);
  if (len >= 16) {
    let v1 = (seed + P1 + P2) >>> 0, v2 = (seed + P2) >>> 0, v3 = seed >>> 0, v4 = (seed - P1) >>> 0;
    for (; i <= len - 16; i += 16) { v1 = lane(v1, i); v2 = lane(v2, i + 4); v3 = lane(v3, i + 8); v4 = lane(v4, i + 12); }
    h = (rotl(v1, 1) + rotl(v2, 7) + rotl(v3, 12) + rotl(v4, 18)) >>> 0;
  } else h = (seed + P5) >>> 0;
  h = (h + len) >>> 0;
  for (; i <= len - 4; i += 4) h = mul(rotl((h + mul(dv.getUint32(i, true), P3)) >>> 0, 17), P4);
  for (; i < len; i++) h = mul(rotl((h + mul(bytes[i], P5)) >>> 0, 11), P1);
  h ^= h >>> 15; h = mul(h, P2); h ^= h >>> 13; h = mul(h, P3); h ^= h >>> 16;
  return h >>> 0;
}

export const hashId = (id: string) => xxh32(new TextEncoder().encode(id));

const unquote = (s: string) => s.trim().replace(/^"(.*)"$/s, '$1').replace(/""/g, '"').replace(/^"(.*)"$/, '$1');

/** Parses the relink-modding sources into [internal id, display name] pairs. */
export function parseSources(itemsCsv: string, sigilsCsv: string, modelsMd: string): [string, string][] {
  const out: [string, string][] = [];
  for (const csv of [itemsCsv, sigilsCsv]) {
    for (const line of csv.split(/\r?\n/).slice(1)) {
      const p = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
      if (p.length < 2 || !p[0].trim()) continue;
      out.push([p[0].trim(), unquote(p[1]).replace(/\s*\(ITEM_\d+_\d+\)$/, '')]);
    }
  }
  for (const m of modelsMd.matchAll(/^(PL\d{4}) -- ([^\r\n]+)/gm)) {
    out.push([m[1], m[2].replace(/\s*\(\d+\.\d+\.\d+\)\s*$/, '').replace(/ \(Rebel\)$/, '').trim()]);
  }
  return out;
}

export function buildTable(pairs: [string, string][]): NameTable {
  const t: NameTable = new Map();
  for (const [id, name] of pairs) t.set(hashId(id), { id, name });
  return t;
}

function readCache(): [string, string][] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as { at: number; pairs: [string, string][] };
    return Date.now() - c.at < CACHE_MS && Array.isArray(c.pairs) ? c.pairs : null;
  } catch { return null; }
}

function writeCache(pairs: [string, string][]) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), pairs })); } catch { /* storage unavailable */ }
}

export type NamesState = { status: 'loading' | 'ready' | 'offline'; table: NameTable };

/** Loads names (cache first, then network). Never throws: offline yields an empty table. */
export async function loadNames(): Promise<NamesState> {
  const cached = readCache();
  if (cached) return { status: 'ready', table: buildTable(cached) };
  try {
    const [a, b, c] = await Promise.all(Object.values(SOURCES).map(async u => {
      const r = await fetch(u, { cache: 'force-cache' });
      if (!r.ok) throw new Error(String(r.status));
      return r.text();
    }));
    const pairs = parseSources(a, b, c);
    if (!pairs.length) throw new Error('empty');
    writeCache(pairs);
    return { status: 'ready', table: buildTable(pairs) };
  } catch {
    return { status: 'offline', table: new Map() };
  }
}

export const NAME_SOURCE_URL = 'https://github.com/Nenkai/relink-modding';
