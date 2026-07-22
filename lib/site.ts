// Canonical public origin for ShippingCow.
//
// shippingcow.ai is the live main domain. shippingcow.com is currently a broken
// GoDaddy forwarding self-loop, so it must never be emitted as canonical/og:url.
// The Vercel env NEXT_PUBLIC_SITE_URL is still set to https://shippingcow.com —
// that needs a Vercel env flip by sc-devops. Until then this guard keeps the
// code output safe regardless of the env value.
const BROKEN_ORIGINS = ['shippingcow.com', 'www.shippingcow.com'];

export const CANONICAL_SITE_URL = 'https://shippingcow.ai';

function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return CANONICAL_SITE_URL;
  try {
    const host = new URL(raw).hostname.toLowerCase();
    if (BROKEN_ORIGINS.includes(host)) return CANONICAL_SITE_URL;
    return raw.replace(/\/$/, '');
  } catch {
    return CANONICAL_SITE_URL;
  }
}

export const SITE_URL = resolveSiteUrl();
