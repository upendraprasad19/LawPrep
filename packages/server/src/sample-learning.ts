import 'server-only';
import { SampleLearningSchema, SampleReceiptSchema, type SampleActivityInput } from '@lawprep/contracts';
import { dbForActor, type VerifiedActor } from './auth';
import { databaseError, ServiceError } from './errors';

export async function getSampleLearning(actor: VerifiedActor) {
  const result = await dbForActor(actor).rpc('lawprep_sample_learning');
  if (result.error) databaseError(result.error);
  const parsed = SampleLearningSchema.safeParse(result.data);
  if (!parsed.success || parsed.data.userId !== actor.userId) {
    throw new ServiceError('UNAVAILABLE', 'Your sample lesson could not be loaded.', 503);
  }
  return parsed.data;
}

export async function recordSampleLearning(actor: VerifiedActor, input: SampleActivityInput) {
  const mutationId = input.mutationId.toLowerCase();
  const result = await dbForActor(actor).rpc('lawprep_record_sample_learning', {
    p_unit_id: input.unitId, p_mutation_id: mutationId, p_kind: input.kind,
    p_question_id: input.kind === 'answer' ? input.questionId : null,
    p_option_id: input.kind === 'answer' ? input.optionId : null
  });
  if (result.error) {
    if (result.error.code === '22023') throw new ServiceError('INVALID_INPUT', 'Choose a listed answer in this sample.', 400);
    databaseError(result.error);
  }
  const parsed = SampleReceiptSchema.safeParse(result.data);
  if (!parsed.success || parsed.data.userId !== actor.userId || parsed.data.mutationId !== mutationId ||
    parsed.data.unitId !== input.unitId || parsed.data.kind !== input.kind ||
    (parsed.data.kind === 'answer' && input.kind === 'answer' &&
      (parsed.data.feedback.questionId !== input.questionId || parsed.data.feedback.selectedOptionId !== input.optionId))) {
    throw new ServiceError('UNAVAILABLE', 'Your sample activity could not be confirmed.', 503);
  }
  return parsed.data;
}
