import 'server-only';
import { CatalogSchema, type Catalog, type ExamId } from '@lawprep/contracts';
import { createRequestClient } from './db';
import { databaseError, ServiceError } from './errors';
export async function getPublishedCatalog(examId: ExamId): Promise<Catalog> {
  const result = await createRequestClient().rpc('lawprep_catalog', { p_exam_id: examId });
  if (result.error) databaseError(result.error);
  const parsed = CatalogSchema.safeParse(result.data);
  if (!parsed.success) throw new ServiceError('UNAVAILABLE', 'The course catalogue could not be loaded.', 503);
  return parsed.data;
}
