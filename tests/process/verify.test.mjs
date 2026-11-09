import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runGates, validateSecurityMap } from '../../scripts/verify.mjs';
import { sourceFingerprint, validateReviewRecord } from '../../scripts/check-review-record.mjs';

const context = { milestone: 'bootstrap', root: process.cwd() };
function registry(gate = {}) {
  return { milestones: ['bootstrap', 'client', 'release'], activeMilestone: 'bootstrap',
    requiredAt: { proof: 'bootstrap' }, gates: [{ id: 'proof', required: true,
      activation: 'bootstrap', command: [process.execPath, '-e', 'console.log("checked")'],
      evidencePattern: 'checked', ...gate }] };
}

test('successful required command produces evidence and passes', async () => {
  const result = await runGates(registry(), context);
  assert.equal(result.passed, true);
  assert.equal(result.results[0].status, 'PASS');
  assert.match(result.results[0].evidence, /checked/);
});
test('nonzero exit is a failure, even when stdout looks green', async () => {
  const result = await runGates(registry({ command: [process.execPath, '-e', 'console.log("checked");process.exit(1)'] }), context);
  assert.equal(result.passed, false);
  assert.equal(result.results[0].status, 'FAIL');
});
test('unavailable executable blocks verification', async () => {
  const result = await runGates(registry({ command: ['lawprep-does-not-exist-279184'] }), context);
  assert.equal(result.passed, false);
  assert.equal(result.results[0].status, 'BLOCKED');
});
test('zero tests or missing report cannot count as success', async () => {
  for (const stdout of ['', '# tests 0']) {
    const result = await runGates(registry({ command: [process.execPath, '-e', `console.log(${JSON.stringify(stdout)})`], evidencePattern: '# tests [1-9][0-9]*' }), context);
    assert.equal(result.passed, false);
    assert.equal(result.results[0].status, 'FAIL');
  }
});
test('a required TAP suite cannot pass with skipped, todo or cancelled cases', async () => {
  for (const summary of [
    '# tests 1\n# pass 0\n# fail 0\n# cancelled 0\n# skipped 1\n# todo 0',
    '# tests 2\n# pass 1\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 1',
    '# tests 1\n# pass 0\n# fail 0\n# cancelled 1\n# skipped 0\n# todo 0'
  ]) {
    const result = await runGates(registry({ command: [process.execPath, '-e', `console.log(${JSON.stringify(summary)})`], evidenceFormat: 'tap', evidencePattern: '# tests [1-9][0-9]*' }), context);
    assert.equal(result.passed, false);
  }
});
test('a genuinely skipped Node test is not successful verification', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lawprep-skipped-'));
  try {
    await writeFile(join(directory, 'skipped.mjs'), 'import {test} from "node:test";test.skip("missing database",()=>{});');
    const result = await runGates(registry({ command: [process.execPath, '--test', '--test-reporter=tap', join(directory, 'skipped.mjs')], evidenceFormat: 'tap', evidencePattern: '# tests [1-9][0-9]*' }), context);
    assert.equal(result.passed, false);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
test('timed-out command blocks instead of passing', async () => {
  const result = await runGates(registry({ command: [process.execPath, '-e', 'setTimeout(()=>{},5000)'], timeoutMs: 30 }), context);
  assert.equal(result.passed, false);
  assert.equal(result.results[0].status, 'BLOCKED');
});
test('unknown milestone, regressed milestone and missing active registration fail closed', async () => {
  assert.equal((await runGates(registry(), { ...context, milestone: 'unknown' })).passed, false);
  const advanced = { ...registry(), activeMilestone: 'client' };
  assert.equal((await runGates(advanced, context)).passed, false);
  const missing = { ...registry(), gates: [] };
  assert.equal((await runGates(missing, context)).passed, false);
});
test('required check cannot become optional, future or conditionally excluded', async () => {
  for (const change of [{ required: false }, { activation: 'release' }, { skip: true }]) {
    const result = await runGates(registry(change), context);
    assert.equal(result.passed, false);
  }
});
test('legitimate future check is explicitly not applicable, never reported as passed', async () => {
  const config = registry();
  config.gates.push({ id: 'future', required: true, activation: 'release', command: ['not-installed-yet'] });
  const result = await runGates(config, context);
  assert.equal(result.passed, true);
  assert.equal(result.results.find(r => r.id === 'future').status, 'NOT_APPLICABLE');
});
test('milestone reviews are enforced at acceptance while iteration stays possible', async () => {
  const config = registry({ acceptanceOnly: true, command: [process.execPath, '-e', 'process.exit(1)'] });
  const iteration = await runGates(config, context);
  assert.equal(iteration.passed, true);
  assert.equal(iteration.results[0].status, 'NOT_APPLICABLE');
  assert.equal((await runGates(config, { ...context, acceptance: true })).passed, false);
  assert.equal((await runGates(registry({ acceptanceOnly: 'yes' }), context)).passed, false);
});
test('duplicate IDs and malformed commands cannot hide a required failure', async () => {
  const duplicate = registry(); duplicate.gates.push({ ...duplicate.gates[0] });
  assert.equal((await runGates(duplicate, context)).passed, false);
  assert.equal((await runGates(registry({ command: [] }), context)).passed, false);
});
test('empty verification registry and unowned required checks fail closed', async () => {
  assert.equal((await runGates({ ...registry(), requiredAt: {}, gates: [] }, context)).passed, false);
  assert.equal((await runGates({ ...registry(), requiredAt: {} }, context)).passed, false);
});
test('CLI executes the same registry checks and emits a machine-readable report', async () => {
  const { spawnSync } = await import('node:child_process');
  const directory = await mkdtemp(join(tmpdir(), 'lawprep-gates-'));
  try {
    await writeFile(join(directory, 'quality-gates.json'), JSON.stringify(registry()));
    const run = spawnSync(process.execPath, [join(process.cwd(), 'scripts/verify.mjs')], { cwd: directory, encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(JSON.parse(run.stdout).results[0].status, 'PASS');
    await writeFile(join(directory, 'quality-gates.json'), JSON.stringify({ ...registry(), gates: [] }));
    const bad = spawnSync(process.execPath, [join(process.cwd(), 'scripts/verify.mjs')], { cwd: directory, encoding: 'utf8' });
    assert.equal(bad.status, 1);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
test('security map preserves pending requirements and rejects false verification', () => {
  const requirement = { standard: 'ASVS', version: '5.0.0', requirementId: 'v5.0.0-8.2.1', applicability: 'applicable', ownerTask: '4', testPaths: [], status: 'pending', evidence: '' };
  assert.equal(validateSecurityMap([requirement], { release: false }).valid, true);
  assert.equal(validateSecurityMap([requirement], { release: true }).valid, false);
  assert.equal(validateSecurityMap([{ ...requirement, ownerTask: '' }], {}).valid, false);
  assert.equal(validateSecurityMap([{ ...requirement, status: 'verified' }], {}).valid, false);
  assert.equal(validateSecurityMap([{ ...requirement, version: 'invented' }], {}).valid, false);
  assert.equal(validateSecurityMap([{ ...requirement, requirementId: 'does-not-exist' }], {}).valid, false);
});
test('review must match current work and include an independent reviewer', () => {
  const review = { fingerprint: 'current', scope: 'code', risk: 'high', reviewer: 'independent-agent', verdict: 'accepted', findings: [], evidence: ['review-report.md'] };
  assert.equal(validateReviewRecord(review, { fingerprint: 'current', implementer: 'root' }).valid, true);
  assert.equal(validateReviewRecord(review, { fingerprint: 'changed', implementer: 'root' }).valid, false);
  assert.equal(validateReviewRecord({ ...review, reviewer: 'root' }, { fingerprint: 'current', implementer: 'root' }).valid, false);
  assert.equal(validateReviewRecord({ ...review, verdict: 'changes-required' }, { fingerprint: 'current', implementer: 'root' }).valid, false);
  assert.equal(validateReviewRecord({ ...review, fingerprint: undefined }, { implementer: 'root' }).valid, false);
  assert.equal(validateReviewRecord({ ...review, evidence: [''] }, { fingerprint: 'current', implementer: 'root' }).valid, false);
});

test('review is invalidated when an enforcement hook or Git policy changes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lawprep-fingerprint-'));
  try {
    await mkdir(join(directory, '.githooks'));
    for (const path of ['.githooks/pre-push', '.gitignore', '.gitattributes']) {
      await writeFile(join(directory, path), 'before\n');
      const before = await sourceFingerprint(directory);
      await writeFile(join(directory, path), 'after\n');
      assert.notEqual(await sourceFingerprint(directory), before, path);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('database migrations, config and tests bind review while exact CLI scratch paths do not', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lawprep-db-fingerprint-'));
  try {
    for (const path of ['supabase/migrations', 'supabase/tests/database', 'supabase/.temp', 'supabase/.branches']) {
      await mkdir(join(directory, path), { recursive: true });
    }
    for (const path of ['supabase/migrations/change.sql', 'supabase/config.toml', 'supabase/tests/database/catalog.test.sql']) {
      const absent = await sourceFingerprint(directory);
      await writeFile(join(directory, path), 'before\n');
      const present = await sourceFingerprint(directory);
      assert.notEqual(present, absent, `addition: ${path}`);
      await writeFile(join(directory, path), 'after\n');
      assert.notEqual(await sourceFingerprint(directory), present, `mutation: ${path}`);
      await rm(join(directory, path));
      assert.equal(await sourceFingerprint(directory), absent, `deletion: ${path}`);
    }
    const stable = await sourceFingerprint(directory);
    for (const path of ['supabase/.temp/cli-latest', 'supabase/.branches/_current_branch']) {
      await writeFile(join(directory, path), 'runtime metadata\n');
      assert.equal(await sourceFingerprint(directory), stable, path);
    }
    await mkdir(join(directory, 'supabase/tests/.temp'));
    await writeFile(join(directory, 'supabase/tests/.temp/must-still-bind.sql'), 'source\n');
    assert.notEqual(await sourceFingerprint(directory), stable, 'same name outside exact scratch root is source');
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('local environment files do not change a source review fingerprint', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lawprep-env-fingerprint-'));
  try {
    await mkdir(join(directory, 'apps/site'), { recursive: true });
    const clean = await sourceFingerprint(directory);
    await writeFile(join(directory, 'apps/site/.env.local'), 'TEST_VALUE=local\n');
    assert.equal(await sourceFingerprint(directory), clean);
    await writeFile(join(directory, '.env.example'), 'TEST_VALUE=\n');
    assert.notEqual(await sourceFingerprint(directory), clean);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('flat TAP and browser reports require executed tests without exclusions', async () => {
  for (const [format, good, bad] of [
    ['tap-flat', 'TAP version 13\n1..1\nok 1 - a real test', 'TAP version 13\n1..1\nok 1 - absent test # SKIP'],
    ['playwright-json', JSON.stringify({ stats: { expected: 1, unexpected: 0, skipped: 0, flaky: 0 } }), JSON.stringify({ stats: { expected: 1, unexpected: 0, skipped: 1, flaky: 0 } })]
  ]) {
    const report = stdout => registry({ command: [process.execPath, '-e', `console.log(${JSON.stringify(stdout)})`], evidencePattern: undefined, evidenceFormat: format });
    assert.equal((await runGates(report(good), context)).passed, true);
    for (const output of [bad, '', format === 'tap-flat' ? '1..0' : JSON.stringify({ stats: { expected: 0, unexpected: 0, skipped: 0, flaky: 0 } })]) {
      assert.equal((await runGates(report(output), context)).passed, false);
    }
  }
});
