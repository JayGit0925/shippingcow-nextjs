# ShippingCow Funnel Event Schema (PRD F-1)

One documented funnel, implemented in PostHog now and mirrored to GA4 once
GATE-ANALYTICS clears (PRD C-4). Typed helpers live in `lib/funnel.ts` on top
of the `captureEvent` wrapper in `lib/analytics.ts`; components never pass raw
event-name strings.

PostHog init: `components/PostHogProvider.tsx` (`NEXT_PUBLIC_POSTHOG_KEY`,
optional `NEXT_PUBLIC_POSTHOG_HOST`). Capture is opted out outside production
builds, so local/dev traffic never pollutes the funnel.

## The funnel, in order

### 1. `$pageview`

- **Where:** `components/PostHogProvider.tsx`
- **Trigger:** every route change (manual capture on `pathname` change;
  `capture_pageview: false` in init).
- **Properties:** `$current_url`.
- PostHog's built-in page-view event — the PRD's `page_view` stage. In the
  GA4 mirror this maps to GA4's automatic `page_view`.

### 2. `calculator_start`

- **Where:** `components/DimCalculator.tsx`
- **Trigger:** the first user edit of any calculator input (dimension, weight,
  volume, or ZIP). Once per mount (`startedRef`).
- **Properties:** `first_field` — one of `length`, `width`, `height`,
  `weight`, `volume`, `origin_zip`, `dest_zip`.

### 3. `calculator_complete`

- **Where:** `components/DimCalculator.tsx`
- **Trigger:** the debounced recalculation (800 ms) settling **after** a user
  edit. The calculator renders results on mount with defaults, so the
  debounce alone is not evidence of engagement — gated on `startedRef`, fires
  once per mount (`completedRef`).
- **Properties:** `used_zone_check` (both ZIPs filled), `monthly_volume`
  (user-stated shipments/month).

### 4. `audit_submitted`

- **Where:** `app/audit/page.tsx` (lands with PR #15, TSK-WEB-09)
- **Trigger:** successful audit form submit.
- **Properties:** `shipment_count`.
- The PRD calls this stage `audit_submit`; the implemented, canonical PostHog
  name is `audit_submitted`. Do not introduce a second audit event.

### 5. `email_captured`

- **Where:** `components/ChatWidget.tsx`
- **Trigger:** successful email submit in the chat capture prompt.
- **Properties:** `source: 'chat'` — and nothing else. The address itself
  goes to Supabase via the existing `/api/chat` PATCH, never to PostHog.

### 6. `qualified`

- **Where:** `components/ChatWidget.tsx`
- **Trigger:** the first chat reply whose ICP score is ≥ 70
  (`QUALIFIED_SCORE_THRESHOLD` in `lib/funnel.ts`, matching the server
  override in `app/api/chat/route.ts`). Once per browser session
  (`sessionStorage` guard `sc_qualified`).
- **Properties:** `score` (0–100), `intent` (scorer's intent label).
- Also mirrored into the first-party `/api/chat/events` pipe (its allowlist
  already includes `qualified`), so the Supabase chat-events funnel is
  complete without joining PostHog data.

## Auxiliary events (not funnel stages)

| Event | Pipe | Where | Notes |
|---|---|---|---|
| `audit_unlock_submitted` | PostHog | `app/audit/_components/ReportView.tsx` (PR #15) | Report-unlock email submit |
| `widget_opened`, `widget_auto_opened`, `first_message`, `handoff_slack`, `session_end` | Supabase `/api/chat/events` only | `components/ChatWidget.tsx`, `app/api/chat/route.ts` | First-party ops telemetry, intentionally not in PostHog |

## Property rules (red lines)

- Never send raw email addresses, names, or message content as PostHog
  properties.
- Never send dollar amounts, savings figures, rates, or DIM divisor values
  (public-surface rule) — funnel properties are counts, booleans, field
  names, and scores only.

## GA4 mirror (post-GATE-ANALYTICS)

When GA4/GTM lands (TSK-W1-01 / PRD C-4): same event names in snake_case,
`$pageview` → GA4 `page_view`, sent via GTM alongside PostHog. Reconcile
counts between the two before trusting either; PostHog remains the interim
source of record until then.
