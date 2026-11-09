import { z } from 'zod';

export const ApiErrorSchema = z.object({
  code: z.enum(['UNAUTHENTICATED', 'FORBIDDEN', 'INVALID_INPUT', 'CONFLICT', 'EXPIRED', 'QUOTA_EXHAUSTED', 'UNAVAILABLE']),
  message: z.string(), currentRevision: z.number().int().nonnegative().optional()
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type ApiResult<T> = { data: T } | { error: ApiError };
export const HealthSchema = z.object({ ok: z.literal(true) });
export type Health = z.infer<typeof HealthSchema>;
export const HealthResultSchema = z.union([z.object({ data: HealthSchema }), z.object({ error: ApiErrorSchema })]);
