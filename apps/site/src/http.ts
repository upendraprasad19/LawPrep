import { z } from 'zod';
import { HealthSchema, ExamIdSchema, ProfileInputSchema, EditorCommandSchema, ImportQuerySchema, type ApiError } from '@lawprep/contracts';
import { requireActor } from '../../../packages/server/src/auth';
import { getProfile, saveProfile } from '../../../packages/server/src/accounts';
import { getAccess } from '../../../packages/server/src/access';
import { StudyPreferencesInputSchema, DiagnosticInputSchema } from '@lawprep/contracts';
import { getStudyPreferences, saveStudyPreferences, getDiagnostic, checkDiagnostic } from '../../../packages/server/src/onboarding';
import { SampleActivityInputSchema } from '@lawprep/contracts';
import { getSampleLearning, recordSampleLearning } from '../../../packages/server/src/sample-learning';
import { getEditorState, executeEditorialCommand } from '../../../packages/server/src/publication';
import { getPublishedCatalog } from '../../../packages/server/src/catalog';
import { getImportLibrary } from '../../../packages/server/src/imports';
import { ServiceError } from '../../../packages/server/src/errors';

async function jsonBody(request: Request): Promise<unknown> {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') throw new ServiceError('INVALID_INPUT', 'Send JSON content.', 415);
  const reader = request.body?.getReader();
  if (!reader) throw new ServiceError('INVALID_INPUT', 'A request body is required.', 400);
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > 262_144) { await reader.cancel(); throw new ServiceError('INVALID_INPUT', 'The request is too large.', 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError('INVALID_INPUT', 'The request is not valid JSON.', 400);
  } finally { reader.releaseLock(); }
}
type Handler = (request: Request, url: URL) => Promise<unknown>;
const routes: Record<string, Partial<Record<string, Handler>>> = {
  '/api/v1/health': { GET: async () => HealthSchema.parse({ ok: true }) },
  '/api/v1/auth/me': { GET: async request => requireActor(request) },
  '/api/v1/access': { GET: async request => getAccess(await requireActor(request)) },
  '/api/v1/sample-learning': {
    GET: async request => getSampleLearning(await requireActor(request)),
    POST: async request => {
      const actor = await requireActor(request);
      return recordSampleLearning(actor, SampleActivityInputSchema.parse(await jsonBody(request)));
    }
  },
  '/api/v1/study-preferences': {
    GET: async request => getStudyPreferences(await requireActor(request)),
    PUT: async request => {
      const actor = await requireActor(request);
      return saveStudyPreferences(actor, StudyPreferencesInputSchema.parse(await jsonBody(request)));
    }
  },
  '/api/v1/diagnostic': {
    GET: async request => { await requireActor(request); return getDiagnostic(); },
    POST: async request => {
      await requireActor(request);
      return checkDiagnostic(DiagnosticInputSchema.parse(await jsonBody(request)));
    }
  },
  '/api/v1/profile': {
    GET: async request => getProfile(await requireActor(request)),
    PUT: async request => { const actor = await requireActor(request); return saveProfile(actor, ProfileInputSchema.parse(await jsonBody(request))); }
  },
  '/api/v1/catalog': { GET: async (_request, url) => getPublishedCatalog(ExamIdSchema.parse(url.searchParams.get('examId'))) },
  '/api/v1/admin/imports': { GET: async (request,url) => {
    const actor=await requireActor(request);
    const keys=[...url.searchParams.keys()];
    if(new Set(keys).size!==keys.length) throw new ServiceError('INVALID_INPUT','Use one value per import filter.',400);
    return getImportLibrary(actor,ImportQuerySchema.parse(Object.fromEntries(url.searchParams)));
  } },
  '/api/v1/admin/editor': {
    GET: async (request, url) => {
      const actor = await requireActor(request); const selected = url.searchParams.get('versionId');
      return getEditorState(actor, selected === null ? undefined : z.uuid().parse(selected));
    },
    POST: async request => { const actor = await requireActor(request); return executeEditorialCommand(actor, EditorCommandSchema.parse(await jsonBody(request))); }
  }
};
export async function dispatch(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'X-Request-Id': requestId };
  const error = (code: ApiError['code'], message: string, status: number, extra = {}) => Response.json({ error: { code, message } }, { status, headers: { ...headers, ...extra } });
  const url = new URL(request.url); const route = routes[url.pathname];
  if (!route) return error('INVALID_INPUT', 'This endpoint does not exist.', 404);
  const handle = route[request.method];
  if (!handle) return error('INVALID_INPUT', 'This method is not supported.', 405, { Allow: Object.keys(route).join(', ') });
  try { return Response.json({ data: await handle(request, url) }, { headers }); }
  catch (failure) {
    if (failure instanceof z.ZodError) return error('INVALID_INPUT', 'Check the submitted fields.', 400);
    if (failure instanceof ServiceError) return error(failure.code, failure.message, failure.status);
    console.error(JSON.stringify({ event: 'api_failure', requestId, path: url.pathname }));
    return error('UNAVAILABLE', 'The service is temporarily unavailable.', 503);
  }
}
