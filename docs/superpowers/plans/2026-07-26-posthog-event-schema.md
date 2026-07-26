# PostHog Event Schema (TSK-WEB-13, PRD F-1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One documented funnel — `$pageview → calculator_start → calculator_complete → audit_submitted → email_captured → qualified` — implemented in PostHog now, mirrored to GA4 post-GATE-ANALYTICS.

**Architecture:** A typed funnel module (`lib/funnel.ts`) sits on top of the thin `captureEvent` wrapper (`lib/analytics.ts`, byte-identical to the file PR #15 adds so both branches merge cleanly). Client components call typed helpers, never raw strings. The schema is documented in `docs/analytics/funnel-events.md`; static tests enforce that call sites exist and stay privacy-safe.

**Tech Stack:** Next.js 14 App Router, posthog-js (already installed, init in `components/PostHogProvider.tsx`), vitest.

## Global Constraints

- PRD F-1 funnel: `page_view → calculator_start → calculator_complete → audit_submit → email_captured (chat) → qualified`. Canonical PostHog names: `$pageview` (PostHog built-in, already fired by PostHogProvider) and `audit_submitted` (name already implemented on the PR #15 branch — fold in, do not invent a second audit event).
- `lib/analytics.ts` and `__tests__/analytics.test.ts` MUST be byte-identical to the versions on the PR #15 branch (commit ff4fc92) — identical file adds merge without conflict.
- Never send raw email addresses, dollar amounts, savings figures, or DIM divisor values (225/285/221) as PostHog event properties.
- `qualified` threshold = score ≥ 70, matching the server override in `app/api/chat/route.ts` (`msgCount >= 2 || qualify.score >= 70` — the score half).
- Do not modify `app/audit/**` or `app/api/audit/**` (PR #15 owns those files; touching them creates conflicts).
- No new dependencies.
- Commits as `git -c user.email=noreply@anthropic.com -c user.name=Claude commit`, short messages.

---

### Task 1: Analytics wrapper (byte-identical to PR #15)

**Files:**
- Create: `lib/analytics.ts`
- Test: `__tests__/analytics.test.ts`

**Interfaces:**
- Produces: `captureEvent(name: string, props?: Record<string, unknown>): void`

- [ ] **Step 1: Copy both files verbatim from the #15 head commit**

```bash
git show ff4fc92:lib/analytics.ts > lib/analytics.ts
git show ff4fc92:__tests__/analytics.test.ts > __tests__/analytics.test.ts
git diff --no-index <(git show ff4fc92:lib/analytics.ts) lib/analytics.ts && echo IDENTICAL
```

- [ ] **Step 2: Run the test**

Run: `npx vitest run __tests__/analytics.test.ts`
Expected: 4 tests PASS

- [ ] **Step 3: Commit**

```bash
git add lib/analytics.ts __tests__/analytics.test.ts
git commit -m "feat(analytics): thin captureEvent wrapper (identical to PR #15)"
```

### Task 2: Typed funnel module

**Files:**
- Create: `lib/funnel.ts`
- Test: `__tests__/funnel.test.ts`

**Interfaces:**
- Consumes: `captureEvent` from Task 1
- Produces: `FUNNEL_STAGES` (readonly tuple of 6 stage names in order), `QUALIFIED_SCORE_THRESHOLD = 70`, `trackCalculatorStart({first_field})`, `trackCalculatorComplete({used_zone_check, monthly_volume})`, `trackEmailCaptured({source})`, `trackQualified({score, intent?})`

- [ ] **Step 1: Write failing test** (`__tests__/funnel.test.ts`)

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const capture = vi.fn();
const posthogMock = { __loaded: true, capture };
vi.mock('posthog-js', () => ({ default: posthogMock }));

describe('lib/funnel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as Record<string, unknown>).window = {};
    posthogMock.__loaded = true;
  });

  it('declares the F-1 funnel stages in order', async () => {
    const { FUNNEL_STAGES } = await import('@/lib/funnel');
    expect(FUNNEL_STAGES).toEqual([
      '$pageview',
      'calculator_start',
      'calculator_complete',
      'audit_submitted',
      'email_captured',
      'qualified',
    ]);
  });

  it('qualified threshold matches the chat route override (70)', async () => {
    const { QUALIFIED_SCORE_THRESHOLD } = await import('@/lib/funnel');
    expect(QUALIFIED_SCORE_THRESHOLD).toBe(70);
    const fs = await import('node:fs');
    const route = fs.readFileSync('app/api/chat/route.ts', 'utf8');
    expect(route).toMatch(/qualify\.score >= 70/);
  });

  it('trackCalculatorStart fires calculator_start with first_field', async () => {
    const { trackCalculatorStart } = await import('@/lib/funnel');
    trackCalculatorStart({ first_field: 'length' });
    expect(capture).toHaveBeenCalledWith('calculator_start', { first_field: 'length' });
  });

  it('trackCalculatorComplete fires calculator_complete', async () => {
    const { trackCalculatorComplete } = await import('@/lib/funnel');
    trackCalculatorComplete({ used_zone_check: true, monthly_volume: 100 });
    expect(capture).toHaveBeenCalledWith('calculator_complete', { used_zone_check: true, monthly_volume: 100 });
  });

  it('trackEmailCaptured fires email_captured with source only (no email)', async () => {
    const { trackEmailCaptured } = await import('@/lib/funnel');
    trackEmailCaptured({ source: 'chat' });
    expect(capture).toHaveBeenCalledWith('email_captured', { source: 'chat' });
  });

  it('trackQualified fires qualified with score + intent', async () => {
    const { trackQualified } = await import('@/lib/funnel');
    trackQualified({ score: 82, intent: 'pricing' });
    expect(capture).toHaveBeenCalledWith('qualified', { score: 82, intent: 'pricing' });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run __tests__/funnel.test.ts`
Expected: FAIL — cannot resolve `@/lib/funnel`

- [ ] **Step 3: Implement `lib/funnel.ts`**

```ts
// F-1 funnel event schema (PRD WS-F). One documented funnel, in order:
//   $pageview → calculator_start → calculator_complete → audit_submitted
//   → email_captured → qualified
// $pageview is fired by components/PostHogProvider.tsx; audit_submitted (and
// the auxiliary audit_unlock_submitted) by the audit flow (PR #15). Everything
// funnel-shaped goes through these typed helpers — no raw event strings in
// components. Full schema: docs/analytics/funnel-events.md.
//
// Privacy rule: never pass raw email addresses, dollar amounts, or savings
// figures as event properties.
import { captureEvent } from './analytics';

export const FUNNEL_STAGES = [
  '$pageview',
  'calculator_start',
  'calculator_complete',
  'audit_submitted',
  'email_captured',
  'qualified',
] as const;

export type FunnelStage = (typeof FUNNEL_STAGES)[number];

// Must match the server-side override in app/api/chat/route.ts
// (`qualify.score >= 70`). A session is "qualified" the first time the ICP
// scorer returns a score at or above this.
export const QUALIFIED_SCORE_THRESHOLD = 70;

export function trackCalculatorStart(props: { first_field: string }): void {
  captureEvent('calculator_start', props);
}

export function trackCalculatorComplete(props: {
  used_zone_check: boolean;
  monthly_volume: number;
}): void {
  captureEvent('calculator_complete', props);
}

export function trackEmailCaptured(props: { source: 'chat' }): void {
  captureEvent('email_captured', props);
}

export function trackQualified(props: { score: number; intent?: string }): void {
  captureEvent('qualified', props);
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run __tests__/funnel.test.ts`
Expected: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/funnel.ts __tests__/funnel.test.ts
git commit -m "feat(analytics): typed F-1 funnel event schema"
```

### Task 3: Instrument the calculator

**Files:**
- Modify: `components/DimCalculator.tsx` (imports at top; started/completed refs near other refs ~line 137; onChange handlers of the 5 number inputs and 2 ZIP inputs; complete-fire inside the existing 800 ms debounce at ~line 170)
- Test: `__tests__/funnel-static.test.ts` (created here, extended in Task 4)

**Interfaces:**
- Consumes: `trackCalculatorStart`, `trackCalculatorComplete` from Task 2

Semantics: `calculator_start` fires once per mount on the first user edit of any input (dimension, weight, volume, or ZIP), with `first_field` naming that input. `calculator_complete` fires once per mount inside the existing debounced-recalc timeout, only after start has fired — the calculator renders results on mount with defaults, so the debounce alone is not evidence the user did anything.

- [ ] **Step 1: Write failing static test** (`__tests__/funnel-static.test.ts`)

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const calc = readFileSync('components/DimCalculator.tsx', 'utf8');

describe('funnel instrumentation: DimCalculator', () => {
  it('imports typed helpers from lib/funnel (no raw event strings)', () => {
    expect(calc).toMatch(/from '@\/lib\/funnel'/);
    expect(calc).not.toMatch(/captureEvent\(/);
  });

  it('fires calculator_start via trackCalculatorStart', () => {
    expect(calc).toMatch(/trackCalculatorStart\(/);
  });

  it('fires calculator_complete via trackCalculatorComplete, gated on start', () => {
    expect(calc).toMatch(/trackCalculatorComplete\(/);
    expect(calc).toMatch(/startedRef\.current && !completedRef\.current/);
  });

  it('sends no dollar or savings properties to the funnel', () => {
    const trackCalls = calc.match(/trackCalculator\w+\(\{[^}]*\}/g) ?? [];
    for (const call of trackCalls) {
      expect(call).not.toMatch(/savings|cost|price|\$/i);
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run __tests__/funnel-static.test.ts`
Expected: FAIL — DimCalculator has no funnel imports yet

- [ ] **Step 3: Instrument DimCalculator.tsx**

Add import after the constants import:

```ts
import { trackCalculatorStart, trackCalculatorComplete } from '@/lib/funnel';
```

Add refs + helper after `sessionIdRef` (~line 138):

```ts
  const startedRef = useRef(false);
  const completedRef = useRef(false);

  // Funnel: calculator_start fires once, on the first user edit of any input.
  function markStarted(field: string) {
    if (startedRef.current) return;
    startedRef.current = true;
    trackCalculatorStart({ first_field: field });
  }
```

Inside the existing debounced timeout (the one calling `saveToDb`), before `saveToDb(...)`:

```ts
        // Funnel: complete = results recomputed after a real user edit. The
        // mount-time run recalculates with defaults, so gate on startedRef.
        if (startedRef.current && !completedRef.current) {
          completedRef.current = true;
          trackCalculatorComplete({
            used_zone_check: originZip.length === 5 && destZip.length === 5,
            monthly_volume: volume,
          });
        }
```

(Add `originZip`, `destZip` to that effect's dependency array — they are read now.)

Wire `markStarted` into every input's onChange:
- dimension map inputs: `onChange={(e) => { markStarted(label); set(Number(e.target.value)); }}`
- weight: `onChange={(e) => { markStarted('weight'); setWeight(Number(e.target.value)); }}`
- volume: `onChange={(e) => { markStarted('volume'); setVolume(Number(e.target.value)); }}`
- origin ZIP: `onChange={(e) => { markStarted('origin_zip'); setOriginZip(...); }}` (keep existing sanitize)
- dest ZIP: `onChange={(e) => { markStarted('dest_zip'); setDestZip(...); }}` (keep existing sanitize)

- [ ] **Step 4: Run tests + typecheck**

Run: `npx vitest run __tests__/funnel-static.test.ts && rm -rf .next && npx tsc --noEmit`
Expected: PASS, no type errors

- [ ] **Step 5: Commit**

```bash
git add components/DimCalculator.tsx __tests__/funnel-static.test.ts
git commit -m "feat(calculator): fire calculator_start / calculator_complete funnel events"
```

### Task 4: Instrument the chat widget

**Files:**
- Modify: `components/ChatWidget.tsx` (import at top; `markQualified` helper near `fireEvent` ~line 243; call in `doSend` after `data` parsed ~line 330; call in `submitEmail` success ~line 370)
- Modify: `__tests__/funnel-static.test.ts` (append ChatWidget + PostHogProvider + doc describe blocks)

**Interfaces:**
- Consumes: `trackEmailCaptured`, `trackQualified`, `QUALIFIED_SCORE_THRESHOLD` from Task 2

Semantics: `email_captured` fires on successful chat email submit with `{ source: 'chat' }` — never the address itself (the address goes to Supabase via the existing PATCH, not to PostHog). `qualified` fires once per browser session (sessionStorage guard `sc_qualified`) when the chat API's ICP score reaches the threshold; it also logs to the existing internal `/api/chat/events` pipe, whose allowlist already contains `qualified` but which nothing fires today.

- [ ] **Step 1: Extend the static test** (append to `__tests__/funnel-static.test.ts`)

```ts
const chat = readFileSync('components/ChatWidget.tsx', 'utf8');
const provider = readFileSync('components/PostHogProvider.tsx', 'utf8');
const doc = readFileSync('docs/analytics/funnel-events.md', 'utf8');

describe('funnel instrumentation: ChatWidget', () => {
  it('fires email_captured via trackEmailCaptured with source only', () => {
    expect(chat).toMatch(/trackEmailCaptured\(\{ source: 'chat' \}\)/);
  });

  it('never passes the email address to PostHog', () => {
    expect(chat).not.toMatch(/trackEmailCaptured\([^)]*email/i);
    expect(chat).not.toMatch(/captureEvent\(/);
  });

  it('fires qualified against the shared threshold with a session guard', () => {
    expect(chat).toMatch(/QUALIFIED_SCORE_THRESHOLD/);
    expect(chat).toMatch(/trackQualified\(/);
    expect(chat).toMatch(/sc_qualified/);
  });

  it('mirrors qualified into the internal chat-events pipe', () => {
    expect(chat).toMatch(/fireEvent\('qualified'/);
  });
});

describe('funnel stage 1: PostHogProvider', () => {
  it('still fires $pageview on route change', () => {
    expect(provider).toMatch(/\$pageview/);
  });
});

describe('funnel schema doc', () => {
  it('documents all six stages in order', () => {
    const idx = [
      '$pageview',
      'calculator_start',
      'calculator_complete',
      'audit_submitted',
      'email_captured',
      'qualified',
    ].map((s) => doc.indexOf(s));
    for (const i of idx) expect(i).toBeGreaterThan(-1);
    expect([...idx]).toEqual([...idx].sort((a, b) => a - b));
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run __tests__/funnel-static.test.ts`
Expected: FAIL — ChatWidget untouched, doc missing (readFileSync throws → write the doc in Task 5 Step 1 first if preferred; acceptable to see ENOENT here)

- [ ] **Step 3: Instrument ChatWidget.tsx**

Import after the types import:

```ts
import { trackEmailCaptured, trackQualified, QUALIFIED_SCORE_THRESHOLD } from '@/lib/funnel';
```

Helper after `fireEvent` (~line 250):

```ts
  // Funnel: qualified fires once per browser session, the first time the ICP
  // scorer returns score >= QUALIFIED_SCORE_THRESHOLD. Mirrored to the
  // internal chat-events pipe (its allowlist already includes 'qualified').
  function markQualified(score: number, intent?: string) {
    try {
      if (sessionStorage.getItem('sc_qualified') === '1') return;
      sessionStorage.setItem('sc_qualified', '1');
    } catch {}
    trackQualified({ score, intent });
    fireEvent('qualified', { score });
  }
```

In `doSend`, after `const data = await res.json();` and the `!res.ok` return — right after the reply is appended:

```ts
      const score = data.qualify?.score;
      if (typeof score === 'number' && score >= QUALIFIED_SCORE_THRESHOLD) {
        markQualified(score, data.qualify?.intent);
      }
```

In `submitEmail`, next to the existing `fireEvent('email_captured', ...)`:

```ts
      trackEmailCaptured({ source: 'chat' });
```

(Leave the existing internal `fireEvent('email_captured', { email: emailInput })` as-is — that pipe is first-party Supabase, not PostHog.)

- [ ] **Step 4: Run tests + typecheck** (doc test still red until Task 5)

Run: `npx vitest run __tests__/funnel-static.test.ts && rm -rf .next && npx tsc --noEmit`
Expected: ChatWidget/PostHogProvider blocks PASS; doc block may still FAIL (ENOENT) until Task 5

- [ ] **Step 5: Commit**

```bash
git add components/ChatWidget.tsx __tests__/funnel-static.test.ts
git commit -m "feat(chat): fire email_captured + qualified funnel events"
```

### Task 5: Schema documentation

**Files:**
- Create: `docs/analytics/funnel-events.md`

**Interfaces:**
- Consumes: everything above; this is the human-readable contract F-1 asks for.

- [ ] **Step 1: Write `docs/analytics/funnel-events.md`**

Content requirements (write full prose, one section per stage, stages in funnel order so the ordering test passes):
1. Title + one-line purpose: PRD F-1, one documented funnel, PostHog now, GA4 mirror after GATE-ANALYTICS.
2. Funnel table: stage order, PostHog event name, where it fires (file), trigger, properties.
   - `$pageview` — components/PostHogProvider.tsx, every route change, `$current_url`.
   - `calculator_start` — components/DimCalculator.tsx, first user edit of any input, `{ first_field }`, once per mount.
   - `calculator_complete` — components/DimCalculator.tsx, debounced recalc after a user edit, `{ used_zone_check, monthly_volume }`, once per mount.
   - `audit_submitted` — app/audit/page.tsx (lands with PR #15), audit form submit, `{ shipment_count }`. PRD name `audit_submit` maps to this implemented name.
   - `email_captured` — components/ChatWidget.tsx, successful chat email submit, `{ source: 'chat' }`. Raw address never sent to PostHog.
   - `qualified` — components/ChatWidget.tsx, first ICP score ≥ 70 (threshold shared with app/api/chat/route.ts), `{ score, intent }`, once per browser session (`sc_qualified` guard); mirrored to the internal `/api/chat/events` pipe.
3. Auxiliary (non-funnel) events: `audit_unlock_submitted` (PR #15); internal Supabase chat events (`widget_opened`, `widget_auto_opened`, `first_message`, `handoff_slack`, `session_end`) — first-party pipe, not PostHog.
4. Privacy + claims rules: no raw emails, no dollar/savings figures, no DIM divisor values as event properties; production-only capture (PostHogProvider opts out outside production).
5. GA4 mirror plan: post-GATE-ANALYTICS, same names snake_case, `$pageview` → GA4 `page_view`; reconcile counts per PRD C-4.

- [ ] **Step 2: Run the full suite**

Run: `npx vitest run`
Expected: all tests PASS (32 baseline + 4 analytics + 6 funnel + ~9 static = ~51)

- [ ] **Step 3: Commit**

```bash
git add docs/analytics/funnel-events.md
git commit -m "docs(analytics): F-1 funnel event schema"
```

### Task 6: Verification & PR

- [ ] **Step 1: Full verification**

Run: `rm -rf .next && npx tsc --noEmit && npm run build && npx vitest run`
Expected: clean typecheck, successful build, all tests green

- [ ] **Step 2: Claims grep**

Run: `grep -riE "DIM ?(225|285|221)|÷ ?(225|285|221)|2.day|two.day|zero shrinkage|guaranteed deliver|\$15M|80% off" lib/funnel.ts docs/analytics/ components/DimCalculator.tsx components/ChatWidget.tsx __tests__/funnel*.test.ts`
Expected: no hits (pre-existing dispositioned hits in lib/constants.ts comments are out of scope)

- [ ] **Step 3: Push branch, open draft PR with QA evidence, subscribe**
