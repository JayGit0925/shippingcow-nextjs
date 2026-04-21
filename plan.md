# Chat Widget v2 — Build Plan

**Objective:** Upgrade ChatWidget from passive Haiku bot to lead-generating conversion machine.  
**Rollback SHA:** `578f4e3` — `git checkout 578f4e3 -- components/ChatWidget.tsx app/api/chat/route.ts lib/constants.ts`

---

## File Tree Diff

### New Files
```
migrations/003_chat_v2.sql          — chat_sessions, chat_events, chat_kb_chunks tables + ALTER chat_messages
lib/slack.ts                        — Slack webhook client
lib/chat-kb.ts                      — KB chunk store + keyword retrieval
lib/chat-session.ts                 — DB helpers for chat_sessions + chat_events
app/api/chat/qualify/route.ts       — internal: Haiku scoring endpoint (called server-side only)
app/dashboard/chat/page.tsx         — admin session list
app/dashboard/chat/[session_id]/page.tsx  — admin transcript viewer
supabase/queries/chat_metrics.sql   — funnel + intent analytics queries
TESTING.md                          — test results log
MOBILE_CHECK.md                     — mobile CTA audit
EXPERIMENTS.md                      — A/B framework scaffold
COST.md                             — cost projection
ITERATION_LOG.md                    — build iteration log
plan.md                             — this file
```

### Modified Files
```
components/ChatWidget.tsx           — major rewrite (triggers, email capture, KB, continuity)
app/api/chat/route.ts               — Sonnet 4.6, parallel scoring, event logging, rate limit
lib/db.ts                           — add chat session + event helpers
lib/constants.ts                    — update CHAT_SYSTEM_PROMPT, add KB_CHUNKS seed data
lib/types.ts                        — add ChatSession, ChatEvent, QualifyResult types
.env.example                        — add SLACK_WEBHOOK_URL
```

---

## Supabase Schema Changes

```sql
-- Existing table: add event_type column
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS event_type TEXT;

-- NEW: tracks one row per browser session
CREATE TABLE chat_sessions (
  session_id         TEXT PRIMARY KEY,
  first_seen         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  page_count         INTEGER NOT NULL DEFAULT 1,
  opener_variant     TEXT,
  email              TEXT,
  qualified_score    INTEGER NOT NULL DEFAULT 0,
  lead_id            UUID REFERENCES leads(id) ON DELETE SET NULL,
  slack_notified_at  TIMESTAMPTZ,
  follow_up_sent_at  TIMESTAMPTZ,
  message_count      INTEGER NOT NULL DEFAULT 0,
  calculator_context JSONB
);

-- NEW: analytics event stream
CREATE TABLE chat_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id  TEXT NOT NULL,
  event_type  TEXT NOT NULL,  -- widget_opened|auto_opened|first_message|email_captured|qualified|handoff_slack|session_end
  metadata    JSONB
);

-- NEW: knowledge base (keyword-matched, no vectors v1)
CREATE TABLE chat_kb_chunks (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source   TEXT NOT NULL,   -- e.g. "pricing", "dim225", "warehouses", "guarantees"
  content  TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}'
);
```

### RLS Policies
- `chat_sessions`: anon INSERT + UPDATE own session_id, service_role ALL
- `chat_events`: anon INSERT, service_role ALL
- `chat_kb_chunks`: service_role ALL (read-only content, no anon access needed — read server-side)

---

## New Env Vars

| Var | Purpose | Required |
|-----|---------|---------|
| `SLACK_WEBHOOK_URL` | Incoming webhook for lead handoff pings | Yes for handoff |
| `DATABASE_URL` | Already required | Confirm set |
| `ANTHROPIC_API_KEY` | Already required | Confirm set |
| `RESEND_API_KEY` | Already wired in lib/email.ts | Confirm set |
| `NEXT_PUBLIC_SITE_URL` | Used in layout.tsx already | Confirm set |

No Upstash/Redis — rate limit tracked via `chat_sessions.message_count` (DB counter, good enough for v1).

---

## Model Routing

| Use Case | Model | Max Tokens | When |
|---------|-------|-----------|------|
| Actual reply | `claude-sonnet-4-6` | 500 | Every user message |
| ICP scoring + intent | `claude-haiku-4-5-20251001` | 100 | Parallel with reply, per user turn |
| Summary (returning user) | `claude-haiku-4-5-20251001` | 150 | On session hydration |
| Opus | NEVER | — | Cost control |

Parallel execution: `Promise.all([sonnetReply, haikuScore])` — latency = max(~2s, ~0.5s) ≈ 2s.

---

## Build Steps

1. DB migration: `migrations/003_chat_v2.sql`
2. API upgrade: Sonnet 4.6, parallel scoring, event log, rate limit (20 msg/session)
3. KB grounding: seed chunks in constants, inject top 5 by keyword match
4. Page-aware openers: URL → variant map in widget
5. Auto-open trigger: 30s delay + exit intent, frequency cap via localStorage
6. Email capture: turn-3 / score>70 prompt, write to chat_sessions
7. Slack handoff: ping on email capture or score>85 or "talk to human"
8. Analytics events: log to chat_events on key actions
9. Mobile CTA safety: reposition widget button on <768px, audit 4 pages
10. Calculator context injection: read localStorage sc_calc_result → inject into system context
11. Admin /dashboard/chat: session list + transcript viewer
12. History continuity: returning email → Haiku summary → inject into new session

---

## Risk List

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Parallel Haiku+Sonnet race — score arrives after reply sent | Low | Promise.all resolves both before responding |
| DB rate limit counter race under burst | Medium | Acceptable v1; add Redis if >500 sessions/day |
| KB keyword match too naive → wrong chunk → hallucination | Medium | Fallback rule in system prompt: "if unsure, ask for email" |
| Slack webhook URL leaked via client | Low | Server-only env var, never in NEXT_PUBLIC_ |
| Mobile widget covers sticky CTAs | Medium | Tested at 375/414/768px before ship |
| Auto-open annoys users → increased bounce | Low | 7-day frequency cap + immediate close respects user |
| email.ts Resend not configured → follow-up silent fail | Low | Non-blocking, logged, chat still works |

---

## Rollback Procedure

**File rollback (no DB change needed):**
```bash
git checkout 578f4e3 -- components/ChatWidget.tsx app/api/chat/route.ts lib/constants.ts lib/types.ts
```

**DB rollback (destructive — only if v2 migration was run):**
```sql
DROP TABLE IF EXISTS chat_events;
DROP TABLE IF EXISTS chat_sessions;
DROP TABLE IF EXISTS chat_kb_chunks;
ALTER TABLE chat_messages DROP COLUMN IF EXISTS event_type;
```

---

## Gap Coverage Check

| Gap | Step | Covered |
|-----|------|---------|
| Human handoff | 7 | ✅ |
| Analytics events | 8 | ✅ |
| Auto-open trigger | 5 | ✅ |
| In-chat email capture | 6 | ✅ |
| KB grounding | 3 | ✅ |
| Mobile CTA check | 9 | ✅ |
| Audit/calculator context | 10 | ✅ |
| History continuity | 12 | ✅ |

All 8 gaps covered. Proceeding to Phase 2.
