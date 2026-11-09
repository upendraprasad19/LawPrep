import { z } from 'zod';

export const IdSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/);
export const VersionIdSchema = IdSchema;
export const IsoTimeSchema = z.iso.datetime({ offset: true });
export const ExamIdSchema = z.enum(['clat-ug', 'blet-patna-llb', 'cuet-pg-llb']);
export type Id = z.infer<typeof IdSchema>;
export type ExamId = z.infer<typeof ExamIdSchema>;

export const SourceRefSchema = z.object({
  id: IdSchema, url: z.url({ protocol: /^https?$/ }).optional(), localPath: z.string().optional(),
  title: z.string().min(1), publisher: z.string().min(1), checkedAt: IsoTimeSchema,
  rights: z.enum(['unknown', 'permitted', 'restricted'])
});
export type SourceRef = z.infer<typeof SourceRefSchema>;
