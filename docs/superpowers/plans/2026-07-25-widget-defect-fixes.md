# Widget Defect Fixes (TSK-WEB-05: D1, D2, D7, Skip label) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the four confirmed ChatWidget defects from the TSK-WEB-04 re-audit: D1 (high-intent pages miss the 10s auto-open), D2 (resetSession keeps stale skipMsgCount), D7 (isMobile never updates on resize), and the "Skip" → "Not now" button label.

**Architecture:** The auto-open path predicate moves out of `components/ChatWidget.tsx` into a new pure module `lib/widget-paths.ts` so it can be unit-tested in the node-environment vitest setup (no jsdom in this repo — component state fixes are verified by typecheck + full suite + build instead). All other changes are surgical edits inside `ChatWidget.tsx`.

**Tech Stack:** Next.js 14, React 18, TypeScript, vitest (node environment, `@` alias = repo root).

## Global Constraints

- Branch: `claude/tsk-web-05-widget-fixes` created from `origin/main`. Draft PR at the end.
- Commit identity: `git -c user.email=noreply@anthropic.com -c user.name=Claude commit ...`; every commit message ends with the two standard trailers (Co-Authored-By + Claude-Session) used on this repo's recent commits.
- No copy changes beyond the "Not now" label — website PRD §4 red lines apply (no dollar figures, no DIM divisors, no transit promises).
- `npm run check:claims` output must be pasted into the PR body per `.github/pull_request_template.md`.
- Full suite (`npx vitest run`) green before every commit. 39 tests exist today; Task 1 adds more.

---

### Task 1: D1 — high-intent path predicate in `lib/widget-paths.ts`

**Files:**
- Create: `lib/widget-paths.ts`
- Test: `__tests__/widget-paths.test.ts`
- Modify: `components/ChatWidget.tsx:231` (the `shortDelay` line inside the auto-open effect)

**Interfaces:**
- Produces: `isHighIntentPath(pathname: string | null | undefined): boolean` — exported from `lib/widget-paths.ts`; also exports `HIGH_INTENT_PREFIXES: readonly string[]`.
- Consumes: nothing from other tasks.

- [ ] **Step 1: Write the failing test**

Create `__tests__/widget-paths.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { isHighIntentPath } from "@/lib/widget-paths";

describe("isHighIntentPath", () => {
  it.each([
    "/calculator",
    "/calculator/pallet",
    "/audit",
    "/big-and-bulky",
    "/heavy-3pl-comparison",
    "/heavy-goods",
  ])("returns true for high-intent path %s", (p) => {
    expect(isHighIntentPath(p)).toBe(true);
  });

  it.each(["/", "/blog", "/blog/heavy-tips", "/about", "/inquiry"])(
    "returns false for %s",
    (p) => {
      expect(isHighIntentPath(p)).toBe(false);
    }
  );

  it("returns false for null and undefined", () => {
    expect(isHighIntentPath(null)).toBe(false);
    expect(isHighIntentPath(undefined)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /workspace/shippingcow-nextjs && npx vitest run __tests__/widget-paths.test.ts`
Expected: FAIL — cannot resolve `@/lib/widget-paths`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/widget-paths.ts`:

```ts
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
```

Note: `/heavy` prefix intentionally covers `/heavy-3pl-comparison` and any future `/heavy-*` vertical pages. `/blog/heavy-tips` stays false because the prefix is anchored at the path start.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /workspace/shippingcow-nextjs && npx vitest run __tests__/widget-paths.test.ts`
Expected: PASS (13 cases).

- [ ] **Step 5: Wire into ChatWidget**

In `components/ChatWidget.tsx`, add to the imports near the top of the file:

```ts
import { isHighIntentPath } from '@/lib/widget-paths';
```

Then replace line 231:

```ts
      const shortDelay = pathname?.startsWith('/calculator') || pathname?.startsWith('/audit');
```

with:

```ts
      const shortDelay = isHighIntentPath(pathname);
```

- [ ] **Step 6: Full suite + typecheck**

Run: `cd /workspace/shippingcow-nextjs && npx vitest run && npx tsc --noEmit`
Expected: all tests PASS, no type errors.

- [ ] **Step 7: Commit**

```bash
git add lib/widget-paths.ts __tests__/widget-paths.test.ts components/ChatWidget.tsx
git commit -m "fix: widget 10s auto-open on all high-intent pages (D1)"
```

### Task 2: D2 — resetSession clears stale skipMsgCount

**Files:**
- Modify: `components/ChatWidget.tsx:269-286` (`resetSession`)

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: nothing used by other tasks.

- [ ] **Step 1: Add the missing state reset**

In `resetSession()`, after `setUserMsgCount(0);` (line 285), add:

```ts
    setSkipMsgCount(0);
```

Why: `skipMsgCount` records "user declined email capture at message N". After a full session reset it refers to a conversation that no longer exists, and the capture gate `newCount >= 4 && (skipMsgCount === 0 || newCount - skipMsgCount >= 2)` (line 329) wrongly delays capture in the fresh chat.

- [ ] **Step 2: Full suite + typecheck**

Run: `cd /workspace/shippingcow-nextjs && npx vitest run && npx tsc --noEmit`
Expected: all PASS (no component-level test exists — node-only vitest; correctness is the one-line state reset plus review).

- [ ] **Step 3: Commit**

```bash
git add components/ChatWidget.tsx
git commit -m "fix: reset skip counter with the rest of the chat session (D2)"
```

### Task 3: D7 + label — isMobile tracks resize; "Skip" → "Not now"

**Files:**
- Modify: `components/ChatWidget.tsx:150-162` (mount effect) and `components/ChatWidget.tsx:543` (button text)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing.

- [ ] **Step 1: Track viewport changes**

Replace the mount effect (lines 150–162):

```ts
  // Init session on mount only — never re-init on route change
  useEffect(() => {
    const sid = getOrCreateSessionId();
    setSessionId(sid);
    const ctx = getCalculatorContext();
    setCalcContext(ctx);
    setIsMobile(window.innerWidth < 768);

    const stored = loadMessages();
    if (stored.length > 0) {
      setMessages(stored);
    }
    // Opener is set below via the pathname effect
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
```

with:

```ts
  // Init session on mount only — never re-init on route change
  useEffect(() => {
    const sid = getOrCreateSessionId();
    setSessionId(sid);
    const ctx = getCalculatorContext();
    setCalcContext(ctx);

    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);

    const stored = loadMessages();
    if (stored.length > 0) {
      setMessages(stored);
    }
    // Opener is set below via the pathname effect
    return () => window.removeEventListener('resize', onResize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 2: Rename the decline button**

At line 543 (inside the capture-form button whose `onClick` is `() => { setSkipMsgCount(userMsgCount); setCaptureMode(false); }`), replace the text node:

```
                      Skip
```

with:

```
                      Not now
```

- [ ] **Step 3: Full suite + typecheck + build**

Run: `cd /workspace/shippingcow-nextjs && npx vitest run && npx tsc --noEmit && npm run build`
Expected: all PASS; build succeeds.

- [ ] **Step 4: Commit**

```bash
git add components/ChatWidget.tsx
git commit -m "fix: widget mobile icon tracks resize; soften capture decline label (D7)"
```

### Task 4: Ship — claims check, push, draft PR

**Files:**
- None created; PR body uses `.github/pull_request_template.md`.

- [ ] **Step 1: Claims check**

Run: `cd /workspace/shippingcow-nextjs && npm run check:claims`
Expected on this branch: only the pre-existing gated hits already dispositioned in PR #10 (comments/identifiers + the `$15M` badge on `app/page.tsx` = DEC-008). This PR adds none — `heavy` alone is not a restricted string. Paste full output into the PR body.

- [ ] **Step 2: Push and open draft PR**

```bash
git push -u origin claude/tsk-web-05-widget-fixes
```

Open a **draft** PR titled `fix(widget): TSK-WEB-05 — high-intent auto-open, session reset, resize icon` using the PR template: "What changed" = the four fixes with defect IDs; QA evidence = check:claims output pasted (checkbox ticked), mobile fold N/A (no layout change; note it), Lighthouse N/A (no layout change; note it). Reference the audit doc `logistar:shippingcow/website/audit_widget-reaudit_shippingcow_2026-07-25.md`.

- [ ] **Step 3: Subscribe to PR activity**

Subscribe the session to the new PR (house standard: watch, drive-to-green).
