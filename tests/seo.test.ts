import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

describe('SEO metadata and configuration', () => {
  const rootDir = resolve(import.meta.dirname, '..');

  it('robots.txt exists and points to sitemap', () => {
    const robotsPath = resolve(rootDir, 'public/robots.txt');
    expect(existsSync(robotsPath)).toBe(true);
    const content = readFileSync(robotsPath, 'utf8');
    expect(content).toContain('User-agent: *');
    expect(content).toContain('Sitemap: https://klysman08.github.io/gbfr-save-analytics/sitemap.xml');
  });

  it('sitemap.xml exists and has valid XML with alternate hreflang entries', () => {
    const sitemapPath = resolve(rootDir, 'public/sitemap.xml');
    expect(existsSync(sitemapPath)).toBe(true);
    const content = readFileSync(sitemapPath, 'utf8');
    expect(content).toContain('https://klysman08.github.io/gbfr-save-analytics/');
    expect(content).toContain('https://klysman08.github.io/gbfr-save-analytics/pt/');
    expect(content).toContain('https://klysman08.github.io/gbfr-save-analytics/ja/');
    expect(content).toContain('hreflang="x-default"');
    expect(content).toContain('hreflang="en"');
    expect(content).toContain('hreflang="pt-BR"');
    expect(content).toContain('hreflang="ja"');
  });

  it('og-image.png and relink-icon.png exist in public directory', () => {
    expect(existsSync(resolve(rootDir, 'public/og-image.png'))).toBe(true);
    expect(existsSync(resolve(rootDir, 'public/relink-icon.png'))).toBe(true);
    expect(existsSync(resolve(rootDir, 'public/site.webmanifest'))).toBe(true);
  });

  it('404.html exists and has noindex directive', () => {
    const p404 = resolve(rootDir, '404.html');
    expect(existsSync(p404)).toBe(true);
    const content = readFileSync(p404, 'utf8');
    expect(content).toContain('content="noindex, nofollow"');
  });

  const pages = [
    { path: 'index.html', lang: 'en', canonical: 'https://klysman08.github.io/gbfr-save-analytics/' },
    { path: 'pt/index.html', lang: 'pt-BR', canonical: 'https://klysman08.github.io/gbfr-save-analytics/pt/' },
    { path: 'ja/index.html', lang: 'ja', canonical: 'https://klysman08.github.io/gbfr-save-analytics/ja/' },
  ];

  for (const page of pages) {
    it(`${page.path} has correct canonical, hreflangs and valid JSON-LD`, () => {
      const fullPath = resolve(rootDir, page.path);
      expect(existsSync(fullPath)).toBe(true);
      const html = readFileSync(fullPath, 'utf8');

      // Canonical and alternates
      expect(html).toContain(`rel="canonical" href="${page.canonical}"`);
      expect(html).toContain('hreflang="x-default"');
      expect(html).toContain('hreflang="en"');
      expect(html).toContain('hreflang="pt-BR"');
      expect(html).toContain('hreflang="ja"');

      // Open Graph & Twitter
      expect(html).toContain('property="og:image" content="https://klysman08.github.io/gbfr-save-analytics/og-image.png"');
      expect(html).toContain('name="twitter:card" content="summary_large_image"');

      // Semantic crawlable fallback
      expect(html).toContain('class="seo-fallback"');
      expect(html).toMatch(/<h1[^>]*>GBFR Save Analytics/);

      // JSON-LD validation
      const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      expect(match).not.toBeNull();
      const json = JSON.parse(match![1]);
      expect(json['@context']).toBe('https://schema.org');
      expect(Array.isArray(json['@graph'])).toBe(true);
      expect(json['@graph'].length).toBe(2);

      const webApp = json['@graph'].find((item: { ['@type']: string }) => item['@type'] === 'WebApplication');
      expect(webApp).toBeDefined();
      expect(webApp.name).toBe('GBFR Save Analytics');

      const faq = json['@graph'].find((item: { ['@type']: string }) => item['@type'] === 'FAQPage');
      expect(faq).toBeDefined();
      expect(faq.mainEntity.length).toBeGreaterThanOrEqual(3);
    });
  }
});
