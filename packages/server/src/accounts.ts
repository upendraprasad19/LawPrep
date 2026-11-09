import 'server-only';
import { ProfileSchema, type Profile, type ProfileInput } from '@lawprep/contracts';
import { dbForActor, type VerifiedActor } from './auth';
import { databaseError, ServiceError } from './errors';
export async function getProfile(actor: VerifiedActor): Promise<Profile> {
  const result = await dbForActor(actor).from('profiles').select('user_id,display_name,timezone,revision').eq('user_id', actor.userId).maybeSingle();
  if (result.error) databaseError(result.error);
  if (result.data === null) return { userId: actor.userId, displayName: '', timezone: 'UTC', revision: 0 };
  const parsed = ProfileSchema.safeParse({ userId: result.data.user_id, displayName: result.data.display_name, timezone: result.data.timezone, revision: result.data.revision });
  if (!parsed.success || parsed.data.userId !== actor.userId) throw new ServiceError('UNAVAILABLE', 'Your profile could not be loaded. Please try again.', 503);
  return parsed.data;
}
export async function saveProfile(actor: VerifiedActor, input: ProfileInput): Promise<Profile> {
  const result = await dbForActor(actor).rpc('lawprep_save_profile', { p_display_name: input.displayName, p_timezone: input.timezone, p_expected_revision: input.expectedRevision });
  if (result.error) databaseError(result.error);
  const parsed = ProfileSchema.safeParse(result.data);
  if (!parsed.success || parsed.data.userId !== actor.userId) throw new ServiceError('UNAVAILABLE', 'Your saved profile could not be confirmed. Refresh before retrying.', 503);
  return parsed.data;
}
