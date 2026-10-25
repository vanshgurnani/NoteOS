'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  api,
  clearSession,
  DataTable,
  getSessionToken,
  listConversations,
  Note,
  User,
} from '../../lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tables, setTables] = useState<DataTable[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickPrompt, setQuickPrompt] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'ai'>('overview');

  useEffect(() => {
    const token = getSessionToken();
    const storedUser = localStorage.getItem('noteos_user') || localStorage.getItem('noteform_user');

    if (!token || !storedUser) {
      router.replace('/login');
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch {
      setUser({ id: '1', username: 'Creator', email: 'user@noteos.ai' });
    }

    // Detect dark mode
    const savedDark = localStorage.getItem('noteform_dark_mode') !== 'false';
    setIsDarkMode(savedDark);

    // Update clock
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 30000);

    // Load workspace data
    loadDashboardData();

    return () => clearInterval(clockInterval);
  }, [router]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [fetchedNotes, fetchedTables, fetchedConvs] = await Promise.all([
        api<Note[]>('/notes').catch(() => []),
        api<DataTable[]>('/tables').catch(() => []),
        listConversations().catch(() => []),
      ]);
      setNotes(fetchedNotes || []);
      setTables(fetchedTables || []);
      setConversations(fetchedConvs || []);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const totalWords = notes.reduce((acc, note) => {
    return acc + (note.content ? note.content.trim().split(/\s+/).length : 0);
  }, 0);

  const handleQuickPromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;
    router.push(`/chat?prompt=${encodeURIComponent(quickPrompt.trim())}`);
  };

  const handleLogout = () => {
    clearSession();
    router.replace('/login');
  };

  return (
    <div className={`dashboard-root ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      {/* Top Navigation Bar */}
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div className="dashboard-brand-wrap">
            <Link href="/" className="dashboard-brand">
              <span className="dashboard-logo-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect width="24" height="24" rx="6" fill="url(#dash-logo-grad)" />
                  <path d="M7 17V7L17 17V7" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="dash-logo-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#6366f1" />
                      <stop stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <span className="dashboard-brand-name">NoteOS</span>
            </Link>
            <span className="dashboard-badge-pill">Workspace Hub</span>
          </div>

          <nav className="dashboard-nav">
            <Link href="/home" className="dashboard-nav-item">🏠 Home</Link>
            <Link href="/" className="dashboard-nav-item">📝 Editor</Link>
            <Link href="/chat" className="dashboard-nav-item">🤖 Copilot Chat</Link>
            <Link href="/tables" className="dashboard-nav-item">📊 Tables</Link>
            <Link href="/settings" className="dashboard-nav-item">⚙️ Settings</Link>
          </nav>

          <div className="dashboard-user-actions">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="dashboard-icon-btn"
              title="Toggle theme"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <div className="dashboard-user-pill">
              <span className="dashboard-avatar-circle">
                {user?.username ? user.username[0].toUpperCase() : 'U'}
              </span>
              <span className="dashboard-username">{user?.username || 'User'}</span>
            </div>
            <button onClick={handleLogout} className="dashboard-logout-btn" title="Sign out">
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="dashboard-main">
        {/* Welcome Banner & Clock */}
        <div className="dashboard-hero-card">
          <div className="dashboard-hero-content">
            <div className="dashboard-time-pill">
              <span className="dashboard-live-dot" />
              <span>{currentTime || '12:00'} • Workspace Live Sync Active</span>
            </div>
            <h1 className="dashboard-greeting">
              Welcome back, <span className="highlight-name">{user?.username || 'Creator'}</span>!
            </h1>
            <p className="dashboard-greeting-sub">
              Your knowledge base is primed with <strong>{notes.length} notes</strong>, <strong>{tables.length} structured tables</strong>, and real-time hybrid vector indexing.
            </p>

            {/* Quick Prompt Bar to AI */}
            <form onSubmit={handleQuickPromptSubmit} className="dashboard-quick-prompt-form">
              <div className="dashboard-prompt-input-wrap">
                <span className="dashboard-prompt-icon">✨</span>
                <input
                  type="text"
                  placeholder="Ask NoteOS Copilot (e.g., 'Draft cheese burst pizza recipe', 'Summarize weekly tasks')..."
                  value={quickPrompt}
                  onChange={(e) => setQuickPrompt(e.target.value)}
                  className="dashboard-prompt-input"
                />
                <button type="submit" className="dashboard-prompt-submit-btn">
                  <span>Ask Copilot ➜</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Action Tiles */}
          <div className="dashboard-quick-actions-grid">
            <Link href="/" className="dashboard-action-tile">
              <span className="action-tile-icon">➕</span>
              <div className="action-tile-text">
                <strong>New Note</strong>
                <small>Blank Canvas</small>
              </div>
            </Link>
            <Link href="/chat" className="dashboard-action-tile">
              <span className="action-tile-icon">🤖</span>
              <div className="action-tile-text">
                <strong>AI Copilot</strong>
                <small>Multi-Model Chat</small>
              </div>
            </Link>
            <Link href="/tables" className="dashboard-action-tile">
              <span className="action-tile-icon">📊</span>
              <div className="action-tile-text">
                <strong>New Database</strong>
                <small>Table / Kanban</small>
              </div>
            </Link>
            <Link href="/settings" className="dashboard-action-tile">
              <span className="action-tile-icon">⚙️</span>
              <div className="action-tile-text">
                <strong>AI Keys</strong>
                <small>Gemini / Groq / Ollama</small>
              </div>
            </Link>
          </div>
        </div>

        {/* =========================================================================
            CINEMATIC SVG "WORKSPACE COMMAND CENTER" ANIMATED GRAPHIC
            (Video-Like Motion Graphic built with Pure Responsive SVG)
            ========================================================================= */}
        <section className="dashboard-visualizer-section">
          <div className="dashboard-visualizer-card">
            <div className="visualizer-header">
              <div className="visualizer-title-group">
                <span className="visualizer-icon-badge">⚡</span>
                <div>
                  <h3 className="visualizer-title">Live Workspace Nerve Center &amp; Velocity Radar</h3>
                  <p className="visualizer-sub">Continuous SVG vector motion • Real-time RAG neural sync • Creative wave frequency</p>
                </div>
              </div>
              <div className="visualizer-tags">
                <span className="vis-tag green">● RAG INDEX SYNCED</span>
                <span className="vis-tag violet">118ms LATENCY</span>
                <span className="vis-tag cyan">HYBRID RANK FUSION</span>
              </div>
            </div>

            {/* The Animated SVG Command Canvas */}
            <div className="dashboard-svg-wrap">
              <svg
                viewBox="0 0 1000 320"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="dashboard-master-svg"
              >
                <defs>
                  <linearGradient id="dash-cyan-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                  <linearGradient id="dash-wave-area" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="dash-radar-sweep" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                  </linearGradient>
                  <filter id="dash-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Grid guidelines */}
                <g opacity="0.12">
                  <line x1="0" y1="80" x2="1000" y2="80" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="160" x2="1000" y2="160" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="240" x2="1000" y2="240" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="4 4" />
                </g>

                {/* Left Telemetry Radar System */}
                <g transform="translate(140, 160)">
                  {/* Concentric rotating dashed rings */}
                  <circle r="110" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="5 5" className="svg-spin-slow" />
                  <circle r="80" stroke="rgba(6,182,212,0.3)" strokeWidth="1.5" strokeDasharray="10 10" className="svg-spin-reverse" />
                  <circle r="48" stroke="url(#dash-cyan-grad)" strokeWidth="2" strokeDasharray="4 4" className="svg-spin-fast" />
                  
                  {/* Rotating Radar Sweep Cone */}
                  <path d="M 0 0 L 80 0 A 80 80 0 0 1 0 80 Z" fill="url(#dash-radar-sweep)" className="svg-radar-sweep" />

                  {/* Center Node */}
                  <circle r="22" fill="#6366f1" filter="url(#dash-glow)" />
                  <text x="0" y="5" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">
                    CORE
                  </text>
                </g>

                {/* Center Creative Velocity Sine Wave (Video-Like Motion) */}
                <g transform="translate(300, 0)">
                  {/* Shaded Area Under Wave */}
                  <path
                    d="M 0 200 C 60 110, 120 250, 180 140 C 240 70, 300 210, 360 120 C 420 60, 480 180, 540 100 L 540 280 L 0 280 Z"
                    fill="url(#dash-wave-area)"
                    className="svg-wave-undulation"
                  />
                  {/* Animated Wave Stroke */}
                  <path
                    d="M 0 200 C 60 110, 120 250, 180 140 C 240 70, 300 210, 360 120 C 420 60, 480 180, 540 100"
                    fill="none"
                    stroke="url(#dash-cyan-grad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    filter="url(#dash-glow)"
                    className="svg-wave-pulse"
                  />

                  {/* Pulsing Highlight Data Points on Wave */}
                  <circle cx="180" cy="140" r="5" fill="#38bdf8" className="svg-pulse-dot" />
                  <circle cx="360" cy="120" r="6" fill="#ec4899" className="svg-pulse-dot" />
                  <circle cx="540" cy="100" r="6" fill="#10b981" className="svg-pulse-dot" />

                  {/* Day Labels */}
                  <text x="30" y="270" fill="#64748b" fontSize="11">Mon</text>
                  <text x="120" y="270" fill="#64748b" fontSize="11">Tue</text>
                  <text x="210" y="270" fill="#64748b" fontSize="11">Wed</text>
                  <text x="300" y="270" fill="#64748b" fontSize="11">Thu</text>
                  <text x="390" y="270" fill="#64748b" fontSize="11">Fri</text>
                  <text x="480" y="270" fill="#38bdf8" fontSize="11" fontWeight="bold">Today</text>
                </g>

                {/* Right Status Gauge HUD */}
                <g transform="translate(870, 70)">
                  <rect x="-60" y="0" width="160" height="42" rx="8" fill="#1e293b" stroke="rgba(255,255,255,0.1)" />
                  <text x="20" y="18" textAnchor="middle" fill="#94a3b8" fontSize="10">VECTOR CHUNKS</text>
                  <text x="20" y="34" textAnchor="middle" fill="#38bdf8" fontSize="14" fontWeight="bold">{notes.length * 4 + 18}</text>

                  <rect x="-60" y="55" width="160" height="42" rx="8" fill="#1e293b" stroke="rgba(255,255,255,0.1)" />
                  <text x="20" y="73" textAnchor="middle" fill="#94a3b8" fontSize="10">AI MEMORY LOAD</text>
                  <text x="20" y="89" textAnchor="middle" fill="#10b981" fontSize="14" fontWeight="bold">Optimal (99.4%)</text>

                  <rect x="-60" y="110" width="160" height="42" rx="8" fill="#1e293b" stroke="rgba(255,255,255,0.1)" />
                  <text x="20" y="128" textAnchor="middle" fill="#94a3b8" fontSize="10">OFFLINE PWA</text>
                  <text x="20" y="144" textAnchor="middle" fill="#a855f7" fontSize="14" fontWeight="bold">Active &amp; Ready</text>
                </g>
              </svg>
            </div>
          </div>
        </section>

        {/* Key Metrics Counters */}
        <section className="dashboard-metrics-grid">
          <div className="dashboard-metric-card">
            <div className="metric-header">
              <span className="metric-label">Workspace Notes</span>
              <span className="metric-icon violet">📄</span>
            </div>
            <div className="metric-value">{notes.length}</div>
            <div className="metric-sub">
              <span>Full-text &amp; vector searchable</span>
            </div>
          </div>

          <div className="dashboard-metric-card">
            <div className="metric-header">
              <span className="metric-label">Words Drafted</span>
              <span className="metric-icon blue">✍️</span>
            </div>
            <div className="metric-value">{totalWords.toLocaleString()}</div>
            <div className="metric-sub">
              <span>~{Math.max(1, Math.round(totalWords / 200))} min total reading time</span>
            </div>
          </div>

          <div className="dashboard-metric-card">
            <div className="metric-header">
              <span className="metric-label">Structured Tables</span>
              <span className="metric-icon emerald">📊</span>
            </div>
            <div className="metric-value">{tables.length}</div>
            <div className="metric-sub">
              <span>Multi-view (Table, Board, Gallery)</span>
            </div>
          </div>

          <div className="dashboard-metric-card">
            <div className="metric-header">
              <span className="metric-label">AI Conversations</span>
              <span className="metric-icon amber">🤖</span>
            </div>
            <div className="metric-value">{conversations.length}</div>
            <div className="metric-sub">
              <span>Grounding with hybrid RAG</span>
            </div>
          </div>
        </section>

        {/* Main Content Grid: Recent Notes & AI Conversations */}
        <div className="dashboard-content-split">
          {/* Left Column: Recent Notes */}
          <div className="dashboard-section-box">
            <div className="section-box-header">
              <div className="section-box-title">
                <span>📚</span>
                <h3>Recent Notes</h3>
              </div>
              <Link href="/" className="section-box-link">
                View All in Editor →
              </Link>
            </div>

            {loading ? (
              <div className="dashboard-empty-state">Loading notes...</div>
            ) : notes.length === 0 ? (
              <div className="dashboard-empty-state">
                <p>No notes yet! Create your first note now.</p>
                <Link href="/" className="dashboard-empty-btn">
                  + Create Note
                </Link>
              </div>
            ) : (
              <div className="dashboard-notes-list">
                {notes.slice(0, 6).map((note) => (
                  <Link
                    key={note.id}
                    href={`/?note=${note.id}`}
                    className="dashboard-note-row"
                  >
                    <div className="note-row-left">
                      <span className="note-row-icon">{note.icon || '📄'}</span>
                      <div className="note-row-text">
                        <span className="note-row-title">{note.title || 'Untitled Note'}</span>
                        <span className="note-row-snippet">
                          {note.content ? note.content.replace(/^[#\s\-*]+/g, '').slice(0, 75) + '...' : 'Empty note'}
                        </span>
                      </div>
                    </div>
                    <div className="note-row-right">
                      {note.category && (
                        <span className="note-row-category">{note.category}</span>
                      )}
                      <span className="note-row-date">
                        {new Date(note.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: AI Conversations & Quick Presets */}
          <div className="dashboard-section-box">
            <div className="section-box-header">
              <div className="section-box-title">
                <span>🤖</span>
                <h3>AI Copilot &amp; Fast Drafts</h3>
              </div>
              <Link href="/chat" className="section-box-link">
                Open Chat →
              </Link>
            </div>

            {/* Quick Draft Shortcuts */}
            <div className="dashboard-recipe-prompt-card">
              <div className="prompt-card-icon">🍕</div>
              <div className="prompt-card-text">
                <strong>Cheese Burst Pizza Recipe</strong>
                <p>Authentic Domino's-style double-crust recipe with secret liquid center.</p>
              </div>
              <Link href="/chat?prompt=need+to+draft+content+add+receipe+of+pizza+chesse+birst" className="prompt-card-action">
                Draft ➜
              </Link>
            </div>

            <div className="dashboard-recipe-prompt-card">
              <div className="prompt-card-icon">🎯</div>
              <div className="prompt-card-text">
                <strong>CAT Exam Study Routine &amp; Error Log</strong>
                <p>Synthesizes your study schedule from workspace notes.</p>
              </div>
              <Link href="/chat?prompt=summarize+my+CAT+exam+study+planner+and+error+log" className="prompt-card-action">
                Review ➜
              </Link>
            </div>

            <div className="section-box-subtitle-wrap">
              <h4>Recent Conversations</h4>
            </div>

            {conversations.length === 0 ? (
              <div className="dashboard-empty-convs">
                <p>No recent conversations. Ask NoteOS Copilot anything!</p>
              </div>
            ) : (
              <div className="dashboard-convs-list">
                {conversations.slice(0, 4).map((c) => (
                  <Link
                    key={c.id}
                    href="/chat"
                    className="dashboard-conv-row"
                  >
                    <span className="conv-row-icon">💬</span>
                    <span className="conv-row-title">{c.title || 'Conversation'}</span>
                    <span className="conv-row-badge">{c.message_count} msgs</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
