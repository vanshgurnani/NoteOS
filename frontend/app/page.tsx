'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem('noteos_token') || localStorage.getItem('noteform_token');
    if (token) { router.replace('/workspace'); return; }
    setReady(true);
  }, [router]);

  return (
    <main className="public-home">
      <header className="public-nav">
        <Link className="public-brand" href="/" aria-label="NOTE OS home"><span className="public-brand-mark">n</span><span>NOTE OS</span></Link>
        <nav className="public-nav-links" aria-label="Main navigation"><a href="#features">Features</a><a href="#philosophy">Why NOTE OS</a></nav>
        <div className="public-nav-actions"><Link className="public-login-link" href="/login">Log in</Link><Link className="public-nav-cta" href="/register">Get started <span>↗</span></Link></div>
      </header>

      <section className="public-hero">
        <div className="public-hero-copy">
          <div className="public-overline"><span /> YOUR PERSONAL KNOWLEDGE SPACE</div>
          <h1>Make room for<br /><em>your thoughts.</em></h1>
          <p className="public-hero-description">A calmer place for notes, ideas, plans, and everything you want to remember. Bring your thinking together and find it when you need it.</p>
          <div className="public-hero-actions"><Link className="public-primary-cta" href="/register">Create your workspace <span>→</span></Link><Link className="public-secondary-cta" href="/login">I already have an account</Link></div>
          <div className="public-hero-footnote"><span className="public-check">✓</span> Your space. Your notes. Your way.</div>
        </div>

        <div className="public-hero-art" aria-label="Animated illustration of notes and ideas coming together">
          <div className="public-art-glow" />
          <svg className="public-orbit public-orbit-one" viewBox="0 0 600 520" fill="none" aria-hidden="true">
            <ellipse cx="300" cy="260" rx="246" ry="166" stroke="currentColor" strokeOpacity=".13" strokeDasharray="4 9" />
            <ellipse cx="300" cy="260" rx="190" ry="226" transform="rotate(42 300 260)" stroke="currentColor" strokeOpacity=".1" />
            <path d="M92 130c74-78 201-108 302-65" stroke="#9DAE9D" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="92" cy="130" r="5" fill="#A5B9A5" /><circle cx="394" cy="65" r="4" fill="#D9A98D" />
          </svg>
          <div className="public-note-card public-note-main">
            <div className="public-note-top"><span className="public-note-dot" /><span>MY SPACE</span><span className="public-note-menu">···</span></div>
            <div className="public-note-symbol">✳</div><div className="public-note-title">A place to think</div>
            <div className="public-note-line line-long" /><div className="public-note-line line-mid" />
            <div className="public-note-tags"><span>Ideas</span><span>Personal</span></div>
            <div className="public-note-footer"><span>Updated just now</span><span>↗</span></div>
          </div>
          <div className="public-note-card public-note-small public-note-left"><div className="public-mini-icon">✎</div><strong>Little ideas</strong><span>Save what matters</span></div>
          <div className="public-note-card public-note-small public-note-right"><div className="public-mini-icon mini-sage">⌘</div><strong>Everything connects</strong><span>Find your flow</span></div>
          <div className="public-floating-star star-a">✳</div><div className="public-floating-star star-b">✦</div>
          <div className="public-floating-pill"><span /> Thoughtfully simple</div>
        </div>
      </section>

      <section className="public-feature-strip" id="features">
        <div><span className="public-feature-icon">✎</span><strong>Write freely</strong><p>Capture ideas in a clean, focused editor.</p></div>
        <div><span className="public-feature-icon">⌕</span><strong>Find anything</strong><p>Search across notes and your workspace.</p></div>
        <div><span className="public-feature-icon">✧</span><strong>Think with AI</strong><p>Use your notes as context for deeper thinking.</p></div>
      </section>
      <section className="public-philosophy" id="philosophy">
        <span className="public-overline">A LITTLE LESS NOISE</span><h2>Your mind is for ideas.<br /><em>Let NOTE OS hold the rest.</em></h2>
        <p>One thoughtful workspace for the things you are learning, making, and figuring out.</p><Link href="/register">Start with a blank page <span>→</span></Link>
      </section>
      <footer className="public-footer"><Link className="public-brand" href="/"><span className="public-brand-mark">n</span><span>NOTE OS</span></Link><span>Made for the way you think.</span><Link href="/login">Log in</Link></footer>
      {!ready && <span className="public-route-check" aria-hidden="true" />}
    </main>
  );
}
