'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';

type Meeting = {
  id: string; title: string; created_at: string;
  summary: { overview: string; key_points: string[]; decisions: string[]; action_items: {task:string;owner?:string|null;due_date?:string|null}[]; follow_ups: string[] };
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [transcript, setTranscript] = useState('');
  const [title, setTitle] = useState('Meeting');
  const [conferences, setConferences] = useState<{name:string; startTime?:string}[]>([]);
  const [transcripts, setTranscripts] = useState<{name:string; state?:string}[]>([]);
  const [selectedConference, setSelectedConference] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try { const data = await api<{meetings:Meeting[]}>('/meetings'); setMeetings(data.meetings || []); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load summaries'); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  async function connectGoogle() {
    setBusy('connect'); setError('');
    try { const result = await api<{authorization_url:string}>('/meetings/google/connect'); window.location.href = result.authorization_url; }
    catch (e) { setError(e instanceof Error ? e.message : 'Google connection failed'); setBusy(''); }
  }
  async function loadConferences() {
    setBusy('conferences'); setError('');
    try { const data = await api<{conferenceRecords?:{name:string;startTime?:string}[]}>('/meetings/google/conferences'); setConferences(data.conferenceRecords || []); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load meetings'); }
    finally { setBusy(''); }
  }
  async function loadTranscripts(name:string) {
    setSelectedConference(name); setBusy('transcripts'); setError('');
    try { const data = await api<{transcripts?:{name:string;state?:string}[]}>('/meetings/google/conferences/'+encodeURIComponent(name)+'/transcripts'); setTranscripts(data.transcripts || []); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load transcripts'); }
    finally { setBusy(''); }
  }
  async function summarizeGoogle(name:string) {
    setBusy(name); setError('');
    try { await api('/meetings/google/transcripts/'+encodeURIComponent(name)+'/summarize',{method:'POST'}); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not summarize transcript'); }
    finally { setBusy(''); }
  }
  async function summarizePasted() {
    if (transcript.trim().length < 20) { setError('Paste at least 20 characters of transcript.'); return; }
    setBusy('manual'); setError('');
    try { await api('/meetings/summarize',{method:'POST',body:JSON.stringify({title,transcript})}); setTranscript(''); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not summarize transcript'); }
    finally { setBusy(''); }
  }

  return <main style={{maxWidth:920,margin:'48px auto',padding:'0 24px',color:'var(--foreground, #292a27)'}}>
    <a href="/workspace" style={{color:'inherit',textDecoration:'none',fontSize:13}}>← Back to workspace</a>
    <header style={{margin:'28px 0 30px'}}><p style={{fontSize:12,letterSpacing:2,opacity:.6}}>NOTE OS · MEETINGS</p><h1 style={{fontSize:34,fontWeight:600,margin:'8px 0'}}>Meeting summaries</h1><p style={{opacity:.7}}>Turn Google Meet transcripts into clear notes, decisions, and action items.</p></header>
    {error && <p role="alert" style={{background:'#fff0ed',color:'#9b3427',padding:12,borderRadius:10}}>{error}</p>}
    <section style={{border:'1px solid #deded7',borderRadius:16,padding:22,marginBottom:18}}>
      <h2 style={{fontSize:18,margin:'0 0 8px'}}>Google Meet</h2><p style={{fontSize:14,opacity:.7}}>Connect your Google account, choose a meeting with an available transcript, and summarize it.</p>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:16}}>
        <button onClick={connectGoogle} disabled={!!busy} style={button}>{busy==='connect'?'Connecting…':'Connect Google'}</button>
        <button onClick={loadConferences} disabled={!!busy} style={secondary}>{busy==='conferences'?'Loading…':'Find recent meetings'}</button>
      </div>
      {conferences.map(c=><div key={c.name} style={row}><span>{c.name.split('/').pop()} {c.startTime ? '· '+new Date(c.startTime).toLocaleString() : ''}</span><button style={secondary} onClick={()=>loadTranscripts(c.name)}>View transcripts</button></div>)}
      {selectedConference && transcripts.map(t=><div key={t.name} style={row}><span>Transcript · {t.state || 'available'}</span><button style={button} disabled={!!busy} onClick={()=>summarizeGoogle(t.name)}>{busy===t.name?'Summarizing…':'Summarize'}</button></div>)}
    </section>
    <section style={{border:'1px solid #deded7',borderRadius:16,padding:22,marginBottom:28}}>
      <h2 style={{fontSize:18,margin:'0 0 8px'}}>Paste a transcript</h2><p style={{fontSize:14,opacity:.7}}>You can also summarize a transcript copied from Google Meet or another meeting tool.</p>
      <input value={title} onChange={e=>setTitle(e.target.value)} aria-label="Meeting title" placeholder="Meeting title" style={{...field,margin:'12px 0'}}/>
      <textarea value={transcript} onChange={e=>setTranscript(e.target.value)} placeholder="Paste meeting transcript…" rows={7} style={{...field,resize:'vertical'}}/>
      <button onClick={summarizePasted} disabled={!!busy} style={{...button,marginTop:12}}>{busy==='manual'?'Summarizing…':'Generate summary'}</button>
    </section>
    <h2 style={{fontSize:21,marginBottom:14}}>Saved summaries</h2>
    {!meetings.length && <p style={{opacity:.65}}>No meeting summaries yet.</p>}
    {meetings.map(m=><article key={m.id} style={{border:'1px solid #deded7',borderRadius:14,padding:20,marginBottom:14}}>
      <p style={{fontSize:12,opacity:.6}}>{m.created_at ? new Date(m.created_at).toLocaleString() : ''}</p><h3 style={{fontSize:18,margin:'4px 0 10px'}}>{m.title}</h3><p>{m.summary?.overview}</p>
      {m.summary?.key_points?.length>0 && <><h4>Key points</h4><ul>{m.summary.key_points.map((x,i)=><li key={i}>{x}</li>)}</ul></>}
      {m.summary?.decisions?.length>0 && <><h4>Decisions</h4><ul>{m.summary.decisions.map((x,i)=><li key={i}>{x}</li>)}</ul></>}
      {m.summary?.action_items?.length>0 && <><h4>Action items</h4><ul>{m.summary.action_items.map((x,i)=><li key={i}>{x.task} — {x.owner || 'Owner TBD'}{x.due_date ? ' · '+x.due_date : ''}</li>)}</ul></>}
      {m.summary?.follow_ups?.length>0 && <><h4>Follow-ups</h4><ul>{m.summary.follow_ups.map((x,i)=><li key={i}>{x}</li>)}</ul></>}
    </article>)}
  </main>;
}

const button:React.CSSProperties={background:'#292a27',color:'#fff',border:0,borderRadius:9,padding:'10px 15px',cursor:'pointer'};
const secondary:React.CSSProperties={background:'transparent',color:'inherit',border:'1px solid #c9c9c1',borderRadius:9,padding:'9px 13px',cursor:'pointer'};
const field:React.CSSProperties={width:'100%',padding:12,border:'1px solid #d3d3cb',borderRadius:9,background:'transparent',color:'inherit',font:'inherit'};
const row:React.CSSProperties={display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'12px 0',borderTop:'1px solid #e7e7e0',fontSize:14};
