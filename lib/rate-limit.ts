// Simple in-memory rate limiter for auth endpoints.
// Resets per window — no external deps.

const windows = new Map<string, { count: number; resetAt: number }>();

/** Returns true if request should be rate-limited. */
export function isRateLimited(
  key: string,
  maxRequests: number = 10,
  windowSeconds: number = 60
): boolean {
  const now = Date.now();
  const entry = windows.get(key);

  if (!entry || now > entry.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return false;
  }

  if (entry.count >= maxRequests) return true;

  entry.count++;
  return false;
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of windows) {
    if (now > entry.resetAt) windows.delete(key);
  }
}, 5 * 60 * 1000);
