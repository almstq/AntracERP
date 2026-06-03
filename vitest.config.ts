import { defineConfig } from 'vitest/config';

// Standalone (does NOT load vite.config.ts) — these are pure-logic tests that
// need no React/Tailwind pipeline. Node environment keeps them fast. When
// component tests arrive, switch `environment` to 'jsdom' and add a setup file
// importing '@testing-library/jest-dom' (already installed).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
