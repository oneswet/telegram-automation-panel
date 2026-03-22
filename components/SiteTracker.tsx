'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function SiteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trackedPath = useRef<string | null>(null);

  useEffect(() => {
    // Prevent double-tracking on StrictMode dev or rapid re-renders
    if (trackedPath.current === pathname) return;
    
    // Optional: Avoid tracking internal admin dashboard navigations
    if (pathname?.startsWith('/dashboard')) return;

    trackedPath.current = pathname;
    const source = searchParams?.get('ref') || searchParams?.get('utm_source') || document.referrer || 'Direct';

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        path: pathname, 
        source, 
        details: document.title || 'Page Visit' 
      })
    }).catch(() => {
      // Fail silently to never interrupt user UX
    });
  }, [pathname, searchParams]);

  return null;
}
