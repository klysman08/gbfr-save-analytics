import { ptBR } from './pt-BR';
import { en } from './en';

export type Lang = 'pt-BR' | 'en';
export type Dict = typeof ptBR;
type Key = keyof Dict;

const DICTS: Record<Lang, Dict> = { 'pt-BR': ptBR, en };
const STORE_KEY = 'gbfr-lang';

function initial(): Lang {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved === 'pt-BR' || saved === 'en') return saved;
  } catch { /* storage unavailable */ }
  return navigator.language?.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en';
}

let lang: Lang = initial();

export const getLang = () => lang;

export function setLang(l: Lang) {
  lang = l;
  try { localStorage.setItem(STORE_KEY, l); } catch { /* storage unavailable */ }
  document.documentElement.lang = l;
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
