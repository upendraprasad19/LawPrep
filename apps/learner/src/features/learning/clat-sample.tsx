import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { SampleActivityInput, SampleLearning } from '@lawprep/contracts';
import { useAccount } from '../auth/context';

function SampleSession() {
  const { store } = useAccount();
  const [state, setState] = useState<SampleLearning | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);
  const [pending, setPending] = useState<SampleActivityInput | null>(null);
  const [busy, setBusy] = useState(false);
  const activeWrite = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const session = store.boundary.capture();
    store.api().sampleLearning(controller.signal).then(result => {
      if (!controller.signal.aborted && store.boundary.accepts(session)) setState(result);
    }).catch(() => {
      if (!controller.signal.aborted && store.boundary.accepts(session)) setError('The sample lesson could not be loaded.');
    });
    return () => controller.abort();
  }, [store, reload]);
  useEffect(() => () => activeWrite.current?.abort(), []);

  async function save(input: SampleActivityInput) {
    if (activeWrite.current) return;
    const controller = new AbortController();
    const session = store.boundary.capture();
    activeWrite.current = controller;
    setPending(input);
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const receipt = await store.api().recordSampleLearning(input, controller.signal);
      if (controller.signal.aborted || !store.boundary.accepts(session)) return;
      setState(current => {
        if (!current) return current;
        if (receipt.kind === 'read') return { ...current, readingCompleted: true };
        return {
          ...current,
          feedback: [...current.feedback.filter(item => item.questionId !== receipt.feedback.questionId), receipt.feedback]
        };
      });
      setPending(null);
      setNotice(receipt.kind === 'read' ? 'Reading saved as complete.' : 'Answer saved. Feedback is below the question.');
    } catch {
      if (!controller.signal.aborted && store.boundary.accepts(session)) {
        setError('The save could not be confirmed. Retry the same activity.');
      }
    } finally {
      activeWrite.current = null;
      if (!controller.signal.aborted && store.boundary.accepts(session)) setBusy(false);
    }
  }

  if (!state) return error
    ? <><p role="alert">{error}</p><button onClick={() => { setError(''); setReload(value => value + 1); }}>Retry lesson</button></>
    : <p role="status">Loading the sample lesson…</p>;
  const { lesson, readingCompleted, feedback } = state;

  function answer(event: FormEvent<HTMLFormElement>, questionId: string) {
    event.preventDefault();
    if (pending) return;
    const optionId = new FormData(event.currentTarget).get('optionId');
    if (typeof optionId !== 'string') return;
    void save({ unitId: lesson.id, mutationId: crypto.randomUUID(), kind: 'answer', questionId, optionId });
  }

  return <>
    <h1>{lesson.title}</h1>
    <p className="intro">{lesson.objective}</p>
    <section className="account-section">
      <h2>Read the lesson</h2>
      <p>{lesson.explanation}</p>
      <h3>Worked example</h3>
      <blockquote>{lesson.example.passage}</blockquote>
      <p>{lesson.example.reasoning}</p>
      <button type="button" disabled={Boolean(pending) || readingCompleted} onClick={() => void save({
        unitId: lesson.id, mutationId: crypto.randomUUID(), kind: 'read'
      })}>{readingCompleted ? 'Reading complete' : 'Mark reading complete'}</button>
    </section>
    <section className="account-section">
      <h2>Try it yourself</h2>
      {lesson.questions.map((question, index) => {
        const previous = feedback.find(item => item.questionId === question.id);
        return <form key={question.id} className="form-stack" onSubmit={event => answer(event, question.id)}>
          <fieldset disabled={Boolean(pending)}>
            <legend>Question {index + 1}. {question.prompt}</legend>
            {question.options.map(option => <label key={option.id} className="check">
              <input type="radio" name="optionId" value={option.id} required defaultChecked={previous?.selectedOptionId === option.id}/>{option.text}
            </label>)}
          </fieldset>
          <button className="button primary" disabled={Boolean(pending)}>{previous ? 'Try this question again' : 'Check answer'}</button>
          {previous && <div aria-live="polite">
            <p><strong>{previous.correct ? 'Correct.' : 'Review this answer.'}</strong> {previous.explanation}</p>
            <p className="muted">{previous.repeated ? 'Repeat attempt' : 'First attempt'}</p>
          </div>}
        </form>;
      })}
    </section>
    {busy && <p role="status">Saving activity…</p>}
    {notice && <p role="status">{notice}</p>}
    {error && <p role="alert">{error}</p>}
    {pending && !busy && <button type="button" onClick={() => void save(pending)}>Retry saving activity</button>}
    <section className="account-section">
      <h2>Your next study step</h2>
      <p>{!readingCompleted ? 'Finish the worked example and mark the reading complete.'
        : feedback.length < lesson.questions.length ? 'Try both questions and read the explanations.'
        : 'Find a short passage and write its main point in one sentence. Underline the words that support your summary.'}</p>
      <Link className="text-link" to="/setup/clat">Return to study setup</Link>
    </section>
  </>;
}

export function ClatSample() {
  const { actor, status } = useAccount();
  return <>
    <p className="eyebrow">Free CLAT sample · Reading foundations</p>
    {actor ? <SampleSession key={actor.userId}/> : status === 'loading' || status === 'checking'
      ? <p role="status">Checking your account…</p>
      : <><h1>Try the CLAT sample lesson</h1><Link className="button primary" to="/account">Sign in to save your activity</Link></>}
  </>;
}
