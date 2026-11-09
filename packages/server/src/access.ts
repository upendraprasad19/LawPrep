import 'server-only';
import { AccessSnapshotSchema, type AccessSnapshot } from '@lawprep/contracts';
import { dbForActor, type VerifiedActor } from './auth';
import { databaseError, ServiceError } from './errors';

export async function getAccess(actor: VerifiedActor): Promise<AccessSnapshot> {
  const result = await dbForActor(actor).rpc('lawprep_access');
  if (result.error) databaseError(result.error);
  const parsed = AccessSnapshotSchema.safeParse(result.data);
  if (!parsed.success || parsed.data.userId !== actor.userId) {
    throw new ServiceError('UNAVAILABLE', 'Your study access could not be checked. Please try again.', 503);
  }
  return parsed.data;
}
