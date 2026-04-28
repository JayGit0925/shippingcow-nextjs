// Sentry instrumentation — no-ops without SENTRY_DSN.
export async function register() {
  if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    await import('@sentry/nextjs');
  }
}
