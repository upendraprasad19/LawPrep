import { NavLink, Route, Routes, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Catalog, ExamId } from '@lawprep/contracts';
import { createApiClient } from '@lawprep/api-client';
import { browserPlatform } from './platform';
import { AccountPage } from './features/auth/account';
import { ClatGuide } from './features/onboarding/clat-guide';
import { ClatSetup } from './features/onboarding/setup';
import { ClatDiagnostic } from './features/onboarding/diagnostic';
import { ClatSample } from './features/learning/clat-sample';
import { EditorPage } from './features/editor/editor';
import { ImportPage } from './features/editor/imports';
import { useAccount } from './features/auth/context';

const routes: { id: ExamId; title: string; description: string }[] = [
  { id: 'clat-ug', title: 'CLAT UG', description: 'Explore the integrated undergraduate law route.' },
  { id: 'blet-patna-llb', title: 'BLET · Patna', description: 'Explore the three-year LLB route at Patna Law College.' },
  { id: 'cuet-pg-llb', title: 'CUET-PG LLB', description: 'Explore participating universities and their LLB admission routes.' }
];
function Discover() {
  return <>
    <div className="welcome"><div><p className="eyebrow">Begin with the possibilities</p><h1>Your preparation<br/>starts here</h1><p className="intro">You don’t need to have it all figured out. Understand the routes into law, then choose where to begin.</p><Link className="button primary" to="/routes">Explore exam routes <span aria-hidden="true">→</span></Link></div><ol className="journey-map"><li className="current"><strong>Discover law</strong><small>Understand the possibilities</small></li><li><strong>Choose your path</strong><small>Find the entrance route for you</small></li><li><strong>Learn, practise, reflect</strong><small>Build knowledge and test understanding</small></li></ol></div>
    <section className="careers"><p className="eyebrow">More than one destination</p><h2>Where could law take you?</h2><div className="career-row"><h3>Work with people.<br/>Work with ideas.</h3><div><p>A legal education can lead towards court practice, work with businesses, public service, research or policy. Each route has its own further requirements.</p><p>You can explore the possibilities before deciding which entrance exam to prepare for.</p><Link className="text-link" to="/routes">Find your starting point <span aria-hidden="true">→</span></Link></div></div></section>
  </>;
}
function ExamRoutes() {
  const [selected, setSelected] = useState<ExamId>('clat-ug');
  const [catalogue, setCatalogue] = useState<{ loading: boolean; data: Catalog | null; error: boolean }>({ loading: true, data: null, error: false });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const api = createApiClient({ baseUrl: browserPlatform().apiBaseUrl, getAccessToken: async () => null });
    api.catalog(selected, controller.signal).then(data => { if (!controller.signal.aborted) setCatalogue({ loading: false, data, error: false }); }).catch(() => { if (!controller.signal.aborted) setCatalogue({ loading: false, data: null, error: true }); });
    return () => controller.abort();
  }, [selected, retry]);
  const route = routes.find(route => route.id === selected)!;
  return <><p className="eyebrow">Choose your path</p><h1>Explore exam routes</h1><p className="intro">Start with the route that interests you. Eligibility and admission requirements need to be checked for your chosen exam cycle.</p><fieldset className="route-list"><legend>Which route would you like to explore?</legend>{routes.map(item => <label key={item.id} className={selected === item.id ? 'selected route-choice' : 'route-choice'}><input type="radio" name="exam" value={item.id} checked={selected === item.id} onChange={() => { setSelected(item.id); setCatalogue({ loading: true, data: null, error: false }); }}/><span><strong>{item.title}</strong><small>{item.description}</small></span></label>)}</fieldset><section className="route-detail" aria-live="polite"><h2>{route.title}</h2><p>{route.description}</p>{selected === 'clat-ug' ? <p><Link className="text-link" to="/guides/clat">Read the CLAT guide</Link></p> : <p className="muted">The detailed exam guide and preparation path are being developed.</p>}<h3>Published material</h3>{catalogue.loading ? <p role="status">Loading the catalogue…</p> : catalogue.error ? <><p role="alert">The catalogue could not be loaded. Please try again.</p><button onClick={() => { setCatalogue({ loading: true, data: null, error: false }); setRetry(value => value + 1); }}>Retry catalogue</button></> : catalogue.data?.items.length ? <ul>{catalogue.data.items.map(item => <li key={item.versionId}><strong>{item.title}</strong><p>{item.summary}</p></li>)}</ul> : <p>No reviewed material has been published for this route yet.</p>}</section></>;
}
export function StudyApp() {
  const { actor } = useAccount();
  return <>
    <a className="skip-link" href="#main" onClick={event => {
      event.preventDefault();
      const content = document.getElementById('main');
      content?.focus(); content?.scrollIntoView();
    }}>Skip to content</a>
    <div className="shell">
      <aside>
        <Link className="brand" to="/">Law<span>Prep</span><small>Your learning journey</small></Link>
        <nav aria-label="Study navigation">
          <NavLink to="/" end><span aria-hidden="true">01</span>Discover law</NavLink>
          <NavLink to="/routes"><span aria-hidden="true">02</span>Choose your path</NavLink>
          <NavLink to="/account"><span aria-hidden="true">03</span>Your account</NavLink>
          {actor?.role === 'publisher' && <NavLink to="/editor"><span aria-hidden="true">04</span>Publishing</NavLink>}
          {actor?.role === 'publisher' && <NavLink to="/imports"><span aria-hidden="true">05</span>Imported library</NavLink>}
        </nav>
        <p className="side-note">A clear next step.<br/>At your own pace.</p>
      </aside>
      <div className="workspace">
        <header className="topbar"><span>Law entrance preparation</span><span>Explore · English</span></header>
        <main id="main" className="content" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Discover/>}/>
            <Route path="/routes" element={<ExamRoutes/>}/>
            <Route path="/guides/clat" element={<ClatGuide/>}/>
            <Route path="/setup/clat" element={<ClatSetup/>}/>
            <Route path="/diagnostic/clat" element={<ClatDiagnostic/>}/>
            <Route path="/learn/clat-sample" element={<ClatSample/>}/>
            <Route path="/account" element={<AccountPage/>}/>
            <Route path="/editor" element={<EditorPage/>}/>
            <Route path="/imports" element={<ImportPage/>}/>
            <Route path="*" element={<><h1>Page not found</h1><Link className="text-link" to="/">Return to Discover law</Link></>}/>
          </Routes>
        </main>
      </div>
    </div>
  </>;
}
