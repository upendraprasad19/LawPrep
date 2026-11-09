import { expect, test } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { extractLegacy } from '../../scripts/extract-lexcommand';
import { auditSources } from '../../scripts/inventory-content';

const question = { id: 'original-q1', exam: 'clat', section: 'English Language', topic: 'RC', q: 'What follows?', opts: ['A', 'B'], ans: 0, expl: 'A follows from the premise.', verify: true };
function html(bank: unknown) { return `<html><script>const BANK = ${JSON.stringify(bank)};</script></html>`; }
test('import is deterministic, preserves provenance and never publishes', () => {
  const source = html({ questions: [question], lessons: [], curriculum: [] });
  const batch = extractLegacy(source);
  expect(extractLegacy(source)).toEqual(batch);
  expect(batch.sourceHash).toBe(createHash('sha256').update(source).digest('hex'));
  expect(batch.records[0]).toMatchObject({ originalId: 'original-q1', status: 'draft', sourceIndex: 0 });
  expect(batch.records[0].payload).toMatchObject({ verify: true });
  expect(batch.errors).toEqual([]);
});
test('malformed answers remain in the batch with an explicit issue', () => {
  const batch = extractLegacy(html({ questions: [{ ...question, ans: 9 }] }));
  expect(batch.records).toHaveLength(1);
  expect(batch.records[0].issues).toContain('invalid-answer-index');
});
test('HTML payloads stay inert and executable initializers are rejected', () => {
  const payload = '<img src=x onerror="globalThis.importExecuted=true">';
  expect(extractLegacy(html({ questions: [{ ...question, expl: payload }] })).records[0].payload).toMatchObject({ expl: payload });
  const batch = extractLegacy('<script>const BANK = (() => { throw new Error("must not execute"); })();</script>');
  expect(batch.records).toEqual([]);
  expect(batch.errors.join(' ')).toMatch(/unsupported/i);
});
test('non-JSON JavaScript literals are parsed without executing code', () => {
  const batch = extractLegacy("<script>const BANK = {questions: [{id:'a',q:'Q',opts:['A','B'],ans:0,expl:'E'}], lessons:[], curriculum:[]};</script>");
  expect(batch.records).toHaveLength(1);
  expect(batch.errors).toEqual([]);
});
test('unsupported records and duplicate banks cannot disappear silently', () => {
  expect(extractLegacy(html({ questions: 'wrong', secretDeck: [1] })).errors.join(' ')).toMatch(/questions|secretDeck/);
  const duplicate = extractLegacy('<script>const BANK = {}; const BANK = {};</script>');
  expect(duplicate.errors.join(' ')).toMatch(/exactly one/i);
});

test('syntax recovery and prototype keys cannot turn broken input into a valid bank', () => {
  const broken = extractLegacy('<script>const BANK = {questions: [1];</script>');
  expect(broken.errors.join(' ')).toMatch(/syntax/i);
  expect(broken.records).toEqual([]);
  expect(extractLegacy(html({ constructor: [1] })).errors.join(' ')).toMatch(/Unsupported BANK field/);
});

test('scalar deck and blueprint containers are reported instead of disappearing', () => {
  for (const key of ['DECKS', 'BLUEPRINTS']) for (const value of ['123', 'null', '"oops"']) {
    const batch = extractLegacy(`<script>const BANK = {}; const ${key} = ${value};</script>`);
    expect(batch.errors.join(' ')).toMatch(new RegExp(`${key}.*Unsupported`, 'i'));
  }
});
test('audit reports duplicates, explanation gaps and unknown rights without mutating source', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lawprep-import-'));
  const source = html({ questions: [question, { ...question, expl: '' }], lessons: [], curriculum: [] });
  try {
    await writeFile(join(root, 'LexCommand.html'), source);
    const report = await auditSources(root);
    expect(report.counts.question).toBe(2);
    expect(report.duplicateIds).toContain('original-q1');
    expect(report.missingExplanations).toHaveLength(1);
    expect(report.rights).toBe('unknown');
    expect(report.sourceHash).toBe(extractLegacy(source).sourceHash);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('analogue classification binds file bytes, not an ambiguous filename', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lawprep-paper-'));
  const paper = '%PDF-1.7\nsynthetic-paper';
  try {
    await mkdir(join(root, 'Past_Papers'));
    await mkdir(join(root, 'content/editorial'), { recursive: true });
    await writeFile(join(root, 'LexCommand.html'), html({}));
    await writeFile(join(root, 'Past_Papers/PU2024.pdf'), paper);
    await writeFile(join(root, 'content/editorial/paper-annotations.json'), JSON.stringify({ annotations: [{ sha256: createHash('sha256').update(paper).digest('hex'), use: 'analogue-only', note: 'Synthetic analogue', evidencePath: 'synthetic-fixture' }] }));
    expect((await auditSources(root)).pdfs[0].use).toBe('analogue-only');
    await writeFile(join(root, 'Past_Papers/PU2024.pdf'), `${paper}-changed`);
    expect((await auditSources(root)).pdfs[0].use).toBe('unclassified');
  } finally { await rm(root, { recursive: true, force: true }); }
});
