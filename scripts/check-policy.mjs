import { readFile, access } from 'node:fs/promises';
import { validateSecurityMap } from './verify.mjs';

try {
  const map = JSON.parse(await readFile('docs/engineering/security-requirements.json', 'utf8'));
  const result = validateSecurityMap(map.requirements, { release: process.argv.includes('--release') });
  if (!result.valid) throw new Error(result.errors.join('; '));
  const registry = JSON.parse(await readFile('quality-gates.json', 'utf8'));
  for (const id of ['process-tests', 'policy', 'review']) {
    if (registry.requiredAt[id] !== 'bootstrap' || !registry.gates.some(g => g.id === id && g.required && g.activation === 'bootstrap')) throw new Error(`Bootstrap protection downgraded: ${id}`);
  }
  for (const path of ['AGENTS.md', 'docs/engineering/discipline.md', 'docs/engineering/threat-model.md', 'docs/engineering/accessibility.md', 'docs/engineering/contracts.json']) await access(path);
  console.log(`Policy map checked: ${map.requirements.length} tracked requirements; ${map.requirements.filter(r => r.status === 'pending').length} pending. This is a bootstrap check, not release certification.`);
} catch (error) { console.error(`Policy check failed: ${error.message}`); process.exitCode = 1; }
