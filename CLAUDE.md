# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Development Commands

**Setup & installation:**
```bash
npm install              # Install dependencies (required on first clone)
```

**Development:**
```bash
npm run dev              # Start dev server at http://localhost:3000
npm run lint             # Run Next.js linting
npm run build            # Build for production (creates .next/)
npm start                # Start production server (requires npm run build first)
```

**Database:**
- Local dev uses Postgres (connection via `DATABASE_URL` env var)
- Schema migrations are in `/migrations/*.sql` — apply manually via `psql` or tool of choice
- Database helpers are in `/lib/db.ts` — use `sql` exported from there for queries

**Environment setup:**
- Copy `.env.local.example` → `.env.local`
- Minimum for local dev: `JWT_SECRET` (generate with `openssl rand -base64 48`) and `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
- Chat widget, email, and admin features are optional and degrade gracefully when unconfigured

---

## Architecture Overview

### High-Level Layers

**Frontend (React 18 + Next.js 14):**
- App Router structure under `/app` — each directory is a route
- Components in `/components/` — ChatWidget (main interactive feature), DimCalculator, PricingCard, FAQ, etc.
- Styling: Custom CSS (`/app/globals.css`) + Tailwind 3
- Chat UI is a floating widget on every page except `/inquiry` and `/dashboard/*` (where it's suppressed)

**Backend (Next.js API routes):**
- API routes under `/app/api/` — grouped by feature (auth, chat, inquiry, tracking, leads)
- Request validation with Zod (`z.object()`, `.safeParse()`)
- Database: Postgres (connection pool via `postgres` npm package)
- Auth: JWT tokens (`jose` lib) + bcrypt password hashing, stored in `sc_session` cookie

**Data & State:**
- Database: Postgres with 3 migration files in `/migrations/`
  - `001_init.sql` — users, password_reset_tokens, inquiries
  - `002_leads_calculator_chat.sql` — calculator_sessions, chat_sessions, chat_messages
  - `003_chat_v2.sql` — analytics events, KB chunks, qualified_score, Slack integration
- In-memory KB chunks: `/lib/chat-kb.ts` has fallback keyword-based retrieval (no vectors)
- Business logic constants: `/lib/constants.ts` (DIM divisors, pricing tiers, etc.)

### Key Flows

**User Authentication:**
- Signup → `/api/auth/signup` → bcrypt hash → JWT token → cookie
- Login → `/api/auth/login` → verify password → JWT token → cookie
- Password reset → `/api/auth/forgot-password` → token email → `/reset-password` page
- Session validation: `getCurrentUser()` in `/lib/auth.ts` reads cookie and verifies JWT

**Chat Widget (Anthropic Claude API):**
1. User sends message → `/api/chat` (POST)
2. Route validates with Zod, upserts session, checks rate limit (20 messages/session)
3. KB retrieval: `retrieveChunks()` does keyword matching on user message
4. Qualification scoring: runs second Claude call to score ICP fit (0–100)
5. Response streamed back, session updated, events logged to DB
6. Email capture trigger: fires at message 3 OR when score > 70 OR pricing intent detected
7. Slack notification: when score >= 85 or user requests handoff (via `/lib/notify.ts`)

**Lead Capture (Inquiry Form):**
- `/inquiry` page → form submits to `/api/inquiry` (POST)
- Saves to `inquiries` table, sends notification emails (Resend)
- Chat widget is suppressed on this page

**Dashboard (Read-only Admin):**
- `/dashboard` — authenticated view showing inquiries, chat sessions, analytics
- Requires session cookie (JWT valid)
- Chat sessions page shows email, qualification score, message count, Slack status

### Critical Code Locations

| Component | File | Purpose |
|-----------|------|---------|
| Chat logic | `/app/api/chat/route.ts` | Main message handling, KB injection, Claude API calls |
| KB retrieval | `/lib/chat-kb.ts` | Keyword-based chunk matching |
| Database helpers | `/lib/db.ts` | All SQL queries (user, inquiry, chat session, events) |
| Auth utilities | `/lib/auth.ts` | JWT signing/verification, password hashing, cookie management |
| Email templates | `/lib/email.ts` | Resend integration, password reset + notification emails |
| Lead notifications | `/lib/notify.ts` | Slack message formatting and posting |
| Chat UI component | `/components/ChatWidget.tsx` | React widget mounting, message send, UI state |
| Pricing & constants | `/lib/constants.ts` | DIM divisors, pricing tiers, system prompt, guardrails |

### Database Schema

**Users table:**
- `id` (serial PK), `email` (unique), `password_hash`, `name`, `company`, `created_at`

**Chat Sessions table:**
- `id` (uuid PK), `email` (nullable), `message_count`, `qualified_score`, `slack_notified_at`, `created_at`, `updated_at`

**Chat Messages table:**
- `id` (uuid PK), `session_id` (FK), `role` (user|assistant), `content`, `created_at`

**Inquiries table:**
- `id` (serial PK), `name`, `email`, `company`, `phone`, `monthly_spend`, `product_weight`, `message`, `user_id`, `created_at`

**Chat events table:**
- `id`, `session_id`, `event_type` (widget_opened, email_captured, handoff_slack, etc.), `metadata`, `created_at`

---

## Important Patterns & Constraints

**Anthropic Claude API Integration:**
- Chat uses Anthropic SDK (`@anthropic-ai/sdk`)
- API calls are made server-side in `/app/api/chat/route.ts`
- System prompt is in `/lib/constants.ts` under `CHAT_SYSTEM_PROMPT`
- KB context is injected as user message system block (not native tool use)
- Rate limit: 20 messages per session (hardcoded in route.ts)

**Database Pooling:**
- Postgres.js configured with `prepare: false` (required for Supabase transaction pooler)
- Connection pool max 10, idle timeout 20s, max lifetime 30m
- Use `sql` exported from `/lib/db.ts` for all queries — do not create new connections

**Authentication & Cookies:**
- Cookie name: `sc_session`
- JWT secret from `JWT_SECRET` env var (defaults to dev-only value)
- Token expires after 7 days
- Cookie is `httpOnly`, `sameSite=lax`, `secure` in prod
- Always use `getCurrentUser()` to get authenticated user in routes

**Validation:**
- All API request bodies validated with Zod before processing
- Chat messages: max 4000 chars, max 50 messages per request
- Email and password validation happens in auth routes

**Email (Resend integration):**
- Optional feature — if `RESEND_API_KEY` not set, emails are skipped, features degrade gracefully
- Sender must be configured domain (not `onboarding@resend.dev` in prod)
- Password reset emails include `NEXT_PUBLIC_SITE_URL` for link construction

**Slack Notifications:**
- Optional feature — if `SLACK_WEBHOOK_URL` not set, skipped
- Fires when qualification score >= 85 OR user requests handoff
- Session marked with `slack_notified_at` to prevent duplicates
- Telegram also supported (via `TELEGRAM_TOKEN` + `TELEGRAM_CHAT_ID`)

---

## Testing Guidance

See `TESTING.md` for comprehensive chat widget v2 test plan (email capture, Slack handoff, KB injection, analytics events, mobile).

Key test commands:
- **Lint:** `npm run lint`
- **Build:** `npm run build` (catches TS errors)
- **Dev server:** `npm run dev` then test in browser

Manual testing is required for:
- Chat widget auto-open behavior (30s timer, exit intent detection)
- Email capture validation and Slack notifications
- KB context injection accuracy
- Mobile responsiveness (especially widget overlay positioning)

---

## Production Checklist (from README)

Before deploying to production:
- [ ] Replace `JWT_SECRET` with cryptographically random value
- [ ] Configure Resend with production domain (not `onboarding@resend.dev`)
- [ ] Migrate to hosted Postgres (Vercel Postgres, Supabase, or Neon)
- [ ] Add rate limiting to auth routes and `/api/inquiry`
- [ ] Configure `ANTHROPIC_API_KEY` with production credentials
- [ ] Set `NEXT_PUBLIC_SITE_URL` to production domain
- [ ] Configure optional features (Slack webhook, email domain, etc.)
- [ ] Verify SQLite fallback is removed (prod uses Postgres only)

---

## Quick Reference: File Organization

```
/app
  /api
    /auth              # signup, login, logout, forgot-password, reset-password
    /chat              # main chat endpoint + events + history
    /inquiry           # lead form submission
    /track             # package tracking lookup
    /tracking          # enhanced tracking with full history
  /dashboard           # authenticated user area
  /login, /signup      # auth pages
  /forgot-password, /reset-password
  /admin               # admin dashboard (read-only inquiries)
  /inquiry             # lead capture form
  /track               # package tracking
  /page.tsx            # homepage

/components            # Reusable React components (ChatWidget, PricingCard, FAQ, etc.)

/lib
  /db.ts               # All database queries (Postgres)
  /auth.ts             # JWT, bcrypt, cookie utilities
  /chat-kb.ts          # KB chunk retrieval (keyword-based)
  /constants.ts        # DIM divisors, pricing tiers, system prompt
  /email.ts            # Resend email templates
  /notify.ts           # Slack notification logic

/migrations            # SQL schema (001, 002, 003)

/public                # Static assets
/styles                # CSS (globals.css)
```
