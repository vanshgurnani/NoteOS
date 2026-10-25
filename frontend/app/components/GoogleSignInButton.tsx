'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { api, saveSession, User } from '@/lib/api';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, string | number>) => void;
        };
      };
    };
  }
}

export default function GoogleSignInButton({ redirectTo = '/workspace' }: { redirectTo?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!ready || !clientId || !window.google || !ref.current) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        setError('');
        try {
          const result = await api<{ token: string; user: User }>('/auth/google', {
            method: 'POST',
            body: JSON.stringify({ credential }),
          });
          saveSession(result.token, result.user);
          router.push(redirectTo);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Google sign-in failed');
        }
      },
    });
    ref.current.innerHTML = '';
    window.google.accounts.id.renderButton(ref.current, {
      type: 'standard', theme: 'outline', size: 'large', shape: 'rectangular',
      text: 'continue_with', width: 340,
    });
  }, [ready, clientId, router, redirectTo]);

  if (!clientId) return <p className="notion-auth-google-hint">Google Sign-In will be available after Google Cloud is configured.</p>;

  return (
    <div className="notion-google-signin">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setReady(true)} />
      <div ref={ref} />
      {error && <p className="notion-auth-error" role="alert">{error}</p>}
    </div>
  );
}
