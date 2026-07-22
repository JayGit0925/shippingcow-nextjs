import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    // Mirrors the `@/*` path alias in tsconfig.json so route handlers, which
    // import via `@/lib/...`, can be exercised directly in tests.
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
