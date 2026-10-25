'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSessionToken } from '../../lib/api';

type MotionScene = 'rag-flow' | 'recipe-draft' | 'database-morph';

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeScene, setActiveScene] = useState<MotionScene>('rag-flow');
  const [isPlaying, setIsPlaying] = useState(true);
  const [sandboxPrompt, setSandboxPrompt] = useState('pizza');
  const [typedContent, setTypedContent] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const token = getSessionToken();
    if (token) setIsLoggedIn(true);
  }, []);

  // Simulated live typing stream for the SVG video mockup
  useEffect(() => {
    let text = '';
    if (activeScene === 'rag-flow') {
      text = 'Hybrid RAG query: "Find study schedule and active milestones"\n➜ Dense search (sentence-transformers): 4 chunks (0.91 score)\n➜ Sparse BM25 keyword matching: 2 chunks (score: 1.4)\n➜ Reciprocal Rank Fusion: 6 notes merged in 118ms\n✓ Citations generated with [Note Title] attribution.';
    } else if (activeScene === 'recipe-draft') {
      text = '# 🍕 Domino\'s Cheese Burst Pizza\n\n### Secret Molten Center:\n- Processed liquid cheese spread: ½ cup\n- Heavy cream: 2 tbsp (for infinite melt)\n\n### Assembly:\n1. Roll thin 7" inner disc, par-cook 45s\n2. Fill liquid cheese on 10" base crust\n3. Seal borders & bake at 240°C for 14 mins!';
    } else {
      text = 'TABLE: "Project Launch 2026"\n[View Mode: Kanban Board]\n├── 📋 Backlog: 4 tasks (P1, P2)\n├── ⏳ In Progress: "Hybrid RAG Engine" (Assigned: You)\n└── ✅ Completed: "SVG Vector Animation Visualizer"';
    }

    if (!isPlaying) {
      setTypedContent(text);
      return;
    }

    setTypedContent('');
    let idx = 0;
    const interval = setInterval(() => {
      idx += 2;
      setTypedContent(text.slice(0, idx));
      if (idx >= text.length) clearInterval(interval);
    }, 28);

    return () => clearInterval(interval);
  }, [activeScene, isPlaying]);

  return (
    <div className={`home-page-container ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      {/* Background Animated Gradient Mesh & Floating Stars */}
      <div className="home-ambient-glow" />
      <div className="home-ambient-glow-secondary" />

      {/* Top Navigation */}
      <header className="home-header">
        <div className="home-header-inner">
          <Link href="/" className="home-brand">
            <span className="home-logo-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="url(#logo-grad)" />
                <path d="M7 17V7L17 17V7" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="logo-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366f1" />
                    <stop stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <span className="home-brand-text">NoteOS</span>
            <span className="home-version-chip">v2.0</span>
          </Link>

          <nav className="home-nav-links">
            <a href="#features" className="home-nav-link">Features</a>
            <a href="#svg-motion" className="home-nav-link">Live SVG Motion</a>
            <a href="#hybrid-rag" className="home-nav-link">Hybrid RAG</a>
            <a href="#sandbox" className="home-nav-link">Live Sandbox</a>
            <Link href="/dashboard" className="home-nav-link highlight">Dashboard</Link>
          </nav>

          <div className="home-header-actions">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="home-theme-toggle-btn"
              title="Toggle Dark / Light Theme"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            {isLoggedIn ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link href="/dashboard" className="home-btn-primary">
                  <span>Open Dashboard</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link href="/" className="home-btn-ghost">
                  Workspace
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link href="/login" className="home-btn-ghost">
                  Sign In
                </Link>
                <Link href="/register" className="home-btn-primary">
                  <span>Get Started Free</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="home-hero-section">
        <div className="home-hero-badge">
          <span className="home-pulse-indicator" />
          <span>Next-Gen Hybrid RAG • Notion Block Canvas • Custom AI Engines</span>
        </div>

        <h1 className="home-hero-title">
          Your Thinking, Accelerated by <br />
          <span className="home-title-gradient">Living Vector Intelligence</span>
        </h1>

        <p className="home-hero-desc">
          NoteOS is the all-in-one knowledge operating system combining calm Notion-style block editing,
          lightning-fast hybrid search, multi-model AI copilot (Gemini 2.0, Groq, Ollama), and instant markdown note generation.
        </p>

        <div className="home-hero-ctas">
          <Link href={isLoggedIn ? "/dashboard" : "/register"} className="home-cta-btn-large">
            <span>{isLoggedIn ? "🚀 Launch Your Dashboard" : "⚡ Start Creating Free"}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <a href="#svg-motion" className="home-cta-btn-secondary">
            <span>▶ Explore Live SVG Motion Engine</span>
          </a>
        </div>

        <div className="home-hero-stats">
          <div className="home-stat-item">
            <strong>&lt;140ms</strong>
            <span>Hybrid Retrieval Latency</span>
          </div>
          <div className="home-stat-divider" />
          <div className="home-stat-item">
            <strong>100%</strong>
            <span>Markdown &amp; Vector Fidelity</span>
          </div>
          <div className="home-stat-divider" />
          <div className="home-stat-item">
            <strong>4+ Engines</strong>
            <span>Gemini 2.0, Groq, Custom AI, Ollama</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CINEMATIC SVG MOTION GRAPHIC (VIDEO-LIKE EXPERIENCE WITHOUT MP4/MP3)
          ========================================================================= */}
      <section id="svg-motion" className="home-motion-section">
        <div className="home-motion-header">
          <div className="home-section-badge">Pure Vector Motion Experience</div>
          <h2 className="home-motion-title">Watch NoteOS in Cinematic Motion</h2>
          <p className="home-motion-subtitle">
            Rendered entirely with interactive, lightweight animated SVG vector graphics — no heavy video files or audio codecs, just pure 60fps dynamic geometry and neural flows.
          </p>

          {/* Scene Switcher Tabs */}
          <div className="home-motion-tabs">
            <button
              onClick={() => setActiveScene('rag-flow')}
              className={`home-motion-tab ${activeScene === 'rag-flow' ? 'active' : ''}`}
            >
              <span>🧠 Hybrid RAG Synapse</span>
            </button>
            <button
              onClick={() => setActiveScene('recipe-draft')}
              className={`home-motion-tab ${activeScene === 'recipe-draft' ? 'active' : ''}`}
            >
              <span>🍕 Pizza Recipe &amp; Content Drafting</span>
            </button>
            <button
              onClick={() => setActiveScene('database-morph')}
              className={`home-motion-tab ${activeScene === 'database-morph' ? 'active' : ''}`}
            >
              <span>📊 Multi-View Database Morph</span>
            </button>
          </div>
        </div>

        {/* Video-Like Mockup Container with SVG Graphics */}
        <div className="home-svg-player-frame">
          {/* Top Window Chrome Bar */}
          <div className="home-player-chrome">
            <div className="home-chrome-dots">
              <span className="chrome-dot red" />
              <span className="chrome-dot yellow" />
              <span className="chrome-dot green" />
            </div>
            <div className="home-chrome-address">
              <span className="chrome-lock-icon">🔒</span>
              <span>noteos.internal://runtime/live-vector-stream.svg</span>
            </div>
            <div className="home-chrome-controls">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="chrome-play-pause-btn"
                title={isPlaying ? "Pause Animation" : "Play Animation"}
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <span className="chrome-badge-live">LIVE 60FPS</span>
            </div>
          </div>

          {/* The Master Animated SVG Canvas */}
          <div className="home-svg-canvas-container">
            <svg
              className="home-master-svg"
              viewBox="0 0 1000 580"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Neon linear gradients */}
                <linearGradient id="cyber-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id="violet-burst" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
                <linearGradient id="emerald-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="amber-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
                <linearGradient id="radar-sweep" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>

                {/* Soft vector drop shadow & glow filters */}
                <filter id="svg-neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="svg-intense-glow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="16" result="blur1" />
                  <feGaussianBlur stdDeviation="6" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur1" />
                    <feMergeNode in="blur2" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Background Geometric Grid Pattern */}
              <g className="svg-background-grid" opacity="0.15">
                {[...Array(20)].map((_, i) => (
                  <line key={`grid-h-${i}`} x1="0" y1={i * 30} x2="1000" y2={i * 30} stroke="#8b5cf6" strokeWidth="0.6" strokeDasharray="3 3" />
                ))}
                {[...Array(34)].map((_, i) => (
                  <line key={`grid-v-${i}`} x1={i * 30} y1="0" x2={i * 30} y2="580" stroke="#06b6d4" strokeWidth="0.6" strokeDasharray="3 3" />
                ))}
              </g>

              {/* Left Side: Animated Interactive App Canvas */}
              <g transform="translate(40, 40)">
                {/* App window frame */}
                <rect width="460" height="490" rx="14" fill="#0d1117" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
                <rect width="460" height="42" rx="14" fill="#161b22" />
                {/* App header dots */}
                <circle cx="25" cy="21" r="5" fill="#ef4444" />
                <circle cx="42" cy="21" r="5" fill="#f59e0b" />
                <circle cx="59" cy="21" r="5" fill="#10b981" />
                {/* Note title */}
                <text x="85" y="26" fill="#8b949e" fontSize="13" fontFamily="monospace">
                  {activeScene === 'rag-flow' ? '⚡ workspace/hybrid_rag_stream.md' : activeScene === 'recipe-draft' ? '🍕 workspace/cheese_burst_pizza.md' : '📊 workspace/launch_board.db'}
                </text>

                {/* Simulated Editor Content Lines */}
                <g transform="translate(25, 65)">
                  {/* Category Chip */}
                  <rect width="90" height="22" rx="4" fill="rgba(99,102,241,0.2)" stroke="rgba(99,102,241,0.4)" />
                  <text x="12" y="15" fill="#a5b4fc" fontSize="11" fontWeight="bold">
                    {activeScene === 'rag-flow' ? '🧠 HYBRID RAG' : activeScene === 'recipe-draft' ? '🍕 CULINARY' : '🚀 SPRINT'}
                  </text>

                  {/* Title Bar in Editor */}
                  <text x="0" y="55" fill="#f0f6fc" fontSize="18" fontWeight="bold" fontFamily="sans-serif">
                    {activeScene === 'rag-flow' ? 'Multi-Source Knowledge Retrieval' : activeScene === 'recipe-draft' ? "Domino's Cheese Burst Pizza Recipe" : 'Q4 Product Roadmap & Tasks'}
                  </text>

                  {/* Streaming Code / Note Box */}
                  <rect x="0" y="75" width="410" height="300" rx="8" fill="#07090e" stroke="rgba(255,255,255,0.06)" />
                  
                  {/* Text lines rendered dynamically */}
                  {typedContent.split('\n').map((line, idx) => (
                    <text
                      key={idx}
                      x="16"
                      y={105 + idx * 22}
                      fill={line.startsWith('#') ? '#38bdf8' : line.startsWith('➜') ? '#a78bfa' : line.startsWith('✓') ? '#34d399' : line.startsWith('-') ? '#fcd34d' : '#e2e8f0'}
                      fontSize="12.5"
                      fontFamily="monospace"
                    >
                      {line}
                    </text>
                  ))}

                  {/* Blinking Typing Cursor */}
                  <rect
                    x="20"
                    y={110 + typedContent.split('\n').length * 22}
                    width="8"
                    height="16"
                    fill="#38bdf8"
                    className="svg-blinking-cursor"
                  />
                </g>

                {/* Live Floating Status Footer inside App Mockup */}
                <g transform="translate(25, 450)">
                  <rect width="410" height="30" rx="6" fill="#161b22" />
                  <circle cx="20" cy="15" r="4" fill="#10b981" className="svg-pulse-dot" />
                  <text x="34" y="19" fill="#7ee787" fontSize="11" fontFamily="monospace">
                    NoteOS Engine Online • Auto-Saved • Vector Indexed
                  </text>
                  <text x="330" y="19" fill="#8b949e" fontSize="11" fontFamily="monospace">
                    140w • 2.4KB
                  </text>
                </g>
              </g>

              {/* Right Side: Animated Synaptic Neural RAG Graph + Soundwave Visualizer */}
              <g transform="translate(540, 40)">
                {/* Holographic Radar / Gyroscopic Orbiting Rings */}
                <g transform="translate(210, 200)">
                  {/* Outer Orbit */}
                  <circle r="180" fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="1" strokeDasharray="6 8" className={isPlaying ? "svg-spin-slow" : ""} />
                  {/* Mid Orbit */}
                  <circle r="130" fill="none" stroke="rgba(6,182,212,0.25)" strokeWidth="1.5" strokeDasharray="12 12" className={isPlaying ? "svg-spin-reverse" : ""} />
                  {/* Inner Ring */}
                  <circle r="70" fill="none" stroke="url(#violet-burst)" strokeWidth="2" strokeDasharray="4 4" className={isPlaying ? "svg-spin-fast" : ""} />
                  {/* Radar Scanning Beam */}
                  <path d="M 0 0 L 130 0 A 130 130 0 0 1 0 130 Z" fill="url(#radar-sweep)" className={isPlaying ? "svg-radar-sweep" : ""} />

                  {/* Central Core Brain Hub */}
                  <circle r="36" fill="url(#violet-burst)" filter="url(#svg-intense-glow)" />
                  <text x="0" y="6" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    AI RAG
                  </text>
                </g>

                {/* Animated Synaptic Connection Curves */}
                <g className="svg-synaptic-lines">
                  {/* Line 1 to Gemini */}
                  <path d="M 210 200 Q 110 90 60 70" fill="none" stroke="url(#cyber-cyan)" strokeWidth="2.5" strokeDasharray="8 6" className={isPlaying ? "svg-energy-flow" : ""} />
                  {/* Line 2 to Groq */}
                  <path d="M 210 200 Q 340 100 370 80" fill="none" stroke="url(#amber-glow)" strokeWidth="2.5" strokeDasharray="8 6" className={isPlaying ? "svg-energy-flow" : ""} />
                  {/* Line 3 to BM25 */}
                  <path d="M 210 200 Q 110 320 70 340" fill="none" stroke="url(#emerald-glow)" strokeWidth="2.5" strokeDasharray="8 6" className={isPlaying ? "svg-energy-flow" : ""} />
                  {/* Line 4 to Notes Vector */}
                  <path d="M 210 200 Q 330 310 360 330" fill="none" stroke="url(#violet-burst)" strokeWidth="2.5" strokeDasharray="8 6" className={isPlaying ? "svg-energy-flow" : ""} />
                </g>

                {/* Floating Node 1: Gemini 2.0 Flash */}
                <g transform="translate(60, 70)" className="svg-floating-node">
                  <rect x="-55" y="-22" width="110" height="44" rx="10" fill="#111827" stroke="#06b6d4" strokeWidth="1.5" filter="url(#svg-neon-glow)" />
                  <text x="0" y="-3" textAnchor="middle" fill="#67e8f9" fontSize="12" fontWeight="bold">Gemini 2.0</text>
                  <text x="0" y="12" textAnchor="middle" fill="#94a3b8" fontSize="10">Flash (Free)</text>
                </g>

                {/* Floating Node 2: Groq Llama 3.3 */}
                <g transform="translate(370, 80)" className="svg-floating-node-2">
                  <rect x="-55" y="-22" width="110" height="44" rx="10" fill="#111827" stroke="#f59e0b" strokeWidth="1.5" filter="url(#svg-neon-glow)" />
                  <text x="0" y="-3" textAnchor="middle" fill="#fde68a" fontSize="12" fontWeight="bold">Groq 70B</text>
                  <text x="0" y="12" textAnchor="middle" fill="#94a3b8" fontSize="10">Ultra-Speed</text>
                </g>

                {/* Floating Node 3: BM25 Keyword Search */}
                <g transform="translate(70, 340)" className="svg-floating-node">
                  <rect x="-55" y="-22" width="110" height="44" rx="10" fill="#111827" stroke="#10b981" strokeWidth="1.5" filter="url(#svg-neon-glow)" />
                  <text x="0" y="-3" textAnchor="middle" fill="#6ee7b7" fontSize="12" fontWeight="bold">BM25 Sparse</text>
                  <text x="0" y="12" textAnchor="middle" fill="#94a3b8" fontSize="10">Exact Recall</text>
                </g>

                {/* Floating Node 4: Vector Notes DB */}
                <g transform="translate(360, 330)" className="svg-floating-node-2">
                  <rect x="-55" y="-22" width="110" height="44" rx="10" fill="#111827" stroke="#ec4899" strokeWidth="1.5" filter="url(#svg-neon-glow)" />
                  <text x="0" y="-3" textAnchor="middle" fill="#f472b6" fontSize="12" fontWeight="bold">Vector Store</text>
                  <text x="0" y="12" textAnchor="middle" fill="#94a3b8" fontSize="10">MongoDB Hybrid</text>
                </g>

                {/* Soundwave / Audio Equalizer Visualizer (The "Not MP3, But Animated SVG Vector Bars" Visualizer) */}
                <g transform="translate(40, 420)">
                  <rect width="340" height="70" rx="10" fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.1)" />
                  <text x="20" y="24" fill="#a5b4fc" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                    AI STREAM SPECTRUM (LIVE VECTOR AUDIO-WAVE)
                  </text>
                  
                  {/* Equalizer Frequency Bars */}
                  <g transform="translate(20, 34)">
                    {[40, 65, 30, 85, 95, 50, 70, 45, 90, 60, 80, 55, 75, 92, 48, 68, 88, 38, 72, 85].map((h, i) => (
                      <rect
                        key={`eq-${i}`}
                        x={i * 15}
                        y={26 - (h * 0.24)}
                        width="8"
                        height={h * 0.24}
                        rx="3"
                        fill={i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#a855f7' : '#34d399'}
                        className={isPlaying ? `svg-eq-bar eq-delay-${i % 5}` : ''}
                      />
                    ))}
                  </g>
                </g>
              </g>
            </svg>
          </div>

          {/* Bottom Video-Like Control Bar */}
          <div className="home-player-bottom-bar">
            <div className="home-player-status">
              <span className="home-player-led" />
              <span>SVG Scene: <strong>{activeScene.toUpperCase()}</strong> • 1080p Vector Crispness • Zero Audio Overhead</span>
            </div>
            <div className="home-player-actions">
              <button
                onClick={() => {
                  const scenes: MotionScene[] = ['rag-flow', 'recipe-draft', 'database-morph'];
                  const nextIdx = (scenes.indexOf(activeScene) + 1) % scenes.length;
                  setActiveScene(scenes[nextIdx]);
                }}
                className="home-player-next-btn"
              >
                Next Scene ➜
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE LIVE COPILOT SANDBOX
          ========================================================================= */}
      <section id="sandbox" className="home-sandbox-section">
        <div className="home-section-badge">Live Interactive Simulation</div>
        <h2 className="home-section-title">Test NoteOS Copilot in Real Time</h2>
        <p className="home-section-subtitle">
          Click any preset prompt below to witness how NoteOS intelligently grounds queries on workspace notes or generates comprehensive, multi-step drafts.
        </p>

        <div className="home-sandbox-presets">
          <button
            onClick={() => setSandboxPrompt('pizza')}
            className={`sandbox-preset-btn ${sandboxPrompt === 'pizza' ? 'active' : ''}`}
          >
            🍕 "need to draft content add receipe of pizza chesse birst"
          </button>
          <button
            onClick={() => setSandboxPrompt('cat')}
            className={`sandbox-preset-btn ${sandboxPrompt === 'cat' ? 'active' : ''}`}
          >
            🎯 "summarize my CAT exam study planner &amp; error log"
          </button>
          <button
            onClick={() => setSandboxPrompt('roadmap')}
            className={`sandbox-preset-btn ${sandboxPrompt === 'roadmap' ? 'active' : ''}`}
          >
            📋 "show Noteform product roadmap and database views"
          </button>
        </div>

        {/* Dynamic Sandbox Result Card */}
        <div className="home-sandbox-card">
          <div className="sandbox-card-header">
            <div className="sandbox-model-tag">
              <span>🤖 NoteOS Copilot</span>
              <span className="sandbox-badge">Gemini 2.0 / Hybrid RAG</span>
            </div>
            <div className="sandbox-header-actions">
              <Link href={isLoggedIn ? "/chat" : "/login"} className="sandbox-open-chat-btn">
                Open in Full Chat ↗
              </Link>
            </div>
          </div>

          <div className="sandbox-card-body">
            {sandboxPrompt === 'pizza' && (
              <div className="sandbox-markdown-output">
                <h3>🍕 Authentic Domino's-Style Cheese Burst Pizza Recipe</h3>
                <p><strong>Yield:</strong> 1 10-inch pizza | <strong>Prep time:</strong> 25 mins | <strong>Baking time:</strong> 12–15 mins at 220°C (425°F)</p>
                <hr />
                <h4>🛒 The Secret Liquid Cheese Center:</h4>
                <ul>
                  <li><strong>Processed cheese spread (Amul / Cheez Whiz):</strong> ½ cup</li>
                  <li><strong>Heavy cream:</strong> 2 tbsp <em>(the secret to keeping it molten after cooling!)</em></li>
                  <li><strong>Shredded low-moisture Mozzarella:</strong> 1.5 cups</li>
                </ul>
                <h4>👨‍🍳 Double-Crust Assembly:</h4>
                <ol>
                  <li>Roll smaller dough portion into thin 7-inch disc, par-bake on dry pan for 45s per side.</li>
                  <li>Spread cheese mixture on 10-inch base crust, leaving 1-inch border.</li>
                  <li>Place par-baked disc on top, fold bottom crust edges inward and pleat airtight.</li>
                  <li>Add marinara sauce, toppings, mozzarella, brush crust with garlic butter, and bake!</li>
                </ol>
              </div>
            )}

            {sandboxPrompt === 'cat' && (
              <div className="sandbox-markdown-output">
                <h3>🎯 CAT Exam Study Planner — Monday to Friday</h3>
                <p><em>Retrieved via Hybrid RAG from workspace note: "CAT Exam Study Planner"</em></p>
                <table className="sandbox-table">
                  <thead>
                    <tr>
                      <th>Time Slot</th>
                      <th>Activity</th>
                      <th>Goal &amp; Focus</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>11:15 AM – 11:25 AM</td>
                      <td>🔁 Quick Revision</td>
                      <td>Flashcards &amp; weak concepts</td>
                    </tr>
                    <tr>
                      <td>11:25 AM – 12:05 PM</td>
                      <td>📚 Main Concept</td>
                      <td>Core problem drills (VARC / DILR / QA)</td>
                    </tr>
                    <tr>
                      <td>12:05 PM – 12:25 PM</td>
                      <td>🎯 Timed Questions</td>
                      <td>Speed &amp; accuracy test</td>
                    </tr>
                    <tr>
                      <td>12:25 PM – 12:30 PM</td>
                      <td>📝 Error Log</td>
                      <td>Log mistakes by Concept / Logic / Time</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {sandboxPrompt === 'roadmap' && (
              <div className="sandbox-markdown-output">
                <h3>🚀 Noteform Product Roadmap &amp; Feature Catalog</h3>
                <ul>
                  <li><strong>Canvas Block Editor:</strong> Reusable callouts, toggles, math equations, code blocks, embeds.</li>
                  <li><strong>Multi-View Databases:</strong> Switch seamlessly between Table, Kanban Board, and Gallery cards.</li>
                  <li><strong>Custom AI Engines:</strong> Connect to local Ollama (100% offline) or external OpenAI-compatible endpoints.</li>
                  <li><strong>Universal MCP Protocol:</strong> Expose your workspace securely to Claude Desktop and Cursor.</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          KEY FEATURES & ARCHITECTURE
          ========================================================================= */}
      <section id="features" className="home-features-section">
        <div className="home-section-badge">Crafted for Flow</div>
        <h2 className="home-section-title">Built with Zero Compromise</h2>
        <p className="home-section-subtitle">
          Every tool, query, and editor block is designed to give you instant clarity and unconstrained creative velocity.
        </p>

        <div className="home-features-grid">
          {/* Card 1 */}
          <div className="home-feature-card">
            <div className="feature-card-icon violet">🧠</div>
            <h3 className="feature-card-title">Hybrid Vector + BM25 RAG</h3>
            <p className="feature-card-desc">
              Combines dense semantic embeddings with sparse keyword search and Reciprocal Rank Fusion. Cites exact note titles with zero hallucination.
            </p>
            <div className="feature-card-footer">
              <span>Reciprocal Rank Fusion</span>
              <span>&lt;140ms</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="home-feature-card">
            <div className="feature-card-icon blue">📝</div>
            <h3 className="feature-card-title">Notion-Style Block Canvas</h3>
            <p className="feature-card-desc">
              Distraction-free markdown editor with slash commands (`/table`, `/code`, `/callout`), custom cover images, tags, and parent-child page hierarchies.
            </p>
            <div className="feature-card-footer">
              <span>Full Width &amp; Serif modes</span>
              <span>Markdown export</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="home-feature-card">
            <div className="feature-card-icon emerald">🔌</div>
            <h3 className="feature-card-title">Multi-Model &amp; Custom AI</h3>
            <p className="feature-card-desc">
              Plug in Google Gemini 2.0 Flash, Groq Llama 3.3, your private local Ollama daemon, or any OpenAI-compatible API key with zero lock-in.
            </p>
            <div className="feature-card-footer">
              <span>Local Offline Inference</span>
              <span>Custom URLs</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="home-feature-card">
            <div className="feature-card-icon amber">📊</div>
            <h3 className="feature-card-title">Structured Data &amp; Multi-View</h3>
            <p className="feature-card-desc">
              Turn notes into databases with custom columns (Text, Date, Select, Checkbox). Switch instantly between Table, Kanban Board, and Gallery views.
            </p>
            <div className="feature-card-footer">
              <span>Table / Board / Gallery</span>
              <span>CSV Import/Export</span>
            </div>
          </div>

          {/* Card 5 */}
          <div className="home-feature-card">
            <div className="feature-card-icon cyan">🤖</div>
            <h3 className="feature-card-title">Model Context Protocol (MCP)</h3>
            <p className="feature-card-desc">
              NoteOS is an official MCP server. Connect Claude Desktop, Cursor, and IDE coding agents directly to your notes and database records.
            </p>
            <div className="feature-card-footer">
              <span>JSON-RPC 2.0</span>
              <span>SSE Protocol</span>
            </div>
          </div>

          {/* Card 6 */}
          <div className="home-feature-card">
            <div className="feature-card-icon pink">📱</div>
            <h3 className="feature-card-title">Installable PWA &amp; Offline Sync</h3>
            <p className="feature-card-desc">
              Install NoteOS directly onto your Mac, Windows, iOS, or Android home screen with service worker offline caching and quick capture.
            </p>
            <div className="feature-card-footer">
              <span>PWA Ready</span>
              <span>Instant Launch</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          COMPARISON MATRIX
          ========================================================================= */}
      <section className="home-comparison-section">
        <div className="home-section-badge">Why NoteOS Wins</div>
        <h2 className="home-section-title">Compare with Other Tools</h2>

        <div className="home-comparison-table-wrap">
          <table className="home-comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th className="highlight-col">NoteOS 2.0</th>
                <th>Notion</th>
                <th>Obsidian</th>
                <th>Roam</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Hybrid RAG (Dense + BM25)</td>
                <td className="highlight-col check">✓ Built-in</td>
                <td className="cross">✕ Basic search</td>
                <td className="cross">✕ Plugin only</td>
                <td className="cross">✕ No vector</td>
              </tr>
              <tr>
                <td>Multi-Model AI (Gemini, Groq, Ollama)</td>
                <td className="highlight-col check">✓ Any model / local</td>
                <td className="cross">✕ $10/mo proprietary</td>
                <td className="cross">✕ Complex plugins</td>
                <td className="cross">✕ Basic GPT-3</td>
              </tr>
              <tr>
                <td>Model Context Protocol (MCP)</td>
                <td className="highlight-col check">✓ Native Server</td>
                <td className="cross">✕ None</td>
                <td className="cross">✕ None</td>
                <td className="cross">✕ None</td>
              </tr>
              <tr>
                <td>1-Click Chat-to-Note Creation</td>
                <td className="highlight-col check">✓ Built-in (.md export)</td>
                <td className="cross">✕ Manual copy</td>
                <td className="cross">✕ Manual copy</td>
                <td className="cross">✕ Manual copy</td>
              </tr>
              <tr>
                <td>Zero Cost Free Tier</td>
                <td className="highlight-col check">✓ 100% Free / Self-host</td>
                <td className="cross">✕ Limited AI</td>
                <td className="check">✓ Free local</td>
                <td className="cross">✕ $15/mo</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="home-cta-banner">
        <div className="home-cta-banner-inner">
          <h2>Ready to Supercharge Your Workspace?</h2>
          <p>Start organizing notes, querying your personal AI copilot, and building knowledge in seconds.</p>
          <div className="home-cta-banner-buttons">
            <Link href={isLoggedIn ? "/dashboard" : "/register"} className="home-cta-btn-large">
              <span>{isLoggedIn ? "Open Your Dashboard" : "Create Free Account"}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/dashboard" className="home-cta-btn-secondary">
              <span>Explore Dashboard</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="home-footer-brand">
            <div className="home-brand">
              <span className="home-logo-badge">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect width="24" height="24" rx="6" fill="#6366f1" />
                  <path d="M7 17V7L17 17V7" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="home-brand-text">NoteOS</span>
            </div>
            <p className="home-footer-tagline">
              The calm, AI-native workspace for notes, structured data, and hybrid vector recall.
            </p>
          </div>

          <div className="home-footer-nav">
            <div className="footer-col">
              <h4>Product</h4>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/">Workspace Editor</Link>
              <Link href="/chat">AI Copilot Chat</Link>
              <Link href="/tables">Databases</Link>
            </div>
            <div className="footer-col">
              <h4>Architecture</h4>
              <a href="#hybrid-rag">Hybrid RAG</a>
              <Link href="/mcp">MCP Protocol</Link>
              <a href="#svg-motion">SVG Motion</a>
              <Link href="/settings">AI Models &amp; Keys</Link>
            </div>
            <div className="footer-col">
              <h4>Connect</h4>
              <a href="https://github.com/vanshgurnani/NoteOS" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href="https://noteos-backend.onrender.com" target="_blank" rel="noopener noreferrer">API Health</a>
              <Link href="/login">Sign In</Link>
              <Link href="/register">Sign Up</Link>
            </div>
          </div>
        </div>

        <div className="home-footer-bottom">
          <p>© 2026 NoteOS Architecture. Open-source, local-first, privacy-respecting.</p>
        </div>
      </footer>
    </div>
  );
}
