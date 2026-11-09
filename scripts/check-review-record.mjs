import { createHash } from 'node:crypto';
import { readFile, readdir, stat, access } from 'node:fs/promises';
import { basename, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function sourceFingerprint(root) {
  const files = [];
  async function walk(path) {
    const normalized = relative(root, path).replaceAll('\\', '/');
    const name = basename(path);
    if (name.startsWith('.env') && name !== '.env.example') return;
    if (['apps/site/public/study', 'supabase/.temp', 'supabase/.branches'].includes(normalized) || path.endsWith('.tsbuildinfo')) return;
    try {
      if ((await stat(path)).isDirectory()) {
        for (const child of (await readdir(path)).sort()) if (!['reviews', 'node_modules', '.next', 'dist'].includes(child)) await walk(join(path, child));
      } else files.push(path);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  for (const path of ['AGENTS.md', 'package.json', 'package-lock.json', 'quality-gates.json', 'scripts', 'tests/process', 'tests/unit', 'tests/integration', 'tests/e2e', '.github', '.githooks', '.gitignore', '.gitattributes', '.env.example', 'tsconfig.json', 'vitest.config.ts', 'vitest.integration.config.ts', 'playwright.config.ts', 'eslint.config.mjs', 'apps', 'packages', 'supabase', 'content/editorial', 'content/coverage', 'docs/engineering', 'docs/implementation/setup.md', 'docs/implementation/content-audit.md']) await walk(join(root, path));
  const hash = createHash('sha256');
  for (const file of files.sort()) { hash.update(relative(root, file).replaceAll('\\', '/')); hash.update('\0'); hash.update(await readFile(file)); hash.update('\0'); }
  return hash.digest('hex');
}

export function validateReviewRecord(record, context) {
  const errors = [];
  if (!record || typeof record.fingerprint !== 'string' || !record.fingerprint.trim() || typeof context.fingerprint !== 'string' || !context.fingerprint.trim() || record.fingerprint !== context.fingerprint) errors.push('Review does not match current work');
  if (!record?.reviewer || record.reviewer === context.implementer) errors.push('Independent review required');
  if (record?.scope !== 'code' || record?.verdict !== 'accepted') errors.push('Code review not accepted');
  if (!Array.isArray(record?.findings) || record.findings.some(f => ['critical', 'important'].includes(f.severity) && f.status !== 'resolved')) errors.push('Unresolved material finding');
  if (!Array.isArray(record?.evidence) || !record.evidence.length || record.evidence.some(path => typeof path !== 'string' || !path.trim())) errors.push('Review evidence missing');
  return { valid: errors.length === 0, errors };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const root = process.cwd();
    const fingerprint = await sourceFingerprint(root);
    if (process.argv.includes('--fingerprint')) console.log(fingerprint);
    else {
      const record = JSON.parse(await readFile('docs/engineering/reviews/foundation.json', 'utf8'));
      const result = validateReviewRecord(record, { fingerprint, implementer: 'root' });
      if (!result.valid) throw new Error(result.errors.join('; '));
      for (const path of record.evidence) {
        const target = resolve(root, path);
        if (relative(root, target).startsWith('..')) throw new Error('Review evidence must stay inside this workspace');
        await access(target);
      }
      console.log('Independent milestone review checked');
    }
  } catch (error) { console.error(`Review blocked: ${error.message}`); process.exitCode = 1; }
}
