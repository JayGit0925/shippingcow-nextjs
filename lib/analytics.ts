// Thin PostHog wrapper: safe to call from any client component. No-ops
// server-side, before posthog.init (PostHogProvider), and when
// NEXT_PUBLIC_POSTHOG_KEY is unset — so callers never need to guard.
import posthog from 'posthog-js';

export function captureEvent(name: string, props?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  if (!posthog.__loaded) return;
  try {
    posthog.capture(name, props);
  } catch {
    // Analytics must never break the funnel.
  }
}
