import { h } from './dom';
import { t } from '../i18n';

export interface Column<R> {
  label: string;
  /** Sort key; omit to make the column unsortable. */
  sort?: (r: R) => number | string;
  cell: (r: R) => Node | string | number;
  numeric?: boolean;
}

const LIMIT = 1500;

/**
 * Data table with sortable headers and an optional text filter.
 * Rows render lazily up to LIMIT; the count line states what is hidden.
 */
export function dataTable<R>(cols: Column<R>[], rows: R[], opts: { filter?: (r: R) => string; caption?: string; initialSort?: number; desc?: boolean } = {}): HTMLElement {
  let sortCol = opts.initialSort ?? -1, desc = opts.desc ?? false, q = '';
  const tbody = h('tbody');
  const count = h('span', { class: 'muted count' });
  const heads = cols.map((c, i) => {
    const th = h('th', { class: c.numeric ? 'n' : '', scope: 'col' });
    if (c.sort) {
      const btn = h('button', { class: 'sort', type: 'button', onclick: () => { desc = sortCol === i ? !desc : !!c.numeric; sortCol = i; draw(); } }, c.label);
      th.append(btn);
    } else th.append(c.label);
    return th;
  });
  const draw = () => {
    heads.forEach((th, i) => th.setAttribute('aria-sort', i === sortCol ? (desc ? 'descending' : 'ascending') : 'none'));
    let list = q && opts.filter ? rows.filter(r => opts.filter!(r).toLowerCase().includes(q)) : rows.slice();
    const sc = cols[sortCol];
    if (sc?.sort) {
      const f = sc.sort;
      list.sort((a, b) => { const x = f(a), y = f(b); const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y)); return desc ? -c : c; });
    }
    const total = list.length;
    list = list.slice(0, LIMIT);
    tbody.replaceChildren(...list.map(r => h('tr', {}, cols.map(c => h('td', { class: c.numeric ? 'n' : '' }, c.cell(r))))));
    count.textContent = t('shown', { shown: Math.min(total, LIMIT), total: rows.length });
  };
  const search = opts.filter ? h('input', { type: 'search', class: 'search', placeholder: t('filter'), 'aria-label': t('filter'), oninput: (e: Event) => { q = (e.target as HTMLInputElement).value.trim().toLowerCase(); draw(); } }) : null;
  draw();
  return h('div', { class: 'table-block' },
    search || opts.caption ? h('div', { class: 'toolbar' }, search, count) : null,
    h('div', { class: 'table-scroll' }, h('table', { class: 'data' }, opts.caption ? h('caption', { class: 'sr' }, opts.caption) : null, h('thead', {}, h('tr', {}, heads)), tbody)));
}
