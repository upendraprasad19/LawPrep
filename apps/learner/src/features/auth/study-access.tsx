import { useEffect, useState } from 'react';
import type { AccessSnapshot } from '@lawprep/contracts';
import { useAccount } from './context';

const formatDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export function StudyAccess() {
  const { store } = useAccount();
  const [result, setResult] = useState<AccessSnapshot | 'unavailable' | null>(null);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const session = store.boundary.capture();
    store.api().access(controller.signal).then(access => {
      if (!controller.signal.aborted && store.boundary.accepts(session)) setResult(access);
    }).catch(() => {
      if (!controller.signal.aborted && store.boundary.accepts(session)) setResult('unavailable');
    });
    return () => controller.abort();
  }, [store, refresh]);

  return <section className="account-section">
    <h2>Study access</h2>
    {result === null ? <p role="status">Checking your study access…</p>
      : result === 'unavailable' ? <p role="alert">Your study access could not be checked.</p>
        : <>
          {result.cycles.length === 0 ? <p>Explore access. You have no active Prepare plan.</p>
            : <ul>{result.cycles.map(cycle => <li key={cycle.cycleId}>
              <strong>{cycle.label}</strong>
              <p>Prepare until {formatDate.format(new Date(cycle.prepareUntil))}</p>
              {cycle.aiUntil && <p>AI Guide plan until {formatDate.format(new Date(cycle.aiUntil))}</p>}
            </li>)}</ul>}
          <p className="muted">Checked {formatDate.format(new Date(result.checkedAt))}</p>
        </>}
    <button type="button" onClick={() => { setResult(null); setRefresh(value => value + 1); }}>Check study access</button>
  </section>;
}
