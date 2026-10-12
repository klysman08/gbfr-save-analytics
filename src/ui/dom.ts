type Child = Node | string | number | null | undefined | false | Child[];
type Attrs = Record<string, unknown>;

/** Tiny hyperscript: h('div', {class: 'x', onclick: fn}, ...children). */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...kids: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = String(v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
    else if (k in el && typeof v !== 'string') (el as unknown as Record<string, unknown>)[k] = v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  append(el, kids);
  return el;
}

export function append(el: Element, kids: Child[]) {
  for (const k of kids.flat(Infinity as 1) as Child[]) {
    if (k === null || k === undefined || k === false) continue;
    el.append(k instanceof Node ? k : String(k));
  }
}

const SVG_NS = 'http://www.w3.org/2000/svg';
export function s<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, ...kids: (Node | string)[]): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  el.append(...kids);
  return el;
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Icons: one authored set, 1.6px stroke on a 20px grid.
const ICONS: Record<string, string> = {
  open: 'M3 6.5h5l1.5 2H17v7.5H3z M3 6.5V4.5h5',
  compare: 'M6 3v14 M14 3v14 M3 7h6 M11 13h6',
  download: 'M10 3v10 M5.5 9l4.5 4.5L14.5 9 M4 17h12',
  undo: 'M7 6L3.5 9.5 7 13 M4 9.5h7.5a4.5 4.5 0 010 9H9',
  dashboard: 'M3 3h6v8H3z M11 3h6v5h-6z M11 10h6v7h-6z M3 13h6v4H3z',
  characters: 'M10 9a3 3 0 100-6 3 3 0 000 6z M4 17c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5',
  sigils: 'M10 2.5l6.5 3.75v7.5L10 17.5l-6.5-3.75v-7.5z M10 6.5l3 1.75v3.5L10 13.5l-3-1.75v-3.5z',
  materials: 'M4 7l6-3.5L16 7v6l-6 3.5L4 13z M4 7l6 3.5L16 7 M10 10.5v6',
  weapons: 'M15.5 3.5L7 12 M13 3.5h2.5V6 M5 12l3 3 M4 16l2.5-2.5',
  other: 'M4 4h5v5H4z M11 4h5v5h-5z M4 11h5v5H4z M11 11h5v5h-5z',
  explore: 'M8.5 14a5.5 5.5 0 100-11 5.5 5.5 0 000 11z M12.5 12.5L17 17',
  ids: 'M3 4h14 M3 8h14 M3 12h14 M3 16h9',
  changes: 'M5 3h7l3 3v11H5z M8 9h4 M8 12h4',
  github: 'M10 2.5a7.5 7.5 0 00-2.4 14.6c.4.1.5-.2.5-.4v-1.4c-2.1.5-2.5-.9-2.5-.9-.3-.9-.8-1.1-.8-1.1-.7-.5 0-.5 0-.5.8.1 1.2.8 1.2.8.7 1.2 1.8.8 2.2.6.1-.5.3-.8.5-1-1.7-.2-3.4-.8-3.4-3.7 0-.8.3-1.5.8-2-.1-.2-.3-1 .1-2 0 0 .6-.2 2.1.8a7 7 0 013.8 0c1.4-1 2.1-.8 2.1-.8.4 1 .2 1.8.1 2 .5.5.8 1.2.8 2 0 2.9-1.8 3.5-3.4 3.7.3.2.5.7.5 1.4v2.1c0 .2.1.5.5.4A7.5 7.5 0 0010 2.5z',
  check: 'M4 10.5l4 4 8-9',
  alert: 'M10 3l7.5 13h-15z M10 8v4 M10 14.2v.3',
};

export function icon(name: keyof typeof ICONS | string, size = 18): SVGSVGElement {
  const svg = s('svg', { viewBox: '0 0 20 20', width: size, height: size, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', class: 'icon' });
  svg.append(s('path', { d: ICONS[name] ?? '' }));
  return svg;
}

export function downloadBlob(blob: Blob, name: string) {
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export const storage = {
  get(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } },
  set(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* storage unavailable */ } },
};
