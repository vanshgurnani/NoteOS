'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, API_URL } from '../../lib/api';

type Mail = { id: string; thread_id?: string; from: string; to: string; subject: string; snippet: string; date: string; unread: boolean };
type MailDetail = Mail & { body: string };

export default function GmailPage() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [messages, setMessages] = useState<Mail[]>([]);
  const [selected, setSelected] = useState<MailDetail | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');

  const loadStatus = useCallback(async () => {
    try {
      const status = await api<{ connected: boolean; email?: string }>('/gmail/status');
      setConnected(status.connected);
      setAccount(status.email || '');
      if (status.connected) await loadMessages();
    } catch (e: any) { setError(e.message || 'Could not load Gmail status'); }
  }, []);

  const loadMessages = async (q = query) => {
    setLoading(true); setError('');
    try {
      const data = await api<{ messages: Mail[] }>('/gmail/messages?' + new URLSearchParams({ q, limit: '30' }));
      setMessages(data.messages);
    } catch (e: any) { setError(e.message || 'Could not load messages'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadStatus(); }, [loadStatus]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('gmail_connected')) setNotice('Gmail connected successfully.');
    if (params.get('gmail_error')) setError('Gmail connection failed. Please try connecting again.');
    if (params.has('gmail_connected') || params.has('gmail_error')) window.history.replaceState({}, '', '/gmail');
  }, []);

  const connect = async () => {
    try {
      setError('');
      const data = await api<{ authorization_url: string }>('/gmail/connect');
      window.location.href = data.authorization_url;
    } catch (e: any) { setError(e.message || 'Could not start Google authorization'); }
  };

  const openMessage = async (id: string) => {
    setSelected(null); setError('');
    try { setSelected(await api<MailDetail>('/gmail/messages/' + encodeURIComponent(id))); }
    catch (e: any) { setError(e.message || 'Could not open message'); }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault(); setSending(true); setError('');
    try {
      await api('/gmail/send', { method: 'POST', body: JSON.stringify({ to, subject, body }) });
      setNotice('Email sent.');
      setShowCompose(false); setTo(''); setSubject(''); setBody('');
    } catch (e: any) { setError(e.message || 'Email could not be sent'); }
    finally { setSending(false); }
  };

  const disconnect = async () => {
    if (!window.confirm('Disconnect Gmail from NOTE OS?')) return;
    try { await api('/gmail/disconnect', { method: 'DELETE' }); setConnected(false); setAccount(''); setMessages([]); setSelected(null); }
    catch (e: any) { setError(e.message || 'Could not disconnect Gmail'); }
  };

  return <main className="min-h-screen bg-[#f7f7f4] px-4 py-8 text-[#20231f] sm:px-8">
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex items-center justify-between">
        <div><Link href="/" className="text-sm text-[#777] hover:text-black">← Back to NOTE OS</Link><h1 className="mt-3 text-3xl font-semibold">Gmail</h1><p className="mt-1 text-sm text-[#777]">Your inbox, connected to your workspace.</p></div>
        {connected && <button onClick={() => setShowCompose(true)} className="rounded-xl bg-[#20231f] px-4 py-2.5 text-sm text-white">Compose</button>}
      </header>
      {notice && <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!connected ? <section className="rounded-2xl border border-[#e6e6df] bg-white p-8">
        <div className="mb-4 text-3xl">✉</div><h2 className="text-xl font-medium">Connect your Gmail account</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#777]">Authorize NOTE OS to search and read your emails and send messages on your behalf. Your OAuth tokens are encrypted before being stored.</p>
        <button onClick={connect} className="mt-6 rounded-xl bg-[#20231f] px-5 py-3 text-sm text-white">Connect Gmail with Google</button>
        <p className="mt-3 text-xs text-[#888]">You can revoke access at any time from your Google Account or disconnect here.</p>
      </section> : <section className="overflow-hidden rounded-2xl border border-[#e6e6df] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee] p-4">
          <div><p className="font-medium">{account || 'Connected Gmail'}</p><p className="text-xs text-[#888]">Connected account</p></div>
          <button onClick={disconnect} className="text-sm text-[#777] underline">Disconnect</button>
        </div>
        <div className="flex gap-2 border-b border-[#eee] p-4">
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadMessages(query)} placeholder="Search Gmail (e.g. from:someone subject:invoice)" className="min-w-0 flex-1 rounded-lg border border-[#ddd] px-3 py-2 text-sm outline-none focus:border-[#888]" />
          <button onClick={() => loadMessages(query)} className="rounded-lg border border-[#ddd] px-4 text-sm">Search</button>
        </div>
        <div className="grid min-h-[420px] md:grid-cols-[minmax(280px,0.85fr)_1.15fr]">
          <div className="divide-y divide-[#eee] border-r border-[#eee]">
            {loading ? <p className="p-5 text-sm text-[#888]">Loading messages…</p> : messages.length ? messages.map(mail => <button key={mail.id} onClick={() => openMessage(mail.id)} className="block w-full p-4 text-left hover:bg-[#fafaf8]">
              <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium">{mail.from}</span>{mail.unread && <span className="h-2 w-2 rounded-full bg-[#73947b]" />}</div>
              <p className="mt-1 truncate text-sm">{mail.subject}</p><p className="mt-1 line-clamp-2 text-xs text-[#888]">{mail.snippet}</p><p className="mt-2 text-[10px] text-[#aaa]">{mail.date}</p>
            </button>) : <p className="p-5 text-sm text-[#888]">No messages found.</p>}
          </div>
          <article className="min-w-0 p-5">
            {selected ? <><button onClick={() => setSelected(null)} className="mb-4 text-xs text-[#888]">← Back to inbox</button><h2 className="text-lg font-semibold">{selected.subject}</h2><p className="mt-2 text-xs text-[#888]">From: {selected.from}<br/>To: {selected.to}<br/>{selected.date}</p><div className="mt-6 whitespace-pre-wrap break-words text-sm leading-7">{selected.body || selected.snippet}</div></> : <p className="mt-24 text-center text-sm text-[#aaa]">Select an email to read it here.</p>}
          </article>
        </div>
      </section>}
      {showCompose && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"><form onSubmit={send} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">New email</h2><button type="button" onClick={() => setShowCompose(false)} className="text-[#888]">✕</button></div><label className="mb-1 block text-xs text-[#777]">To</label><input required type="email" value={to} onChange={e => setTo(e.target.value)} className="mb-4 w-full rounded-lg border p-3 text-sm"/><label className="mb-1 block text-xs text-[#777]">Subject</label><input value={subject} onChange={e => setSubject(e.target.value)} className="mb-4 w-full rounded-lg border p-3 text-sm"/><label className="mb-1 block text-xs text-[#777]">Message</label><textarea required value={body} onChange={e => setBody(e.target.value)} rows={8} className="mb-4 w-full rounded-lg border p-3 text-sm"/><button disabled={sending} className="rounded-xl bg-[#20231f] px-5 py-2.5 text-sm text-white disabled:opacity-50">{sending ? 'Sending…' : 'Send email'}</button></form></div>}
    </div>
  </main>;
}
