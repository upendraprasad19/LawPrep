import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest';
import { createServer, type Server } from 'node:http';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { dispatch } from '../../apps/site/src/http';
import { createApiClient } from '../../packages/api-client/src/index';
import { ExamIdSchema, IdSchema } from '../../packages/contracts/src/exam';

let server: Server;
let origin: string;
let receivedUrl = '';
let receivedAuthorization: string | undefined;
let responseMode: 'normal' | 'invalid' | 'redirect' = 'normal';
let requestCount = 0;
beforeEach(() => { responseMode = 'normal'; requestCount = 0; });
beforeAll(async () => {
  server = createServer(async (request, response) => {
    receivedUrl = request.url ?? '';
    receivedAuthorization = request.headers.authorization;
    requestCount++;
    if (responseMode === 'redirect') { response.writeHead(307, { Location: `${origin}/api/v1/not-registered` }); response.end(); return; }
    if (responseMode === 'invalid') { response.writeHead(200, { 'Content-Type': 'application/json' }); response.end('{"data":{"ok":"untrusted"}}'); return; }
    const result = await dispatch(new Request(`${origin}${receivedUrl}`, { method: request.method }));
    response.writeHead(result.status, Object.fromEntries(result.headers));
    response.end(await result.text());
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(async () => { server.close(); await once(server, 'close'); });

test('typed client reaches the actual registered health endpoint', async () => {
  const client = createApiClient({ baseUrl: `${origin}/api/v1/`, getAccessToken: async () => null });
  expect(await client.health()).toEqual({ ok: true });
  expect(receivedUrl).toBe('/api/v1/health');
});
test('tokens travel only in authorization headers, never request URLs', async () => {
  const client = createApiClient({ baseUrl: `${origin}/api/v1/`, getAccessToken: async () => 'synthetic-access-token' });
  await client.health();
  expect(receivedAuthorization).toBe('Bearer synthetic-access-token');
  expect(receivedUrl).not.toContain('synthetic-access-token');
});
test('unregistered routes and unsupported methods fail explicitly', async () => {
  const missing = await dispatch(new Request(`${origin}/api/v1/not-registered`));
  expect(missing.status).toBe(404);
  expect((await missing.json()).error.code).toBe('INVALID_INPUT');
  expect((await dispatch(new Request(`${origin}/api/v1/health`, { method: 'POST' }))).status).toBe(405);
});
test('exam and identifier contracts reject malformed input', () => {
  expect(ExamIdSchema.safeParse('clat-pg').success).toBe(false);
  expect(ExamIdSchema.parse('blet-patna-llb')).toBe('blet-patna-llb');
  expect(IdSchema.safeParse('../keys').success).toBe(false);
});
test('client refuses insecure remote API transport', () => {
  expect(() => createApiClient({ baseUrl: 'http://example.com/api/v1', getAccessToken: async () => null })).toThrow(/HTTPS/);
});

test('client rejects URL credentials, queries and fragments', () => {
  for (const baseUrl of ['https://student:token@example.com/api/v1', 'https://example.com/api/v1?token=private', 'https://example.com/api/v1#token']) {
    expect(() => createApiClient({ baseUrl, getAccessToken: async () => null })).toThrow(/must not contain/);
  }
});
test('malformed HTTP payloads cannot become typed success', async () => {
  responseMode = 'invalid';
  const client = createApiClient({ baseUrl: `${origin}/api/v1/`, getAccessToken: async () => null });
  await expect(client.health()).rejects.toMatchObject({ detail: { code: 'UNAVAILABLE' } });
});
test('authenticated transport refuses redirects instead of forwarding a token', async () => {
  responseMode = 'redirect';
  const client = createApiClient({ baseUrl: `${origin}/api/v1/`, getAccessToken: async () => 'fixture-token' });
  await expect(client.health()).rejects.toMatchObject({ detail: { code: 'UNAVAILABLE' } });
  expect(requestCount).toBe(1);
});
test('account transport rejects malformed identity responses and supports cancellation', async () => {
  responseMode = 'invalid';
  const client = createApiClient({ baseUrl: `${origin}/api/v1/`, getAccessToken: async () => 'fixture-token' });
  await expect(client.me()).rejects.toMatchObject({ detail: { code: 'UNAVAILABLE' } });
  const controller = new AbortController(); controller.abort();
  await expect(client.profile(controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
});
