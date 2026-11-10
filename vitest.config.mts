import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

/**
 * Unit tests for pure logic only (plan generation, training load, date
 * helpers) — the modules docs/CLAUDE.md calls "critical logic". These run
 * in plain Node with no React Native runtime, which is why this is Vitest
 * rather than jest-expo: nothing here renders a component. Screen/component
 * tests would need jest-expo and are a separate, later decision.
 */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['**/__tests__/**/*.test.ts'],
    exclude: ['node_modules/**', 'supabase/functions/**', 'design/**'],
  },
});
