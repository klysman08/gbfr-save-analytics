#!/usr/bin/env node
// Leitor/editor de saves do Granblue Fantasy: Relink (PC).
// O save não é criptografado: é um container com seções FlatBuffers
// ("SaveDataBinary"), cada uma com tabelas tipadas de unidades {id, unit, values[]}.
//
// Uso:
//   node gbfr-save.cjs info  <save>
//   node gbfr-save.cjs dump  <save> [saida.json] [--section main|meta]
//   node gbfr-save.cjs find  <save> <valor> [--type int|uint|float|ulong|...]
//   node gbfr-save.cjs get   <save> <tipo> <id> [unit]
//   node gbfr-save.cjs set   <save> <tipo> <id> <unit|-> <indice> <valor> [--section main|meta]
//   node gbfr-save.cjs diff  <saveA> <saveB>
//   node gbfr-save.cjs check <save>            confere o hash de integridade
//   node gbfr-save.cjs fixhash <save>          recalcula o hash (conserta save editado)
//
// "set" edita no lugar (mesmo tamanho), recalcula o hash de integridade e cria
// <save>.bak-<timestamp> antes de gravar.
//
// Integridade (formato documentado em github.com/Nenkai/GBFRDataTools, SaveFile.cs):
// o fim da seção principal guarda 10 hashes XXHash64 (seed 0x2F1A43EBCD), cada um
// sobre um trecho diferente; o jogo confere só o de índice (uint 1003 % 10).

const fs = require('fs');

// Índice do campo na tabela raiz (SaveDataBinary) -> tipo do elemento.
const TABLES = {
  1: { name: 'bool', size: 1 },
  2: { name: 'sbyte', size: 1 },
  3: { name: 'ubyte', size: 1 },
  4: { name: 'short', size: 2 },
  5: { name: 'ushort', size: 2 },
  6: { name: 'int', size: 4 },
  7: { name: 'uint', size: 4 },
  8: { name: 'long', size: 8 },
  9: { name: 'ulong', size: 8 },
  10: { name: 'float', size: 4 },
};

const HASH_SEED = 0x2F1A43EBCDn;
const HASH_SEED_ID = 1003;
// [início, bytes excluídos antes do bloco de hashes] de cada um dos 10 trechos
const HASH_SECTIONS = [[0x58, 0x80], [0x30, 0xA0], [0x28, 0x30], [0x38, 0xC0], [0x40, 0xB0], [0x68, 0x50], [0x48, 0x60], [0x70, 0x90], [0x50, 0x40], [0x60, 0x70]];

// XXHash64 padrão (BigInt).
function xxh64(buf, seed) {
  const M = (1n << 64n) - 1n;
  const P1 = 11400714785074694791n, P2 = 14029467366897019727n, P3 = 1609587929392839161n, P4 = 9650029242287828579n, P5 = 2870177450012600261n;
  const rotl = (x, r) => ((x << BigInt(r)) | (x >> BigInt(64 - r))) & M;
  const round = (acc, lane) => (rotl((acc + lane * P2) & M, 31) * P1) & M;
  const merge = (acc, v) => ((acc ^ round(0n, v)) * P1 + P4) & M;
  const len = buf.length;
  let i = 0, h;
  if (len >= 32) {
    let v1 = (seed + P1 + P2) & M, v2 = (seed + P2) & M, v3 = seed, v4 = (seed - P1) & M;
    for (; i <= len - 32; i += 32) {
      v1 = round(v1, buf.readBigUInt64LE(i)); v2 = round(v2, buf.readBigUInt64LE(i + 8));
      v3 = round(v3, buf.readBigUInt64LE(i + 16)); v4 = round(v4, buf.readBigUInt64LE(i + 24));
    }
    h = (rotl(v1, 1) + rotl(v2, 7) + rotl(v3, 12) + rotl(v4, 18)) & M;
    h = merge(merge(merge(merge(h, v1), v2), v3), v4);
  } else h = (seed + P5) & M;
  h = (h + BigInt(len)) & M;
  for (; i + 8 <= len; i += 8) h = (rotl(h ^ round(0n, buf.readBigUInt64LE(i)), 27) * P1 + P4) & M;
  if (i + 4 <= len) { h = (rotl(h ^ ((BigInt(buf.readUInt32LE(i)) * P1) & M), 23) * P2 + P3) & M; i += 4; }
  for (; i < len; i++) h = (rotl(h ^ ((BigInt(buf[i]) * P5) & M), 11) * P1) & M;
  h ^= h >> 33n; h = (h * P2) & M; h ^= h >> 29n; h = (h * P3) & M; h ^= h >> 32n;
  return h;
}

// Confere (e opcionalmente corrige) o hash que o jogo valida. Retorna {idx, stored, computed}.
function checkHash(d, units, fix) {
  const sec = sections(d).find(s => s.name === 'main');
  const seedUnit = units.find(u => u.section === 'main' && u.type === 'uint' && u.id === HASH_SEED_ID);
  if (!sec || sec.start === 8 || !seedUnit) return null;
  const slot = d.subarray(sec.start, sec.start + sec.size);
  const hashesOffset = Number(slot.readBigUInt64LE(slot.length - 0x14));
  const idx = seedUnit.values[0] % HASH_SECTIONS.length;
  const [start, sub] = HASH_SECTIONS[idx];
  const computed = xxh64(slot.subarray(start, hashesOffset - sub), HASH_SEED);
  const stored = slot.readBigUInt64LE(hashesOffset + 8 * idx);
  if (fix && computed !== stored) slot.writeBigUInt64LE(computed, hashesOffset + 8 * idx);
  return { idx, stored, computed };
}
const TYPE_TO_FIELD = Object.fromEntries(Object.entries(TABLES).map(([k, v]) => [v.name, +k]));

function readElem(b, o, type) {
  switch (type) {
    case 'bool': return b[o] !== 0;
    case 'ubyte': return b.readUInt8(o);
    case 'sbyte': return b.readInt8(o);
    case 'short': return b.readInt16LE(o);
    case 'ushort': return b.readUInt16LE(o);
    case 'int': return b.readInt32LE(o);
    case 'uint': return b.readUInt32LE(o);
    case 'long': return b.readBigInt64LE(o).toString();
    case 'ulong': return b.readBigUInt64LE(o).toString();
    case 'float': return b.readFloatLE(o);
  }
}

function writeElem(b, o, type, raw) {
  switch (type) {
    case 'bool': b[o] = /^(1|true)$/i.test(raw) ? 1 : 0; break;
    case 'ubyte': b.writeUInt8(+raw, o); break;
    case 'sbyte': b.writeInt8(+raw, o); break;
    case 'short': b.writeInt16LE(+raw, o); break;
    case 'ushort': b.writeUInt16LE(+raw, o); break;
    case 'int': b.writeInt32LE(+raw, o); break;
    case 'uint': b.writeUInt32LE(+raw >>> 0, o); break;
    case 'long': b.writeBigInt64LE(BigInt(raw), o); break;
    case 'ulong': b.writeBigUInt64LE(BigInt(raw), o); break;
    case 'float': b.writeFloatLE(+raw, o); break;
  }
}

// Retorna [{name, start, size}] das seções FlatBuffers do arquivo.
function sections(d) {
  // SaveDataN.dat: u32 versão, u64 SteamID, u32 0, u32 subversão,
  //                i64 offsetMeta, i64 offsetMain, i64 tamanhoMeta, i64 tamanhoMain
  if (d.length > 0x100000) {
    return [
      { name: 'meta', start: Number(d.readBigInt64LE(0x14)), size: Number(d.readBigInt64LE(0x24)) },
      { name: 'main', start: Number(d.readBigInt64LE(0x1c)), size: Number(d.readBigInt64LE(0x2c)) },
    ];
  }
  // SystemData.dat / GraphicSetting.vdat: header de 8 bytes + um FlatBuffer
  return [{ name: 'main', start: 8, size: d.length - 8 }];
}

function vtable(b, t) {
  const vt = t - b.readInt32LE(t);
  const vs = b.readUInt16LE(vt);
  const f = [];
  for (let i = 0; i < (vs - 4) / 2; i++) f.push(b.readUInt16LE(vt + 4 + 2 * i));
  return f;
}

// Lê todas as unidades de uma seção. Cada unidade guarda o offset absoluto dos valores.
function parseSection(d, sec) {
  const b = d.subarray(sec.start, sec.start + sec.size);
  const root = b.readUInt32LE(0);
  const rf = vtable(b, root);
  const units = [];
  for (const [fi, t] of Object.entries(TABLES)) {
    const fo = rf[fi];
    if (!fo) continue;
    const p = root + fo;
    const v = p + b.readUInt32LE(p);
    const n = b.readUInt32LE(v);
    for (let i = 0; i < n; i++) {
      const e = v + 4 + 4 * i + b.readUInt32LE(v + 4 + 4 * i);
      const f = vtable(b, e);
      const id = f[0] ? b.readUInt32LE(e + f[0]) : 0;
      const unit = f[1] ? b.readUInt32LE(e + f[1]) : null;
      const values = [];
      let va = null;
      if (f[2]) {
        va = e + f[2] + b.readUInt32LE(e + f[2]);
        const vn = b.readUInt32LE(va);
        for (let k = 0; k < vn; k++) values.push(readElem(b, va + 4 + k * t.size, t.name));
      }
      units.push({ type: t.name, id, unit, values, _off: va === null ? null : sec.start + va + 4, _size: t.size });
    }
  }
  return units;
}

function load(path, secName) {
  const d = fs.readFileSync(path);
  const secs = sections(d);
  const picked = secName ? secs.filter(s => s.name === secName) : secs;
  const units = [];
  for (const s of picked) for (const u of parseSection(d, s)) units.push({ section: s.name, ...u });
  return { d, secs, units };
}

const key = u => `${u.section}:${u.type}:${u.id}:${u.unit ?? '-'}`;
const show = u => `${u.section.padEnd(4)} ${u.type.padEnd(6)} id=${String(u.id).padEnd(5)} unit=${String(u.unit ?? '-').padEnd(10)} ${fmtVals(u)}`;

function fmtVals(u) {
  if ((u.type === 'ubyte' || u.type === 'sbyte' || u.type === 'ushort') && u.values.length >= 8) {
    const end = u.values.indexOf(0) < 0 ? u.values.length : u.values.indexOf(0);
    const s = u.type === 'ushort' ? String.fromCharCode(...u.values.slice(0, end))
      : Buffer.from(u.values.slice(0, end).map(c => c & 0xff)).toString('utf8');
    if (s && /^[\x20-\x7e -￿]+$/.test(s)) return JSON.stringify(s);
  }
  const v = u.values.length > 16 ? [...u.values.slice(0, 16), `...(+${u.values.length - 16})`] : u.values;
  return JSON.stringify(v);
}

function opt(args, name) {
  const i = args.indexOf('--' + name);
  if (i < 0) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
}

function main() {
  const args = process.argv.slice(2);
  const section = opt(args, 'section');
  const typeFilter = opt(args, 'type');
  const [cmd, file, ...rest] = args;
  if (!cmd || !file) {
    console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 22).join('\n'));
    process.exit(1);
  }

  if (cmd === 'info') {
    const { secs, units } = load(file);
    for (const s of secs) console.log(`seção ${s.name}: offset 0x${s.start.toString(16)} tamanho ${s.size}`);
    const count = {};
    for (const u of units) count[`${u.section}/${u.type}`] = (count[`${u.section}/${u.type}`] || 0) + 1;
    console.table(count);
    for (const u of units.filter(u => u.values.length >= 8 && (u.type === 'ubyte' || u.type === 'sbyte' || u.type === 'ushort'))) console.log(show(u));
  } else if (cmd === 'dump') {
    const { units } = load(file, section);
    const out = units.map(({ _off, _size, ...u }) => u);
    const json = JSON.stringify(out, null, 1);
    if (rest[0]) { fs.writeFileSync(rest[0], json); console.log(`${out.length} unidades -> ${rest[0]}`); }
    else console.log(json);
  } else if (cmd === 'find') {
    const target = rest[0];
    const { units } = load(file, section);
    for (const u of units) {
      if (typeFilter && u.type !== typeFilter) continue;
      const hits = u.values.map((v, i) => (String(v) === target || (u.type === 'float' && Math.abs(v - +target) < 1e-4) ? i : -1)).filter(i => i >= 0);
      if (hits.length) console.log(`${show(u)}  <- índice ${hits.join(',')}`);
    }
  } else if (cmd === 'get') {
    const [type, id, unit] = rest;
    const { units } = load(file, section);
    for (const u of units) if (u.type === type && u.id === +id && (unit === undefined || String(u.unit ?? '-') === unit)) console.log(show(u));
  } else if (cmd === 'set') {
    const [type, id, unit, idx, value] = rest;
    if (!TYPE_TO_FIELD[type] || value === undefined) throw new Error('uso: set <save> <tipo> <id> <unit|-> <indice> <valor>');
    const { d, units } = load(file, section || 'main');
    const matches = units.filter(u => u.type === type && u.id === +id && String(u.unit ?? '-') === unit);
    if (matches.length !== 1) throw new Error(`esperava 1 unidade, encontrei ${matches.length}`);
    const u = matches[0];
    if (+idx >= u.values.length) throw new Error(`índice fora do intervalo (0..${u.values.length - 1})`);
    console.log('antes :', show(u));
    const bak = `${file}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    fs.copyFileSync(file, bak);
    writeElem(d, u._off + +idx * u._size, type, value);
    const h = checkHash(d, load(file).units.map(x => x.id === HASH_SEED_ID && x.section === 'main' && x.type === 'uint' ? { ...x, values: [d.readUInt32LE(x._off)] } : x), true);
    fs.writeFileSync(file, d);
    if (h) console.log(`hash #${h.idx} recalculado: ${h.computed.toString(16)}`);
    const after = load(file, u.section).units.find(x => key(x) === key(u));
    console.log('depois:', show(after));
    console.log('backup:', bak);
  } else if (cmd === 'check' || cmd === 'fixhash') {
    const { d, units } = load(file);
    const h = checkHash(d, units, false);
    if (!h) { console.log('este arquivo não tem hash de integridade (não é um SaveDataN.dat)'); return; }
    const ok = h.stored === h.computed;
    console.log(`hash #${h.idx}: gravado ${h.stored.toString(16)}, calculado ${h.computed.toString(16)} -> ${ok ? 'OK' : 'INVÁLIDO (o jogo vai dizer que está corrompido)'}`);
    if (cmd === 'fixhash' && !ok) {
      const bak = `${file}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`;
      fs.copyFileSync(file, bak);
      checkHash(d, units, true);
      fs.writeFileSync(file, d);
      console.log('hash corrigido. backup:', bak);
    }
  } else if (cmd === 'diff') {
    const a = load(file, section).units, b = load(rest[0], section).units;
    const mb = new Map(b.map(u => [key(u), u]));
    const ma = new Map(a.map(u => [key(u), u]));
    for (const u of a) {
      const o = mb.get(key(u));
      if (!o) { console.log('- ' + show(u)); continue; }
      if (JSON.stringify(o.values) === JSON.stringify(u.values)) continue;
      const idx = u.values.map((v, i) => (v !== o.values[i] ? i : -1)).filter(i => i >= 0);
      const parts = idx.slice(0, 8).map(i => `[${i}] ${u.values[i]} -> ${o.values[i]}`);
      console.log(`~ ${u.section} ${u.type} id=${u.id} unit=${u.unit ?? '-'}  ${parts.join('  ')}${idx.length > 8 ? ` ...(+${idx.length - 8})` : ''}${u.values.length !== o.values.length ? ` len ${u.values.length}->${o.values.length}` : ''}`);
    }
    for (const u of b) if (!ma.has(key(u))) console.log('+ ' + show(u));
  } else {
    throw new Error('comando desconhecido: ' + cmd);
  }
}

if (require.main === module) main();
else module.exports = { load };
