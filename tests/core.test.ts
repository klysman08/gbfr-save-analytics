import { describe, expect, it } from 'vitest';
import { parseSave, rec, read, num, readString, encodeString, parseValue, unitsOf } from '../src/core/save';
import { checkHash, hex, xxh64 } from '../src/core/hash';
import { buildTable, hashId, parseSources, xxh32 } from '../src/core/names';
import { EditStore } from '../src/core/edits';
import { characters, evolution, materials, sigils, weapons } from '../src/core/analytics';
import { buildSlotSave, NAME_PAIRS, sampleUnits } from './fixture';

const enc = (s: string) => new TextEncoder().encode(s);
const dvOf = (b: Uint8Array) => new DataView(b.buffer, b.byteOffset, b.byteLength);

describe('hashes', () => {
  it('xxh64 matches reference vectors', () => {
    expect(hex(xxh64(dvOf(new Uint8Array()), 0, 0, 0n))).toBe('ef46db3751d8e999');
    expect(hex(xxh64(dvOf(enc('abc')), 0, 3, 0n))).toBe('44bc2cf5ad770999');
  });
  it('xxh32 with the game seed reproduces known IDs', () => {
    expect(xxh32(enc(''), 0)).toBe(0x02cc5d05);
    expect(hashId('')).toBe(2289754288); // the game's "none" value
    expect(hashId('PL0100')).toBe(2762783350); // Djeeta
  });
});

describe('save parsing', () => {
  const file = () => parseSave(buildSlotSave(sampleUnits(), [{ table: 6, id: 822, values: [hashId('PL0100'), hashId('PL0200'), 0, 0] }]));

  it('reads typed units from both sections', () => {
    const m = file();
    expect(m.isSlot).toBe(true);
    expect(num(m, rec(m, 1104))).toBe(2464174);
    expect(readString(m, rec(m, 1101)!)).toBe('Djeeta');
    expect(read(m, rec(m, 7201)!)).toBe(1791747059000n);
    expect(num(m, rec(m, 2509), 1)).toBeCloseTo(15.25);
    expect(unitsOf(m, 1301)).toHaveLength(3);
    expect(rec(m, 822, 0, 'meta')?.count).toBe(4);
  });

  it('validates input ranges', () => {
    expect(() => parseValue('ubyte', '256')).toThrow();
    expect(() => parseValue('int', '1.5')).toThrow();
    expect(parseValue('ulong', '18446744073709551615')).toBe(18446744073709551615n);
    expect(parseValue('bool', 'true')).toBe(1);
  });

  it('encodes strings within the array length', () => {
    const m = file();
    const u = rec(m, 1101)!;
    expect(encodeString(u, 'Gran').slice(0, 5)).toEqual([71, 114, 97, 110, 0]);
    expect(() => encodeString(u, 'x'.repeat(40))).toThrow();
  });
});

describe('integrity hash', () => {
  it('detects an edit and fixes it, matching what the game checks', () => {
    const m = parseSave(buildSlotSave(sampleUnits()));
    checkHash(m, true); // fixture starts without a hash
    expect(checkHash(m)?.ok).toBe(true);
    expect(checkHash(m)?.index).toBe(55860511 % 10);

    const edits = new EditStore(m);
    edits.apply(rec(m, 1104)!, 0, 9999999);
    expect(num(m, rec(m, 1104))).toBe(9999999);
    expect(checkHash(m)?.ok).toBe(false);

    checkHash(m, true);
    const after = parseSave(m.buf);
    expect(checkHash(after)?.ok).toBe(true);
    expect(num(after, rec(after, 1104))).toBe(9999999);
  });

  it('undo restores the original bytes', () => {
    const m = parseSave(buildSlotSave(sampleUnits()));
    const before = m.buf.slice();
    const edits = new EditStore(m);
    edits.apply(rec(m, 1104)!, 0, 1);
    edits.applyMany(rec(m, 1101)!, encodeString(rec(m, 1101)!, 'Gran'));
    expect(edits.size).toBeGreaterThan(1);
    edits.undoAll();
    expect(m.buf).toEqual(before);
  });
});

describe('names + analytics', () => {
  const names = buildTable(NAME_PAIRS);

  it('parses the relink-modding sources', () => {
    const pairs = parseSources('Id,Name,Id Hash\nITEM_01_0000,Cobblestone,X\nWEP_X,"""Rukalsa""",Y', 'Id,Name\n', 'PL0100 -- Djeeta (Rebel)\nPL2100 -- Sandalphon (1.3.0)\n');
    expect(pairs).toEqual([['ITEM_01_0000', 'Cobblestone'], ['WEP_X', 'Rukalsa'], ['PL0100', 'Djeeta'], ['PL2100', 'Sandalphon']]);
  });

  it('summarises characters, materials, sigils and weapons', () => {
    const m = parseSave(buildSlotSave(sampleUnits()));
    const cs = characters(m, names);
    expect(cs.map(c => [c.name, c.level])).toEqual([['Djeeta', 100], ['Katalina', 100], ['Rackam', 62]]);
    expect(materials(m, names).map(x => [x.name, x.qty])).toEqual([['Cobblestone', 101], ['Whorlshroom', 3]]);
    const ss = sigils(m, names);
    expect(ss).toHaveLength(3);
    expect(ss[0].wornBy).toBe('Katalina');
    expect(ss[1].wornBy).toBeNull();
    expect(weapons(m, names)[0]).toMatchObject({ name: 'Rukalsa', owner: 'Katalina', exp: 162540 });
  });

  it('computes evolution between two saves', () => {
    const older = parseSave(buildSlotSave(sampleUnits(2784174)));
    const newer = parseSave(buildSlotSave(sampleUnits(2464174)));
    const ev = evolution(older, newer, names);
    expect(ev.rupies.diff).toBe(-320000);
    expect(ev.materials).toEqual([]);
  });
});
