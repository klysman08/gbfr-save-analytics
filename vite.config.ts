/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/gbfr-save-analytics/',
  build: { target: 'es2022', sourcemap: true },
  test: { environment: 'node' },
});
