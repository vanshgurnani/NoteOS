'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import GoogleSignInButton from '../../components/GoogleSignInButton';
import { api, getSessionToken } from '@/lib/api';

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState('Sign in with the Google account that received this invitation.');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!getSessionToken()) return;
    setBusy(true);
    api<{ note_id: string; role: string }>(`/invites/${params.token}/accept`, { method: 'POST' })
      .then(result => router.replace(`/workspace?note=${result.note_id}`))
      .catch(err => setStatus(err instanceof Error ? err.message : 'This invitation could not be accepted.'))
      .finally(() => setBusy(false));
  }, [params.token, router]);

  return <main className="notion-auth-container"><section className="notion-auth-box">
    <Link href="/" className="notion-auth-brand"><span className="noteos-brand-lockup"><span className="noteos-brand-symbol">✦</span><span className="noteos-brand-word">NoteOS</span></span></Link>
    <h1 className="notion-auth-title">You’re invited</h1>
    <p className="notion-auth-subtitle">{busy ? 'Accepting your invitation…' : status}</p>
    {!getSessionToken() && <><GoogleSignInButton redirectTo={`/invite/${params.token}`} /><p className="notion-auth-footer">Use the exact Google email address the invitation was sent to.</p></>}
    <p className="notion-auth-footer"><Link href="/login">Sign in another way</Link></p>
  </section></main>;
}
