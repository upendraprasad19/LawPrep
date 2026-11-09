import { expect, test } from 'vitest';
import { DraftInputSchema, EditorCommandSchema, EditorialImportSchema, ProfileInputSchema, SourceInputSchema } from '../../packages/contracts/src/editorial';
import { SessionBoundary } from '../../apps/learner/src/features/auth/session-boundary';

const sourceId = '40000000-0000-4000-8000-000000000001';
const versionId = '20000000-0000-4000-8000-000000000001';
const mutationId = '30000000-0000-4000-8000-000000000001';
const draft = { cycleId: 'fixture-cycle', topicId: 'reading', kind: 'question', title: 'Fixture question', summary: 'Practice fixture', body: 'Choose an answer.', visibility: 'public', sourceIds: [sourceId], question: { options: [{ id: 'A', text: 'First' }, { id: 'B', text: 'Second' }], correctOptionId: 'B', explanation: 'Second is correct in this fixture.' } };

test('profile changes cannot submit an owner, role or arbitrary timezone', () => {
  expect(ProfileInputSchema.parse({ displayName: ' Student ', timezone: 'Asia/Kolkata', expectedRevision: 0 }).displayName).toBe('Student');
  for (const extra of [{ userId: versionId }, { role: 'publisher' }, { timezone: 'not/a-timezone' }]) {
    expect(ProfileInputSchema.safeParse({ displayName: 'Student', timezone: 'UTC', expectedRevision: 0, ...extra }).success).toBe(false);
  }
});
test('question drafts require distinct options, a matching answer and an explanation', () => {
  expect(DraftInputSchema.parse(draft).kind).toBe('question');
  for (const question of [
    { ...draft.question, correctOptionId: 'C' },
    { ...draft.question, options: [{ id: 'A', text: 'One' }, { id: 'A', text: 'Two' }] },
    { ...draft.question, explanation: '' }
  ]) expect(DraftInputSchema.safeParse({ ...draft, question }).success).toBe(false);
});
test('imported flags cannot publish or mark a draft reviewed', () => {
  for (const extra of [{ status: 'published' }, { verified: true }, { reviewerId: versionId }]) {
    expect(DraftInputSchema.safeParse({ ...draft, ...extra }).success).toBe(false);
  }
});
test('sources accept safe HTTPS references and preserve unknown rights', () => {
  const source = { title: 'Fixture source', publisher: 'Fixture', url: 'https://example.org/source', rights: 'unknown', checkedAt: '2026-10-28T00:00:00Z', reviewNote: '' };
  expect(SourceInputSchema.parse(source).rights).toBe('unknown');
  for (const url of ['javascript:alert(1)', 'http://example.org', 'https://user:password@example.org', 'https://example.org/#token']) {
    expect(SourceInputSchema.safeParse({ ...source, url }).success).toBe(false);
  }
  for (const checkedAt of ['9999-12-31T23:59:59-14:00', '0001-01-01T00:00:00+14:00']) expect(SourceInputSchema.safeParse({ ...source, checkedAt }).success).toBe(false);
});
test('review attestations must be explicit and cannot contain an invented reviewer', () => {
  const input = { op: 'review', mutationId, versionId, sourceVerified: true, rightsVerified: true, answerVerified: true, explanationVerified: true, note: 'Checked synthetic fixture.' };
  expect(EditorCommandSchema.parse(input).op).toBe('review');
  expect(EditorCommandSchema.safeParse({ ...input, reviewerId: sourceId }).success).toBe(false);
  expect(EditorCommandSchema.safeParse({ ...input, rightsVerified: undefined }).success).toBe(false);
});
test('publication commands cannot inject a score, actor or replacement on withdrawal', () => {
  expect(EditorCommandSchema.safeParse({ op: 'publish', mutationId, versionId, note: 'Reviewed fixture.' }).success).toBe(true);
  for (const extra of [{ userId: sourceId }, { score: 100 }, { replacementVersionId: sourceId }]) {
    expect(EditorCommandSchema.safeParse({ op: 'withdraw', mutationId, versionId, note: 'Withdraw fixture.', ...extra }).success).toBe(false);
  }
});
test('account switching and logout invalidate in-flight private results', async () => {
  const boundary = new SessionBoundary();
  boundary.change('student-A');
  const pendingA = boundary.capture();
  boundary.change(null);
  boundary.change('student-B');
  await Promise.resolve();
  expect(boundary.accepts(pendingA)).toBe(false);
  const pendingB = boundary.capture();
  expect(boundary.accepts(pendingB)).toBe(true);
  boundary.change(null);
  expect(boundary.accepts(pendingB)).toBe(false);
});
test('import preview accepts structured drafts but cannot choose an existing identity or carry approval flags', () => {
  expect(EditorialImportSchema.safeParse(draft).success).toBe(true);
  for (const extra of [{ contentId: versionId }, { status: 'published' }, { verified: true }]) expect(EditorialImportSchema.safeParse({ ...draft, ...extra }).success).toBe(false);
});
