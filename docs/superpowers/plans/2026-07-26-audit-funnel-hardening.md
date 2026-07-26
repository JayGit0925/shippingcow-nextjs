# Audit Funnel Hardening Implementation Plan (TSK-WEB-09, PRD A-1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The free cost audit — the #1 conversion path — must never silently fail: captured emails become durable lead rows, email-delivery failures surface a retry UI, server failures log to Sentry, and submit events fire in PostHog.

**Architecture:** Server hardening lands in `/api/audit/unlock` (lead persistence, awaited email send, rate limit, Sentry) and `/api/audit` (Sentry on catch paths). Client hardening lands in `app/audit/page.tsx` (retry without re-upload, PostHog submit event) and `ReportView.tsx` (email-failure banner + resend). All new logic that tests need lives in `.ts` files (vitest is node-env and cannot parse `.tsx`); `.tsx` wiring is asserted via `readFileSync` static tests, the established pattern in `__tests__/vertical-pages-static.test.ts`.

**Tech Stack:** Next.js 14 App Router, vitest (node env, `@` alias = repo root), `@sentry/nextjs` (already configured, no-ops without DSN), `posthog-js` (already initialized in `PostHogProvider`, no-ops without `NEXT_PUBLIC_POSTHOG_KEY`), existing `lib/rate-limit.ts`, existing `lib/db.ts` lead helpers.

## Global Constraints

- Red lines (website PRD §4): no DIM divisor values (225/285/221) in rendered copy; no dollar figures pre-GATE-DIM; no transit/SLA promises; no unsourced numbers. New UI strings in this plan are neutral status copy only ("We couldn't send your email copy. The report below is still yours." etc.) — no claims.
- Jay decision 7 (2026-07-22): possession of an audit ID is NOT authentication; dollar fields stay redacted for anonymous callers. Nothing in this plan changes redaction.
- The unlock email (`sendAuditReport`) quotes no savings figure — untouched.
- Existing emails, Slack alert, and CRM behavior stay intact; hardening is additive.
- The A-1 "staging test with real inbox" AC requires production env vars (`RESEND_API_KEY`, `INQUIRY_TO_EMAIL`, `SLACK_WEBHOOK_URL`, `SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_KEY`) which live in Vercel — that verification step is the founder's, documented in the PR body. This plan makes every failure observable so that test is meaningful.
- The "link valid ≥ 30 days" AC is satisfied structurally: `audits` rows have no TTL/cleanup and `getAudit` applies no date filter — asserted by a static test in Task 1 so a future cleanup job can't silently break it.
- Commit as `git -c user.email=noreply@anthropic.com -c user.name=Claude`; no model IDs in pushed artifacts.

---

### Task 1: Unlock route hardening — lead row, awaited email, rate limit, Sentry

**Files:**
- Modify: `lib/db.ts` (add `linkAuditLead` after `saveAudit`/`getAudit`, ~line 527)
- Modify: `app/api/audit/unlock/route.ts` (full rewrite of POST)
- Test: `__tests__/audit-unlock-route.test.ts` (new)

**Interfaces:**
- Consumes: `createLead({step1_data, source_url})` and `getAudit(id)` from `lib/db.ts`; `sendAuditReport(to, auditId, siteUrl)` from `lib/email.ts` (returns `{ok:true} | {ok:false; error}`); `isRateLimited(key, max, windowSeconds)` from `lib/rate-limit.ts`.
- Produces: `linkAuditLead(auditId: string, leadId: string): Promise<void>`; unlock response shape `{ok: true, email_sent: boolean}` — Task 3's ReportView relies on `email_sent`.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/audit-unlock-route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// A-1 hardening (TSK-WEB-09): the unlock POST is the funnel's lead-capture
// moment. It must (a) persist a lead row, (b) report email delivery honestly,
// (c) rate-limit per IP, (d) log failures to Sentry. lib/db is mocked — no
// real database is reachable here (CURRENT_STATE.md DATABASE_URL blocker).

const getAudit = vi.fn();
const createLead = vi.fn();
const linkAuditLead = vi.fn();
vi.mock('@/lib/db', () => ({ getAudit, createLead, linkAuditLead }));

const sendAuditReport = vi.fn();
vi.mock('@/lib/email', () => ({ sendAuditReport }));

const isRateLimited = vi.fn();
vi.mock('@/lib/rate-limit', () => ({ isRateLimited }));

const captureException = vi.fn();
vi.mock('@sentry/nextjs', () => ({ captureException }));

const AUDIT_ID = '123e4567-e89b-42d3-a456-426614174000';
const AUDIT_ROW = { id: AUDIT_ID, total_savings: 100 };

function makeReq(body: unknown) {
  return new Request('http://test/api/audit/unlock', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/audit/unlock (A-1 hardening)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isRateLimited.mockReturnValue(false);
    getAudit.mockResolvedValue(AUDIT_ROW);
    createLead.mockResolvedValue({ id: 'lead-1' });
    linkAuditLead.mockResolvedValue(undefined);
    sendAuditReport.mockResolvedValue({ ok: true });
  });

  it('creates a lead row from the captured email and links it to the audit', async () => {
    const { POST } = await import('@/app/api/audit/unlock/route');
    const res = await POST(makeReq({ email: 'buyer@example.com', audit_id: AUDIT_ID }));
    expect(res.status).toBe(200);
    expect(createLead).toHaveBeenCalledTimes(1);
    const arg = createLead.mock.calls[0][0];
    expect(arg.step1_data.email).toBe('buyer@example.com');
    expect(arg.step1_data.audit_id).toBe(AUDIT_ID);
    expect(arg.source_url).toBe('/audit');
    expect(linkAuditLead).toHaveBeenCalledWith(AUDIT_ID, 'lead-1');
  });

  it('reports email delivery honestly: email_sent true on success', async () => {
    const { POST } = await import('@/app/api/audit/unlock/route');
    const res = await POST(makeReq({ email: 'buyer@example.com', audit_id: AUDIT_ID }));
    const json = await res.json();
    expect(json).toEqual({ ok: true, email_sent: true });
  });

  it('reports email_sent false (still 200) when the send fails, and captures to Sentry', async () => {
    sendAuditReport.mockResolvedValue({ ok: false, error: 'resend down' });
    const { POST } = await import('@/app/api/audit/unlock/route');
    const res = await POST(makeReq({ email: 'buyer@example.com', audit_id: AUDIT_ID }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true, email_sent: false });
    expect(captureException).toHaveBeenCalled();
  });

  it('still succeeds (and captures to Sentry) when lead persistence throws — email capture must not 500', async () => {
    createLead.mockRejectedValue(new Error('db down'));
    const { POST } = await import('@/app/api/audit/unlock/route');
    const res = await POST(makeReq({ email: 'buyer@example.com', audit_id: AUDIT_ID }));
    expect(res.status).toBe(200);
    expect(captureException).toHaveBeenCalled();
    expect(sendAuditReport).toHaveBeenCalled(); // email still goes out
  });

  it('rate-limits per IP with 429', async () => {
    isRateLimited.mockReturnValue(true);
    const { POST } = await import('@/app/api/audit/unlock/route');
    const res = await POST(makeReq({ email: 'buyer@example.com', audit_id: AUDIT_ID }));
    expect(res.status).toBe(429);
    expect(sendAuditReport).not.toHaveBeenCalled();
    expect(createLead).not.toHaveBeenCalled();
  });

  it('404s on unknown audit without creating a lead', async () => {
    getAudit.mockResolvedValue(undefined);
    const { POST } = await import('@/app/api/audit/unlock/route');
    const res = await POST(makeReq({ email: 'buyer@example.com', audit_id: AUDIT_ID }));
    expect(res.status).toBe(404);
    expect(createLead).not.toHaveBeenCalled();
  });

  it('400s on invalid body', async () => {
    const { POST } = await import('@/app/api/audit/unlock/route');
    const res = await POST(makeReq({ email: 'not-an-email', audit_id: 'nope' }));
    expect(res.status).toBe(400);
  });
});

describe('report link longevity (A-1: valid ≥ 30 days)', () => {
  it('getAudit has no TTL/date filter and no cleanup job exists', async () => {
    const { readFileSync } = await import('node:fs');
    const db = readFileSync('lib/db.ts', 'utf8');
    const getAuditSrc = db.slice(db.indexOf('export async function getAudit'));
    const fnBody = getAuditSrc.slice(0, getAuditSrc.indexOf('}'));
    expect(fnBody).not.toMatch(/INTERVAL|created_at\s*[<>]|expires/i);
    expect(db).not.toMatch(/DELETE FROM audits/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /workspace/shippingcow-nextjs && npx vitest run __tests__/audit-unlock-route.test.ts`
Expected: FAIL — `linkAuditLead` is not exported from `@/lib/db` mock target mismatch aside, the route neither calls `createLead` nor returns `email_sent` (first two tests fail on mock-call assertions; rate-limit test fails because the route imports no rate limiter).

- [ ] **Step 3: Implement `linkAuditLead` in lib/db.ts**

Append after `getAudit` (end of Audit helpers section):

```ts
export async function linkAuditLead(auditId: string, leadId: string): Promise<void> {
  await sql`
    UPDATE audits SET lead_id = ${leadId} WHERE id = ${auditId}
  `;
}
```

- [ ] **Step 4: Rewrite app/api/audit/unlock/route.ts**

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { sendAuditReport } from '@/lib/email';
import { getAudit, createLead, linkAuditLead } from '@/lib/db';
import { isRateLimited } from '@/lib/rate-limit';
import { SITE_URL } from '@/lib/site';

const bodySchema = z.object({
  email: z.string().email(),
  audit_id: z.string().uuid(),
});

// A-1 hardening (TSK-WEB-09): this POST is the audit funnel's lead-capture
// moment. The captured email must survive even if Slack/Resend are down, and
// the caller must learn whether their email copy actually went out.
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited(`audit-unlock:${ip}`, 10, 3600)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { email, audit_id } = parsed.data;

  // Verify audit exists; trust DB, never client input. The savings figure below
  // is INTERNAL ONLY — it goes to our Slack alert, never to the customer email.
  const audit = await getAudit(audit_id);
  if (!audit) {
    return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
  }

  // Persist the lead FIRST — the email address must not depend on Slack or
  // Resend being up. A lead-write failure is logged, not surfaced: losing the
  // row is bad, but refusing the prospect their report is worse.
  try {
    const lead = await createLead({
      step1_data: { email, audit_id, source: 'audit_unlock' },
      source_url: '/audit',
    });
    await linkAuditLead(audit_id, lead.id);
  } catch (err) {
    Sentry.captureException(err);
    console.error('[audit/unlock] lead persist error:', err);
  }

  // Awaited (was fire-and-forget): the client shows a resend UI on failure.
  let email_sent = false;
  try {
    const sent = await sendAuditReport(email, audit_id, SITE_URL);
    email_sent = sent.ok;
    if (!sent.ok) {
      Sentry.captureException(new Error(`[audit/unlock] report email failed: ${sent.error}`));
    }
  } catch (err) {
    Sentry.captureException(err);
    console.error('[audit/unlock] email error:', err);
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (webhookUrl) {
    const annual_savings = Number(audit.total_savings) * 12;
    const savings = `$${Math.round(annual_savings).toLocaleString()}/yr`;
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🔓 *Audit report unlocked* — ${email} | ${savings} | audit_id: ${audit_id}`,
      }),
    }).catch((e) => console.error('[audit/unlock] slack error:', e));
  }

  return NextResponse.json({ ok: true, email_sent });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd /workspace/shippingcow-nextjs && npx vitest run __tests__/audit-unlock-route.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 6: Full suite + typecheck**

Run: `cd /workspace/shippingcow-nextjs && npx vitest run && npx tsc --noEmit`
Expected: all suites pass (32 baseline + 8 new), tsc clean

- [ ] **Step 7: Commit**

```bash
git add lib/db.ts app/api/audit/unlock/route.ts __tests__/audit-unlock-route.test.ts
git -c user.email=noreply@anthropic.com -c user.name=Claude commit -m "feat(audit): persist unlock email as lead row, honest email_sent, rate limit, Sentry (TSK-WEB-09 T1)"
```

---

### Task 2: Sentry on /api/audit failure paths + PostHog capture helper

**Files:**
- Create: `lib/analytics.ts`
- Modify: `app/api/audit/route.ts` (three catch paths)
- Test: `__tests__/analytics.test.ts` (new), extend `__tests__/audit-route.test.ts` (Sentry mock + one test)

**Interfaces:**
- Consumes: `posthog-js` default export (`posthog.__loaded`, `posthog.capture`).
- Produces: `captureEvent(name: string, props?: Record<string, unknown>): void` — Task 3's client components call this; safe to call anywhere (no-ops server-side and when PostHog isn't loaded).

- [ ] **Step 1: Write the failing tests**

```ts
// __tests__/analytics.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// captureEvent must be safe to call from any component in any environment:
// no-op without a browser, no-op before posthog.init, never throws.

const capture = vi.fn();
const posthogMock = { __loaded: false, capture };
vi.mock('posthog-js', () => ({ default: posthogMock }));

describe('lib/analytics captureEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    posthogMock.__loaded = false;
    // vitest node env has no window
    // @ts-expect-error cleanup between tests
    delete globalThis.window;
  });

  it('no-ops when window is undefined (server)', async () => {
    posthogMock.__loaded = true;
    const { captureEvent } = await import('@/lib/analytics');
    captureEvent('audit_submitted', { shipment_count: 3 });
    expect(capture).not.toHaveBeenCalled();
  });

  it('no-ops when posthog is not loaded', async () => {
    (globalThis as Record<string, unknown>).window = {};
    const { captureEvent } = await import('@/lib/analytics');
    captureEvent('audit_submitted');
    expect(capture).not.toHaveBeenCalled();
  });

  it('captures name + props when loaded in a browser', async () => {
    (globalThis as Record<string, unknown>).window = {};
    posthogMock.__loaded = true;
    const { captureEvent } = await import('@/lib/analytics');
    captureEvent('audit_submitted', { shipment_count: 3 });
    expect(capture).toHaveBeenCalledWith('audit_submitted', { shipment_count: 3 });
  });

  it('never throws even if posthog.capture throws', async () => {
    (globalThis as Record<string, unknown>).window = {};
    posthogMock.__loaded = true;
    capture.mockImplementation(() => { throw new Error('boom'); });
    const { captureEvent } = await import('@/lib/analytics');
    expect(() => captureEvent('audit_submitted')).not.toThrow();
  });
});
```

Extend `__tests__/audit-route.test.ts`: add at the top with the other mocks —

```ts
const captureException = vi.fn();
vi.mock('@sentry/nextjs', () => ({ captureException }));
```

and add this test inside the existing `describe` (uses the file's existing `makeReq`-style helpers; follow the local conventions in that file):

```ts
it('captures to Sentry when the DB save fails (report still returned)', async () => {
  const db = await import('@/lib/db');
  (db.saveAudit as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('db down'));
  const { POST } = await import('@/app/api/audit/route');
  const res = await POST(new Request('http://test/api/audit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ shipments: [{ origin_zip: '08901', dest_zip: '90210', length: 30, width: 24, height: 20, weight: 85, quantity: 1 }] }),
  }));
  expect(res.status).toBe(200);
  expect(captureException).toHaveBeenCalled();
});
```

(If the existing suite mocks `analyzeShipment` differently, reuse its fixtures — the assertion that matters is `captureException` fired while status stayed 200.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/analytics.test.ts __tests__/audit-route.test.ts`
Expected: analytics FAILS (`lib/analytics` doesn't exist); the new audit-route test FAILS (`captureException` never called).

- [ ] **Step 3: Implement lib/analytics.ts**

```ts
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
```

- [ ] **Step 4: Add Sentry to app/api/audit/route.ts**

Add import: `import * as Sentry from '@sentry/nextjs';`

Three catch paths:
- GET catch (`console.error('[audit get]', err)`) → add `Sentry.captureException(err);` above the console line.
- POST db-save catch (`console.error('[audit] DB save error:', dbErr)`) → add `Sentry.captureException(dbErr);`.
- POST outer catch (`console.error('[audit]', err)`) → add `Sentry.captureException(err);`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run __tests__/analytics.test.ts __tests__/audit-route.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/analytics.ts app/api/audit/route.ts __tests__/analytics.test.ts __tests__/audit-route.test.ts
git -c user.email=noreply@anthropic.com -c user.name=Claude commit -m "feat(audit): Sentry capture on audit route failures + safe PostHog event helper (TSK-WEB-09 T2)"
```

---

### Task 3: Client retry UI + submit events

**Files:**
- Modify: `app/audit/page.tsx` (retry without re-upload; `audit_submitted` event)
- Modify: `app/audit/_components/ReportView.tsx` (`email_sent:false` banner + resend button; `audit_unlock_submitted` event)
- Test: `__tests__/audit-client-static.test.ts` (new, readFileSync pattern)

**Interfaces:**
- Consumes: `captureEvent` from `lib/analytics.ts` (Task 2); unlock response `{ok, email_sent}` (Task 1).
- Produces: user-visible behavior only.

- [ ] **Step 1: Write the failing static test**

```ts
// __tests__/audit-client-static.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// vitest here is node-env and its transform cannot parse .tsx imports, so
// client wiring is asserted statically (same pattern as vertical-pages-static).
const root = join(__dirname, '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');

describe('audit page failure path (A-1: retry UI)', () => {
  const src = () => read('app/audit/page.tsx');

  it('keeps the parsed preview on failure so retry does not require re-upload', () => {
    // runAudit failure states must carry the preview forward
    expect(src()).toMatch(/type:\s*'upload',\s*error[\s\S]{0,120}preview/);
  });

  it('fires the PostHog submit event', () => {
    expect(src()).toContain("captureEvent('audit_submitted'");
  });
});

describe('unlock gate failure path (A-1: retry UI)', () => {
  const src = () => read('app/audit/_components/ReportView.tsx');

  it('reads email_sent from the unlock response and stores a failure flag', () => {
    expect(src()).toMatch(/email_sent/);
    expect(src()).toMatch(/emailFailed|email_failed/);
  });

  it('offers a resend action when the email copy failed', () => {
    expect(src()).toMatch(/Resend/i);
  });

  it('fires the PostHog unlock event', () => {
    expect(src()).toContain("captureEvent('audit_unlock_submitted'");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/audit-client-static.test.ts`
Expected: FAIL — none of the patterns exist yet.

- [ ] **Step 3: Implement app/audit/page.tsx changes**

1. Add import: `import { captureEvent } from '@/lib/analytics';`
2. In `runAudit()`, keep the preview alive on every failure path and fire the submit event on success. Replace the body after `setState({type: 'processing', count: shipments.length});` with:

```tsx
    // On failure, keep the parsed preview so retry is one click — the
    // prospect must never have to re-upload their file (PRD A-1 retry UI).
    const failBack = (error: string) =>
      setState({type: 'upload', error, preview: {rows: shipments.slice(0, 5), count: shipments.length}});
    try {
      const res = await fetch('/api/audit', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({shipments})});
      if (!res.ok) { const err = await res.json(); failBack(err.error || 'Analysis failed'); return; }
      const report = await res.json();
      captureEvent('audit_submitted', { shipment_count: shipments.length });
      setState({type: 'report', report, auditId: report.id});
      sessionStorage.removeItem('audit_shipments');
    } catch (err) {
      failBack(err instanceof Error ? err.message : 'Error');
    }
```

3. In `UploadView`, when both `error` and `preview` are present the existing render already shows the error box above the preview table with its Run button — verify visually that the retry affordance appears (error div renders before preview block; both are independent conditionals, no code change needed).

- [ ] **Step 4: Implement ReportView.tsx changes**

1. Add import: `import { captureEvent } from '@/lib/analytics';`
2. Add state next to the other gate states: `const [emailFailed, setEmailFailed] = useState(false);`
3. Replace the body of `handleGateSubmit`'s `try` block:

```tsx
      const res = await fetch('/api/audit/unlock', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        // No annual_savings sent: the unlock email must not quote a savings figure.
        body: JSON.stringify({email: gateEmail, audit_id: auditId}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGateError(json.error || 'Something went wrong. Try again.');
        return;
      }
      captureEvent('audit_unlock_submitted');
      setEmailFailed(json.email_sent === false);
      setUnlocked(true);
```

4. Inside the `{unlocked && <>` block, render the failure banner first:

```tsx
          {emailFailed && (
            <div style={{background: '#FEF3C7', border: '2px solid #D97706', color: '#78350F', padding: '1rem', borderRadius: '6px', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap'}}>
              <span>We couldn&apos;t send your email copy — the report below is still yours.</span>
              <button
                className="btn"
                disabled={gateSubmitting}
                onClick={async () => {
                  setGateSubmitting(true);
                  try {
                    const res = await fetch('/api/audit/unlock', {
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({email: gateEmail, audit_id: auditId}),
                    });
                    const json = await res.json().catch(() => ({}));
                    if (res.ok && json.email_sent !== false) setEmailFailed(false);
                  } catch {
                    // stays failed; banner remains
                  } finally {
                    setGateSubmitting(false);
                  }
                }}
                style={{padding: '0.5rem 1rem', whiteSpace: 'nowrap'}}
              >
                {gateSubmitting ? '...' : 'Resend email'}
              </button>
            </div>
          )}
```

- [ ] **Step 5: Run tests, typecheck, build**

Run: `npx vitest run && npx tsc --noEmit && npm run build`
Expected: full suite passes, tsc clean, build succeeds.

- [ ] **Step 6: Claims grep over changed files**

Run: `grep -rniE "DIM ?(225|285|221)|÷ ?(225|285|221)|2.day|two.day|zero shrinkage|guaranteed deliver|\$15M|80% off" app/audit app/api/audit lib/analytics.ts`
Expected: no new rendered-copy hits (pre-existing identifier/comment hits only, if any).

- [ ] **Step 7: Commit**

```bash
git add app/audit/page.tsx app/audit/_components/ReportView.tsx __tests__/audit-client-static.test.ts
git -c user.email=noreply@anthropic.com -c user.name=Claude commit -m "feat(audit): retry without re-upload, resend-email banner, submit events (TSK-WEB-09 T3)"
```

---

## Acceptance criteria (PRD A-1 → this plan)

| AC | Coverage |
|---|---|
| form submit → lead row | Task 1: unlock POST persists `leads` row + links `audits.lead_id` (test-enforced) |
| + email delivered (staging, real inbox) | Task 1 makes delivery honest (`email_sent`); real-inbox staging run = founder step (Vercel env vars), listed in PR body |
| `/audit/report/[id]` valid ≥ 30 days | No TTL exists; Task 1 static test locks it in |
| failure path shows retry UI | Task 3: audit-run failure keeps preview (one-click retry); email failure shows resend banner |
| failures log to Sentry | Tasks 1–2: captureException on lead-persist, email-send, audit GET/POST/db-save failures |
| submit event fires in PostHog | Tasks 2–3: `captureEvent` helper + `audit_submitted` / `audit_unlock_submitted` |
