import { z } from 'zod';

export const ImportRecordSchema = z.object({
  kind: z.enum(['question', 'lesson', 'curriculum', 'deck', 'blueprint']),
  sourceKey: z.string(), originalId: z.string().nullable(), sourceIndex: z.number().int().nonnegative(),
  status: z.literal('draft'), payload: z.unknown(), issues: z.array(z.string())
});
export const ImportBatchSchema = z.object({
  formatVersion: z.literal(1), sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
  records: z.array(ImportRecordSchema), errors: z.array(z.string()),
  counts: z.object({ question: z.number().int(), lesson: z.number().int(), curriculum: z.number().int(), deck: z.number().int(), blueprint: z.number().int() })
});
export type ImportRecord = z.infer<typeof ImportRecordSchema>;
export type ImportBatch = z.infer<typeof ImportBatchSchema>;

export const CoverageRowSchema = z.object({
  topicId: z.string(), title: z.string(), objectives: z.array(z.string()).min(1),
  sourceRefIds: z.array(z.string()), sourceStatus: z.enum(['verified-syllabus', 'awaiting-official-syllabus']),
  required: z.object({ teachingUnit: z.number().int().positive(), workedExample: z.number().int().positive(), guidedPracticeSet: z.number().int().positive(), freshPracticeSet: z.number().int().positive(), revisionSet: z.number().int().positive(), assessmentPool: z.number().int().positive() }),
  reviewer: z.string(), status: z.enum(['missing', 'draft', 'reviewed', 'published']), blockers: z.array(z.string())
});
export type CoverageRow = z.infer<typeof CoverageRowSchema>;

export const PaperAnnotationSchema = z.object({
  sha256: z.string().regex(/^[a-f0-9]{64}$/), use: z.literal('analogue-only'),
  note: z.string().min(1), evidencePath: z.string().min(1)
});
