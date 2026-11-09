import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { StudyPreferencesInputSchema, type Catalog, type StudyPreferences } from '@lawprep/contracts';
import { ApiClientError } from '@lawprep/api-client';
import { useAccount } from '../auth/context';

type Setup = { preferences: StudyPreferences; cycles: Catalog['cycles'] };

function PreferencesForm() {
  const { store } = useAccount();
  const [data, setData] = useState<Setup | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const session = store.boundary.capture();
    const api = store.api();
    Promise.all([api.studyPreferences(controller.signal), api.catalog('clat-ug', controller.signal)])
      .then(([preferences, catalogue]) => {
        if (!controller.signal.aborted && store.boundary.accepts(session)) setData({ preferences, cycles: catalogue.cycles });
      }).catch(() => {
        if (!controller.signal.aborted && store.boundary.accepts(session)) setError('Study preferences could not be loaded.');
      });
    return () => controller.abort();
  }, [store, reload]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data || busy) return;
    const form = new FormData(event.currentTarget);
    const input = StudyPreferencesInputSchema.safeParse({
      cycleId: form.get('cycleId') || null, targetDate: form.get('targetDate') || null,
      dailyMinutes: Number(form.get('dailyMinutes')), familiarity: form.get('familiarity'),
      diagnosticChoice: form.get('diagnosticChoice'), expectedRevision: data.preferences.revision
    });
    setSaved(false);
    if (!input.success) { setError('Check your target date and study minutes.'); return; }
    const session = store.boundary.capture();
    setBusy(true);
    setError('');
    try {
      const preferences = await store.api().saveStudyPreferences(input.data);
      if (store.boundary.accepts(session)) {
        setData({ ...data, preferences });
        setSaved(true);
      }
    } catch (failure) {
      if (store.boundary.accepts(session)) setError(failure instanceof ApiClientError && failure.detail.code === 'CONFLICT'
        ? 'Your preferences changed elsewhere. Reload the saved values before editing again.'
        : 'Your study preferences could not be saved. Please try again.');
    } finally {
      if (store.boundary.accepts(session)) setBusy(false);
    }
  }

  function reloadPreferences() {
    setSaved(false);
    setError('');
    setData(null);
    setReload(value => value + 1);
  }
  if (!data) return error
    ? <><p role="alert">{error}</p><button onClick={reloadPreferences}>Retry setup</button></>
    : <p role="status">Loading study preferences…</p>;
  const { preferences, cycles } = data;
  return <>
    <form className="form-stack account-width" key={preferences.revision} onSubmit={submit} onChange={() => setSaved(false)}>
      <fieldset disabled={busy} className="form-stack">
      <label>Preparation cycle<select name="cycleId" defaultValue={preferences.cycleId ?? ''}>
        <option value="">Undecided</option>
        {preferences.cycleId && !cycles.some(cycle => cycle.id === preferences.cycleId)
          && <option value={preferences.cycleId}>Previously saved cycle</option>}
        {cycles.map(cycle => <option key={cycle.id} value={cycle.id}>{cycle.label}</option>)}
      </select></label>
      <label>Target date<input name="targetDate" type="date" min="0001-01-01" max="9999-12-31" defaultValue={preferences.targetDate ?? ''}/></label>
      <p className="muted">This is your personal target. Leave it blank if you are undecided.</p>
      <label>Minutes per day<input name="dailyMinutes" type="number" min="5" max="240" required defaultValue={preferences.dailyMinutes}/></label>
      <label>How familiar are you with CLAT?<select name="familiarity" defaultValue={preferences.familiarity}>
        <option value="new">I am new to it</option><option value="some">I know the basics</option><option value="preparing">I have started preparing</option>
      </select></label>
      <fieldset>
        <legend>Optional two-question diagnostic</legend>
        <label className="check"><input name="diagnosticChoice" type="radio" value="take" defaultChecked={preferences.diagnosticChoice === 'take'}/>Try it after saving</label>
        <label className="check"><input name="diagnosticChoice" type="radio" value="skip" defaultChecked={preferences.diagnosticChoice === 'skip'}/>Skip for now</label>
        <label className="check"><input name="diagnosticChoice" type="radio" value="later" defaultChecked={preferences.diagnosticChoice === 'later'}/>Decide later</label>
      </fieldset>
      <button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save study preferences'}</button>
      </fieldset>
    </form>
    {error && <><p role="alert">{error}</p><button disabled={busy} onClick={reloadPreferences}>Reload saved preferences and discard edits</button></>}
    {saved && <p role="status">Study preferences saved.</p>}
    {preferences.revision > 0 && <section className="account-section">
      <h2>Your starting point</h2>
      <p>Begin with reading and reasoning foundations. Aim for {preferences.dailyMinutes} minutes in your first study session.</p>
      {preferences.diagnosticChoice === 'take' &&
        <p><Link className="text-link" to="/diagnostic/clat">Start the short diagnostic</Link></p>}
      <Link className="button primary" to="/learn/clat-sample">Continue to the sample lesson</Link>
    </section>}
  </>;
}

export function ClatSetup() {
  const { actor, status } = useAccount();
  return <>
    <p className="eyebrow">Your starting point</p><h1>Set up CLAT study</h1>
    <p className="intro">Choose a starting routine. You can change it as you learn what fits.</p>
    {actor ? <PreferencesForm key={actor.userId}/> : status === 'loading' || status === 'checking'
      ? <p role="status">Checking your account…</p>
      : <Link className="button primary" to="/account">Open your account to save preferences</Link>}
  </>;
}
