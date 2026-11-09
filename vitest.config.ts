import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['tests/unit/**/*.test.ts'], passWithNoTests: false, allowOnly: false, maxWorkers: 2 } });
