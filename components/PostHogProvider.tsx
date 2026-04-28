'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

export default function PostHogProvider() {
  const pathname = usePathname();

  useEffect(() => {
    if (!POSTHOG_KEY) return;
    if (!posthog.__loaded) {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: false, // manual capture below
        loaded: (ph) => {
          if (process.env.NODE_ENV !== 'production') ph.opt_out_capturing();
        },
      });
    }
  }, []);

  useEffect(() => {
    if (!POSTHOG_KEY || !posthog.__loaded) return;
    posthog.capture('$pageview', { $current_url: window.location.href });
  }, [pathname]);

  return null;
}
