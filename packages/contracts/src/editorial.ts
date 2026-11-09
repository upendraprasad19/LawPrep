import { z } from 'zod';
import { ExamIdSchema, IdSchema, IsoTimeSchema } from './exam';
import { ApiErrorSchema } from './api';

const text = (max: number) => z.string().trim().min(1).max(max).refine(value => !value.includes('\0'), 'Unsupported character.');
const uuid = z.uuid();
export const SafeSourceUrlSchema = z.url({ protocol: /^https$/ }).max(2048).refine(value => {
  const url = new URL(value);
  // Same conservative DNS/port grammar as the direct database command boundary.
  return /^https:\/\/[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,63}(?::[0-9]{1,5})?(?:[/?][^\s#]*)?$/.test(value)
    && (!url.port || Number(url.port) <= 65535) && !url.username && !url.password && !url.hash;
}, 'Use an HTTPS reference without credentials or fragments.');
export const TimezoneSchema = text(100).refine(value => {
  try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; }
}, 'Choose a valid timezone.');
export const ActorSchema = z.strictObject({ userId: uuid, email: z.email(), role: z.enum(['learner', 'publisher']) });
export const CapabilitySchema = ActorSchema.omit({ email: true });
export const ProfileSchema = z.strictObject({ userId: uuid, displayName: z.string().max(80), timezone: TimezoneSchema, revision: z.number().int().nonnegative() });
export const ProfileInputSchema = z.strictObject({ displayName: text(80), timezone: TimezoneSchema, expectedRevision: z.number().int().nonnegative() });
export const SourceCheckedAtSchema = IsoTimeSchema.refine(value => {
  const year = new Date(value).getUTCFullYear(); return year >= 1 && year <= 9999;
}, 'The checked date must remain within UTC years 0001 through 9999.');
export const SourceInputSchema = z.strictObject({
  title: text(300), publisher: text(200), url: SafeSourceUrlSchema,
  checkedAt: SourceCheckedAtSchema, rights: z.enum(['unknown', 'permitted', 'restricted']), reviewNote: z.string().trim().max(4000)
});
export const ContentKindSchema = z.enum(['guide', 'lesson', 'question', 'current-affairs']);
const QuestionSchema = z.strictObject({
  options: z.array(z.strictObject({ id: text(32), text: text(4000) })).min(2).max(6),
  correctOptionId: text(32), explanation: text(30000)
}).superRefine((value, ctx) => {
  const ids = value.options.map(option => option.id);
  if (new Set(ids).size !== ids.length || !ids.includes(value.correctOptionId)) ctx.addIssue({ code: 'custom', message: 'Options must be distinct and include the correct answer.' });
});
export const DraftInputSchema = z.strictObject({
  contentId: uuid.optional(), cycleId: IdSchema, topicId: IdSchema,
  kind: ContentKindSchema, title: text(200), summary: text(1000), body: text(100000),
  visibility: z.enum(['public', 'prepare']), sourceIds: z.array(uuid).min(1).max(12),
  question: QuestionSchema.optional(), importReference: text(512).optional()
}).superRefine((value, ctx) => {
  if ((value.kind === 'question') !== Boolean(value.question)) ctx.addIssue({ code: 'custom', message: 'Only question drafts require answer options and an explanation.' });
  if (new Set(value.sourceIds).size !== value.sourceIds.length) ctx.addIssue({ code: 'custom', message: 'Source references must be distinct.' });
});
const mutation = { mutationId: uuid };
export const EditorialImportSchema = DraftInputSchema.refine(value => !value.contentId, 'An import starts a new private content identity.');
const versionAction = { ...mutation, versionId: uuid, note: text(4000) };
export const ReviewSchema = z.strictObject({ sourceVerified: z.boolean(), rightsVerified: z.boolean(), answerVerified: z.boolean(), explanationVerified: z.boolean(), note: text(4000) });
export const EditorCommandSchema = z.discriminatedUnion('op', [
  z.strictObject({ op: z.literal('source'), ...mutation, source: SourceInputSchema }),
  z.strictObject({ op: z.literal('cycle'), ...mutation, cycle: z.strictObject({ id: IdSchema, examId: ExamIdSchema, label: text(200), sourceId: uuid, sourceVerified: z.literal(true) }) }),
  z.strictObject({ op: z.literal('topic'), ...mutation, topic: z.strictObject({ id: IdSchema, cycleId: IdSchema, title: text(200), prerequisiteIds: z.array(IdSchema).max(20) }) }),
  z.strictObject({ op: z.literal('draft'), ...mutation, draft: DraftInputSchema }),
  z.strictObject({ op: z.literal('review'), ...mutation, versionId: uuid, ...ReviewSchema.shape }),
  z.strictObject({ op: z.literal('publish'), ...versionAction }),
  z.strictObject({ op: z.literal('correct'), ...versionAction, replacementVersionId: uuid }),
  z.strictObject({ op: z.literal('withdraw'), ...versionAction })
]);
export const EditorResultSchema = z.strictObject({ id: z.string().min(1).max(128), op: z.enum(['source', 'cycle', 'topic', 'draft', 'review', 'publish', 'correct', 'withdraw']) });
const CycleSchema = z.strictObject({ id: IdSchema, examId: ExamIdSchema, label: text(200) });
const TopicSchema = z.strictObject({ id: IdSchema, cycleId: IdSchema, title: text(200), prerequisiteIds: z.array(IdSchema) });
const VersionSummarySchema = z.strictObject({ id: uuid, contentId: uuid, versionNumber: z.number().int().positive(), cycleId: IdSchema, title: text(200), kind: ContentKindSchema, reviewed: z.boolean(), state: z.enum(['draft', 'published', 'withdrawn', 'corrected']) });
export const EditorStateSchema = z.strictObject({
  cycles: z.array(CycleSchema).max(100), topics: z.array(TopicSchema).max(500),
  sources: z.array(SourceInputSchema.extend({ id: uuid })).max(100),
  versions: z.array(VersionSummarySchema).max(50),
  selected: z.strictObject({ id: uuid, contentId: uuid, versionNumber: z.number().int().positive(), draft: DraftInputSchema, review: ReviewSchema.nullable(), events: z.array(z.strictObject({ action: z.enum(['published', 'corrected', 'withdrawn']), occurredAt: IsoTimeSchema, note: text(4000), replacementVersionId: uuid.nullable() })) }).nullable()
});
export const CatalogSchema = z.strictObject({
  examId: ExamIdSchema, cycles: z.array(CycleSchema).max(100), topics: z.array(TopicSchema).max(500),
  items: z.array(z.strictObject({ versionId: uuid, cycleId: IdSchema, topicId: IdSchema, kind: ContentKindSchema, title: text(200), summary: text(1000) })).max(100)
});
export function envelope<T extends z.ZodType>(schema: T) { return z.union([z.strictObject({ data: schema }), z.strictObject({ error: ApiErrorSchema })]); }
export const ActorResultSchema = envelope(ActorSchema);
export const ProfileResultSchema = envelope(ProfileSchema);
export const EditorStateResultSchema = envelope(EditorStateSchema);
export const EditorResultEnvelopeSchema = envelope(EditorResultSchema);
export const CatalogResultSchema = envelope(CatalogSchema);
export type Actor = z.infer<typeof ActorSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileInput = z.infer<typeof ProfileInputSchema>;
export type DraftInput = z.infer<typeof DraftInputSchema>;
export type EditorCommand = z.infer<typeof EditorCommandSchema>;
export type EditorResult = z.infer<typeof EditorResultSchema>;
export type EditorState = z.infer<typeof EditorStateSchema>;
export type Catalog = z.infer<typeof CatalogSchema>;
