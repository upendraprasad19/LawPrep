import 'server-only';
import { DiagnosticSchema, DiagnosticFeedbackSchema, StudyPreferencesSchema,
  type DiagnosticInput, type StudyPreferencesInput } from '@lawprep/contracts';
import { dbForActor, type VerifiedActor } from './auth';
import { databaseError, ServiceError } from './errors';

function preferencesFor(actor: VerifiedActor, result: { data: unknown; error: { code?: string; message?: string } | null }) {
  if (result.error) {
    if (result.error.code === '22023') throw new ServiceError('INVALID_INPUT', 'Check your study preferences and choose an available CLAT cycle.', 400);
    databaseError(result.error);
  }
  const parsed = StudyPreferencesSchema.safeParse(result.data);
  if (!parsed.success || parsed.data.userId !== actor.userId) {
    throw new ServiceError('UNAVAILABLE', 'Your study preferences could not be confirmed.', 503);
  }
  return parsed.data;
}

export async function getStudyPreferences(actor: VerifiedActor) {
  return preferencesFor(actor, await dbForActor(actor).rpc('lawprep_study_preferences'));
}

export async function saveStudyPreferences(actor: VerifiedActor, input: StudyPreferencesInput) {
  return preferencesFor(actor, await dbForActor(actor).rpc('lawprep_save_study_preferences', {
    p_cycle_id: input.cycleId, p_target_date: input.targetDate, p_daily_minutes: input.dailyMinutes,
    p_familiarity: input.familiarity, p_diagnostic_choice: input.diagnosticChoice, p_expected_revision: input.expectedRevision
  }));
}

// Original onboarding questions. This set is separate from scored practice and learning evidence.
const questions = [
  {
    id: 'starter-reading', prompt: 'The library extended its opening hours for a trial. Evening visits increased, but the library kept the trial running to check whether the change would last. What is best supported?',
    options: [
      { id: 'trial', text: 'Evening visits increased during the trial.' },
      { id: 'permanent', text: 'The library made the longer hours permanent.' },
      { id: 'all', text: 'Every visitor preferred the longer hours.' }
    ],
    answer: 'trial', explanation: 'The passage reports more evening visits. It leaves the long-term effect and final decision open.'
  },
  {
    id: 'starter-logic', prompt: 'A school says any student who hands in a completed form by Friday can join a club. Ravi handed in a completed form on Thursday. What follows from the rule?',
    options: [
      { id: 'unproved', text: 'Ravi has already attended a meeting.' },
      { id: 'eligible', text: 'Ravi can join the club.' },
      { id: 'late', text: 'Ravi missed the deadline.' }
    ],
    answer: 'eligible', explanation: 'The completed form arrived before Friday, so Ravi meets the stated condition for joining.'
  }
];

export function getDiagnostic() {
  return DiagnosticSchema.parse({ questions: questions.map(({ id, prompt, options }) => ({ id, prompt, options })) });
}

export function checkDiagnostic(input: DiagnosticInput) {
  const answers = new Map(input.answers.map(answer => [answer.questionId, answer.optionId]));
  if (answers.size !== questions.length) throw new ServiceError('INVALID_INPUT', 'Choose one answer for each question.', 400);
  return DiagnosticFeedbackSchema.parse({ feedback: questions.map(question => {
    const selected = answers.get(question.id);
    if (!question.options.some(option => option.id === selected)) {
      throw new ServiceError('INVALID_INPUT', 'Choose a listed answer for each question.', 400);
    }
    return { questionId: question.id, correct: selected === question.answer, explanation: question.explanation };
  }) });
}
