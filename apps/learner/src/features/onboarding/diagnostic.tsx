import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { DiagnosticInputSchema, type Diagnostic, type DiagnosticFeedback } from '@lawprep/contracts';
import { useAccount } from '../auth/context';

function DiagnosticForm() {
  const { store } = useAccount();
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);
  const [feedback, setFeedback] = useState<DiagnosticFeedback | null>(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const session = store.boundary.capture();
    store.api().diagnostic(controller.signal).then(result => {
      if (!controller.signal.aborted && store.boundary.accepts(session)) setDiagnostic(result);
    }).catch(() => {
      if (!controller.signal.aborted && store.boundary.accepts(session)) setError('The diagnostic could not be loaded.');
    });
    return () => controller.abort();
  }, [store, reload]);

  async function check(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!diagnostic || busy) return;
    const values = new FormData(event.currentTarget);
    const input = DiagnosticInputSchema.safeParse({
      answers: diagnostic.questions.map(question => ({ questionId: question.id, optionId: values.get(question.id) }))
    });
    if (!input.success) { setError('Choose one answer for each question.'); return; }
    const session = store.boundary.capture();
    setBusy(true);
    setError('');
    setFeedback(null);
    try {
      const result = await store.api().checkDiagnostic(input.data);
      if (store.boundary.accepts(session)) setFeedback(result);
    } catch {
      if (store.boundary.accepts(session)) setError('Your answers could not be checked. Please try again.');
    } finally {
      if (store.boundary.accepts(session)) setBusy(false);
    }
  }
  if (!diagnostic) return error
    ? <><p role="alert">{error}</p><button onClick={() => { setError(''); setReload(value => value + 1); }}>Retry diagnostic</button></>
    : <p role="status">Loading questions…</p>;

  return <>
    <form className="form-stack" onSubmit={check} onChange={() => setFeedback(null)}>
      {diagnostic.questions.map((question, index) => <fieldset key={question.id} disabled={busy}>
        <legend>Question {index + 1}. {question.prompt}</legend>
        {question.options.map(option => <label className="check" key={option.id}>
          <input type="radio" name={question.id} value={option.id} required/>{option.text}
        </label>)}
      </fieldset>)}
      <button className="button primary" disabled={busy}>{busy ? 'Checking…' : 'Check my answers'}</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {feedback && <section className="account-section" aria-live="polite">
      <h2>Feedback</h2>
      <ol>{feedback.feedback.map(item => <li key={item.questionId}>
        <strong>{item.correct ? 'Correct.' : 'Review this answer.'}</strong> {item.explanation}
      </li>)}</ol>
      <p>Use these explanations to choose what to practise first. Your feedback is available during this visit.</p>
      <Link className="button primary" to="/learn/clat-sample">Continue to the sample lesson</Link>
    </section>}
  </>;
}

export function ClatDiagnostic() {
  const { actor, status } = useAccount();
  return <>
    <p className="eyebrow">Optional starting check</p><h1>CLAT diagnostic</h1>
    <p className="intro">Try two untimed reading and reasoning questions. This short check gives you feedback on these questions.</p>
    {actor ? <DiagnosticForm key={actor.userId}/> : status === 'loading' || status === 'checking'
      ? <p role="status">Checking your account…</p>
      : <Link className="button primary" to="/account">Open your account to try the diagnostic</Link>}
    <p><Link className="text-link" to="/setup/clat">Return to study setup</Link></p>
  </>;
}
