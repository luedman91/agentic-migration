/**
 * ============================================================================
 * Unified Vite & Vitest Configuration (vite.config.ts)
 * ============================================================================
 * 
 * Feature Description:
 * Unified configuration for Vite bundler and Vitest test runner. Consolidates
 * plugin declarations, path aliases, HMR policies, and test suite execution
 * environments into a single source of truth, eliminating redundant config files.
 * 
 * Use Cases:
 * 1. Building the production SPA and bundled server assets via `vite build`.
 * 2. Running the test runner (`vitest`) across unit and integration test suites.
 * 3. Hot Module Replacement (HMR) and dev server asset orchestration.
 * ============================================================================
 */

/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR=true.
      // When enabled, server.ts attaches the websocket to the Express HTTP
      // server so Vite does not open a standalone listener on port 24678.
      hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    test: {
      globals: true,
      environment: 'node',
      include: ['tests/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: [
          'src/config/**/*.ts',
          'src/utils/**/*.ts',
          'src/hooks/**/*.ts',
          'server/**/*.ts',
        ],
        exclude: [
          'node_modules',
          'dist',
          'tests',
          '**/*.d.ts',
          'src/data/**',
        ],
      },
    },
  };
});
