'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';

export default function InviteMembers({ noteId }: { noteId: string }) {
  const [recipient, setRecipient] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await api<{ email: string; email_sent: boolean; invite_url: string; message: string }>(`/notes/${noteId}/invites`, {
        method: 'POST', body: JSON.stringify({ recipient: recipient.trim(), role }),
      });
      setMessage(result.email_sent ? `Invitation sent to ${result.email}` : `Invite created for ${result.email}, but email delivery is not configured yet.`);
      setRecipient('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send invitation');
    } finally { setBusy(false); }
  }

  return (
    <section className="noteos-invite-section">
      <div className="noteos-invite-heading">
        <div><strong>Invite people</strong><p>Collaborate on this note together</p></div>
      </div>
      <form className="noteos-invite-form" onSubmit={submit}>
        <input aria-label="Username or email" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Enter username or email" required />
        <select aria-label="Permission" value={role} onChange={e => setRole(e.target.value as 'editor' | 'viewer')}>
          <option value="editor">Can edit</option><option value="viewer">Can view</option>
        </select>
        <button type="submit" disabled={busy || !recipient.trim()}>{busy ? 'Sending…' : 'Invite'}</button>
      </form>
      <p className="noteos-invite-hint">Invitees must sign in with Google using the invited email address.</p>
      {message && <p className="noteos-invite-success" role="status">{message}</p>}
      {error && <p className="noteos-invite-error" role="alert">{error}</p>}
    </section>
  );
}
