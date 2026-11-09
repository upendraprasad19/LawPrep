import type { z } from 'zod';
import { ImportLibraryResultSchema, type ImportQuery, type ImportLibrary } from '@lawprep/contracts';
import { AccessResultSchema, type AccessSnapshot } from '@lawprep/contracts';
import { SampleLearningResultSchema, SampleReceiptResultSchema,
  type SampleLearning, type SampleActivityInput, type SampleReceipt } from '@lawprep/contracts';
import { StudyPreferencesResultSchema, DiagnosticResultSchema, DiagnosticFeedbackResultSchema,
  type StudyPreferences, type StudyPreferencesInput, type Diagnostic, type DiagnosticInput, type DiagnosticFeedback } from '@lawprep/contracts';
import { HealthResultSchema, ActorResultSchema, ProfileResultSchema, EditorStateResultSchema, EditorResultEnvelopeSchema, CatalogResultSchema, type ApiError, type ApiResult, type Health, type Actor, type Profile, type ProfileInput, type EditorCommand, type EditorResult, type EditorState, type Catalog, type ExamId } from '@lawprep/contracts';

export class ApiClientError extends Error {
  constructor(public readonly detail: ApiError) { super(detail.message); this.name = 'ApiClientError'; }
}
export type ApiClient = {
  health(signal?: AbortSignal): Promise<Health>;
  me(signal?: AbortSignal): Promise<Actor>;
  access(signal?: AbortSignal): Promise<AccessSnapshot>;
  sampleLearning(signal?: AbortSignal): Promise<SampleLearning>;
  recordSampleLearning(input: SampleActivityInput, signal?: AbortSignal): Promise<SampleReceipt>;
  studyPreferences(signal?: AbortSignal): Promise<StudyPreferences>;
  saveStudyPreferences(input: StudyPreferencesInput, signal?: AbortSignal): Promise<StudyPreferences>;
  diagnostic(signal?: AbortSignal): Promise<Diagnostic>;
  checkDiagnostic(input: DiagnosticInput, signal?: AbortSignal): Promise<DiagnosticFeedback>;
  profile(signal?: AbortSignal): Promise<Profile>;
  saveProfile(input: ProfileInput, signal?: AbortSignal): Promise<Profile>;
  editorState(versionId?: string, signal?: AbortSignal): Promise<EditorState>;
  editorCommand(command: EditorCommand, signal?: AbortSignal): Promise<EditorResult>;
  catalog(examId: ExamId, signal?: AbortSignal): Promise<Catalog>;
  imports(query:ImportQuery,signal?:AbortSignal):Promise<ImportLibrary>;
};
export function createApiClient(options: { baseUrl: string; getAccessToken(): Promise<string | null> }): ApiClient {
  const base = new URL(options.baseUrl);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname);
  if (base.protocol !== 'https:' && !(loopback && base.protocol === 'http:')) throw new Error('API transport requires HTTPS');
  if (base.username || base.password || base.search || base.hash) throw new Error('API base URL must not contain credentials, query parameters or fragments');
  base.pathname = `${base.pathname.replace(/\/$/, '')}/`;
  async function send<T>(path: string, schema: z.ZodType<ApiResult<T>>, signal?: AbortSignal, body?: unknown, method = 'GET'): Promise<T> {
      signal?.throwIfAborted();
      const token = await options.getAccessToken();
      signal?.throwIfAborted();
      const headers = new Headers({ Accept: 'application/json' });
      if (token) headers.set('Authorization', `Bearer ${token}`);
      if (body !== undefined) headers.set('Content-Type', 'application/json');
      let response: Response;
      try {
        response = await fetch(new URL(path, base), { method, body: body === undefined ? undefined : JSON.stringify(body), headers, credentials: 'omit', redirect: 'error', cache: 'no-store', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000) });
      } catch { signal?.throwIfAborted(); throw new ApiClientError({ code: 'UNAVAILABLE', message: 'The service could not be reached. Please try again.' }); }
      const result = schema.safeParse(await response.json().catch(() => null));
      signal?.throwIfAborted();
      if (!result.success) throw new ApiClientError({ code: 'UNAVAILABLE', message: 'The service returned an invalid response.' });
      if ('error' in result.data) throw new ApiClientError(result.data.error);
      if (!response.ok) throw new ApiClientError({ code: 'UNAVAILABLE', message: 'The service is temporarily unavailable.' });
      return result.data.data;
  }
  return {
    health: signal => send('health', HealthResultSchema, signal),
    me: signal => send('auth/me', ActorResultSchema, signal),
    access: signal => send('access', AccessResultSchema, signal),
    sampleLearning: signal => send('sample-learning', SampleLearningResultSchema, signal),
    recordSampleLearning: (input, signal) => send('sample-learning', SampleReceiptResultSchema, signal, input, 'POST'),
    studyPreferences: signal => send('study-preferences', StudyPreferencesResultSchema, signal),
    saveStudyPreferences: (input, signal) => send('study-preferences', StudyPreferencesResultSchema, signal, input, 'PUT'),
    diagnostic: signal => send('diagnostic', DiagnosticResultSchema, signal),
    checkDiagnostic: (input, signal) => send('diagnostic', DiagnosticFeedbackResultSchema, signal, input, 'POST'),
    profile: signal => send('profile', ProfileResultSchema, signal),
    saveProfile: (input, signal) => send('profile', ProfileResultSchema, signal, input, 'PUT'),
    editorState: (versionId, signal) => send(`admin/editor${versionId ? `?versionId=${encodeURIComponent(versionId)}` : ''}`, EditorStateResultSchema, signal),
    editorCommand: (command, signal) => send('admin/editor', EditorResultEnvelopeSchema, signal, command, 'POST'),
    catalog: (examId, signal) => send(`catalog?examId=${encodeURIComponent(examId)}`, CatalogResultSchema, signal),
    imports:(query,signal)=>{
      const params=new URLSearchParams();
      for(const [key,value] of Object.entries(query)) if(value!==undefined) params.set(key,String(value));
      return send(`admin/imports?${params}`,ImportLibraryResultSchema,signal);
    }
  };
}
