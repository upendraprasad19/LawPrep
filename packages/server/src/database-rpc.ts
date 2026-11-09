import type { Database } from './database.types';

type PublicSchema = Database['public'];
type Functions = PublicSchema['Functions'];
type WithNullArgs<T extends { Args: object }, K extends keyof T['Args']> =
  Omit<T, 'Args'> & { Args: Omit<T['Args'], K> & { [P in K]: T['Args'][P] | null } };

// Supabase's generator omits SQL function argument nullability.
type NullableFunctions = {
  lawprep_record_sample_learning: WithNullArgs<Functions['lawprep_record_sample_learning'], 'p_question_id' | 'p_option_id'>;
  lawprep_save_study_preferences: WithNullArgs<Functions['lawprep_save_study_preferences'], 'p_cycle_id' | 'p_target_date'>;
};

export type RuntimeDatabase = Omit<Database, 'public'> & {
  public: Omit<PublicSchema, 'Functions'> & { Functions: Omit<Functions, keyof NullableFunctions> & NullableFunctions };
};
