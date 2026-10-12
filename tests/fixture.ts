// Builds synthetic Relink-format saves for tests (no real player data is ever committed).
import { hashId } from '../src/core/names';

export type FieldIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export interface FixtureUnit { table: FieldIndex; id: number; unit?: number; values: (number | bigint)[] }

const WIDTH: Record<FieldIndex, number> = { 1: 1, 2: 1, 3: 1, 4: 2, 5: 2, 6: 4, 7: 4, 8: 8, 9: 8, 10: 4 };

class Writer {
  buf = new Uint8Array(1 << 16);
  dv = new DataView(this.buf.buffer);
  pos = 0;
  align(n: number) { while (this.pos % n) this.pos++; }
  u16(v: number, at = this.pos) { this.dv.setUint16(at, v, true); if (at === this.pos) this.pos += 2; }
  u32(v: number, at = this.pos) { this.dv.setUint32(at, v >>> 0, true); if (at === this.pos) this.pos += 4; }
  i32(v: number, at = this.pos) { this.dv.setInt32(at, v, true); if (at === this.pos) this.pos += 4; }
  bytes() { return this.buf.slice(0, this.pos); }
}

function writeValue(w: Writer, table: FieldIndex, v: number | bigint) {
  const o = w.pos;
  switch (table) {
    case 1: case 3: w.dv.setUint8(o, Number(v)); break;
    case 2: w.dv.setInt8(o, Number(v)); break;
    case 4: w.dv.setInt16(o, Number(v), true); break;
    case 5: w.dv.setUint16(o, Number(v), true); break;
    case 6: w.dv.setInt32(o, Number(v), true); break;
    case 7: w.dv.setUint32(o, Number(v) >>> 0, true); break;
    case 8: w.dv.setBigInt64(o, BigInt(v), true); break;
    case 9: w.dv.setBigUint64(o, BigInt(v), true); break;
    case 10: w.dv.setFloat32(o, Number(v), true); break;
  }
  w.pos += WIDTH[table];
}

/** Minimal SaveDataBinary FlatBuffer: all references point forward, one shared entry vtable. */
export function buildFlatBuffer(units: FixtureUnit[]): Uint8Array {
  const w = new Writer();
  w.u32(0); // root offset, patched below
  // root vtable: 11 fields (version + 10 tables)
  const rootVt = w.pos;
  w.u16(4 + 2 * 11); w.u16(4 + 4 * 11);
  for (let f = 0; f < 11; f++) w.u16(4 + 4 * f);
  // entry vtable: id, unit, values
  w.align(4);
  const entryVt = w.pos;
  w.u16(4 + 2 * 3); w.u16(16); w.u16(4); w.u16(8); w.u16(12);
  w.align(4);
  const root = w.pos;
  w.u32(root, 0);
  w.i32(root - rootVt);
  w.u32(1); // version
  const tableSlot: Record<number, number> = {};
  for (let f = 1; f <= 10; f++) { tableSlot[f] = w.pos; w.u32(0); }
  const byTable = new Map<FieldIndex, FixtureUnit[]>();
  for (const u of units) byTable.set(u.table, [...(byTable.get(u.table) ?? []), u]);
  // vectors of entry offsets
  const pending: { slot: number; u: FixtureUnit }[] = [];
  for (let n = 1; n <= 10; n++) {
    const f = n as FieldIndex;
    const list = byTable.get(f) ?? [];
    w.align(4);
    w.u32(w.pos - tableSlot[f], tableSlot[f]);
    w.u32(list.length);
    for (const u of list) { pending.push({ slot: w.pos, u }); w.u32(0); }
  }
  // entries + value vectors
  for (const { slot, u } of pending) {
    w.align(4);
    const e = w.pos;
    w.u32(e - slot, slot);
    w.i32(e - entryVt);
    w.u32(u.id);
    w.u32(u.unit ?? 0);
    const valSlot = w.pos;
    w.u32(0);
    const width = WIDTH[u.table];
    // align so the data after the u32 length is aligned to its width
    while ((w.pos + 4) % Math.max(4, width)) w.pos++;
    w.u32(w.pos - valSlot, valSlot);
    w.u32(u.values.length);
    for (const v of u.values) writeValue(w, u.table, v);
  }
  w.align(4);
  return w.bytes();
}

/** Full SaveData1.dat-shaped file: header, meta + main sections, hash footer, padded past 1 MiB. */
export function buildSlotSave(main: FixtureUnit[], meta: FixtureUnit[] = []): Uint8Array {
  const metaFb = buildFlatBuffer(meta);
  const mainFb = buildFlatBuffer(main);
  const hashesOffset = mainFb.length;
  const slotSize = hashesOffset + 10 * 8 + 0x14;
  const metaOff = 0x34, mainOff = 0x34 + 0x1400;
  const file = new Uint8Array(0x110000);
  const dv = new DataView(file.buffer);
  dv.setUint32(0, 2, true);
  dv.setBigUint64(4, 0n, true);
  dv.setUint32(0x10, 2, true);
  dv.setBigInt64(0x14, BigInt(metaOff), true);
  dv.setBigInt64(0x1c, BigInt(mainOff), true);
  dv.setBigInt64(0x24, BigInt(metaFb.length), true);
  dv.setBigInt64(0x2c, BigInt(slotSize), true);
  file.set(metaFb, metaOff);
  file.set(mainFb, mainOff);
  const footer = mainOff + hashesOffset + 10 * 8;
  dv.setBigUint64(footer, BigInt(hashesOffset), true);
  dv.setBigUint64(footer + 8, 0x50n, true);
  dv.setUint32(footer + 16, 1, true);
  return file;
}

export const NAME_PAIRS: [string, string][] = [
  ['PL0100', 'Djeeta'], ['PL0200', 'Katalina'], ['PL0300', 'Rackam'],
  ['ITEM_01_0000', 'Cobblestone'], ['ITEM_01_0001', 'Whorlshroom'],
  ['GEEN_003_04', 'Critical Hit Rate V'], ['GEEN_005_04', 'Enmity V'],
  ['WEP_PL0200_01', 'Rukalsa'],
];

const H = (id: string) => hashId(id);

/** A small but representative save: 3 characters, 2 materials, 3 sigils, 1 weapon, name, rupies, seed. */
export function sampleUnits(rupies = 2464174): FixtureUnit[] {
  const name = Array.from('Djeeta', c => c.charCodeAt(0));
  return [
    { table: 5, id: 1101, values: [...name, ...new Array(32 - name.length).fill(0)] },
    { table: 6, id: 1104, values: [rupies] },
    { table: 7, id: 1003, values: [55860511] },
    ...[['PL0100', 100, 8400000], ['PL0200', 100, 8400000], ['PL0300', 62, 796665]].flatMap(([id, lvl, exp], i) => [
      { table: 7 as const, id: 1301, unit: 10001 + i, values: [H(id as string)] },
      { table: 6 as const, id: 1308, unit: 10001 + i, values: [lvl as number] },
      { table: 6 as const, id: 1303, unit: 10001 + i, values: [exp as number] },
    ]),
    { table: 7, id: 1801, unit: 0, values: [H('ITEM_01_0000')] }, { table: 6, id: 1802, unit: 0, values: [101] },
    { table: 7, id: 1801, unit: 1, values: [H('ITEM_01_0001')] }, { table: 6, id: 1802, unit: 1, values: [3] },
    { table: 7, id: 2703, unit: 30000, values: [H('GEEN_003_04')] }, { table: 6, id: 2704, unit: 30000, values: [11] }, { table: 7, id: 2706, unit: 30000, values: [H('PL0200')] },
    { table: 7, id: 2703, unit: 30001, values: [H('GEEN_003_04')] }, { table: 6, id: 2704, unit: 30001, values: [15] }, { table: 7, id: 2706, unit: 30001, values: [2289754288] },
    { table: 7, id: 2703, unit: 30002, values: [H('GEEN_005_04')] }, { table: 6, id: 2704, unit: 30002, values: [4] }, { table: 7, id: 2706, unit: 30002, values: [2289754288] },
    { table: 7, id: 2803, unit: 40000, values: [H('WEP_PL0200_01')] }, { table: 7, id: 2804, unit: 40000, values: [162540] },
    { table: 9, id: 7201, values: [1791747059000n] },
    { table: 10, id: 2509, values: [271.5, 15.25, 562.5, -2.75] },
  ];
}
