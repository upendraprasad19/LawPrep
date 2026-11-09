import { z } from 'zod';
import { IdSchema } from './exam';
import { envelope } from './editorial';

const UnitIdSchema = z.literal('clat-reading-v1');
const QuestionSchema = z.strictObject({
  id: IdSchema,
  prompt: z.string().min(1),
  options: z.array(z.strictObject({ id: IdSchema, text: z.string().min(1) })).min(2).max(4)
});
const FeedbackSchema = z.strictObject({
  questionId: IdSchema, selectedOptionId: IdSchema, correct: z.boolean(),
  explanation: z.string().min(1), repeated: z.boolean()
});
export const SampleLearningSchema = z.strictObject({
  userId: z.uuid(),
  lesson: z.strictObject({
    id: UnitIdSchema, title: z.string().min(1), objective: z.string().min(1), explanation: z.string().min(1),
    example: z.strictObject({ passage: z.string().min(1), reasoning: z.string().min(1) }),
    questions: z.array(QuestionSchema).length(2)
  }),
  readingCompleted: z.boolean(),
  feedback: z.array(FeedbackSchema).max(2)
}).refine(state => {
  const questions = new Map(state.lesson.questions.map(question => [question.id, question.options]));
  return questions.size === state.lesson.questions.length &&
    new Set(state.feedback.map(item => item.questionId)).size === state.feedback.length &&
    state.feedback.every(item => questions.get(item.questionId)?.some(option => option.id === item.selectedOptionId));
}, 'Sample activity must match the lesson questions.');

const identity = { unitId: UnitIdSchema, mutationId: z.uuid() };
export const SampleActivityInputSchema = z.discriminatedUnion('kind', [
  z.strictObject({ ...identity, kind: z.literal('read') }),
  z.strictObject({ ...identity, kind: z.literal('answer'), questionId: IdSchema, optionId: IdSchema })
]);
export const SampleReceiptSchema = z.discriminatedUnion('kind', [
  z.strictObject({ ...identity, userId: z.uuid(), kind: z.literal('read') }),
  z.strictObject({ ...identity, userId: z.uuid(), kind: z.literal('answer'), feedback: FeedbackSchema })
]);
export const SampleLearningResultSchema = envelope(SampleLearningSchema);
export const SampleReceiptResultSchema = envelope(SampleReceiptSchema);
export type SampleLearning = z.infer<typeof SampleLearningSchema>;
export type SampleActivityInput = z.infer<typeof SampleActivityInputSchema>;
export type SampleReceipt = z.infer<typeof SampleReceiptSchema>;
