// Reader/writer for Granblue Fantasy: Relink save files (SaveDataBinary FlatBuffers).
// Format reference: github.com/Nenkai/GBFRDataTools (SaveFile.cs, SaveDataBinary.fbs).

export type ValueType = 'bool' | 'sbyte' | 'ubyte' | 'short' | 'ushort' | 'int' | 'uint' | 'long' | 'ulong' | 'float';
export type SectionName = 'meta' | 'main';
export type Value = number | bigint;

export interface Section { name: SectionName; start: number; size: number }

export interface Unit {
  sec: SectionName;
  type: ValueType;
  size: number;
  id: number;
  unit: number;
  count: number;
  /** Absolute byte offset of the first value. */
  off: number;
}

export interface SaveModel {
  name: string;
  buf: Uint8Array;
  dv: DataView;
  secs: Section[];
  units: Unit[];
  byKey: Map<string, Unit>;
  byId: Map<string, Unit[]>;
  /** True for SaveDataN.dat (has meta + main sections and an integrity hash). */
  isSlot: boolean;
}

// Root table fields of SaveDataBinary -> element type and width.
const TABLES: Record<number, [ValueType, number]> = {
  1: ['bool', 1], 2: ['sbyte', 1], 3: ['ubyte', 1], 4: ['short', 2], 5: ['ushort', 2],
  6: ['int', 4], 7: ['uint', 4], 8: ['long', 8], 9: ['ulong', 8], 10: ['float', 4],
};

export const VALUE_TYPES: ValueType[] = ['bool', 'sbyte', 'ubyte', 'short', 'ushort', 'int', 'uint', 'long', 'ulong', 'float'];

/** Empty-string hash used by the game as "none". */
export const EMPTY_HASH = 2289754288;

function sections(dv: DataView): Section[] {
  // SaveDataN.dat: u32 version, u64 SteamID, u32 0, u32 subversion,
  //                i64 metaOffset, i64 mainOffset, i64 metaSize, i64 mainSize
  if (dv.byteLength > 0x100000) {
    return [
      { name: 'meta', start: Number(dv.getBigInt64(0x14, true)), size: Number(dv.getBigInt64(0x24, true)) },
      { name: 'main', start: Number(dv.getBigInt64(0x1c, true)), size: Number(dv.getBigInt64(0x2c, true)) },
    ];
  }
  // SystemData.dat / GraphicSetting.vdat: 8-byte header + one FlatBuffer
  return [{ name: 'main', start: 8, size: dv.byteLength - 8 }];
}

export const keyOf = (sec: SectionName, id: number, unit: number) => `${sec}|${id}|${unit}`;

export function parseSave(buf: Uint8Array, name = 'SaveData1.dat'): SaveModel {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const secs = sections(dv);
  const units: Unit[] = [];
  for (const sec of secs) {
    const B = sec.start;
    if (B < 0 || B + sec.size > buf.byteLength) throw new Error('section out of bounds');
    const u32 = (o: number) => dv.getUint32(B + o, true);
    const vtable = (t: number) => {
      const vt = t - dv.getInt32(B + t, true);
      const vs = dv.getUint16(B + vt, true);
      const f: number[] = [];
      for (let i = 0; i < (vs - 4) / 2; i++) f.push(dv.getUint16(B + vt + 4 + 2 * i, true));
      return f;
    };
    const root = u32(0);
    const rf = vtable(root);
    for (const [fi, [type, size]] of Object.entries(TABLES)) {
      const fo = rf[+fi];
      if (!fo) continue;
      const v = root + fo + u32(root + fo);
      const n = u32(v);
      for (let i = 0; i < n; i++) {
        const e = v + 4 + 4 * i + u32(v + 4 + 4 * i);
        const f = vtable(e);
        const id = f[0] ? u32(e + f[0]) : 0;
        const unit = f[1] ? u32(e + f[1]) : 0;
        let count = 0, off = 0;
        if (f[2]) { const va = e + f[2] + u32(e + f[2]); count = u32(va); off = B + va + 4; }
        units.push({ sec: sec.name, type, size, id, unit, count, off });
      }
    }
  }
  const byKey = new Map<string, Unit>();
  const byId = new Map<string, Unit[]>();
  for (const u of units) {
    byKey.set(keyOf(u.sec, u.id, u.unit), u);
    const k = `${u.sec}|${u.id}`;
    let list = byId.get(k);
    if (!list) byId.set(k, (list = []));
    list.push(u);
  }
  return { name, buf, dv, secs, units, byKey, byId, isSlot: secs.length === 2 };
}

export const rec = (m: SaveModel, id: number, unit = 0, sec: SectionName = 'main') => m.byKey.get(keyOf(sec, id, unit));
export const unitsOf = (m: SaveModel, id: number, sec: SectionName = 'main') => m.byId.get(`${sec}|${id}`) ?? [];

export function read(m: SaveModel, u: Unit, i = 0): Value {
  const o = u.off + i * u.size, dv = m.dv;
  switch (u.type) {
    case 'bool': return dv.getUint8(o) !== 0 ? 1 : 0;
    case 'ubyte': return dv.getUint8(o);
    case 'sbyte': return dv.getInt8(o);
    case 'short': return dv.getInt16(o, true);
    case 'ushort': return dv.getUint16(o, true);
    case 'int': return dv.getInt32(o, true);
    case 'uint': return dv.getUint32(o, true);
    case 'long': return dv.getBigInt64(o, true);
    case 'ulong': return dv.getBigUint64(o, true);
    case 'float': return dv.getFloat32(o, true);
  }
}

/** Numeric read for scalar lookups; returns 0 when the unit is missing. */
export const num = (m: SaveModel, u: Unit | undefined, i = 0): number => (u && u.count > i ? Number(read(m, u, i)) : 0);

export const readAll = (m: SaveModel, u: Unit): Value[] => Array.from({ length: u.count }, (_, i) => read(m, u, i));

export function writeRaw(m: SaveModel, u: Unit, i: number, val: Value) {
  const o = u.off + i * u.size, dv = m.dv;
  switch (u.type) {
    case 'bool': case 'ubyte': dv.setUint8(o, Number(val)); break;
    case 'sbyte': dv.setInt8(o, Number(val)); break;
    case 'short': dv.setInt16(o, Number(val), true); break;
    case 'ushort': dv.setUint16(o, Number(val), true); break;
    case 'int': dv.setInt32(o, Number(val), true); break;
    case 'uint': dv.setUint32(o, Number(val), true); break;
    case 'long': dv.setBigInt64(o, BigInt(val), true); break;
    case 'ulong': dv.setBigUint64(o, BigInt(val), true); break;
    case 'float': dv.setFloat32(o, Number(val), true); break;
  }
}

const LIMITS: Partial<Record<ValueType, [number, number]>> = {
  bool: [0, 1], ubyte: [0, 255], sbyte: [-128, 127], short: [-32768, 32767], ushort: [0, 65535],
  int: [-2147483648, 2147483647], uint: [0, 4294967295],
};

export class ValueError extends Error {
  constructor(public code: 'nan' | 'int' | 'range', public range?: [string, string]) { super(code); }
}

export function parseValue(type: ValueType, input: string): Value {
  const text = input.trim();
  if (type === 'ulong' || type === 'long') {
    if (!/^-?\d+$/.test(text)) throw new ValueError('int');
    const b = BigInt(text);
    const [lo, hi] = type === 'ulong' ? [0n, 2n ** 64n - 1n] : [-(2n ** 63n), 2n ** 63n - 1n];
    if (b < lo || b > hi) throw new ValueError('range', [String(lo), String(hi)]);
    return b;
  }
  if (type === 'bool' && /^(true|false)$/i.test(text)) return /^true$/i.test(text) ? 1 : 0;
  const x = Number(text);
  if (text === '' || !Number.isFinite(x)) throw new ValueError('nan');
  if (type === 'float') return x;
  if (!Number.isInteger(x)) throw new ValueError('int');
  const [lo, hi] = LIMITS[type]!;
  if (x < lo || x > hi) throw new ValueError('range', [String(lo), String(hi)]);
  return x;
}

export function formatValue(u: Unit, v: Value): string {
  if (u.type === 'float') return String(Math.round(Number(v) * 1e6) / 1e6);
  return String(v);
}

// ---------- Strings stored as byte / ushort arrays ----------
const isStringish = (u: Unit) => u.count >= 8 && (u.type === 'sbyte' || u.type === 'ubyte' || u.type === 'ushort');

export function readString(m: SaveModel, u: Unit): string {
  const vals = readAll(m, u).map(Number);
  const zero = vals.indexOf(0);
  const body = vals.slice(0, zero < 0 ? vals.length : zero);
  if (u.type === 'ushort') return String.fromCharCode(...body);
  return new TextDecoder('utf-8').decode(new Uint8Array(body.map(v => v & 255)));
}

export function looksText(m: SaveModel, u: Unit): boolean {
  if (!isStringish(u)) return false;
  const s = readString(m, u);
  return s.length > 0 && !/[\x00-\x08\x0e-\x1f�]/.test(s);
}

/** Encodes text into the unit's array; throws with the max length when it does not fit. */
export function encodeString(u: Unit, s: string): number[] {
  const codes = u.type === 'ushort' ? Array.from(s, c => c.charCodeAt(0)) : Array.from(new TextEncoder().encode(s));
  if (codes.length > u.count - 1) throw new ValueError('range', ['0', String(u.count - 1)]);
  const out = codes.concat(new Array(u.count - codes.length).fill(0));
  // sbyte arrays store UTF-8 bytes as signed values
  return u.type === 'sbyte' ? out.map(c => (c > 127 ? c - 256 : c)) : out;
}
