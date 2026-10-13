/// <reference types="vitest/config" />
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/gbfr-save-analytics/',
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        pt: resolve(import.meta.dirname, 'pt/index.html'),
        ja: resolve(import.meta.dirname, 'ja/index.html'),
        fallback: resolve(import.meta.dirname, '404.html'),
      },
    },
  },
  test: { environment: 'node' },
});
