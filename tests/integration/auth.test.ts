import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { createServer, type Server } from 'node:http';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { dispatch } from '../../apps/site/src/http';
import { requireActor, dbForActor } from '../../packages/server/src/auth';

let provider: Server;
const userA = '10000000-0000-4000-8000-000000000001';
const userB = '10000000-0000-4000-8000-000000000002';
const trace: { path: string; authorization: string | undefined }[] = [];
beforeAll(async () => {
  provider = createServer(async (request, response) => {
    trace.push({ path: request.url ?? '', authorization: request.headers.authorization });
    const token = request.headers.authorization?.replace('Bearer ', '');
    const id = token === 'fixture-A' ? userA : userB;
    response.setHeader('Content-Type', 'application/json');
    if (token === 'expired' || token === 'forged') { response.writeHead(401); response.end('{"message":"Invalid JWT","code":"bad_jwt"}'); return; }
    if (request.url === '/auth/v1/user') {
      response.end(JSON.stringify({ id, email: `${id}@example.invalid`, email_confirmed_at: token === 'unconfirmed' ? null : '2026-10-28T00:00:00Z', is_anonymous: token === 'anonymous', user_metadata: { role: 'publisher' } })); return;
    }
    if (request.url === '/rest/v1/rpc/lawprep_actor') { response.end(JSON.stringify({ userId: id, role: token === 'fixture-owner' ? 'publisher' : 'learner' })); return; }
    if (request.url === '/rest/v1/rpc/lawprep_access') {
      response.end(JSON.stringify({ userId: token === 'wrong-access-owner' ? userA : id, checkedAt: '2026-11-08T10:00:00Z', cycles: [] }));
      return;
    }
    if (request.url === '/rest/v1/rpc/lawprep_sample_learning') {
      const question = (number: number) => ({
        id: 'q' + number, prompt: 'Read fixture ' + number,
        options: [{ id: 'a', text: 'First' }, { id: 'b', text: 'Second' }]
      });
      response.end(JSON.stringify({ userId: id, lesson: {
        id: 'clat-reading-v1', title: 'Fixture lesson', objective: 'Find the main point',
        explanation: 'Fixture explanation', example: { passage: 'Fixture passage', reasoning: 'Fixture reasoning' },
        questions: [question(1), question(2)]
      }, readingCompleted: false, feedback: [] }));
      return;
    }
    if (request.url === '/rest/v1/rpc/lawprep_record_sample_learning') {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(chunk);
      const input = JSON.parse(Buffer.concat(chunks).toString());
      response.end(JSON.stringify({
        userId: id, unitId: input.p_unit_id, mutationId: input.p_mutation_id.toLowerCase(), kind: 'answer',
        feedback: { questionId: input.p_question_id, selectedOptionId: input.p_option_id,
          correct: true, explanation: 'Checked by the fixture provider', repeated: false }
      }));
      return;
    }
    if (request.url === '/rest/v1/rpc/lawprep_save_study_preferences') {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(chunk);
      const input = JSON.parse(Buffer.concat(chunks).toString());
      if (input.p_expected_revision !== 0) {
        response.writeHead(409);
        response.end(JSON.stringify({ code: 'PT409' }));
        return;
      }
      response.end(JSON.stringify({ userId: id, cycleId: input.p_cycle_id, targetDate: input.p_target_date,
        dailyMinutes: input.p_daily_minutes, familiarity: input.p_familiarity,
        diagnosticChoice: input.p_diagnostic_choice, revision: 1 }));
      return;
    }
    if (request.url?.startsWith('/rest/v1/profiles')) { response.end(JSON.stringify([{ user_id: id, display_name: id === userA ? 'A name' : 'B name', timezone: 'UTC', revision: 1 }])); return; }
    response.writeHead(503); response.end('{"message":"Fixture database unavailable"}');
  });
  provider.listen(0, '127.0.0.1'); await once(provider, 'listening');
  vi.stubEnv('SUPABASE_URL', `http://127.0.0.1:${(provider.address() as AddressInfo).port}`);
  vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_fixture_key_for_tests_only');
});
afterAll(async () => { vi.unstubAllEnvs(); provider.close(); await once(provider, 'close'); });
const request = (path: string, token?: string, init?: RequestInit) => new Request(`http://127.0.0.1/api/v1/${path}`, { ...init, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers } });

test('anonymous, forged and expired identities cannot enter private routes', async () => {
  for (const token of [undefined, 'forged', 'expired', 'unconfirmed', 'anonymous']) {
    const response = await dispatch(request('auth/me', token));
    expect(response.status).toBe(401);
    expect(response.headers.get('cache-control')).toContain('no-store');
  }
});
test('verified identity and current database role override forged admin metadata', async () => {
  const response = await dispatch(request('auth/me', 'fixture-A'));
  expect(response.status).toBe(200);
  expect((await response.json()).data).toMatchObject({ userId: userA, role: 'learner' });
  expect((await dispatch(request('admin/editor', 'fixture-A'))).status).toBe(403);
});
test('request-scoped clients do not share caller tokens or profile state', async () => {
  const [a, b] = await Promise.all([dispatch(request('profile', 'fixture-A')), dispatch(request('profile', 'fixture-B'))]);
  expect((await a.json()).data).toMatchObject({ userId: userA, displayName: 'A name' });
  expect((await b.json()).data).toMatchObject({ userId: userB, displayName: 'B name' });
  expect(trace.filter(item => item.path.startsWith('/rest/v1/profiles')).map(item => item.authorization)).toEqual(expect.arrayContaining(['Bearer fixture-A', 'Bearer fixture-B']));
});
test('a fabricated actor object is not an authenticated database capability', async () => {
  const actor = await requireActor(request('auth/me', 'fixture-A'));
  expect(Object.isFrozen(actor)).toBe(true);
  expect(() => dbForActor({ ...actor, role: 'publisher' })).toThrow();
});
test('access requires a verified caller and rejects a mismatched provider identity', async () => {
  expect((await dispatch(request('access'))).status).toBe(401);
  const response = await dispatch(request('access', 'fixture-A'));
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toContain('no-store');
  expect(await response.json()).toEqual({ data: { userId: userA, checkedAt: '2026-11-08T10:00:00Z', cycles: [] } });
  expect((await dispatch(request('access', 'wrong-access-owner'))).status).toBe(503);
});

test('sample learning verifies caller and returns only public questions until an answer', async () => {
  expect((await dispatch(request('sample-learning'))).status).toBe(401);
  const loaded = await dispatch(request('sample-learning', 'fixture-A'));
  expect(loaded.status).toBe(200);
  expect(loaded.headers.get('cache-control')).toContain('no-store');
  const { data } = await loaded.json();
  expect(data).toMatchObject({ userId: userA, readingCompleted: false, feedback: [] });
  expect(data.lesson.questions).toHaveLength(2);
  for (const question of data.lesson.questions) expect(Object.keys(question).sort()).toEqual(['id', 'options', 'prompt']);
  const input = { unitId: 'clat-reading-v1', mutationId: '20000000-0000-4000-8000-00000000000a', kind: 'answer', questionId: 'q1', optionId: 'a' };
  const submit = (body: object) => dispatch(request('sample-learning', 'fixture-A', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  }));
  expect((await submit({ ...input, userId: userB, correct: true })).status).toBe(400);
  expect((await submit({ ...input, unitId: 'private-draft' })).status).toBe(400);
  const saved = await submit(input);
  expect(saved.status).toBe(200);
  expect((await saved.json()).data).toMatchObject({ kind: 'answer', mutationId: input.mutationId, feedback: { correct: true, questionId: 'q1' } });
  const replay = await submit({ ...input, mutationId: input.mutationId.toUpperCase() });
  expect(replay.status).toBe(200);
  expect((await replay.json()).data.mutationId).toBe(input.mutationId);
});

test('study preferences accept an undecided date, reject a supplied owner and report a stale revision', async () => {
  const input = { cycleId: null, targetDate: null, dailyMinutes: 25, familiarity: 'new', diagnosticChoice: 'skip', expectedRevision: 0 };
  const put = (body: object, token?: string) => dispatch(request('study-preferences', token, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  }));
  expect((await put(input)).status).toBe(401);
  const saved = await put(input, 'fixture-A');
  expect(saved.status).toBe(200);
  expect((await saved.json()).data).toMatchObject({ userId: userA, targetDate: null, diagnosticChoice: 'skip', revision: 1 });
  expect((await put({ ...input, userId: userB }, 'fixture-A')).status).toBe(400);
  expect((await put({ ...input, expectedRevision: 1 }, 'fixture-A')).status).toBe(409);
});

test('the optional diagnostic returns original questions and grades distinct valid answers', async () => {
  const loaded = await dispatch(request('diagnostic', 'fixture-A'));
  expect(loaded.status).toBe(200);
  const questions = (await loaded.json()).data.questions;
  expect(questions).toHaveLength(2);
  for (const question of questions) expect(Object.keys(question).sort()).toEqual(['id', 'options', 'prompt']);
  const answers = questions.map((question: { id: string; options: { id: string }[] }) =>
    ({ questionId: question.id, optionId: question.options[0].id }));
  const submit = (items: unknown) => dispatch(request('diagnostic', 'fixture-A', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: items })
  }));
  expect((await submit([answers[0], answers[0]])).status).toBe(400);
  expect((await submit([{ ...answers[0], optionId: 'absent' }, answers[1]])).status).toBe(400);
  const result = await submit(answers);
  expect(result.status).toBe(200);
  expect((await result.json()).data.feedback).toMatchObject([
    { questionId: 'starter-reading', correct: true },
    { questionId: 'starter-logic', correct: false }
  ]);
});
test('privileged input and over-limit bodies are rejected before a save', async () => {
  const body = JSON.stringify({ displayName: 'Name', timezone: 'UTC', expectedRevision: 1, userId: userB });
  expect((await dispatch(request('profile', 'fixture-A', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body }))).status).toBe(400);
  expect((await dispatch(request('profile', 'fixture-A', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: 'x'.repeat(262145) }))).status).toBe(413);
});
test('editor dependency failure remains unavailable and does not become an empty list', async () => {
  const response = await dispatch(request('admin/editor', 'fixture-owner'));
  expect(response.status).toBe(503);
  expect((await response.json()).error.code).toBe('UNAVAILABLE');
  expect(response.headers.get('x-request-id')).toBeTruthy();
});

test('private imports reject anonymous and forged publisher metadata; failed provider is not an empty library', async () => {
  expect((await dispatch(request('admin/imports'))).status).toBe(401);
  expect((await dispatch(request('admin/imports','fixture-A'))).status).toBe(403);
  expect((await dispatch(request('admin/imports','fixture-owner'))).status).toBe(503);
  expect((await dispatch(request('admin/imports?offset=-1','fixture-owner'))).status).toBe(400);
  expect((await dispatch(request('admin/imports?limit=51','fixture-owner'))).status).toBe(400);
  expect((await dispatch(request('admin/imports?ordinal=1&ordinal=2','fixture-owner'))).status).toBe(400);
});
