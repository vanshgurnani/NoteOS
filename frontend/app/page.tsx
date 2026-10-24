import Link from 'next/link';

const features = [
  { icon: '✳', title: 'A home for every thought', text: 'Keep notes, plans, ideas, and everyday fragments in one calm, searchable space.' },
  { icon: '⌘', title: 'Your knowledge, connected', text: 'Bring related pages together and find the context you need without digging.' },
  { icon: '↗', title: 'A little help from AI', text: 'Use your workspace with AI tools and connected workflows when you need an extra hand.' },
];

function MotionArtwork() {
  return (
    <div className="noteos-motion-stage" aria-label="Abstract animated NOTE OS workspace illustration">
      <svg className="noteos-motion-art" viewBox="0 0 620 490" fill="none" aria-hidden="true">
        <g className="noteos-motion-ring" stroke="#171717" strokeWidth="1">
          <ellipse cx="310" cy="245" rx="275" ry="100" strokeOpacity=".10" />
          <ellipse cx="310" cy="245" rx="225" ry="160" strokeOpacity=".09" />
          <ellipse cx="310" cy="245" rx="155" ry="220" strokeOpacity=".08" />
          <circle cx="310" cy="245" r="205" strokeOpacity=".06" strokeDasharray="2 8" />
          <circle cx="585" cy="245" r="4" fill="#171717" stroke="none" />
        </g>
        <g className="noteos-motion-ring reverse" stroke="#171717" strokeWidth="1">
          <ellipse cx="310" cy="245" rx="255" ry="135" strokeOpacity=".07" strokeDasharray="4 9" />
          <circle cx="85" cy="245" r="5" fill="#171717" fillOpacity=".4" stroke="none" />
          <circle cx="310" cy="25" r="3" fill="#171717" fillOpacity=".3" stroke="none" />
        </g>
        <circle className="noteos-motion-pulse" cx="310" cy="245" r="170" fill="#171717" fillOpacity=".025" />
        <circle className="noteos-motion-dot" cx="125" cy="115" r="5" fill="#171717" fillOpacity=".5" />
        <circle className="noteos-motion-dot delay" cx="500" cy="370" r="7" fill="#171717" fillOpacity=".22" />
        <circle cx="492" cy="116" r="2" fill="#171717" fillOpacity=".35" />
      </svg>
      <div className="noteos-demo-window">
        <div className="noteos-demo-topbar"><i /><i /><i /><span>MY WORKSPACE</span></div>
        <div className="noteos-demo-content">
          <aside className="noteos-demo-sidebar">
            <div className="noteos-demo-side-line active" /><div className="noteos-demo-side-line" />
            <div className="noteos-demo-side-line" /><div className="noteos-demo-side-line" />
            <div className="noteos-demo-side-line" />
          </aside>
          <div className="noteos-demo-paper">
            <div className="noteos-demo-kicker">MONDAY · PERSONAL</div>
            <div className="noteos-demo-heading">A place to<br />think clearly.</div>
            <div className="noteos-demo-rule" /><div className="noteos-demo-rule short" />
            <div className="noteos-demo-note"><span className="noteos-demo-check" /> Capture the thought. Come back to it later.</div>
          </div>
        </div>
      </div>
      <div className="noteos-demo-chip one"><span className="noteos-demo-chip-icon">✳</span><span><strong>Thought, saved.</strong>Nothing gets lost.</span></div>
      <div className="noteos-demo-chip two"><span className="noteos-demo-chip-icon">⌘</span><span><strong>Everything connected</strong>Your ideas, in context.</span></div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="noteos-landing">
      <nav className="noteos-landing-nav" aria-label="Main navigation">
        <Link className="noteos-landing-brand" href="/"><img src="/images/noteos-mark.svg" alt="" /><span>NOTE OS</span></Link>
        <div className="noteos-landing-navlinks"><a href="#features">Features</a><a href="#about">A calmer workspace</a></div>
        <div className="noteos-landing-actions"><Link className="noteos-landing-login" href="/login">Log in</Link><Link className="noteos-landing-cta" href="/register">Get started <span aria-hidden="true">↗</span></Link></div>
      </nav>
      <section className="noteos-landing-hero" id="about">
        <div className="noteos-landing-copy">
          <div className="noteos-eyebrow">Your personal thinking space</div>
          <h1 className="noteos-landing-title">Make room<br />for <span>thought.</span></h1>
          <p className="noteos-landing-description">Notes, ideas, plans, and the little things worth remembering. One quiet space to collect it all and make sense of it.</p>
          <div className="noteos-landing-hero-actions"><Link className="noteos-landing-cta" href="/register">Create your workspace <span aria-hidden="true">→</span></Link><Link className="noteos-landing-secondary" href="/login">I already have an account <span aria-hidden="true">↗</span></Link></div>
          <div className="noteos-landing-footnote">Simple by design. Yours to organise.</div>
        </div>
        <MotionArtwork />
      </section>
      <div className="noteos-landing-proof"><div className="noteos-landing-proof-inner"><span className="noteos-proof-item"><b>01</b> Capture freely</span><span className="noteos-proof-item"><b>02</b> Find your flow</span><span className="noteos-proof-item"><b>03</b> Connect the dots</span><span className="noteos-proof-item">A little less noise. A little more clarity.</span></div></div>
      <section className="noteos-landing-features" id="features">
        <div className="noteos-section-eyebrow">A workspace that gets out of the way</div>
        <h2 className="noteos-section-title">Everything you need.<br />Nothing shouting for attention.</h2>
        <div className="noteos-feature-grid">{features.map(feature => <article className="noteos-feature-card" key={feature.title}><div className="noteos-feature-symbol" aria-hidden="true">{feature.icon}</div><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div>
      </section>
      <footer className="noteos-landing-footer"><span>© {new Date().getFullYear()} NOTE OS</span><Link href="/login">Open your workspace ↗</Link></footer>
    </main>
  );
}
