import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ProfileInputSchema, type Profile } from '@lawprep/contracts';
import { ApiClientError } from '@lawprep/api-client';
import { useAccount } from './context';
import { StudyAccess } from './study-access';
function ProfileForm() {
  const { store } = useAccount();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState(''); const [status, setStatus] = useState(''); const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); const snapshot = store.boundary.capture();
    store.api().profile(controller.signal).then(result => {
      if (store.boundary.accepts(snapshot)) { setProfile(result); setError(''); }
    }).catch(() => { if (!controller.signal.aborted && store.boundary.accepts(snapshot)) setError('Your profile could not be loaded.'); });
    return () => controller.abort();
  }, [store, reload]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!profile) return;
    const fields = new FormData(event.currentTarget);
    const parsed = ProfileInputSchema.safeParse({ displayName: fields.get('displayName'), timezone: fields.get('timezone'), expectedRevision: profile.revision });
    if (!parsed.success) { setError('Enter a name and a valid timezone, such as Asia/Kolkata.'); return; }
    const snapshot = store.boundary.capture(); setBusy(true); setError(''); setStatus('');
    try { const result = await store.api().saveProfile(parsed.data); if (store.boundary.accepts(snapshot)) { setProfile(result); setStatus('Profile saved.'); } }
    catch (failure) { if (store.boundary.accepts(snapshot)) setError(failure instanceof ApiClientError && failure.detail.code === 'CONFLICT' ? 'Your profile changed elsewhere. Reload it before saving again.' : 'Your profile was not saved. Please try again.'); }
    finally { if (store.boundary.accepts(snapshot)) setBusy(false); }
  }
  return <section className="account-section"><h2>Your profile</h2>{error && <p role="alert">{error}</p>}{!profile ? <><p>Loading your profile…</p><button onClick={() => setReload(value => value + 1)}>Retry profile</button></> : <form className="form-stack" onSubmit={save} key={profile.revision}><label>Display name<input name="displayName" autoComplete="nickname" maxLength={80} required defaultValue={profile.displayName}/></label><label>Timezone<input name="timezone" required maxLength={100} defaultValue={profile.timezone}/><small>For example, Asia/Kolkata.</small></label><div className="actions"><button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button><button type="button" onClick={() => { setStatus(''); setReload(value => value + 1); }}>Reload profile</button></div></form>}<p role="status">{status}</p></section>;
}
export function AccountPage() {
  const { status, actor, session, error, store } = useAccount();
  const [email, setEmail] = useState(''); const [code, setCode] = useState(''); const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [failure, setFailure] = useState('');
  const [resendAt, setResendAt] = useState(0); const [now, setNow] = useState(Date.now);
  useEffect(() => { if (!resendAt) return; const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [resendAt]);
  async function send(event?: FormEvent) {
    event?.preventDefault(); if (busy || Date.now() < resendAt) return;
    setBusy(true); setFailure(''); setMessage('');
    try { await store.sendCode(email.trim()); setSent(true); setCode(''); setResendAt(Date.now() + 60_000); setNow(Date.now()); setMessage('Check your inbox for a sign-in code or link.'); }
    catch (failure) { setFailure(failure instanceof Error ? failure.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  async function verify(event: FormEvent) {
    event.preventDefault(); setBusy(true); setFailure('');
    try { await store.verifyCode(email.trim(), code.trim()); setMessage('Email verified. Checking your account…'); }
    catch (failure) { setFailure(failure instanceof Error ? failure.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  async function logout() {
    setSent(false); setCode(''); setMessage(''); setFailure('');
    const revoked = await store.logout();
    setMessage(revoked ? 'You have signed out.' : 'Signed out on this device. The server could not confirm session revocation.');
  }
  return <><p className="eyebrow">Your account</p><h1>{actor ? 'Welcome back' : 'Sign in to Law Prep'}</h1><p className="intro">Use your email to continue your preparation across sessions.</p>
    {error && <p role="alert">{error}</p>}{failure && <p role="alert">{failure}</p>}<p role="status">{message}</p>
    {status === 'loading' || status === 'checking' ? <p role="status">Checking your account…</p> : null}
    {status === 'signing-out' && <p role="status">Signing out…</p>}
    {actor ? <><p>Signed in as <strong>{actor.email}</strong></p>{actor.role === 'publisher' && <Link className="text-link" to="/editor">Open publishing workspace →</Link>}<ProfileForm key={actor.userId}/></> : !session && store.configured && status !== 'signing-out' ? <div className="account-width">{!sent ? <form className="form-stack" onSubmit={send}><label>Email address<input type="email" autoComplete="email" name="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)}/></label><button className="button primary" disabled={busy}>{busy ? 'Sending…' : 'Send sign-in code'}</button></form> : <><p>Sent to {email}</p><form className="form-stack" onSubmit={verify}><label>Sign-in code<input autoComplete="one-time-code" inputMode="numeric" name="code" required minLength={6} maxLength={10} pattern="[0-9]{6,10}" value={code} onChange={event => setCode(event.target.value)}/></label><button className="button primary" disabled={busy}>{busy ? 'Verifying…' : 'Verify code'}</button></form><div className="actions"><button disabled={busy || now < resendAt} onClick={() => void send()}>Resend code{now < resendAt ? ` (${Math.ceil((resendAt - now) / 1000)}s)` : ''}</button><button disabled={busy} onClick={() => { setSent(false); setFailure(''); }}>Change email</button></div><p className="muted">If your email contains a link, open it in this browser to continue.</p></>}</div> : null}
    {actor && <StudyAccess key={actor.userId}/>}
    {session && !actor && <button onClick={store.retry}>Retry account check</button>}
    {actor && <button onClick={store.retry}>Refresh account access</button>}
    {session && <button className="logout" onClick={() => void logout()}>Sign out</button>}
  </>;
}
