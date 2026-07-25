// Pages where a visitor has already shown buying intent — the chat widget
// auto-opens after 10s here instead of the default 30s (TSK-WEB-04 defect D1).
export const HIGH_INTENT_PREFIXES = [
  "/calculator",
  "/audit",
  "/big-and-bulky",
  "/heavy",
] as const;

export function isHighIntentPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return HIGH_INTENT_PREFIXES.some((p) => pathname.startsWith(p));
}
