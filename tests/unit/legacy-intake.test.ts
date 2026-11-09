import { describe, expect, test } from 'vitest';
import { extractLegacy } from '../../scripts/extract-lexcommand';
import { prepareLegacyIntake, intakeSql } from '../../scripts/prepare-legacy-intake';
import { ImportQuerySchema } from '../../packages/contracts/src/imports';

const source = `<script>const BANK={questions:[{id:'q1',exam:'blet',q:"Who's liable?",opts:['A','B'],ans:0,expl:'',verify:true}],lessons:[],curriculum:[{id:'L1',html:'<img src=x onerror=alert(1)>',title:'Raw lesson'}]};</script>`;
const batchText = JSON.stringify(extractLegacy(source));
describe('faithful private intake', () => {
  test('record detail always identifies its batch, not whichever import is newest', () => {
    expect(ImportQuerySchema.safeParse({ordinal:0}).success).toBe(false);
    expect(ImportQuerySchema.safeParse({batch:'a'.repeat(64),ordinal:0}).success).toBe(true);
  });
  test('preserves incomplete questions, legacy flags and inert HTML without inventing approvals', () => {
    const plan = prepareLegacyIntake(source, batchText);
    expect(plan.records).toHaveLength(2);
    const question = JSON.parse(plan.records[0].json);
    expect(question.payload).toMatchObject({ expl: '', verify: true });
    expect(question.issues).toContain('missing-explanation');
    expect(plan.manifest.rights).toBe('unknown');
    expect(plan.manifest.status).toBe('loading');
    expect(JSON.parse(plan.records[1].json).payload.html).toBe('<img src=x onerror=alert(1)>');
  });
  test('rejects edited extraction or mismatched original bytes before preparing writes', () => {
    const changed = JSON.parse(batchText); changed.records[0].payload.ans = 1;
    expect(() => prepareLegacyIntake(source, JSON.stringify(changed))).toThrow(/match/i);
    expect(() => prepareLegacyIntake(source + 'changed', batchText)).toThrow(/match/i);
  });
  test('rejects count drift, extra records and added approval fields', () => {
    for (const mutate of [
      (value: ReturnType<typeof extractLegacy>) => { value.counts.question++; },
      (value: ReturnType<typeof extractLegacy>) => { value.records.push(value.records[0]); },
      (value: ReturnType<typeof extractLegacy>) => { Object.assign(value.records[0], { approved: true }); }
    ]) {
      const changed = JSON.parse(batchText); mutate(changed);
      expect(() => prepareLegacyIntake(source, JSON.stringify(changed))).toThrow(/match/i);
    }
  });
  test('separates source, extracted file and record digests; harmless file formatting preserves record identity', () => {
    const compact = prepareLegacyIntake(source, batchText);
    const formatted = prepareLegacyIntake(source, JSON.stringify(JSON.parse(batchText), null, 2));
    expect(compact.manifest.sourceHash).toBe(formatted.manifest.sourceHash);
    expect(compact.manifest.fileHash).not.toBe(formatted.manifest.fileHash);
    expect(compact.records).toEqual(formatted.records);
    expect(compact.manifest.recordsHash).toBe(formatted.manifest.recordsHash);
  });
  test('SQL contains only staged data writes and quotes apostrophes and backslashes', () => {
    const plan = prepareLegacyIntake(source, batchText);
    const statements = intakeSql(plan, 'owner@example.invalid', 1);
    expect(statements.chunks).toHaveLength(2);
    expect(statements.chunks[0]).toContain("Who''s liable?");
    expect(statements.chunks.join('')).not.toMatch(/insert into (public\.|lawprep_private\.(content_versions|version_keys|content_reviews))/i);
    expect(statements.seal).toContain("status='complete'");
    expect(() => intakeSql(plan, 'bad email', 1)).toThrow();
  });
});
