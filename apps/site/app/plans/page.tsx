import Link from 'next/link';

export default function PlansPage() {
  return <>
    <header className="site-header"><Link className="brand" href="/">Law<span>Prep</span><small>A clear path forward</small></Link></header>
    <main id="main" className="journey">
      <div>
        <p className="eyebrow">Plan preview</p>
        <h1>Study plans</h1>
        <p>See what each plan is designed to include. The preparation courses are in development.</p>
        <a className="button primary" href="/study/#/routes">Explore exam routes</a>
      </div>
      <ol>
        <li><span>01</span><div><h2>Explore</h2><p>Free career and exam guidance, with a sample learning unit and practice test planned.</p></div></li>
        <li><span>02</span><div><h2>Prepare</h2><p>Lessons, practice, revision and mocks for your chosen exam cycle, with standard explanations and progress tracking.</p></div></li>
        <li><span>03</span><div><h2>AI Guide</h2><p>An optional Prepare upgrade for personalised hints, study plan suggestions and help reviewing completed mocks.</p></div></li>
      </ol>
    </main>
  </>;
}
