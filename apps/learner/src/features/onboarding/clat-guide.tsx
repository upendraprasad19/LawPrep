import { Link } from 'react-router-dom';

export function ClatGuide() {
  return <article className="route-detail">
    <p className="eyebrow">Beginner exam guide</p>
    <h1>Start with CLAT UG</h1>
    <p className="intro">Explore the entrance route for integrated undergraduate law programmes at participating National Law Universities.</p>
    <section className="account-section">
      <h2>Check your route and eligibility</h2>
      <p>If you are planning to study law after school, start with the undergraduate route. If you already have a degree and want a three-year LLB, check the entrance requirements for the universities you are considering.</p>
      <p>Check the Consortium’s eligibility page for your cycle before applying. It explains qualifying exams, marks and eligibility for students awaiting results.</p>
      <p><a className="text-link" href="https://consortiumofnlus.ac.in/clat-2027/ug-eligibility.html">Official CLAT 2027 eligibility</a></p>
    </section>
    <section className="account-section">
      <h2>What the 2027 syllabus covers</h2>
      <p>The Consortium lists 120 multiple-choice questions in two hours. Each correct answer earns one mark and each incorrect answer deducts a quarter mark.</p>
      <ul>
        <li>English Language</li><li>Current Affairs and General Knowledge</li><li>Legal Reasoning</li>
        <li>Logical Reasoning</li><li>Quantitative Techniques</li>
      </ul>
      <p><a className="text-link" href="https://consortiumofnlus.ac.in/clat-2027/ug-syllabus.html">Official CLAT 2027 syllabus</a></p>
    </section>
    <section className="account-section">
      <h2>Choose a manageable start</h2>
      <p>Start with a short reading passage. Summarise its main point in one sentence, then check which lines support your summary. Use your available time to decide how much to do in one sitting.</p>
      <Link className="button primary" to="/setup/clat">Set up CLAT study</Link>
      <p><Link className="text-link" to="/learn/clat-sample">Try the free sample lesson</Link></p>
    </section>
  </article>;
}
