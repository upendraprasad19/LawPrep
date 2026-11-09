import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function invalid(reason) { return { passed: false, results: [{ id: 'configuration', status: 'BLOCKED', reason }] }; }

export async function runGates(registry, context) {
  const phases = registry?.milestones;
  if (!Array.isArray(phases) || new Set(phases).size !== phases.length || !phases.length ||
      !phases.includes(context?.milestone) || !phases.includes(registry.activeMilestone)) return invalid('Unknown or missing milestone');
  const active = phases.indexOf(context.milestone);
  if (active < phases.indexOf(registry.activeMilestone)) return invalid('Active milestone cannot move backward');
  if (!Array.isArray(registry.gates) || !registry.gates.length || !registry.requiredAt || typeof registry.requiredAt !== 'object' || !Object.keys(registry.requiredAt).length) return invalid('Missing gate registrations');
  const registered = new Map();
  for (const gate of registry.gates) {
    if (!gate.id || registered.has(gate.id) || !phases.includes(gate.activation) || typeof gate.required !== 'boolean' ||
        !Array.isArray(gate.command) || !gate.command.length || gate.command.some(v => typeof v !== 'string' || !v) ||
        gate.skip !== undefined || (gate.acceptanceOnly !== undefined && typeof gate.acceptanceOnly !== 'boolean') ||
        (gate.evidenceFormat !== undefined && !['tap', 'tap-flat', 'playwright-json'].includes(gate.evidenceFormat)) ||
        (gate.timeoutMs !== undefined && (!Number.isInteger(gate.timeoutMs) || gate.timeoutMs < 1))) return invalid('Invalid, duplicated or conditionally excluded gate');
    registered.set(gate.id, gate);
  }
  for (const [id, phase] of Object.entries(registry.requiredAt)) {
    const gate = registered.get(id);
    if (!phases.includes(phase) || !gate || !gate.required || phases.indexOf(gate.activation) > phases.indexOf(phase)) return invalid(`Required registration missing or downgraded: ${id}`);
  }
  if (registry.gates.some(gate => gate.required && !Object.hasOwn(registry.requiredAt, gate.id) && phases.indexOf(gate.activation) <= active)) return invalid('Active required gate lacks policy registration');
  const results = [];
  for (const gate of registry.gates) {
    if (gate.acceptanceOnly && context.acceptance !== true) {
      results.push({ id: gate.id, status: 'NOT_APPLICABLE', reason: 'Milestone acceptance check; run verify:milestone before accepting work' });
      continue;
    }
    if (phases.indexOf(gate.activation) > active) {
      results.push({ id: gate.id, status: 'NOT_APPLICABLE', reason: `Activates at ${gate.activation}` });
      continue;
    }
    const command = gate.command[0] === 'node' ? process.execPath : gate.command[0];
    const execution = spawnSync(command, gate.command.slice(1), { cwd: context.root, encoding: 'utf8',
      timeout: gate.timeoutMs ?? 120000, maxBuffer: 8 * 1024 * 1024, windowsHide: true });
    const output = `${execution.stdout ?? ''}\n${execution.stderr ?? ''}`.trim();
    if (execution.error || execution.signal || execution.status === null) {
      results.push({ id: gate.id, status: 'BLOCKED', reason: execution.error?.code ?? 'Command interrupted' });
      continue;
    }
    let evidenceMatches = true;
    try { if (gate.evidencePattern) evidenceMatches = new RegExp(gate.evidencePattern, 'm').test(output); }
    catch { evidenceMatches = false; }
    if (gate.evidenceFormat === 'tap') {
      const number = key => Number(output.match(new RegExp(`^# ${key} (\\d+)\\s*$`, 'm'))?.[1] ?? NaN);
      evidenceMatches = evidenceMatches && number('tests') > 0 && number('pass') === number('tests') &&
        ['fail', 'cancelled', 'skipped', 'todo'].every(key => number(key) === 0);
    }
    if (gate.evidenceFormat === 'tap-flat') {
      const plan = Number(output.match(/^1\.\.(\d+)\s*$/m)?.[1] ?? NaN);
      evidenceMatches = evidenceMatches && plan > 0 && (output.match(/^ok \d+ - /gm) ?? []).length === plan && !/^not ok\b|#\s*(skip|todo)\b/im.test(output);
    }
    if (gate.evidenceFormat === 'playwright-json') {
      try {
        const { stats } = JSON.parse(execution.stdout);
        evidenceMatches = evidenceMatches && Number.isInteger(stats.expected) && stats.expected > 0 && ['unexpected', 'skipped', 'flaky'].every(key => stats[key] === 0);
      } catch { evidenceMatches = false; }
    }
    const passed = execution.status === 0 && evidenceMatches;
    results.push({ id: gate.id, status: passed ? 'PASS' : 'FAIL', evidence: output.slice(-3000),
      ...(passed ? {} : { reason: execution.status !== 0 ? `Exit ${execution.status}` : 'Required evidence missing or empty' }) });
  }
  const passed = results.every(result => !registered.get(result.id).required || ['PASS', 'NOT_APPLICABLE'].includes(result.status));
  return { passed, results };
}

export function validateSecurityMap(requirements, { release = false } = {}) {
  const errors = [];
  let inventory;
  try { inventory = JSON.parse(readFileSync(new URL('../docs/engineering/asvs-5.0.0-inventory.json', import.meta.url), 'utf8')); }
  catch { return { valid: false, errors: ['Pinned ASVS inventory unavailable'] }; }
  if (!Array.isArray(requirements) || !requirements.length) return { valid: false, errors: ['Security map is empty'] };
  const seen = new Set();
  for (const entry of requirements) {
    if (entry.standard !== 'ASVS' || !entry.version || !entry.requirementId || seen.has(entry.requirementId) || !entry.ownerTask ||
        !['applicable', 'not-applicable'].includes(entry.applicability) || !['pending', 'verified', 'failed', 'blocked'].includes(entry.status) ||
        !Array.isArray(entry.testPaths)) errors.push('Invalid or unowned security requirement');
    seen.add(entry.requirementId);
    if (entry.version !== inventory.version || !inventory.requirementIds.includes(entry.requirementId)) errors.push('Unknown standard version or requirement ID');
    if ((entry.status === 'verified' || entry.applicability === 'not-applicable') && (!entry.evidence || (entry.applicability === 'applicable' && !entry.testPaths.length))) errors.push('Verification/exclusion needs evidence');
    if (release && entry.applicability === 'applicable' && entry.status !== 'verified') errors.push(`Unverified release requirement: ${entry.requirementId}`);
  }
  return { valid: errors.length === 0, errors };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const registry = JSON.parse(await readFile(resolve('quality-gates.json'), 'utf8'));
    const result = await runGates(registry, { root: process.cwd(), milestone: registry.activeMilestone, acceptance: process.argv.includes('--acceptance') });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = result.passed ? 0 : 1;
  } catch (error) {
    process.stdout.write(`${JSON.stringify(invalid(error.message))}\n`);
    process.exitCode = 1;
  }
}
