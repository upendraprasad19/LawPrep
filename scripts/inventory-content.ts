import { readFile, readdir, stat, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractLegacy, object } from './extract-lexcommand.ts';
import { PaperAnnotationSchema } from '../packages/contracts/src/content.ts';

export async function auditSources(root: string) {
  const source = await readFile(join(root, 'LexCommand.html'), 'utf8');
  const batch = extractLegacy(source);
  const ids = new Set<string>(), duplicateIds: string[] = [], seenQuestions = new Map<string, string>();
  const duplicateQuestionGroups: string[][] = [], missingExplanations: string[] = [], unmappedTopics: Record<string, number> = {};
  let verificationFlags = 0, missingOriginalIds = 0;
  for (const record of batch.records) {
    if (!record.originalId) missingOriginalIds++;
    else if (ids.has(`${record.kind}:${record.originalId}`)) duplicateIds.push(record.originalId);
    else ids.add(`${record.kind}:${record.originalId}`);
    const value = object(record.payload), reference = record.originalId ?? `${record.sourceKey}[${record.sourceIndex}]`;
    const topic = [value.exam ?? 'unassigned', value.section ?? value.subject ?? 'unassigned', value.topic ?? value.chapter ?? 'unassigned'].join('|');
    unmappedTopics[topic] = (unmappedTopics[topic] ?? 0) + 1;
    if (record.kind === 'question') {
      if (value.verify === true) verificationFlags++;
      if (record.issues.includes('missing-explanation')) missingExplanations.push(reference);
      const signature = createHash('sha256').update(JSON.stringify([value.q, value.opts, value.passage]).toLowerCase().replace(/\s+/g, ' ')).digest('hex');
      const previous = seenQuestions.get(signature);
      if (previous) duplicateQuestionGroups.push([previous, reference]); else seenQuestions.set(signature, reference);
    }
  }
  const annotations = await (async () => {
    try { return PaperAnnotationSchema.array().parse(JSON.parse(await readFile(join(root, 'content/editorial/paper-annotations.json'), 'utf8')).annotations); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []; throw error; }
  })();
  const pdfs: { path: string; bytes: number; sha256: string; validHeader: boolean; rights: 'unknown'; authenticity: 'unverified'; filenameClaim: string; use: 'analogue-only' | 'unclassified'; annotation: { note: string; evidencePath: string } | null }[] = [];
  async function papers(directory: string, prefix: string) {
    let entries;
    try { entries = await readdir(directory, { withFileTypes: true }); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return; throw error; }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      if (entry.isDirectory()) await papers(join(directory, entry.name), `${prefix}/${entry.name}`);
      else if (entry.name.toLowerCase().endsWith('.pdf')) {
        const data = await readFile(join(directory, entry.name));
        const sha256 = createHash('sha256').update(data).digest('hex');
        const annotation = annotations.find(annotation => annotation.sha256 === sha256);
        pdfs.push({ path: `${prefix}/${entry.name}`, bytes: data.length, sha256, validHeader: data.subarray(0, 5).toString() === '%PDF-', rights: 'unknown', authenticity: 'unverified', filenameClaim: /memory.based/i.test(entry.name) ? 'memory-based' : /unofficial/i.test(entry.name) ? 'unofficial' : 'paper-or-key-unverified', use: annotation?.use ?? 'unclassified', annotation: annotation ? { note: annotation.note, evidencePath: annotation.evidencePath } : null });
      }
    }
  }
  await papers(join(root, 'Past_Papers'), 'Past_Papers');
  return { formatVersion: 1, sourceHash: batch.sourceHash, counts: batch.counts, errors: batch.errors, rights: 'unknown' as const, publishedRecords: 0, duplicateIds, duplicateQuestionGroups, missingExplanations, missingOriginalIds, originalVerificationFlags: verificationFlags, issues: batch.records.filter(record => record.issues.length).map(({ sourceKey, sourceIndex, originalId, issues }) => ({ sourceKey, sourceIndex, originalId, issues })), unmappedTopics, pdfs, notes: ['All imports remain draft; legacy verification booleans are not editorial approval.', 'Topic labels are legacy labels, not verified exam mappings.', 'PDF metadata and filenames do not establish authenticity, page count, answer-key correctness or redistribution rights.'] };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.cwd(), report = await auditSources(root);
  const sourcePath = join(root, 'LexCommand.html');
  const before = (await stat(sourcePath)).mtimeMs;
  const batch = extractLegacy(await readFile(sourcePath, 'utf8'));
  await mkdir('content/imports', { recursive: true });
  await mkdir('content/editorial', { recursive: true });
  await writeFile('content/imports/legacy-draft.json', `${JSON.stringify(batch, null, 2)}\n`);
  await writeFile('content/imports/manifest.json', `${JSON.stringify({ source: 'LexCommand.html', sourceHash: report.sourceHash, counts: report.counts, status: 'draft', rights: 'unknown' }, null, 2)}\n`);
  await writeFile('content/editorial/inventory.json', `${JSON.stringify(report, null, 2)}\n`);
  if ((await stat(sourcePath)).mtimeMs !== before || extractLegacy(await readFile(sourcePath, 'utf8')).sourceHash !== report.sourceHash) throw new Error('Source changed during audit');
  console.log(JSON.stringify({ counts: report.counts, pdfs: report.pdfs.length, issues: report.issues.length, errors: report.errors, status: 'draft', published: 0 }, null, 2));
}
