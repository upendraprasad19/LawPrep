import 'server-only';
import { ImportLibrarySchema, type ImportLibrary, type ImportQuery } from '@lawprep/contracts';
import { dbForActor, requirePublisher, type VerifiedActor } from './auth';
import { databaseError, ServiceError } from './errors';
export async function getImportLibrary(actor:VerifiedActor,query:ImportQuery):Promise<ImportLibrary> {
  requirePublisher(actor);
  const result=await dbForActor(actor).rpc('lawprep_import_library',{
    p_query:query.q,p_offset:query.offset,p_limit:query.limit,
    ...(query.batch?{p_batch_hash:query.batch}:{}),...(query.kind?{p_kind:query.kind}:{}),
    ...(query.ordinal!==undefined?{p_ordinal:query.ordinal}:{})
  });
  if(result.error) databaseError(result.error);
  const parsed=ImportLibrarySchema.safeParse(result.data);
  if(!parsed.success) throw new ServiceError('UNAVAILABLE','The imported library could not be loaded.',503);
  return parsed.data;
}
