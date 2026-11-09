import { z } from 'zod';
import { IdSchema } from './exam';
import { envelope } from './editorial';

const fields = {
  cycleId: IdSchema.nullable(),
  targetDate: z.iso.date().refine(date => date.slice(0, 4) !== '0000').nullable(),
  dailyMinutes: z.number().int().min(5).max(240),
  familiarity: z.enum(['new', 'some', 'preparing']),
  diagnosticChoice: z.enum(['later', 'take', 'skip'])
};
export const StudyPreferencesInputSchema = z.strictObject({
  ...fields, expectedRevision: z.number().int().min(0).max(2147483646)
});
export const StudyPreferencesSchema = z.strictObject({
  ...fields, userId: z.uuid(), revision: z.number().int().min(0).max(2147483647)
});
export const StudyPreferencesResultSchema = envelope(StudyPreferencesSchema);
export type StudyPreferencesInput = z.infer<typeof StudyPreferencesInputSchema>;
export type StudyPreferences = z.infer<typeof StudyPreferencesSchema>;

const question = z.strictObject({
  id: IdSchema, prompt: z.string().min(1),
  options: z.array(z.strictObject({ id: IdSchema, text: z.string().min(1) })).min(2).max(4)
});
export const DiagnosticSchema = z.strictObject({ questions: z.array(question).length(2) });
export const DiagnosticInputSchema = z.strictObject({
  answers: z.array(z.strictObject({ questionId: IdSchema, optionId: IdSchema })).length(2)
});
export const DiagnosticFeedbackSchema = z.strictObject({
  feedback: z.array(z.strictObject({ questionId: IdSchema, correct: z.boolean(), explanation: z.string().min(1) })).length(2)
});
export const DiagnosticResultSchema = envelope(DiagnosticSchema);
export const DiagnosticFeedbackResultSchema = envelope(DiagnosticFeedbackSchema);
export type Diagnostic = z.infer<typeof DiagnosticSchema>;
export type DiagnosticInput = z.infer<typeof DiagnosticInputSchema>;
export type DiagnosticFeedback = z.infer<typeof DiagnosticFeedbackSchema>;
