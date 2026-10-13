import { h, icon, downloadBlob, reducedMotion, storage } from './dom';
import { fmtDate, fmtInt, fmtPct, fmtSigned, getLang, t } from '../i18n';
import { state } from './state';
import { confMark, nameCell, numberCell, stringCell } from './cells';
import { barList, columns, diverging } from './charts';
import { dataTable } from './table';
import { CATALOG, catalogOf, type Confidence } from '../core/catalog';
import { namePlate, portrait } from './art';
import { sfx } from './sfx';
import {
  EMPTY_HASH, formatValue, looksText, num, read, readAll, readString, rec, unitsOf, VALUE_TYPES,
  type SaveModel, type SectionName, type Unit,
} from '../core/save';
import {
  type Character, characters, countBy, evolution, levelHistogram, materials, MAX_EXP, MAX_LEVEL, party, recruited, sigils,
  summary, weapons,
} from '../core/analytics';

const L = () => (getLang() === 'en' ? 'en' : 'pt') as 'en' | 'pt';
const M = () => state.model!;

function panel(title: string, opts: { note?: string; ink?: string; wide?: boolean; id?: string } = {}, ...body: (Node | null)[]): HTMLElement {
  return h('section', { class: `panel${opts.wide ? ' wide' : ''}${opts.ink ? ' ink-' + opts.ink : ''}`, id: opts.id },
    h('h2', {}, title),
    opts.note ? h('p', { class: 'note' }, opts.note) : null,
    ...body);
}

// ---------------------------------------------------------------- Dashboard
/** Centered section heading with the official site's ornament divider (lines + copper lozenge). */
export function ornateTitle(text: string, tag: 'h1' | 'h2' = 'h2'): HTMLElement {
  return h(tag, { class: 'ornate' }, h('span', {}, text), h('i', { class: 'ornament', 'aria-hidden': 'true' }));
}

export function dashboard(seal: Node): HTMLElement {
  const m = M();
  if (!m.isSlot || !rec(m, 1104)) return h('div', { class: 'view' }, panel(t('dashboard'), { note: t('configFile') }));
  const names = state.names;
  const sum = summary(m, names, u => readString(m, u));
  const other = state.other?.isSlot ? state.other : null;
  const prev = other ? summary(other, names, u => readString(other, u)) : null;
  const delta = (a: number, b: number | undefined) =>
    b === undefined ? null : h('span', { class: `delta ${a - b > 0 ? 'up' : a - b < 0 ? 'down' : ''}` }, t('sinceCompare', { delta: fmtSigned(a - b), name: other!.name }));

  const ts = num(m, rec(m, 7201));
  const pty = party(m, names);
  const cs = recruited(characters(m, names));
  const ss = sigils(m, names);
  const mats = materials(m, names).filter(x => x.qty > 0);
  const ws = weapons(m, names);

  const hero = h('section', { class: 'hero' },
    h('div', { class: 'hero-art', 'aria-hidden': 'true' }),
    h('div', { class: 'hero-copy' },
      h('p', { class: 'hero-label' }, confMark('confirmed', false), t('playerName')),
      h('div', { class: 'hero-name' }, stringCell(rec(m, 1101), { label: t('playerName') })),
      h('dl', { class: 'hero-facts' },
        h('div', {}, h('dt', {}, confMark('possible', false), t('profileName')), h('dd', {}, stringCell(rec(m, 4413), { label: t('profileName') }))),
        h('div', {}, h('dt', {}, confMark('likely', false), t('party')), h('dd', {}, pty.length ? pty.join(' · ') : t('none'))),
        h('div', {}, h('dt', {}, confMark('likely', false), t('lastSaved')), h('dd', {}, ts ? fmtDate(ts) : t('none'))))),
    h('div', { class: 'hero-seal' }, seal));

  const stat = (ink: string, conf: Confidence, label: string, value: Node, d: Node | null) =>
    h('div', { class: `stat ink-${ink}` }, h('span', { class: 'lbl' }, confMark(conf, false), label), value, d);
  const ledger = h('div', { class: 'ledger' },
    stat('chara', 'likely', t('rupies'), numberCell(rec(m, 1104), 0, { label: t('rupies'), grouped: true }), delta(sum.rupies, prev?.rupies)),
    stat('chara', 'likely', t('maxedChars'), h('strong', { class: 'fig' }, `${sum.maxed}`, h('small', {}, ` / ${sum.characters}`)), delta(sum.maxed, prev?.maxed)),
    stat('sigil', 'confirmed', t('sigilCount'), h('strong', { class: 'fig' }, fmtInt(sum.sigils)), delta(sum.sigils, prev?.sigils)),
    stat('mat', 'confirmed', t('materialKinds'), h('strong', { class: 'fig' }, fmtInt(sum.materials)), delta(sum.materials, prev?.materials)),
    stat('wep', 'confirmed', t('weaponCount'), h('strong', { class: 'fig' }, fmtInt(sum.weapons)), delta(sum.weapons, prev?.weapons)),
  );

  return h('div', { class: 'view dash' },
    hero,
    ledger,
    h('section', { class: 'band' },
      ornateTitle(t('charProgress')),
      h('p', { class: 'band-note' }, t('charProgressNote')),
      characterGallery(cs)),
    h('section', { class: 'band' },
      ornateTitle(t('analysis')),
      h('div', { class: 'grid' },
        panel(t('sigilLevels'), { ink: 'sigil' }, columns(levelHistogram(ss), 'sigil', [t('level'), t('count')])),
        panel(t('topSigils'), { ink: 'sigil' }, barList(countBy(ss, x => x.name).slice(0, 10), 'sigil', { headers: [t('sigil'), t('count')] })),
        panel(t('topMaterials'), { ink: 'mat' }, barList(mats.slice().sort((a, b) => b.qty - a.qty).slice(0, 10).map(x => ({ label: x.name, value: x.qty, sub: x.id })), 'mat', { headers: [t('material'), t('quantity')] })),
        panel(t('weaponsByChar'), { ink: 'wep' }, barList(countBy(ws, w => w.owner || t('noOwner')).slice(0, 12), 'wep', { headers: [t('owner'), t('count')] })),
        evolutionPanel())));
}

function evolutionPanel(): HTMLElement {
  const m = M(), other = state.other;
  if (!other || !other.isSlot) return panel(t('evolution'), { note: t('evolutionEmpty'), wide: true });
  const ev = evolution(other, m, state.names);
  return panel(t('evolution'), { wide: true },
    h('div', { class: 'sides' },
      h('span', { class: 'side a' }, t('sideA', { name: other.name })),
      h('span', { class: 'side b' }, t('sideB', { name: m.name }))),
    h('dl', { class: 'facts' },
      h('div', {}, h('dt', {}, t('rupiesDelta')), h('dd', { class: ev.rupies.diff < 0 ? 'neg' : 'pos' }, fmtSigned(ev.rupies.diff))),
      h('div', {}, h('dt', {}, t('sigilsGained')), h('dd', {}, fmtSigned(ev.sigilsGained))),
      h('div', {}, h('dt', {}, t('weaponsGained')), h('dd', {}, fmtSigned(ev.weaponsGained))),
      h('div', {}, h('dt', {}, t('levelUps')), h('dd', {}, ev.levels.length ? ev.levels.map(l => `${l.label} ${l.before}→${l.after}`).join(' · ') : t('none')))),
    ev.materials.length ? h('div', {}, h('h3', {}, t('materialDeltas')),
      diverging(ev.materials.slice(0, 14).map(d => ({ label: d.label, value: d.diff, sub: `${fmtInt(d.before)} → ${fmtInt(d.after)}` })), [t('material'), t('change')])) : null);
}

// ---------------------------------------------------------------- Characters
/** Characters with an unknown hash (guests/NPCs) are labelled as such, with the raw hash as their ID. */
function charName(c: Character): Node {
  if (c.name) return nameCell(c.hash, c.name);
  return h('span', { class: 'named' }, h('span', {}, t('unknownChar'), ' ', confMark('possible', false)), h('span', { class: 'id' }, `#${c.hash.toString(16)}`));
}

/** Portrait card in the official site's style: framed art, vertical name plate, level plate, EXP bar. Opens the character sheet. */
function characterCard(c: Character, i: number): HTMLElement {
  const src = portrait(c.id);
  const plate = namePlate(c.id);
  const maxed = c.level >= MAX_LEVEL;
  const name = c.name || t('unknownChar');
  const open = () => { sfx('select'); openCharacter(c.unit); };
  return h('figure', {
    class: `char-card${maxed ? ' max' : ''}${src ? '' : ' no-art'}`, style: { '--i': String(Math.min(i, 16)) } as unknown as Partial<CSSStyleDeclaration>,
    tabindex: '0', role: 'button', 'aria-haspopup': 'dialog', 'aria-label': `${name}, ${t('level')} ${c.level}, EXP ${fmtInt(c.exp)}`,
    onclick: open,
    onkeydown: (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } },
  },
    h('div', { class: 'char-art' },
      src ? h('img', { src, alt: '', loading: 'lazy', decoding: 'async', width: 280, height: 536 }) : h('span', { class: 'char-unknown', 'aria-hidden': 'true' }, '?'),
      plate ? h('img', { class: 'char-plate', src: plate, alt: '', loading: 'lazy', 'aria-hidden': 'true' }) : null,
      h('span', { class: 'char-lv' }, maxed ? t('maxShort') : 'Lv', ' ', h('b', {}, c.level))),
    h('figcaption', {},
      h('span', { class: 'char-name' }, name),
      progressBar(c.exp / MAX_EXP, maxed),
      h('span', { class: 'char-exp' }, `EXP ${fmtInt(c.exp)}`)));
}

function characterGallery(cs: Character[]): HTMLElement {
  return h('div', { class: 'gallery' }, cs.map(characterCard));
}

// ---------------------------------------------------------------- Character sheet (modal)
const confOf = (id: number): Confidence => catalogOf('main', id)?.conf ?? 'unknown';

/** Opens a character's sheet. ←/→ step through the gallery order; Esc, ✕ or the backdrop close it. */
function openCharacter(unit: number) {
  const list = recruited(characters(M(), state.names));
  if (!list.length) return;
  let i = Math.max(0, list.findIndex(c => c.unit === unit));
  const returnFocus = document.activeElement as HTMLElement | null;
  const dlg = h('dialog', { class: 'char-dialog', 'aria-labelledby': 'sheet-name' });
  const draw = (dir: -1 | 0 | 1) => {
    dlg.replaceChildren(characterSheet(list[i], i, list.length, dir, step, () => dlg.close()));
    if (dir) dlg.querySelector<HTMLElement>(`[data-step="${dir}"]`)?.focus();
  };
  const step = (dir: -1 | 1) => { i = (i + dir + list.length) % list.length; sfx(dir > 0 ? 'next' : 'prev'); draw(dir); };
  dlg.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => { sfx('close'); dlg.remove(); returnFocus?.focus({ preventScroll: true }); });
  draw(0);
  document.body.append(dlg);
  dlg.showModal();
}

function characterSheet(c: Character, i: number, n: number, dir: -1 | 0 | 1, step: (d: -1 | 1) => void, close: () => void): HTMLElement {
  const m = M(), names = state.names;
  const src = portrait(c.id), plate = namePlate(c.id);
  const maxed = c.level >= MAX_LEVEL;
  const name = c.name || t('unknownChar');
  const inParty = !!c.name && party(m, names).includes(c.name);
  const ws = c.id ? weapons(m, names).filter(w => w.id.startsWith(`WEP_${c.id}`)).sort((a, b) => b.uncap - a.uncap || b.awakening - a.awakening) : [];
  const worn = c.name || `#${c.hash.toString(16)}`;
  const ss = sigils(m, names).filter(s => s.wornBy === worn).sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));
  const p = Math.min(1, c.exp / MAX_EXP);
  const navBtn = (d: -1 | 1) => h('button', { type: 'button', class: 'sheet-icon', 'data-step': String(d), 'data-sfx': 'none', 'aria-label': t(d < 0 ? 'prevChar' : 'nextChar'), title: t(d < 0 ? 'prevChar' : 'nextChar'), onclick: () => step(d) }, icon(d < 0 ? 'prev' : 'next'));
  const stat = (label: string, id: number, value: number) =>
    h('div', {}, h('dt', {}, confMark(confOf(id), false), label), h('dd', {}, fmtInt(value)));
  const list = (ink: string, title: string, count: number, body: Node) =>
    h('section', { class: `sheet-list ink-${ink}` }, h('h3', {}, title, h('sup', {}, fmtInt(count))), body);

  return h('article', { class: `sheet${maxed ? ' max' : ''}${dir ? (dir > 0 ? ' from-next' : ' from-prev') : ' from-open'}` },
    h('div', { class: `sheet-art${src ? '' : ' no-art'}` },
      src ? h('img', { class: 'sheet-portrait', src, alt: '', width: 280, height: 536 }) : h('span', { class: 'char-unknown', 'aria-hidden': 'true' }, '?'),
      plate ? h('img', { class: 'sheet-plate', src: plate, alt: '', 'aria-hidden': 'true' }) : null,
      h('span', { class: 'char-lv' }, maxed ? t('maxShort') : 'Lv', ' ', h('b', {}, c.level))),
    h('div', { class: 'sheet-body' },
      h('header', { class: 'sheet-head' },
        h('div', { class: 'sheet-title' },
          h('h2', { id: 'sheet-name' }, name),
          h('p', { class: 'sheet-meta' },
            h('span', { class: 'mono' }, c.id || `#${c.hash.toString(16)}`),
            inParty ? h('span', { class: 'chip party' }, t('inParty')) : null)),
        h('div', { class: 'sheet-nav' },
          n > 1 ? navBtn(-1) : null,
          n > 1 ? h('span', { class: 'sheet-pos' }, `${i + 1} / ${n}`) : null,
          n > 1 ? navBtn(1) : null,
          h('button', { type: 'button', class: 'sheet-icon', 'data-sfx': 'none', 'aria-label': t('close'), title: t('close'), autofocus: true, onclick: close }, icon('close')))),
      h('section', { class: 'sheet-level' },
        h('div', {},
          h('span', { class: 'lbl' }, confMark(confOf(1308), false), t('level')),
          h('strong', { class: 'fig' }, c.level, h('small', {}, ` / ${MAX_LEVEL}`))),
        h('div', { class: 'sheet-exp' },
          h('span', { class: 'lbl' }, confMark(confOf(1303), false), t('exp')),
          progressBar(p, maxed),
          h('span', { class: 'sheet-exp-n' }, `${fmtInt(c.exp)} / ${fmtInt(MAX_EXP)} · ${fmtPct(p)}`))),
      h('dl', { class: 'sheet-stats' }, stat(t('hp'), 1309, c.hp), stat(t('atk'), 1310, c.atk), stat(t('msp'), 1321, c.msp)),
      list('wep', t('weapons'), ws.length, ws.length
        ? h('ul', {}, ws.map(w => h('li', {}, h('span', { class: 'sheet-item' }, w.name), h('span', { class: 'sheet-tags' }, `${t('uncap')} ${w.uncap} · ${t('awakening')} ${w.awakening}`))))
        : h('p', { class: 'muted' }, t('noWeapons'))),
      list('sigil', t('sigilsWorn'), ss.length, ss.length
        ? h('ul', {}, ss.map(s => h('li', {}, h('span', { class: 'sheet-item' }, s.name), h('span', { class: 'sheet-tags' }, `Lv ${s.level}`))))
        : h('p', { class: 'muted' }, t('noSigils'))),
      h('footer', { class: 'sheet-foot' },
        h('p', { class: 'note' }, t('sheetNote')),
        h('button', { type: 'button', class: 'btn', 'data-sfx': 'none', onclick: () => { close(); revealEditor(); } }, t('editCharacter')))));
}

/** Takes the visitor to the characters edit table (route change renders asynchronously). */
function revealEditor() {
  if (!/characters/.test(location.hash)) location.hash = '#/characters';
  let tries = 0;
  const seek = () => {
    const el = document.getElementById('char-edit');
    if (el) el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    else if (tries++ < 60) requestAnimationFrame(seek);
  };
  requestAnimationFrame(seek);
}

export function charactersView(): HTMLElement {
  const m = M();
  const cs = recruited(characters(m, state.names));
  const r = (unit: number, id: number) => rec(m, id, unit);
  return h('div', { class: 'view' },
    h('section', { class: 'band' }, ornateTitle(t('characters'), 'h1'), characterGallery(cs)),
    panel(t('charEditTitle'), { note: t('charEditNote'), ink: 'chara', wide: true, id: 'char-edit' },
      dataTable([
        { label: t('character'), sort: c => c.name || '~', cell: charName },
        { label: t('level'), sort: c => c.level, numeric: true, cell: c => numberCell(r(c.unit, 1308), 0, { width: '5em', label: `${c.name} ${t('level')}` }) },
        { label: t('progress'), sort: c => c.exp, cell: c => progressBar(c.exp / MAX_EXP, c.level >= MAX_LEVEL) },
        { label: t('exp'), sort: c => c.exp, numeric: true, cell: c => numberCell(r(c.unit, 1303), 0, { label: `${c.name} ${t('exp')}` }) },
        { label: `${t('hp')}`, sort: c => c.hp, numeric: true, cell: c => numberCell(r(c.unit, 1309), 0, { width: '6em' }) },
        { label: `${t('atk')}`, sort: c => c.atk, numeric: true, cell: c => numberCell(r(c.unit, 1310), 0, { width: '6em' }) },
        { label: `${t('msp')}`, sort: c => c.msp, numeric: true, cell: c => numberCell(r(c.unit, 1321)) },
      ], cs, { filter: c => `${c.name} ${c.id}`, caption: t('characters') })));
}

function progressBar(p: number, full: boolean): HTMLElement {
  return h('span', { class: `progress${full ? ' full' : ''}`, role: 'img', 'aria-label': fmtPct(Math.min(1, p)) },
    h('i', { style: { width: `${Math.min(100, p * 100)}%` } }));
}

// ---------------------------------------------------------------- Sigils
export function sigilsView(): HTMLElement {
  const m = M();
  const ss = sigils(m, state.names);
  const dup = countBy(ss, x => x.name).filter(c => c.value > 1).length;
  return h('div', { class: 'view' },
    h('div', { class: 'grid' },
      panel(t('sigilLevels'), { ink: 'sigil' }, columns(levelHistogram(ss), 'sigil', [t('level'), t('count')])),
      panel(t('sigilsByChar'), { ink: 'sigil' }, barList(countBy(ss, x => x.wornBy), 'sigil', { headers: [t('character'), t('count')] })),
      panel(t('topSigils'), { ink: 'sigil', note: `${fmtInt(dup)} ${t('duplicates')}` }, barList(countBy(ss, x => x.name).slice(0, 15), 'sigil', { headers: [t('sigil'), t('count')] }))),
    panel(t('sigils'), { ink: 'sigil', wide: true }, dataTable([
      { label: t('sigil'), sort: x => x.name, cell: x => nameCell(x.hash, x.name) },
      { label: t('level'), sort: x => x.level, numeric: true, cell: x => numberCell(rec(m, 2704, x.unit), 0, { width: '5em', label: `${x.name} ${t('level')}` }) },
      { label: t('wornBy'), sort: x => x.wornBy ?? '', cell: x => x.wornBy ?? t('none') },
      { label: t('serial'), sort: x => num(m, rec(m, 2702, x.unit)), numeric: true, cell: x => fmtInt(num(m, rec(m, 2702, x.unit))) },
    ], ss, { filter: x => `${x.name} ${x.id} ${x.wornBy ?? ''}`, caption: t('sigils'), initialSort: 1, desc: true })));
}

// ---------------------------------------------------------------- Materials
export function materialsView(): HTMLElement {
  const m = M();
  const all = materials(m, state.names);
  const stocked = all.filter(x => x.qty > 0);
  return h('div', { class: 'view' },
    h('div', { class: 'grid' },
      panel(t('topMaterials'), { ink: 'mat' }, barList(stocked.slice().sort((a, b) => b.qty - a.qty).slice(0, 15).map(x => ({ label: x.name, value: x.qty, sub: x.id })), 'mat', { headers: [t('material'), t('quantity')] })),
      panel(t('scarceMaterials'), { ink: 'mat' }, barList(stocked.slice().sort((a, b) => a.qty - b.qty).slice(0, 15).map(x => ({ label: x.name, value: x.qty, sub: x.id })), 'mat', { headers: [t('material'), t('quantity')] }))),
    panel(t('materials'), { ink: 'mat', wide: true }, dataTable([
      { label: t('material'), sort: x => x.name, cell: x => nameCell(x.hash, x.name) },
      { label: t('quantity'), sort: x => x.qty, numeric: true, cell: x => numberCell(rec(m, 1802, x.unit), 0, { label: `${x.name} ${t('quantity')}` }) },
      { label: 'unit', sort: x => x.unit, numeric: true, cell: x => h('span', { class: 'mono muted' }, x.unit) },
    ], all, { filter: x => `${x.name} ${x.id}`, caption: t('materials'), initialSort: 1, desc: true })));
}

// ---------------------------------------------------------------- Weapons
export function weaponsView(): HTMLElement {
  const m = M();
  const ws = weapons(m, state.names);
  const hashName = (id: number, unit: number) => { const v = num(m, rec(m, id, unit)); return v && v !== EMPTY_HASH ? nameCell(v) : t('none'); };
  return h('div', { class: 'view' },
    panel(t('weaponsByChar'), { ink: 'wep' }, barList(countBy(ws, w => w.owner || t('noOwner')), 'wep', { headers: [t('owner'), t('count')] })),
    panel(t('weapons'), { ink: 'wep', wide: true }, dataTable([
      { label: t('weapon'), sort: w => w.name, cell: w => nameCell(w.hash, w.name) },
      { label: t('owner'), sort: w => w.owner || '~', cell: w => w.owner || h('span', { class: 'muted' }, t('noOwner')) },
      { label: t('exp'), sort: w => w.exp, numeric: true, cell: w => numberCell(rec(m, 2804, w.unit), 0, { label: `${w.name} ${t('exp')}` }) },
      { label: t('uncap'), sort: w => w.uncap, numeric: true, cell: w => numberCell(rec(m, 2805, w.unit), 0, { width: '4em' }) },
      { label: t('awakening'), sort: w => w.awakening, numeric: true, cell: w => numberCell(rec(m, 2806, w.unit), 0, { width: '4em' }) },
      { label: t('wrightstone'), cell: w => hashName(2816, w.unit) },
      { label: t('appearance'), cell: w => hashName(2814, w.unit) },
    ], ws, { filter: w => `${w.name} ${w.id} ${w.owner}`, caption: t('weapons') })));
}

// ---------------------------------------------------------------- Other items
let otherTab: 'wright' | 'curio' | 'list' = 'wright';
export function otherView(): HTMLElement {
  const m = M();
  const defs = {
    wright: { label: t('wrightstones'), key: 2102, cols: [[t('serial'), 2103], ['2105', 2105]] as [string, number][] },
    curio: { label: t('curios'), key: 2002, cols: [['2003', 2003]] as [string, number][] },
    list: { label: t('list1901'), key: 1901, cols: [['1902', 1902]] as [string, number][] },
  };
  const def = defs[otherTab];
  const rows = unitsOf(m, def.key).filter(u => { const v = num(m, u); return v && v !== EMPTY_HASH; });
  const root = h('div', { class: 'view' });
  const tabs = h('div', { class: 'segmented', role: 'tablist' }, (Object.keys(defs) as (keyof typeof defs)[]).map(k =>
    h('button', { type: 'button', role: 'tab', 'aria-selected': String(k === otherTab), onclick: () => { otherTab = k; root.replaceWith(otherView()); } }, defs[k].label)));
  root.append(tabs, panel(def.label, { wide: true }, dataTable([
    { label: def.label, sort: (u: Unit) => state.names.get(num(m, u))?.name ?? '', cell: (u: Unit) => nameCell(num(m, u)) },
    ...def.cols.map(([label, id]) => ({ label: `${label}`, numeric: true, sort: (u: Unit) => num(m, rec(m, id, u.unit)), cell: (u: Unit) => numberCell(rec(m, id, u.unit)) })),
    { label: 'unit', numeric: true, sort: (u: Unit) => u.unit, cell: (u: Unit) => h('span', { class: 'mono muted' }, u.unit) },
  ], rows, { filter: u => { const n = state.names.get(num(m, u)); return n ? `${n.name} ${n.id}` : ''; } })));
  return root;
}

// ---------------------------------------------------------------- Explore
export const explore = { q: '', type: '', sec: '' as '' | SectionName, id: '', unit: '', nonzero: false };
export function exploreView(): HTMLElement {
  const m = M();
  const tbody = h('tbody');
  const info = h('span', { class: 'muted count' });
  const draw = () => {
    const q = explore.q.trim().toLowerCase();
    let shown = 0, matched = 0;
    const rows: HTMLElement[] = [];
    for (const u of m.units) {
      if (explore.sec && u.sec !== explore.sec) continue;
      if (explore.type && u.type !== explore.type) continue;
      if (explore.id && String(u.id) !== explore.id.trim()) continue;
      if (explore.unit && String(u.unit) !== explore.unit.trim()) continue;
      if (explore.nonzero || q) {
        let hit = !q, nonzero = false;
        for (let i = 0; i < Math.min(u.count, 64); i++) {
          const v = read(m, u, i);
          if (v != 0) nonzero = true;
          if (q && !hit) {
            const n = u.type === 'uint' ? state.names.get(Number(v)) : undefined;
            if (String(v) === q || (n && `${n.id} ${n.name}`.toLowerCase().includes(q))) hit = true;
          }
        }
        if (q && !hit && looksText(m, u) && readString(m, u).toLowerCase().includes(q)) hit = true;
        if (q && !hit && catalogOf(u.sec, u.id)?.[L()].toLowerCase().includes(q)) hit = true;
        if (!hit || (explore.nonzero && !nonzero)) continue;
      }
      matched++;
      if (shown++ < 300) rows.push(unitRow(m, u));
    }
    tbody.replaceChildren(...rows);
    info.textContent = matched > 300 ? t('tooMany', { total: fmtInt(matched), shown: 300 }) : t('shown', { shown: fmtInt(matched), total: fmtInt(m.units.length) });
  };
  const field = (k: 'q' | 'id' | 'unit', attrs: Record<string, string>) =>
    h('input', { ...attrs, value: explore[k], oninput: (e: Event) => { explore[k] = (e.target as HTMLInputElement).value; draw(); } });
  const sel = (k: 'type' | 'sec', opts: [string, string][]) => h('select', { 'aria-label': k, onchange: (e: Event) => { (explore as Record<string, unknown>)[k] = (e.target as HTMLSelectElement).value; draw(); } },
    opts.map(([v, label]) => h('option', { value: v, selected: explore[k] === v }, label)));
  const view = h('div', { class: 'view' }, panel(t('explore'), { wide: true },
    h('div', { class: 'toolbar' },
      field('q', { type: 'search', class: 'search', placeholder: t('filterValue'), 'aria-label': t('filterValue') }),
      field('id', { placeholder: 'id', class: 'short', 'aria-label': 'id', inputmode: 'numeric' }),
      field('unit', { placeholder: 'unit', class: 'short', 'aria-label': 'unit', inputmode: 'numeric' }),
      sel('type', [['', t('allTypes')], ...VALUE_TYPES.map(v => [v, v] as [string, string])]),
      sel('sec', [['', t('allSections')], ['main', 'main'], ['meta', 'meta']]),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: explore.nonzero, onchange: (e: Event) => { explore.nonzero = (e.target as HTMLInputElement).checked; draw(); } }), t('onlyNonZero')),
      info),
    h('div', { class: 'table-scroll' }, h('table', { class: 'data' },
      h('thead', {}, h('tr', {}, [t('section'), t('type'), 'id', 'unit', t('value'), t('description')].map(x => h('th', { scope: 'col' }, x)))), tbody))));
  draw();
  return view;
}

function unitRow(m: SaveModel, u: Unit): HTMLElement {
  const c = catalogOf(u.sec, u.id);
  let val: Node;
  if (looksText(m, u)) val = stringCell(u);
  else if (u.count === 0) val = h('span', { class: 'muted' }, t('empty'));
  else if (u.count === 1) {
    const v = read(m, u);
    val = h('span', { class: 'inline' }, numberCell(u), u.type === 'uint' && state.names.get(Number(v)) ? nameCell(Number(v)) : null);
  } else val = arrayCell(m, u);
  return h('tr', {},
    h('td', { class: 'mono' }, u.sec), h('td', { class: 'mono' }, u.type), h('td', { class: 'mono' }, u.id), h('td', { class: 'mono' }, u.unit),
    h('td', {}, val),
    h('td', { class: 'note' }, c ? h('span', {}, c[L()], ' ', confMark(c.conf, false)) : (notes()[`${u.sec}:${u.id}`] ?? '')));
}

function arrayCell(m: SaveModel, u: Unit): HTMLElement {
  const box = h('div', { class: 'array' });
  const preview = readAll(m, u).slice(0, 10).map(v => { const n = u.type === 'uint' ? state.names.get(Number(v)) : undefined; return n ? n.name : formatValue(u, v); });
  const summaryEl = h('span', { class: 'mono' }, `[${u.count}] ${preview.join(', ')}${u.count > 10 ? ', …' : ''}`);
  const btn = h('button', { type: 'button', class: 'ghost small' }, t('edit'));
  btn.addEventListener('click', () => {
    const lim = Math.min(u.count, 2000);
    const grid = h('div', { class: 'array-grid' });
    for (let i = 0; i < lim; i++) grid.append(h('label', {}, h('span', {}, `[${i}]`), numberCell(u, i, { width: u.type === 'bool' ? '3em' : '7em' })));
    box.replaceChildren(summaryEl, grid, u.count > lim ? h('p', { class: 'note' }, t('showing', { n: lim, total: u.count })) : '');
  });
  box.append(summaryEl, ' ', btn);
  return box;
}

// ---------------------------------------------------------------- ID table
const NOTES_KEY = 'gbfr-notes';
let notesCache: Record<string, string> | null = null;
function notes(): Record<string, string> {
  if (!notesCache) { try { notesCache = JSON.parse(storage.get(NOTES_KEY) ?? '{}'); } catch { notesCache = {}; } }
  return notesCache!;
}
const saveNotes = () => storage.set(NOTES_KEY, JSON.stringify(notes()));
let idsQ = '', idsOnly = false;

export function idsView(go: (route: string) => void): HTMLElement {
  const m = state.model;
  type G = { sec: SectionName; id: number; type: string; n: number; sample?: Unit };
  const groups = new Map<string, G>();
  if (m) for (const u of m.units) {
    const k = `${u.sec}:${u.id}`;
    const g = groups.get(k) ?? { sec: u.sec, id: u.id, type: u.type, n: 0, sample: u };
    g.n++;
    groups.set(k, g);
  }
  for (const c of CATALOG) if (!groups.has(`${c.s}:${c.id}`)) groups.set(`${c.s}:${c.id}`, { sec: c.s, id: c.id, type: '?', n: 0 });
  const list = [...groups.values()].sort((a, b) => a.sec.localeCompare(b.sec) || a.id - b.id);
  const tbody = h('tbody');
  const draw = () => {
    const q = idsQ.toLowerCase();
    tbody.replaceChildren(...list.flatMap(g => {
      const k = `${g.sec}:${g.id}`, c = catalogOf(g.sec, g.id), note = notes()[k] ?? '';
      if (idsOnly && !c && !note) return [];
      if (q && !`${g.id} ${g.sec} ${g.type} ${c ? t(`group${c.group}` as never) + ' ' + c[L()] : ''} ${note}`.toLowerCase().includes(q)) return [];
      const ta = h('textarea', { class: 'notes', placeholder: t('notePlaceholder'), 'aria-label': `${t('note')} ${g.id}`, rows: 1 });
      ta.value = note;
      ta.addEventListener('change', () => { if (ta.value.trim()) notes()[k] = ta.value.trim(); else delete notes()[k]; saveNotes(); });
      let sample = '';
      if (m && g.sample) {
        const u = g.sample;
        if (looksText(m, u)) sample = JSON.stringify(readString(m, u));
        else if (u.count) { const v = read(m, u); const n = u.type === 'uint' ? state.names.get(Number(v)) : undefined; sample = (n ? n.name : formatValue(u, v)) + (u.count > 1 ? ` …[${u.count}]` : ''); }
        else sample = t('empty');
      }
      return [h('tr', {},
        h('td', { class: 'mono' }, g.sec), h('td', { class: 'mono' }, g.id), h('td', { class: 'mono' }, g.type),
        h('td', {}, c ? t(`group${c.group}` as never) : ''),
        h('td', {}, c ? c[L()] : h('span', { class: 'muted' }, t('noDescription'))),
        h('td', {}, c ? confMark(c.conf) : ''),
        h('td', { class: 'n mono' }, g.n || ''),
        h('td', { class: 'mono muted clip' }, sample),
        h('td', {}, ta),
        h('td', {}, m && g.n ? h('button', { type: 'button', class: 'ghost small', onclick: () => { Object.assign(explore, { q: '', type: '', sec: g.sec, id: String(g.id), unit: '', nonzero: false }); go('explore'); } }, t('view')) : ''))];
    }));
  };
  const importInp = h('input', { type: 'file', accept: '.json,application/json', class: 'sr' });
  const status = h('p', { class: 'note', role: 'status' });
  importInp.addEventListener('change', async () => {
    try { Object.assign(notes(), JSON.parse(await importInp.files![0].text())); saveNotes(); draw(); status.textContent = ''; }
    catch (e) { status.textContent = t('importError', { msg: (e as Error).message }); }
  });
  const view = h('div', { class: 'view' }, panel(t('ids'), { note: t('idsIntro'), wide: true },
    h('p', { class: 'legend' }, confMark('confirmed'), confMark('likely'), confMark('possible'), confMark('unknown')),
    h('div', { class: 'toolbar' },
      h('input', { type: 'search', class: 'search', placeholder: t('filter'), 'aria-label': t('filter'), value: idsQ, oninput: (e: Event) => { idsQ = (e.target as HTMLInputElement).value; draw(); } }),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: idsOnly, onchange: (e: Event) => { idsOnly = (e.target as HTMLInputElement).checked; draw(); } }), t('onlyDescribed')),
      h('button', { type: 'button', class: 'ghost', onclick: () => downloadBlob(new Blob([JSON.stringify(notes(), null, 1)], { type: 'application/json' }), 'gbfr-notes.json') }, t('exportNotes')),
      h('label', { class: 'button ghost' }, t('importNotes'), importInp)),
    status,
    h('div', { class: 'table-scroll' }, h('table', { class: 'data' },
      h('thead', {}, h('tr', {}, [t('section'), 'id', t('type'), t('group'), t('description'), t('confidence'), 'n', t('example'), t('note'), ''].map(x => h('th', { scope: 'col' }, x)))), tbody))));
  draw();
  return view;
}

// ---------------------------------------------------------------- Compare
export function compareView(): HTMLElement {
  const m = M(), other = state.other;
  if (!other) return h('div', { class: 'view' }, panel(t('compare'), { note: t('compareIntro') }));
  const map = new Map(other.units.map(u => [`${u.sec}|${u.type}|${u.id}|${u.unit}`, u]));
  type Row = { u: Unit; o: Unit; diffs: number[]; a: string[]; b: string[] };
  const rows: Row[] = [];
  for (const u of m.units) {
    const o = map.get(`${u.sec}|${u.type}|${u.id}|${u.unit}`);
    if (!o) continue;
    const a = readAll(other, o).map(v => formatValue(o, v)), b = readAll(m, u).map(v => formatValue(u, v));
    const diffs: number[] = [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) diffs.push(i);
    if (diffs.length) rows.push({ u, o, diffs, a, b });
  }
  const refersTo = (u: Unit) => {
    const base = Math.floor(u.id / 100) * 100;
    for (const k of [base + 1, base + 3]) {
      const r = rec(m, k, u.unit, u.sec);
      if (r && r.type === 'uint' && r.count) { const n = state.names.get(num(m, r)); if (n) return n.name; }
    }
    return '';
  };
  return h('div', { class: 'view' },
    evolutionPanel(),
    panel(t('differences', { a: other.name, b: m.name, n: fmtInt(rows.length) }), { wide: true }, dataTable([
      { label: t('section'), sort: r => r.u.sec, cell: r => h('span', { class: 'mono' }, r.u.sec) },
      { label: 'id', sort: r => r.u.id, numeric: true, cell: r => h('span', { class: 'mono' }, r.u.id) },
      { label: 'unit', sort: r => r.u.unit, numeric: true, cell: r => h('span', { class: 'mono' }, r.u.unit) },
      { label: t('refersTo'), sort: r => refersTo(r.u), cell: r => refersTo(r.u) },
      { label: t('change'), cell: r => h('span', { class: 'mono changes' }, r.diffs.slice(0, 4).map(i => h('span', {}, r.u.count > 1 ? `[${i}] ` : '', h('del', {}, r.a[i] ?? '∅'), ' → ', h('ins', {}, r.b[i] ?? '∅'))), r.diffs.length > 4 ? `+${r.diffs.length - 4}` : '') },
      { label: t('description'), cell: r => catalogOf(r.u.sec, r.u.id)?.[L()] ?? notes()[`${r.u.sec}:${r.u.id}`] ?? '' },
    ], rows, { filter: r => `${r.u.id} ${refersTo(r.u)} ${catalogOf(r.u.sec, r.u.id)?.[L()] ?? ''}` })));
}

// ---------------------------------------------------------------- Changes
export function changesView(): HTMLElement {
  const edits = state.edits!;
  const list = edits.list();
  return h('div', { class: 'view' }, panel(t('changesTitle', { n: list.length }), { wide: true },
    list.length ? h('div', { class: 'table-scroll' }, h('table', { class: 'data' },
      h('thead', {}, h('tr', {}, [t('field'), t('description'), t('value'), ''].map(x => h('th', { scope: 'col' }, x)))),
      h('tbody', {}, list.map(e => h('tr', {},
        h('td', { class: 'mono' }, `${e.u.sec} ${e.u.type} id ${e.u.id} unit ${e.u.unit}${e.u.count > 1 ? ` [${e.i}]` : ''}`),
        h('td', { class: 'note' }, catalogOf(e.u.sec, e.u.id)?.[L()] ?? ''),
        h('td', { class: 'mono changes' }, h('del', {}, formatValue(e.u, e.before)), ' → ', h('ins', {}, formatValue(e.u, e.after))),
        h('td', {}, h('button', { type: 'button', class: 'ghost small', 'data-sfx': 'undo', onclick: () => edits.undo(e) }, t('undo'))))))))
      : h('p', { class: 'empty-state' }, t('noChanges')),
    h('p', { class: 'note' }, t('changesHelp', { name: state.model!.name }))));
}
