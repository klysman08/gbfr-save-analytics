import { h, s } from './dom';
import { fmtInt, fmtSigned, t } from '../i18n';

// Hand-built SVG charts. Inks follow the data family, never the rank:
// characters gold, materials moss, sigils blue, weapons rust (validated for CVD on the night ground).
export type Ink = 'chara' | 'mat' | 'sigil' | 'wep';

export interface Datum { label: string; value: number; sub?: string; highlight?: boolean }

let tip: HTMLDivElement | null = null;
function tooltip(): HTMLDivElement {
  if (!tip) { tip = h('div', { class: 'chart-tip', role: 'tooltip' }); document.body.append(tip); }
  return tip;
}
function bindTip(target: Element, html: () => string) {
  target.addEventListener('pointerenter', () => { const el = tooltip(); el.innerHTML = html(); el.classList.add('on'); });
  target.addEventListener('pointermove', e => {
    const el = tooltip(), ev = e as PointerEvent;
    const x = Math.min(ev.clientX + 14, innerWidth - el.offsetWidth - 8);
    el.style.transform = `translate(${x}px, ${ev.clientY + 14}px)`;
  });
  target.addEventListener('pointerleave', () => tooltip().classList.remove('on'));
}
const esc = (x: string) => x.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

function tableView(rows: Datum[], headers: [string, string]): HTMLElement {
  return h('details', { class: 'chart-table' },
    h('summary', {}, t('viewTable')),
    h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, headers[0]), h('th', { class: 'n' }, headers[1]))),
      h('tbody', {}, rows.map(r => h('tr', {}, h('td', {}, r.label), h('td', { class: 'n' }, fmtInt(r.value)))))));
}

/** Horizontal bars with direct labels; bars "pull" from the baseline in sequence. */
export function barList(rows: Datum[], ink: Ink, opts: { max?: number; headers: [string, string]; unit?: string } = { headers: ['', ''] }): HTMLElement {
  const max = opts.max ?? Math.max(1, ...rows.map(r => r.value));
  const list = h('ol', { class: `bars ink-${ink}` },
    rows.map((r, i) => {
      const li = h('li', { style: { '--i': String(Math.min(i, 12)) } as unknown as Partial<CSSStyleDeclaration> },
        h('span', { class: 'bar-label', title: r.sub ?? r.label }, r.label),
        h('span', { class: 'bar-track' }, h('span', { class: `bar-fill${r.highlight ? ' hi' : ''}`, style: { width: `${(r.value / max) * 100}%` } })),
        h('span', { class: 'bar-value' }, fmtInt(r.value)));
      bindTip(li, () => `<b>${esc(r.label)}</b>${r.sub ? `<span>${esc(r.sub)}</span>` : ''}<em>${fmtInt(r.value)}${opts.unit ? ' ' + esc(opts.unit) : ''}</em>`);
      return li;
    }));
  return h('div', { class: 'chart' }, list, tableView(rows, opts.headers));
}

/** Vertical columns for a distribution (e.g. sigils per level). */
export function columns(rows: Datum[], ink: Ink, headers: [string, string]): HTMLElement {
  const W = 560, H = 190, pad = { l: 34, r: 8, t: 12, b: 26 };
  const max = Math.max(1, ...rows.map(r => r.value));
  const step = (W - pad.l - pad.r) / rows.length;
  const bw = Math.max(4, step - 4);
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: `cols ink-${ink}`, role: 'img', 'aria-label': headers.join(' / ') });
  for (const f of [0.5, 1]) {
    svg.append(s('line', { x1: pad.l, x2: W - pad.r, y1: y(max * f), y2: y(max * f), class: 'grid' }));
    svg.append(s('text', { x: pad.l - 6, y: y(max * f) + 4, class: 'axis', 'text-anchor': 'end' }, fmtInt(Math.round(max * f))));
  }
  svg.append(s('line', { x1: pad.l, x2: W - pad.r, y1: y(0), y2: y(0), class: 'base' }));
  rows.forEach((r, i) => {
    const x = pad.l + i * step + (step - bw) / 2;
    const top = y(r.value), hgt = Math.max(0, y(0) - top);
    const g = s('g', { class: 'col', style: `--i:${Math.min(i, 14)}` });
    g.append(s('rect', { x: pad.l + i * step, y: pad.t, width: step, height: H - pad.t - pad.b, class: 'hit' }));
    if (hgt > 0) g.append(s('path', { d: `M${x},${y(0)} V${top + 3} q0,-3 3,-3 h${bw - 6} q3,0 3,3 V${y(0)} z`, class: 'mark' }));
    g.append(s('text', { x: x + bw / 2, y: H - 8, class: 'axis', 'text-anchor': 'middle' }, r.label));
    bindTip(g, () => `<b>${esc(headers[0])} ${esc(r.label)}</b><em>${fmtInt(r.value)}</em>`);
    svg.append(g);
  });
  return h('div', { class: 'chart' }, svg, tableView(rows, headers));
}

/** Diverging bars around zero: gains to the right (moss), spending to the left (rust), neutral axis. */
export function diverging(rows: Datum[], headers: [string, string]): HTMLElement {
  const max = Math.max(1, ...rows.map(r => Math.abs(r.value)));
  const list = h('ol', { class: 'div-bars' },
    rows.map((r, i) => {
      const pct = (Math.abs(r.value) / max) * 50;
      const li = h('li', { style: { '--i': String(Math.min(i, 12)) } as unknown as Partial<CSSStyleDeclaration> },
        h('span', { class: 'bar-label', title: r.label }, r.label),
        h('span', { class: 'div-track' },
          h('span', { class: `div-fill ${r.value < 0 ? 'neg' : 'pos'}`, style: r.value < 0 ? { right: '50%', width: `${pct}%` } : { left: '50%', width: `${pct}%` } })),
        h('span', { class: `bar-value ${r.value < 0 ? 'neg' : 'pos'}` }, fmtSigned(r.value)));
      bindTip(li, () => `<b>${esc(r.label)}</b>${r.sub ? `<span>${esc(r.sub)}</span>` : ''}<em>${fmtSigned(r.value)}</em>`);
      return li;
    }));
  return h('div', { class: 'chart' },
    h('div', { class: 'div-legend' }, h('span', { class: 'lg neg' }, t('spent')), h('span', { class: 'lg pos' }, t('gained'))),
    list, tableView(rows, headers));
}
