import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import next from '@next/eslint-plugin-next';
import hooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import globals from 'globals';
export default defineConfig([
  js.configs.recommended, ...tseslint.configs.recommended,
  { languageOptions: { globals: { ...globals.node, ...globals.browser } } },
  { files: ['apps/**/*.tsx', 'apps/**/*.ts'], ...hooks.configs.flat.recommended },
  { files: ['apps/site/**/*.{ts,tsx}'], ...next.configs['core-web-vitals'] },
  globalIgnores(['**/.next/**', '**/dist/**', '**/node_modules/**', 'apps/site/public/study/**', 'playwright-report/**', 'test-results/**', '.superpowers/**', 'content/imports/**', 'LexCommand.html', '**/next-env.d.ts']),
  { settings: { next: { rootDir: 'apps/site/' } } }
]);
