import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
// This Node protocol harness has no RSC loader. Select the package's official
// server export here only; Next and the browser import guard retain enforcement.
export default defineConfig({
  resolve: { alias: { 'server-only': fileURLToPath(new URL('./node_modules/server-only/empty.js', import.meta.url)) } },
  test: { include: ['tests/integration/**/*.test.ts'], passWithNoTests: false, allowOnly: false, maxWorkers: 2 }
});
