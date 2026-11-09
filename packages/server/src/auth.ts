import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RuntimeDatabase } from './database-rpc';
import { ActorSchema, CapabilitySchema, type Actor } from '@lawprep/contracts';
import { createRequestClient } from './db';
import { databaseError, ServiceError } from './errors';

export type VerifiedActor = Readonly<Actor>;
const clients = new WeakMap<VerifiedActor, SupabaseClient<RuntimeDatabase>>();
export async function requireActor(request: Request): Promise<VerifiedActor> {
  const match = request.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9._~-]+)$/i);
  if (!match || match[1].length > 8192) throw new ServiceError('UNAUTHENTICATED', 'Please sign in to continue.', 401);
  const client = createRequestClient(match[1]);
  const { data, error } = await client.auth.getUser(match[1]);
  if (error) {
    if ([400, 401, 403].includes(error.status ?? 0)) throw new ServiceError('UNAUTHENTICATED', 'Please sign in again.', 401);
    throw new ServiceError('UNAVAILABLE', 'Sign-in could not be checked. Please try again.', 503);
  }
  if (!data.user?.email || !data.user.email_confirmed_at || data.user.is_anonymous) throw new ServiceError('UNAUTHENTICATED', 'Verify your email to continue.', 401);
  const capability = await client.rpc('lawprep_actor');
  if (capability.error) databaseError(capability.error);
  const parsed = CapabilitySchema.safeParse(capability.data);
  if (!parsed.success || parsed.data.userId !== data.user.id) throw new ServiceError('UNAVAILABLE', 'Sign-in could not be checked. Please try again.', 503);
  const actor = Object.freeze(ActorSchema.parse({ ...parsed.data, email: data.user.email }));
  clients.set(actor, client);
  return actor;
}
export function dbForActor(actor: VerifiedActor): SupabaseClient<RuntimeDatabase> {
  const client = clients.get(actor);
  if (!client) throw new ServiceError('UNAUTHENTICATED', 'Please sign in to continue.', 401);
  return client;
}
export function requirePublisher(actor: VerifiedActor) {
  dbForActor(actor);
  if (actor.role !== 'publisher') throw new ServiceError('FORBIDDEN', 'The publishing workspace is available to the owner.', 403);
}
