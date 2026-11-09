import { createClient, type Session } from '@supabase/supabase-js';
import { createApiClient, type ApiClient } from '@lawprep/api-client';
import type { Actor } from '@lawprep/contracts';
import { browserPlatform } from '../../platform';
import { SessionBoundary } from './session-boundary';
import { authStorageKey, endLocalSession } from './logout';

type AccountState = { status: 'loading' | 'signed-out' | 'signing-out' | 'checking' | 'ready' | 'error'; session: Session | null; actor: Actor | null; error: string };
const initial: AccountState = { status: 'loading', session: null, actor: null, error: '' };
function browserClient() {
  const url = import.meta.env.VITE_SUPABASE_URL, key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key?.startsWith('sb_publishable_')) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') return null;
    return createClient(parsed.origin, key, {
      auth: { storageKey: authStorageKey, flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      global: { fetch: (input, init) => fetch(input, { ...init, credentials: 'omit', redirect: 'error', signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000) }) }
    });
  } catch { return null; }
}
export class AccountStore {
  private client = browserClient();
  private state = initial;
  private listeners = new Set<() => void>();
  private controller = new AbortController();
  private blocked = false;
  private logoutTask: Promise<boolean> | null = null;
  readonly boundary = new SessionBoundary();
  readonly configured = Boolean(this.client);
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  snapshot = () => this.state;
  private set(state: AccountState) { this.state = state; this.listeners.forEach(listener => listener()); }
  start() {
    if (!this.client) { this.set({ ...initial, status: 'error', error: 'Account services are being connected. You can still explore law and exam routes.' }); return () => {}; }
    let stopped = false;
    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      // Run outside Supabase's auth lock; the callback itself never awaits SDK work.
      queueMicrotask(() => { if (!stopped && !this.blocked) void this.receive(session); });
    });
    this.client.auth.startAutoRefresh();
    return () => { stopped = true; data.subscription.unsubscribe(); this.controller.abort(); this.client?.auth.stopAutoRefresh(); };
  }
  private async receive(session: Session | null) {
    this.controller.abort(); this.controller = new AbortController();
    const controller = this.controller;
    const sameUser = Boolean(session && this.state.session?.user.id === session.user.id);
    const previousActor = sameUser ? this.state.actor : null;
    if (!sameUser) this.boundary.change(session?.user.id ?? null);
    const snapshot = this.boundary.capture();
    this.set({ status: session ? previousActor ? 'ready' : 'checking' : 'signed-out', session, actor: previousActor, error: '' });
    if (!session) return;
    try {
      const actor = await this.api().me(controller.signal);
      if (this.boundary.accepts(snapshot) && !controller.signal.aborted && !this.blocked) this.set({ status: 'ready', session, actor, error: '' });
    } catch {
      if (this.boundary.accepts(snapshot) && !controller.signal.aborted && !this.blocked) { this.boundary.change(null); this.set({ status: 'error', session, actor: null, error: 'Your account could not be checked. Retry, or sign out and request a new code.' }); }
    }
  }
  retry = () => { void this.receive(this.state.session); };
  api(): ApiClient {
    const token = this.state.session?.access_token ?? null;
    return createApiClient({ baseUrl: browserPlatform().apiBaseUrl, getAccessToken: async () => token });
  }
  async sendCode(email: string) {
    if (this.logoutTask) throw new Error('Wait for sign-out to finish before signing in.');
    if (!this.client) throw new Error('Account services are not configured yet.');
    this.blocked = false; this.client.auth.startAutoRefresh();
    const { error } = await this.client.auth.signInWithOtp({ email, options: { emailRedirectTo: new URL('/study/', window.location.origin).href } });
    if (error) throw new Error('A sign-in code could not be sent. Please wait and try again.');
  }
  async verifyCode(email: string, token: string) {
    if (this.logoutTask) throw new Error('Wait for sign-out to finish before signing in.');
    if (!this.client) throw new Error('Account services are not configured yet.');
    const { error } = await this.client.auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw new Error('That code could not be verified. Check it or request a new one.');
  }
  logout() {
    if (this.logoutTask) return this.logoutTask;
    this.blocked = true; this.client?.auth.stopAutoRefresh();
    this.logoutTask = endLocalSession({
      clearView: () => { this.controller.abort(); this.boundary.change(null); this.set({ status: 'signing-out', session: null, actor: null, error: '' }); },
      revoke: async () => { if (!this.client) return true; const { error } = await this.client.auth.signOut({ scope: 'local' }); return !error; },
      removeItem: key => { try { localStorage.removeItem(key); } catch { /* View is already cleared if storage is unavailable. */ } }
    }).finally(() => { this.logoutTask = null; this.set({ status: 'signed-out', session: null, actor: null, error: '' }); });
    return this.logoutTask;
  }
}
// One SDK instance per page, including React Strict Mode's render checks.
export const accountStore = new AccountStore();
