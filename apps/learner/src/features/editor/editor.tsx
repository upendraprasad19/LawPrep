import { cloneElement, useEffect, useId, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { DraftInputSchema, EditorialImportSchema, EditorCommandSchema, type DraftInput, type EditorCommand, type EditorState } from '@lawprep/contracts';
import { ApiClientError } from '@lawprep/api-client';
import { useAccount } from '../auth/context';

type CommandInput = EditorCommand extends infer C ? C extends EditorCommand ? Omit<C, 'mutationId'> : never : never;
const formValue = (form: FormData, key: string) => String(form.get(key) ?? '');
function Field({ label, name, value = '', max = 200, children }: { label: string; name: string; value?: string; max?: number; children?: ReactElement<{ id?: string }> }) {
  const id = useId();
  return <div className="field"><label htmlFor={id}>{label}</label>{children ? cloneElement(children, { id }) : <input id={id} name={name} required maxLength={max} defaultValue={value}/>}</div>;
}
function PublishingDesk() {
  const { store } = useAccount();
  const [state, setState] = useState<EditorState | null>(null);
  const [selectedId, setSelectedId] = useState<string>();
  const [reload, setReload] = useState(0); const [error, setError] = useState(''); const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false); const [editing, setEditing] = useState(false);
  const [draftCycle, setDraftCycle] = useState(''); const [topicCycle, setTopicCycle] = useState('');
  const [imported, setImported] = useState<DraftInput | null>(null);
  const pending = useRef<{ text: string; command: EditorCommand } | null>(null);
  useEffect(() => {
    const controller = new AbortController(); const snapshot = store.boundary.capture();
    store.api().editorState(selectedId, controller.signal).then(result => { if (store.boundary.accepts(snapshot)) { setState(result); setError(''); } }).catch(() => {
      if (!controller.signal.aborted && store.boundary.accepts(snapshot)) setError('The publishing workspace could not be loaded. Retry to check the latest state.');
    });
    return () => controller.abort();
  }, [store, selectedId, reload]);
  async function run(input: CommandInput) {
    if (busy) return; setBusy(true); setError(''); setStatus(''); const snapshot = store.boundary.capture();
    try {
      // Retain identity for an uncertain retry of exactly the same mutation.
      const text = JSON.stringify(input);
      const command = pending.current?.text === text ? pending.current.command : EditorCommandSchema.parse({ ...input, mutationId: crypto.randomUUID() });
      pending.current = { text, command };
      const result = await store.api().editorCommand(command);
      if (store.boundary.accepts(snapshot)) {
        pending.current = null; setStatus('Saved. Refreshing the workspace…');
        if (result.op === 'draft') { setImported(null); setEditing(false); setSelectedId(result.id); }
        setReload(value => value + 1);
      }
    } catch (failure) {
      if (store.boundary.accepts(snapshot)) setError(failure instanceof ApiClientError ? failure.message : 'Check the required fields, references and answer options.');
    } finally { if (store.boundary.accepts(snapshot)) setBusy(false); }
  }
  function submit(event: FormEvent<HTMLFormElement>, build: (form: FormData) => CommandInput) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    try { void run(build(form)); } catch { setError('Check the required fields and references.'); }
  }
  async function previewImport(file: File | undefined) {
    if (!file) return;
    if (file.size > 262144) { setError('Choose a draft JSON file smaller than 256 KB.'); return; }
    const snapshot = store.boundary.capture();
    try {
      const bytes = await file.arrayBuffer();
      const parsed = EditorialImportSchema.parse(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
      const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
      if (!store.boundary.accepts(snapshot)) return;
      setImported({ ...parsed, importReference: `local-json:${digest}:${file.name}`.slice(0,512) });
      setDraftCycle(parsed.cycleId); setSelectedId(undefined); setEditing(false); setError(''); setStatus('Import preview ready. Review the draft and sources before saving.');
      setState(value => value ? { ...value, selected: null } : null); setReload(value => value + 1);
    } catch { if (store.boundary.accepts(snapshot)) setError('This file is not a valid draft. Approval flags and existing content identities are not accepted.'); }
  }
  if (!state) return <><p role={error ? 'alert' : 'status'}>{error || 'Loading the publishing workspace…'}</p><button onClick={() => setReload(value => value + 1)}>Retry workspace</button></>;
  const selected = state.selected;
  const draft = imported ?? (editing ? selected?.draft : undefined);
  const questionOptions = draft?.question?.options ?? ['A', 'B', 'C', 'D'].map(id => ({ id, text: '' }));
  const current = selected && state.versions.find(version => version.id === selected.id);
  return <>
    {error && <p role="alert">{error}</p>}<p role="status">{status}</p>
    <details className="import-section"><summary>Import a structured draft</summary><p className="muted">Import a draft JSON file with its cycle, topic and source references. Preview it before saving; review and publication are separate steps.</p><label>Import draft JSON<input type="file" accept="application/json,.json" disabled={busy} onChange={event => { void previewImport(event.target.files?.[0]); event.target.value=''; }}/></label></details>
    <div className="editor-layout"><section className="version-list"><div className="section-heading"><h2>Versions</h2><button disabled={busy} onClick={() => { setImported(null); setSelectedId(undefined); setDraftCycle(''); setEditing(false); setState(null); setReload(value => value + 1); }}>New draft</button></div>
      {state.versions.length === 0 ? <p className="muted">No drafts yet. Add a source and exam topic below to begin.</p> : <ul>{state.versions.map(version => <li key={version.id}><button className={selectedId === version.id ? 'version selected' : 'version'} disabled={busy} onClick={() => { setImported(null); setState(null); setSelectedId(version.id); setEditing(false); setReload(value => value + 1); }}><strong>{version.title}</strong><small>v{version.versionNumber} · {version.kind} · {version.state}{version.reviewed ? ' · reviewed' : ''}</small></button></li>)}</ul>}
      <p className="muted">Showing up to 50 recent versions.</p>
      <button disabled={busy} onClick={() => setReload(value => value + 1)}>Refresh versions</button>
    </section><section className="editor-document">
      {selected && !editing ? <>
        <p className="eyebrow">Version {selected.versionNumber} · {current?.state ?? 'draft'}</p><h2>{selected.draft.title}</h2><p>{selected.draft.summary}</p><div className="plain-preview">{selected.draft.body}</div>
        {selected.draft.question && <section className="answer-preview"><h3>Answer review</h3><ol>{selected.draft.question.options.map(option => <li key={option.id}>{option.id}: {option.text}</li>)}</ol><p><strong>Correct answer:</strong> {selected.draft.question.correctOptionId}</p><p className="plain-preview">{selected.draft.question.explanation}</p></section>}
        <h3>Sources</h3><ul>{selected.draft.sourceIds.map(id => { const source = state.sources.find(source => source.id === id); return <li key={id}>{source ? <a className="text-link" href={source.url} target="_blank" rel="noopener noreferrer">{source.title} · {source.rights}</a> : `Source ${id}`}</li>; })}</ul>
        <button disabled={busy} onClick={() => { setDraftCycle(selected.draft.cycleId); setEditing(true); }}>Create a revised draft</button>
        {!selected.review ? <form className="form-stack review-form" onSubmit={event => submit(event, form => ({ op: 'review', versionId: selected.id, sourceVerified: form.has('sourceVerified'), rightsVerified: form.has('rightsVerified'), answerVerified: form.has('answerVerified'), explanationVerified: form.has('explanationVerified'), note: formValue(form, 'note') }))}>
          <h3>Editorial review</h3><p className="muted">Review seals this version. Further changes create a new version.</p>
          <label className="check"><input type="checkbox" name="sourceVerified" required/>Source and exam mapping checked</label><label className="check"><input type="checkbox" name="rightsVerified" required/>Source rights permit this use</label><label className="check"><input type="checkbox" name="answerVerified" required/>Answer or teaching claims checked</label><label className="check"><input type="checkbox" name="explanationVerified" required/>Explanation checked</label><Field label="Review note" name="note" max={4000}/><button className="button primary" disabled={busy}>Record review</button>
        </form> : <section className="review-form"><h3>Review recorded</h3><p className="plain-preview">{selected.review.note}</p></section>}
        <form className="form-stack" onSubmit={event => submit(event, form => {
          const action = formValue(form, 'action'); const base = { versionId: selected.id, note: formValue(form, 'note') };
          return action === 'correct' ? { op: 'correct', ...base, replacementVersionId: formValue(form, 'replacement') } : { op: action === 'withdraw' ? 'withdraw' : 'publish', ...base };
        })}><h3>Publication</h3><Field label="Action" name="action"><select name="action" required><option value="publish">Publish reviewed version</option><option value="correct">Replace this published version</option><option value="withdraw">Withdraw this published version</option></select></Field><label>Replacement version<select name="replacement"><option value="">Choose only when correcting</option>{state.versions.filter(version => version.contentId === selected.contentId && version.id !== selected.id && version.reviewed && version.state === 'draft').map(version => <option key={version.id} value={version.id}>v{version.versionNumber} · {version.title}</option>)}</select></label><Field label="Publication note" name="note" max={4000}/><button className="button primary" disabled={busy}>Confirm publication action</button></form>
        <h3>Publication history</h3>{selected.events.length ? <ul>{selected.events.map((event, index) => <li key={index}>{event.action} · {new Date(event.occurredAt).toLocaleString()}<p className="plain-preview">{event.note}</p></li>)}</ul> : <p className="muted">No publication events for this version.</p>}
      </> : <form className="form-stack" key={imported?.importReference ?? (draft ? selected?.id : 'new')} onSubmit={event => submit(event, form => {
        const kind = formValue(form, 'kind');
        return { op: 'draft', draft: DraftInputSchema.parse({ ...(editing && selected && !imported ? { contentId: selected.contentId } : {}), cycleId: formValue(form, 'cycleId'), topicId: formValue(form, 'topicId'), kind, title: formValue(form, 'title'), summary: formValue(form, 'summary'), body: formValue(form, 'body'), visibility: formValue(form, 'visibility'), sourceIds: form.getAll('sourceIds'), ...(kind === 'question' ? { question: { options: questionOptions.map(({ id }, index) => ({ id, text: formValue(form, `option${index}`) })).filter(option => option.text.trim()), correctOptionId: formValue(form, 'correct'), explanation: formValue(form, 'explanation') } } : {}), ...(draft?.importReference ? { importReference: draft.importReference } : {}) }) };
      })}>
        <h2>{imported ? 'Imported draft preview' : draft ? 'Revised draft' : 'New draft'}</h2><p className="muted">Saved drafts remain private until reviewed and published.</p>
        <Field label="Exam cycle" name="cycleId"><select name="cycleId" required value={draftCycle} onChange={event => setDraftCycle(event.target.value)}><option value="">Choose a cycle</option>{state.cycles.map(cycle => <option key={cycle.id} value={cycle.id}>{cycle.label}</option>)}</select></Field>
        <Field label="Topic" name="topicId"><select key={draftCycle} name="topicId" required defaultValue={draftCycle === draft?.cycleId ? draft.topicId : ''}><option value="">Choose a topic in the same cycle</option>{state.topics.filter(topic => topic.cycleId === draftCycle).map(topic => <option key={`${topic.cycleId}:${topic.id}`} value={topic.id}>{topic.title}</option>)}</select></Field>
        <Field label="Content type" name="kind"><select name="kind" defaultValue={draft?.kind ?? 'lesson'}>{['guide', 'lesson', 'question', 'current-affairs'].map(kind => <option key={kind}>{kind}</option>)}</select></Field><Field label="Title" name="title" value={draft?.title}/><Field label="Summary" name="summary" value={draft?.summary} max={1000}/><Field label="Teaching text or question" name="body"><textarea name="body" rows={10} required maxLength={100000} defaultValue={draft?.body}/></Field>
        <Field label="Availability" name="visibility"><select name="visibility" defaultValue={draft?.visibility ?? 'public'}><option value="public">Public catalogue</option><option value="prepare">Preparation library</option></select></Field>
        <fieldset><legend>Source references</legend>{state.sources.map(source => <label className="check" key={source.id}><input type="checkbox" name="sourceIds" value={source.id} defaultChecked={draft?.sourceIds.includes(source.id)}/>{source.title} · {source.rights}</label>)}</fieldset>
        <details open={draft?.kind === 'question'}><summary>Question answer and explanation</summary><p className="muted">Provide at least two options and the checked answer. Existing option identities are preserved.</p>{questionOptions.map((option, index) => <label key={option.id}>Option {option.id}<input name={`option${index}`} maxLength={4000} defaultValue={option.text}/></label>)}<Field label="Correct answer" name="correct"><select name="correct" defaultValue={draft?.question?.correctOptionId ?? questionOptions[0].id}>{questionOptions.map(option => <option key={option.id} value={option.id}>{option.id}</option>)}</select></Field><label>Answer explanation<textarea name="explanation" rows={5} maxLength={30000} defaultValue={draft?.question?.explanation}/></label></details>
        <button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save private draft'}</button>
      </form>}
    </section></div>
    <section className="metadata-section"><h2>Sources and exam structure</h2><p className="muted">Create references before authoring. Confirm exam rules against official sources. Topic prerequisites are fixed once content references the cycle.</p>
      <details><summary>Add a source reference</summary><form className="form-stack" onSubmit={event => submit(event, form => ({ op: 'source', source: { title: formValue(form, 'title'), publisher: formValue(form, 'publisher'), url: formValue(form, 'url'), checkedAt: new Date(formValue(form, 'checkedAt')).toISOString(), rights: formValue(form, 'rights') as 'unknown' | 'permitted' | 'restricted', reviewNote: formValue(form, 'reviewNote') } }))}><Field label="Source title" name="title" max={300}/><Field label="Publisher" name="publisher"/><Field label="Source URL" name="url"><input name="url" type="url" required maxLength={2048} placeholder="https://"/></Field><Field label="Date checked" name="checkedAt"><input name="checkedAt" type="date" required/></Field><Field label="Usage rights" name="rights"><select name="rights"><option value="unknown">Unknown</option><option value="permitted">Permitted</option><option value="restricted">Restricted</option></select></Field><label>Rights review note<textarea name="reviewNote" maxLength={4000}/></label><button disabled={busy}>Save source reference</button></form></details>
      <details><summary>Add an exam cycle</summary><form className="form-stack" onSubmit={event => submit(event, form => ({ op: 'cycle', cycle: { id: formValue(form, 'id'), examId: formValue(form, 'examId') as 'clat-ug' | 'blet-patna-llb' | 'cuet-pg-llb', label: formValue(form, 'label'), sourceId: formValue(form, 'sourceId'), sourceVerified: true } }))}><Field label="Cycle identifier" name="id" max={128}/><Field label="Cycle label" name="label"/><Field label="Exam route" name="examId"><select name="examId"><option value="clat-ug">CLAT UG</option><option value="blet-patna-llb">BLET · Patna</option><option value="cuet-pg-llb">CUET-PG LLB</option></select></Field><Field label="Official source" name="sourceId"><select name="sourceId" required><option value="">Choose a permitted, reviewed source</option>{state.sources.filter(source => source.rights === 'permitted' && source.reviewNote.trim()).map(source => <option value={source.id} key={source.id}>{source.title}</option>)}</select></Field><label className="check"><input type="checkbox" required/>I checked this cycle against its official source</label><button disabled={busy}>Save exam cycle</button></form></details>
      <details><summary>Add a topic</summary><form className="form-stack" onSubmit={event => submit(event, form => ({ op: 'topic', topic: { id: formValue(form, 'id'), cycleId: formValue(form, 'cycleId'), title: formValue(form, 'title'), prerequisiteIds: form.getAll('prerequisiteIds').map(String) } }))}><Field label="Topic identifier" name="id" max={128}/><Field label="Topic title" name="title"/><Field label="Topic cycle" name="cycleId"><select name="cycleId" required value={topicCycle} onChange={event => setTopicCycle(event.target.value)}><option value="">Choose cycle</option>{state.cycles.map(cycle => <option key={cycle.id} value={cycle.id}>{cycle.label}</option>)}</select></Field><fieldset key={topicCycle}><legend>Prerequisites in the same cycle</legend>{state.topics.filter(topic => topic.cycleId === topicCycle).map(topic => <label className="check" key={`${topic.cycleId}:${topic.id}`}><input type="checkbox" name="prerequisiteIds" value={topic.id}/>{topic.title}</label>)}</fieldset><button disabled={busy}>Save topic</button></form></details>
    </section>
  </>;
}
export function EditorPage() {
  const { status, actor, session } = useAccount();
  if (status === 'loading' || status === 'checking') return <p role="status">Checking publishing access…</p>;
  if (!actor) return <><h1>{session ? 'Publishing access unavailable' : 'Sign in to publish'}</h1><p>The publishing workspace requires a verified owner account.</p><Link className="text-link" to="/account">Open your account →</Link></>;
  if (actor.role !== 'publisher') return <><h1>Owner access required</h1><p>Your account can prepare for exams. Publishing is available to the owner.</p><Link className="text-link" to="/">Return to your study path →</Link></>;
  return <><p className="eyebrow">Owner workspace</p><h1>Content publishing</h1><p className="intro">Draft, check and publish versioned learning material.</p><PublishingDesk key={actor.userId}/></>;
}
