import { z } from 'zod';
import { ExamIdSchema, IdSchema, IsoTimeSchema } from './exam';
import { envelope } from './editorial';

export const AccessSnapshotSchema = z.strictObject({
  userId: z.uuid(),
  checkedAt: IsoTimeSchema,
  cycles: z.array(z.strictObject({
    cycleId: IdSchema,
    examId: ExamIdSchema,
    label: z.string().min(1).max(200),
    prepareUntil: IsoTimeSchema,
    aiUntil: IsoTimeSchema.nullable()
  }))
});
export const AccessResultSchema = envelope(AccessSnapshotSchema);
export type AccessSnapshot = z.infer<typeof AccessSnapshotSchema>;
