'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;

    let registration: ServiceWorkerRegistration | undefined;
    let cancelled = false;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((result) => {
        registration = result;
        if (!cancelled) {
          result.update().catch(() => {
            // A failed background update should not affect the current session.
          });
        }
      })
      .catch((error: unknown) => {
        console.error('NOTE OS service worker registration failed:', error);
      });

    return () => {
      cancelled = true;
      void registration;
    };
  }, []);

  return null;
}
