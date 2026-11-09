import { afterEach, expect, test } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { checkBrowserBoundary } from '../../scripts/check-browser-boundary';

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });
async function fixture(files: Record<string, string>) {
  const root = await mkdtemp(join(tmpdir(), 'lawprep-boundary-')); roots.push(root);
  for (const [path, source] of Object.entries(files)) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), source);
  }
  return checkBrowserBoundary({ root, entries: ['src/main.ts'] });
}
test('browser graph follows safe relative imports', async () => {
  expect(await fixture({ 'src/main.ts': "import {label} from './shared'; console.log(label)", 'src/shared.ts': "export const label = 'study'" })).toEqual([]);
});
test('direct Node imports are prohibited', async () => {
  expect(await fixture({ 'src/main.ts': "import {readFile} from 'node:fs'; readFile('secret',()=>{})" })).toEqual(expect.arrayContaining([expect.stringMatching(/node:fs/)]));
});
test('a transitive re-export cannot hide server code', async () => {
  expect(await fixture({ 'src/main.ts': "import {key} from './barrel'", 'src/barrel.ts': "export {key} from './private'", 'src/private.ts': "import 'server-only'; export const key = process.env.SECRET" })).toEqual(expect.arrayContaining([expect.stringMatching(/server-only|process.env/)]));
});
test('TypeScript aliases resolve before checking ownership', async () => {
  expect(await fixture({ 'tsconfig.json': JSON.stringify({ compilerOptions: { paths: { '@hidden': ['./packages/server/src/index.ts'] } } }), 'src/main.ts': "import '@hidden'", 'packages/server/src/index.ts': 'export const key = 1' })).toEqual(expect.arrayContaining([expect.stringMatching(/server/)]));
});
test('unknown and computed dynamic imports fail closed', async () => {
  for (const source of ["import('unknown-library')", 'const path = location.hash; import(path)', "require('./anything')"]) {
    expect((await fixture({ 'src/main.ts': source })).length).toBeGreaterThan(0);
  }
});

test('Vite glob and URL asset imports cannot bypass the server boundary', async () => {
  for (const source of [
    "console.log(import.meta.glob('../packages/server/*.ts', { eager: true, query: '?raw', import: 'default' }))",
    "console.log(new URL('../packages/server/key.ts', import.meta.url))"
  ]) {
    const problems = await fixture({ 'src/main.ts': source, 'packages/server/key.ts': "export const privateValue = 'fixture-only-private-content'" });
    expect(problems).toEqual(expect.arrayContaining([expect.stringMatching(/glob|asset/i)]));
  }
});

test('private imported answer data cannot become an ordinary JSON dependency', async () => {
  const problems = await fixture({
    'tsconfig.json': JSON.stringify({ compilerOptions: { resolveJsonModule: true } }),
    'src/main.ts': "import answers from '../content/imports/legacy-draft.json'; console.log(answers)",
    'content/imports/legacy-draft.json': '{"fixtureAnswer":0}'
  });
  expect(problems).toEqual(expect.arrayContaining([expect.stringMatching(/private|imports/i)]));
});
