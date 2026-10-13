import { h } from './dom';
import { fmtInt, getLang, t } from '../i18n';
import { state } from './state';
import { sfx } from './sfx';
import { catalogOf, type Confidence } from '../core/catalog';
import { encodeString, formatValue, parseValue, read, readString, ValueError, type Unit } from '../core/save';

function errorText(e: unknown): string {
  if (e instanceof ValueError) {
    if (e.code === 'nan') return t('errNan');
    if (e.code === 'int') return t('errInt');
    return t('errRange', { lo: e.range?.[0] ?? '', hi: e.range?.[1] ?? '' });
  }
  return String(e);
}

const describe = (u: Unit, i?: number) => {
  const c = catalogOf(u.sec, u.id);
  return `${u.sec} ${u.type} id ${u.id}${u.unit ? ' unit ' + u.unit : ''}${i !== undefined && u.count > 1 ? ` [${i}]` : ''}${c ? ' — ' + c[langKey()] : ''}`;
};
const langKey = () => { const l = getLang(); return (l === 'ja' ? 'ja' : l === 'en' ? 'en' : 'pt') as 'pt' | 'en' | 'ja'; };

/** Ink wash on an edited field: the signature feedback for a change. */
function washIn(el: HTMLElement) {
  el.classList.remove('wash');
  void el.offsetWidth;
  el.classList.add('wash');
}

/** Editable numeric field bound to (unit, index). */
export function numberCell(u: Unit | undefined, i = 0, opts: { width?: string; label?: string; grouped?: boolean } = {}): HTMLElement {
  if (!u || !state.model || !state.edits || u.count <= i) return h('span', { class: 'muted' }, t('none'));
  const m = state.model, edits = state.edits;
  const inp = h('input', {
    class: 'num', inputmode: 'decimal',
    title: describe(u, i), 'aria-label': opts.label ?? describe(u, i),
  });
  // Grouped cells show 2.464.174 at rest and the raw number while editing.
  const shown = () => (opts.grouped && document.activeElement !== inp ? fmtInt(read(m, u, i)) : formatValue(u, read(m, u, i)));
  inp.value = shown();
  if (opts.grouped) {
    inp.addEventListener('focus', () => { inp.value = formatValue(u, read(m, u, i)); inp.select(); });
    inp.addEventListener('blur', () => { inp.value = shown(); });
  }
  if (opts.width) inp.style.width = opts.width;
  const mark = () => inp.classList.toggle('edited', edits.has(u, i));
  mark();
  inp.addEventListener('change', () => {
    try {
      edits.apply(u, i, parseValue(u.type, inp.value));
      inp.setCustomValidity('');
      washIn(inp);
      sfx('edit');
    } catch (e) {
      inp.setCustomValidity(errorText(e));
      inp.reportValidity();
      sfx('error');
    }
    inp.value = shown();
    mark();
  });
  inp.addEventListener('keydown', e => { if (e.key === 'Escape') { inp.value = formatValue(u, read(m, u, i)); inp.blur(); } });
  return inp;
}

export function stringCell(u: Unit | undefined, opts: { label?: string } = {}): HTMLElement {
  if (!u || !state.model || !state.edits) return h('span', { class: 'muted' }, t('none'));
  const m = state.model, edits = state.edits;
  const inp = h('input', { class: 'text', value: readString(m, u), title: describe(u), 'aria-label': opts.label ?? describe(u), spellcheck: false });
  const mark = () => inp.classList.toggle('edited', Array.from({ length: u.count }, (_, i) => edits.has(u, i)).some(Boolean));
  mark();
  inp.addEventListener('change', () => {
    try {
      edits.applyMany(u, encodeString(u, inp.value));
      inp.setCustomValidity('');
      washIn(inp);
      sfx('edit');
    } catch (e) {
      inp.setCustomValidity(errorText(e));
      inp.reportValidity();
      sfx('error');
    }
    inp.value = readString(m, u);
    mark();
  });
  return inp;
}

/** Display name for a hash, with its internal ID as a quiet secondary line. */
export function nameCell(hash: number, fallback?: string): HTMLElement {
  const n = state.names.get(hash);
  if (!n) return h('span', { class: 'mono muted' }, fallback ?? `#${hash.toString(16)}`);
  return h('span', { class: 'named', title: n.id }, h('span', {}, n.name), h('span', { class: 'id' }, n.id));
}

/** Fixed-cell confidence mark: filled = confirmed, half = likely, hollow = possible, dashed = unknown. */
export function confMark(c: Confidence, withLabel = true): HTMLElement {
  return h('span', { class: `conf conf-${c}` }, h('i', { 'aria-hidden': 'true' }), withLabel ? t(c) : h('span', { class: 'sr' }, t(c)));
}
