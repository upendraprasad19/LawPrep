import Link from 'next/link';
export default function Home() {
  return <>
    <header className="site-header"><Link className="brand" href="/">Law<span>Prep</span><small>A clear path forward</small></Link><nav aria-label="Main navigation"><a href="#journey">The journey</a><a href="/study/#/">Open study app <span aria-hidden="true">↗</span></a></nav></header>
    <main id="main">
      <section className="hero"><div className="hero-inner"><p className="eyebrow">Law entrance preparation · English</p><h1>Find your way<br/>into <em>law.</em></h1><p className="lead">Start with the possibilities. Find your exam route. Build your preparation, one clear step at a time.</p><a className="button primary" href="/study/#/">Explore your study path <span aria-hidden="true">→</span></a><p className="subtle">CLAT UG · BLET, Patna · CUET-PG LLB</p></div><div className="hero-mark" aria-hidden="true"><span>01</span><div className="rule"/><p>Know your path.<br/>Make your start.</p></div></section>
      <section className="journey" id="journey"><div><p className="eyebrow">From the first question</p><h2>A journey with<br/>a next step.</h2><p>New to law entrance exams? Begin by understanding your options.</p></div><ol><li><span>01</span><div><h3>Discover law</h3><p>Explore the career and the routes into a law degree.</p></div></li><li><span>02</span><div><h3>Choose your route</h3><p>Find the entrance pathway you want to prepare for.</p></div></li><li><span>03</span><div><h3>Build your preparation</h3><p>Lessons, practice, revision and mocks form the learning journey.</p></div></li></ol></section>
    </main><footer><span className="brand small">Law<span>Prep</span></span><p>Preparation preview · Learning content is being developed.</p><Link href="/plans">Study plans</Link><a href="/study/#/">Start exploring <span aria-hidden="true">→</span></a></footer>
  </>;
}
