'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/?view=dashboard');
  }, [router]);

  return (
    <div className="notion-loading-screen">
      <span className="notion-spinner" />
      <p>Loading Workspace Dashboard…</p>
    </div>
  );
}
