import { ptBR } from './pt-BR';
import { en } from './en';
import { ja } from './ja';

export type Lang = 'pt-BR' | 'en' | 'ja';
export type Dict = typeof ptBR;
type Key = keyof Dict;

const DICTS: Record<Lang, Dict> = { 'pt-BR': ptBR, en, ja };
// v2: earlier builds saved the browser language automatically; only an explicit choice is stored now.
const STORE_KEY = 'gbfr-lang-v2';

function detectFromPath(): Lang | null {
  if (typeof window === 'undefined') return null;
  const p = window.location.pathname.toLowerCase();
  if (/(^|\/)pt(\/|$)/.test(p)) return 'pt-BR';
  if (/(^|\/)ja(\/|$)/.test(p)) return 'ja';
  return null;
}

function initial(): Lang {
  const fromPath = detectFromPath();
  if (fromPath) return fromPath;
  return 'en';
}

let lang: Lang = initial();

export const getLang = () => lang;

export function getLangUrl(l: Lang): string {
  const base = (import.meta.env?.BASE_URL || '/').replace(/\/+$/, '');
  const path = l === 'pt-BR' ? `${base}/pt/` : l === 'ja' ? `${base}/ja/` : `${base}/`;
  const hash = typeof window !== 'undefined' ? window.location.hash || '' : '';
  return `${path}${hash}`;
}

/** Applies a language; persist=true only for the user's explicit choice in the selector. */
export function setLang(l: Lang, persist = true) {
  lang = l;
  if (persist) try { localStorage.setItem(STORE_KEY, l); } catch { /* storage unavailable */ }
  if (typeof document !== 'undefined') document.documentElement.lang = l;
}

/** Translate with {name} placeholders. */
export function t(key: Key, vars: Record<string, string | number> = {}): string {
  const s: string = DICTS[lang][key] ?? ptBR[key];
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export const fmtInt = (n: number | bigint) => new Intl.NumberFormat(lang).format(n);
export const fmtSigned = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + fmtInt(Math.abs(n));
export const fmtPct = (n: number) => new Intl.NumberFormat(lang, { style: 'percent', maximumFractionDigits: 0 }).format(n);
export const fmtDate = (ms: number) => new Date(ms).toLocaleString(lang, { dateStyle: 'medium', timeStyle: 'short' });
