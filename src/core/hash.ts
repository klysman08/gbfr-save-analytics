import { rec, num, type SaveModel } from './save';

// Integrity: the end of the main slot stores 10 XXHash64 hashes (seed 0x2F1A43EBCD), each over a
// different span. The game checks only index (uint 1003 % 10); without it the save reads as corrupted.
const HASH_SEED = 0x2F1A43EBCDn;
export const HASH_SEED_ID = 1003;
const HASH_SECTIONS: [start: number, excluded: number][] = [
  [0x58, 0x80], [0x30, 0xA0], [0x28, 0x30], [0x38, 0xC0], [0x40, 0xB0],
  [0x68, 0x50], [0x48, 0x60], [0x70, 0x90], [0x50, 0x40], [0x60, 0x70],
];

const M = (1n << 64n) - 1n;
const P1 = 11400714785074694791n, P2 = 14029467366897019727n, P3 = 1609587929392839161n, P4 = 9650029242287828579n, P5 = 2870177450012600261n;
const rotl = (x: bigint, r: number) => ((x << BigInt(r)) | (x >> BigInt(64 - r))) & M;
const round = (acc: bigint, lane: bigint) => (rotl((acc + lane * P2) & M, 31) * P1) & M;
const merge = (acc: bigint, v: bigint) => ((acc ^ round(0n, v)) * P1 + P4) & M;

/** Standard XXHash64 over dv[off, off+len). */
export function xxh64(dv: DataView, off: number, len: number, seed: bigint): bigint {
  const u64 = (i: number) => dv.getBigUint64(off + i, true);
  let i = 0, h: bigint;
  if (len >= 32) {
    let v1 = (seed + P1 + P2) & M, v2 = (seed + P2) & M, v3 = seed, v4 = (seed - P1) & M;
    for (; i <= len - 32; i += 32) {
      v1 = round(v1, u64(i)); v2 = round(v2, u64(i + 8)); v3 = round(v3, u64(i + 16)); v4 = round(v4, u64(i + 24));
    }
    h = (rotl(v1, 1) + rotl(v2, 7) + rotl(v3, 12) + rotl(v4, 18)) & M;
    h = merge(merge(merge(merge(h, v1), v2), v3), v4);
  } else h = (seed + P5) & M;
  h = (h + BigInt(len)) & M;
  for (; i + 8 <= len; i += 8) h = (rotl(h ^ round(0n, u64(i)), 27) * P1 + P4) & M;
  if (i + 4 <= len) { h = (rotl(h ^ ((BigInt(dv.getUint32(off + i, true)) * P1) & M), 23) * P2 + P3) & M; i += 4; }
  for (; i < len; i++) h = (rotl(h ^ ((BigInt(dv.getUint8(off + i)) * P5) & M), 11) * P1) & M;
  h ^= h >> 33n; h = (h * P2) & M; h ^= h >> 29n; h = (h * P3) & M; h ^= h >> 32n;
  return h;
}

export interface HashStatus { index: number; stored: bigint; computed: bigint; ok: boolean }

/** Checks the hash the game validates; with fix=true writes the computed value. Null for files without a hash. */
export function checkHash(m: SaveModel, fix = false): HashStatus | null {
  const sec = m.secs.find(s => s.name === 'main');
  const seed = rec(m, HASH_SEED_ID);
  if (!m.isSlot || !sec || !seed || seed.type !== 'uint') return null;
  const hashesOffset = Number(m.dv.getBigUint64(sec.start + sec.size - 0x14, true));
  const index = num(m, seed) % HASH_SECTIONS.length;
  const [start, excluded] = HASH_SECTIONS[index];
  const computed = xxh64(m.dv, sec.start + start, hashesOffset - excluded - start, HASH_SEED);
  const at = sec.start + hashesOffset + 8 * index;
  const stored = m.dv.getBigUint64(at, true);
  if (fix) m.dv.setBigUint64(at, computed, true);
  return { index, stored, computed, ok: stored === computed };
}

export const hex = (b: bigint) => b.toString(16).padStart(16, '0');
