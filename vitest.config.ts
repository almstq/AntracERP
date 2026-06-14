import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

// Standalone (does NOT load vite.config.ts) — these are pure-logic tests that
// need no React/Tailwind pipeline. Node environment keeps them fast. When
// component tests arrive, switch `environment` to 'jsdom' and add a setup file
// importing '@testing-library/jest-dom' (already installed).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    alias: {
      // Stub Firebase so the workflow engine's pure-logic tests run in Node
      // without trying to initialise a real Firebase app. The stubs live at
      // src/__mocks__/firebase/ and export only the types the registry needs.
      'firebase/firestore': resolve(__dirname, 'src/__mocks__/firebase/firestore.ts'),
      'firebase/auth': resolve(__dirname, 'src/__mocks__/firebase/auth.ts'),
      'firebase/storage': resolve(__dirname, 'src/__mocks__/firebase/storage.ts'),
      'firebase/app': resolve(__dirname, 'src/__mocks__/firebase/app.ts'),
    },
  },
});
