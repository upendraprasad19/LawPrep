import { useEffect,useId,useState,type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ImportKindSchema,ImportQuerySchema,type ImportQuery,type ImportLibrary } from '@lawprep/contracts';
import { useAccount } from '../auth/context';

function ImportDesk() {
  const {store}=useAccount();
  const kindId=useId(),batchId=useId();
  const [query,setQuery]=useState<ImportQuery>({q:'',offset:0,limit:20});
  const [search,setSearch]=useState(''); const [retry,setRetry]=useState(0);
  const [result,setResult]=useState<{key:string;data:ImportLibrary|null;error:string}|null>(null);
  const key=JSON.stringify(query);
  useEffect(()=>{
    const controller=new AbortController(),snapshot=store.boundary.capture();
    store.api().imports(query,controller.signal).then(data=>{
      if(!controller.signal.aborted && store.boundary.accepts(snapshot)) setResult({key,data,error:''});
    }).catch(()=>{
      if(!controller.signal.aborted && store.boundary.accepts(snapshot)) setResult({key,data:null,error:'The imported library could not be loaded. Please retry.'});
    });
    return ()=>controller.abort();
  },[store,query,key,retry]);
  const current=result?.key===key?result:null;
  const data=current?.data;
  function filter(next:Partial<ImportQuery>) {setQuery(previous=>ImportQuerySchema.parse({...previous,batch:data?.batch?.sourceHash??previous.batch,offset:0,ordinal:undefined,...next}));}
  function submitSearch(event:FormEvent) {event.preventDefault();filter({q:search});}
  return <>
    <p className="eyebrow">Owner workspace · Private intake</p><h1>Imported library</h1>
    <p className="intro">The original collection, kept intact for review. Imported records are private and have not been published.</p>
    <Link className="text-link" to="/editor">Open content publishing →</Link>
    {!current?<p role="status">Loading imported records…</p>:current.error?<><p role="alert">{current.error}</p><button onClick={()=>setRetry(value=>value+1)}>Retry imports</button></>:null}
    {data && <>
      {!data.batch?<p>No complete import has been loaded yet.</p>:<>
        <section className="intake-overview" aria-label="Import status">
          <p><strong>{data.batch.recordCount.toLocaleString('en')} records</strong> · {data.batch.counts.question.toLocaleString('en')} questions · {data.batch.counts.lesson} lessons · {data.batch.counts.curriculum} curriculum entries · {data.batch.counts.deck} decks</p>
          <p>{data.batch.missingExplanations} questions need an explanation. <strong>Rights unknown</strong>. Legacy exam labels need mapping; the BLET entrance syllabus remains unverified.</p>
          {data.batch.errors.length>0 && <details><summary>Extraction notes ({data.batch.errors.length})</summary><ul>{data.batch.errors.map((note,index)=><li key={index}>{note}</li>)}</ul></details>}
          <details><summary>Source provenance</summary><p>{data.batch.sourcePath}</p><p className="hash-text">Original source SHA256: {data.batch.sourceHash}</p><p className="hash-text">Extracted file SHA256: {data.batch.fileHash}</p></details>
        </section>
        <div className="intake-filters">
          {data.batches.length>1 && <div className="field"><label htmlFor={batchId}>Import batch</label><select id={batchId} value={data.batch.sourceHash} onChange={event=>filter({batch:event.target.value})}>{data.batches.map(batch=><option key={batch.sourceHash} value={batch.sourceHash}>{batch.sourcePath} · {batch.sourceHash.slice(0,12)}</option>)}</select></div>}
          <div className="field"><label htmlFor={kindId}>Content type</label><select id={kindId} value={query.kind??''} onChange={event=>filter({kind:event.target.value?ImportKindSchema.parse(event.target.value):undefined})}><option value="">All types</option>{['question','lesson','curriculum','deck','blueprint'].map(kind=><option key={kind} value={kind}>{kind}</option>)}</select></div>
          <form onSubmit={submitSearch}><label>Search imported titles<input type="search" value={search} maxLength={100} onChange={event=>setSearch(event.target.value)}/></label><button type="submit">Search</button></form>
        </div>
        <p role="status">{data.total===0?'No matching records.':`Showing ${data.offset+1}–${Math.min(data.offset+data.limit,data.total)} of ${data.total} matching records.`}</p>
        <div className="intake-layout">
          <section aria-label="Imported records"><ul className="intake-records">{data.records.map(row=><li key={row.ordinal}><button onClick={()=>setQuery(previous=>({...previous,batch:data.batch!.sourceHash,ordinal:row.ordinal}))} aria-pressed={data.selected?.ordinal===row.ordinal}>{row.title}</button><p className="muted">{row.kind} · {row.exam} · {row.originalId??`${row.sourceKey}[${row.sourceIndex}]`}</p>{row.issues.length>0 && <p className="muted">Needs attention: {row.issues.join(', ')}</p>}</li>)}</ul>
            <div className="actions"><button disabled={query.offset===0} onClick={()=>setQuery(previous=>({...previous,batch:data.batch!.sourceHash,offset:Math.max(0,previous.offset-previous.limit),ordinal:undefined}))}>Previous page</button><button disabled={data.offset+data.limit>=data.total} onClick={()=>setQuery(previous=>({...previous,batch:data.batch!.sourceHash,offset:previous.offset+previous.limit,ordinal:undefined}))}>Next page</button></div>
          </section>
          <section className="intake-inspector" aria-label="Original record">{data.selected?<>
            <h2>Original record</h2><p>{data.selected.record.kind} · Draft · Not reviewed</p>
            <p className="hash-text">Record SHA256: {data.selected.recordHash}</p>
            {data.selected.record.issues.length>0 && <ul>{data.selected.record.issues.map((issue,index)=><li key={index}>{issue}</li>)}</ul>}
            <h3>Original payload</h3><p className="muted">Original markup and legacy verification flags are displayed as source data. They do not establish approval.</p><pre>{JSON.stringify(data.selected.record.payload,null,2)}</pre>
          </>:<p className="muted">Choose a record to inspect its original text, answers and known issues. Publication requires completed sources, mapping and editorial checks.</p>}</section>
        </div>
      </>}
    </>}
  </>;
}
export function ImportPage() {
  const {actor,status,session}=useAccount();
  if(status==='loading'||status==='checking') return <p role="status">Checking import access…</p>;
  if(!actor) return <><h1>{session?'Import access unavailable':'Sign in to review imports'}</h1><p>The imported collection is private to the owner.</p><Link to="/account" className="text-link">Open your account →</Link></>;
  if(actor.role!=='publisher') return <><h1>Owner access required</h1><p>The imported collection is available to the owner for review.</p></>;
  return <ImportDesk key={actor.userId}/>;
}
