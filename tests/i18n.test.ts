import { describe, expect, it } from 'vitest';
import { en } from '../src/i18n/en';
import { ptBR } from '../src/i18n/pt-BR';
import { ja } from '../src/i18n/ja';
import { getLang, setLang, t, fmtInt, fmtPct, fmtSigned } from '../src/i18n';
import { CATALOG } from '../src/core/catalog';

describe('i18n', () => {
  it('ja dictionary covers all keys from en and pt-BR', () => {
    const enKeys = Object.keys(en).sort();
    const ptKeys = Object.keys(ptBR).sort();
    const jaKeys = Object.keys(ja).sort();

    expect(jaKeys).toEqual(enKeys);
    expect(jaKeys).toEqual(ptKeys);
  });

  it('all ja dictionary entries are non-empty strings', () => {
    for (const [, v] of Object.entries(ja)) {
      expect(typeof v).toBe('string');
      expect((v as string).trim().length).toBeGreaterThan(0);
    }
  });

  it('preserves all interpolation placeholders in ja', () => {
    const getPlaceholders = (s: string) => (s.match(/\{(\w+)\}/g) || []).sort();
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      const enPlaceholders = getPlaceholders(en[key]);
      const jaPlaceholders = getPlaceholders(ja[key]);
      expect(jaPlaceholders, `placeholder mismatch for key "${key}"`).toEqual(enPlaceholders);
    }
  });

  it('switches to ja and translates correctly', () => {
    const prev = getLang();
    try {
      setLang('ja', false);
      expect(getLang()).toBe('ja');
      expect(t('appName')).toBe('GBFR Save Analytics');
      expect(t('sigils')).toBe('ジーン');
      expect(t('materials')).toBe('トレジャー');
      expect(t('fileInfo', { name: 'SaveData1.dat', size: '3.1', units: 42 })).toBe('SaveData1.dat · 3.1 MB · 42 ユニット');
      expect(fmtInt(1234567)).toBe('1,234,567');
      expect(fmtSigned(50)).toBe('+50');
      expect(fmtPct(0.75)).toBe('75%');
    } finally {
      setLang(prev, false);
    }
  });

  it('catalog includes japanese description for every entry', () => {
    for (const entry of CATALOG) {
      expect(entry.ja).toBeDefined();
      expect(typeof entry.ja).toBe('string');
      expect(entry.ja.trim().length).toBeGreaterThan(0);
    }
  });
});
