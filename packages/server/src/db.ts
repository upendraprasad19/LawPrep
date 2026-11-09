import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { RuntimeDatabase } from './database-rpc';
import { ServiceError } from './errors';

export function createRequestClient(token?: string) {
  const urlText = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!urlText || !key?.startsWith('sb_publishable_')) throw new ServiceError('UNAVAILABLE', 'Account services are not configured yet.', 503);
  let url: URL;
  try { url = new URL(urlText); } catch { throw new ServiceError('UNAVAILABLE', 'Account services are not configured yet.', 503); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new ServiceError('UNAVAILABLE', 'Account services are not configured yet.', 503);
  }
  return createClient<RuntimeDatabase>(url.origin, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      fetch: (input, init) => fetch(input, { ...init, credentials: 'omit', redirect: 'error', signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000) })
    }
  });
}
