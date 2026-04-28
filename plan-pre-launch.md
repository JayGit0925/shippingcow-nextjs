# 🐄 ShippingCow — Pre-Launch Plan

| **Branch:** `jay-review` · **Build:** 60 pages, clean
> **Last updated:** 2026-04-26

---

## ✅ Phases 0–3: Done

| Phase | Items | Summary |
|-------|-------|---------|
| P0 | 6/6 | Domain fix, JWT hardening, build, rate limiting, DB-backed KB, chat bug fixes |
| P1 | 9/10 | Capture UX, sitemap+robots, cookie consent, CRM webhook, OG image, 404, Sentry wired |
| P2 | 7/7 | Chat toggle, auto-open, suggestion chips, persistence, header, CTA polish, PostHog |
| P3 | 7/7 | 3 blog posts, DIM calculator page, social links, GSC meta, JSON-LD |

**P1-9 dropped** — no n8n endpoint exists. Phantom task.

### Deploy-time env vars needed
- `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` — Sentry installed, no-ops without DSN
- `CRM_WEBHOOK_URL` — inquiry route POSTs on submit (optional)
- `NEXT_PUBLIC_GOOGLE_VERIFICATION` — GSC meta tag

---

## 🔵 Phase 4: Lead Gen (Partial)

| # | Task | Status |
|---|------|--------|
| P4-1 | Listmonk: "Beta Prospects" list + 4-email nurture sequence | ⬜ Drafted, not linked (list UUIDs unknown) |
| P4-2 | Reddit sweep via `opencli` | ✅ 5 leads found |
| P4-3 | Manual outreach: 50 DTC furniture/bulky-item brands | ⬜ Human task |
| P4-4 | X.com content blast via `xurl` | ⬜ Blocked — xurl needs OAuth |
| P4-5 | Free Audit Guide at `/guide` — email capture via `/api/inquiry`, sends guide to inbox | ✅ |

---

## 🔴 Phase 5: Core Product (NEW — Priority)

These are the three things the product actually needs to work. Everything above was scaffolding. This is the product.

### T01 — Email Verification on Signup ✅ `LTL_COST_PER_MILE` fixed

**Problem:** Signup creates account instantly, no verification. Fake emails get in. No trust signal.

**What exists:** `POST /api/auth/signup` → `createUser()` → `setSessionCookie()`. No verification step.

**Plan:**
1. Add `email_verified` boolean column to `users` table (default false)
2. Add `email_verification_codes` table (user_id, code CHAR(4), expires_at, used)
3. On signup: create user with `email_verified=false`, generate 4-digit code, email it via Resend
4. New `POST /api/auth/verify-email` route: check code, set `email_verified=true`, issue session cookie
5. Gate authenticated routes on `email_verified=true`

**Verify:** Sign up with real email → receive 4-digit code → enter code → account activates. Sign up with fake email → stuck at verification screen.

**Files touched:** `migrations/003_email_verification.sql`, `lib/db.ts` (+2 helpers), `lib/email.ts` (+1 template), `app/api/auth/signup/route.ts` (modify), `app/api/auth/verify-email/route.ts` (new), `app/(auth)/verify-email/page.tsx` (new UI)

---

### T02 — Real USPS Zone Chart (Replace Haversine Estimates)

**Problem:** `lib/zone.ts` → `distanceToZone()` maps haversine miles to zones using rough buckets. USPS zones are based on SCF (Sectional Center Facility) origin→destination 3-digit ZIP prefix pairs, not distance. The current approximation is wrong for edge cases near SCF boundaries.

**What exists:** User has the actual USPS zone chart data (origin 3-digit prefix → destination 3-digit prefix → zone). This replaces the haversine estimate entirely.

**Plan:**
1. User provides the zone chart (CSV/table). Format: `origin_prefix, dest_prefix, zone`
2. Load into a `usps_zone_chart` table or a static JSON lookup (depends on size)
3. New function `getUSPSZone(originZip, destZip)` → extracts 3-digit prefixes, looks up exact zone
4. Replace `distanceToZone()` calls in `estimateZone()` and `smartRoute()` with the real lookup
5. Keep haversine as fallback only for ZIP pairs not in the chart

**Verify:** Known ZIP pair (e.g., 08901→91761) returns correct USPS zone matching the chart. All audit results use real zones.

**Blocked on:** User providing the zone chart data.

---

### T03 — Upgrade Calculator to Full Cost Engine

**Problem:** `DimCalculator.tsx` does `(L×W×H)/divisor × $0.45/lb` — a toy. The real engine (`analyzeShipment()` in `lib/cost.ts`) already computes zone routing, rate cards, inbound palletization, handling fees, and warehouse allocation. The calculator doesn't use any of it.

**What exists:**
- `lib/cost.ts` → `analyzeShipment()` — full engine (zone, DIM, rate cards, pallet math, inbound LTL)
- `lib/zone.ts` → `smartRoute()` — picks best warehouse per destination
- `lib/constants.ts` → `GOFO_RATES`, `FEDEX_RATES`, `FEDEX_HEAVY_RATES`, `HANDLING_TIERS`
- Current calculator: client-side only, no ZIP inputs, no zone awareness, no rate cards

**Plan:**
1. Add origin ZIP + destination ZIP inputs to calculator (or default origin to "your warehouse")
2. New `POST /api/calculator` server route that calls `analyzeShipment()` and returns full breakdown
3. Calculator UI shows:
   - **DIM comparison** (139 vs 166 vs 225) — keep existing bar chart
   - **Zone routing** — which warehouse, what zone, vs shipping direct
   - **Cost breakdown** — inbound (amortized per unit), outbound (rate card), handling
   - **Warehouse allocation** — "Ship from NJ for this destination" with map
   - **Pallet math** — X units per pallet, inbound cost per unit at $0.40/mi
   - **Total savings** — real dollars, not $0.45/lb estimate
4. Add 5 bulky-item presets: bicycle, foam mattress topper, artificial tree, yoga roller case, storage bins
5. "Get your full audit →" CTA passes all inputs to `/inquiry`

**Verify:** Enter bicycle (60×30×8, 35 lbs) from ZIP 90210 to ZIP 10001 → see real zone, real rate, real warehouse assignment, real savings. Numbers match what `/api/audit` would return for the same inputs.

**Files touched:** `app/api/calculator/route.ts` (new — thin wrapper around `analyzeShipment`), `components/DimCalculator.tsx` (rewrite), `app/calculator/page.tsx` (minor — add metadata for new fields)

**Assumption:** The current `DimCalculator` saves to `calculator_sessions` table via `/api/calculator-session`. Keep that — just extend the saved data with the full analysis result.

---

### T04 — Inbound Quote (Auto-Allocation)

**Problem:** User wants: given origin ZIP + multiple SKUs + destination distribution → automatically compute optimal warehouse allocation, pallet counts, and inbound trucking quote. The current audit does this per-row but doesn't aggregate into an inbound plan.

**What exists:**
- `analyzeShipment()` already computes `units_per_pallet`, `inbound_cost_per_unit`, `sc_warehouse`
- `smartRoute()` picks best warehouse per destination
- `findClosestWarehouseToOrigin()` picks closest warehouse for inbound
- Missing: aggregation across SKUs into "send X pallets to NJ, Y pallets to CA, Z pallets to TX"

**Plan:**
1. New `lib/allocation.ts` — takes array of `{sku, dims, weight, dest_zips_distribution}`, runs `analyzeShipment()` per destination, aggregates by warehouse
2. Output: per-warehouse pallet count, inbound trucking cost (origin → each warehouse at $0.40/mi), total inbound cost, projected outbound savings
3. New `POST /api/allocation` route
4. UI: either extend `/calculator` with multi-SKU mode, or new `/allocation` page (decide when T03 is done)

**Verify:** 2 SKUs, origin 91761, destinations split 60% East / 40% West → system recommends split across NJ + CA, shows pallet counts and total inbound cost.

**Depends on:** T02 (real zones) and T03 (calculator upgrade) should land first.

---

## ⚪ Phase 6: Post-Launch

Ships after May 1. Not blocking:
- Onboard beta customers, case studies, follow-up sequences
- Facebook Groups / YouTube / LinkedIn (manual, no code)
- LTL broker API (replace $0.40/mi flat with real lane pricing)
- Embedding-based KB, ISR, integration tests
- Referral program (plan delivered, not built — depends on xurl OAuth)
- Listmonk integration (blocked on list UUIDs / admin API access)

---

## 🚨 Minimum Viable Launch Checklist

- [x] Domain → shippingcow.ai
- [x] JWT from env only
- [x] Auth rate limited
- [x] Chat widget working
- [x] Sitemap + robots.txt
- [x] DIM calculator page live
- [x] 3 blog posts published
- [x] Form → email notification working
- [x] PostHog tracking verified
- [x] `/guide` → email capture → guide delivered
- [x] **Email verification on signup** (T01)
- [x] **Real USPS zone lookup** (T02)
- [x] **Calculator uses full cost engine** (T03)
- [x] **Inbound allocation page** (T04)

---

## Reference (not tasks)

SEO keywords, social media playbooks, content calendar, Reddit subreddit list, outreach templates documented in skills:
- `dim-225-heavy-parcel-story` — core narrative
- `b2b-sales-outreach-playbook` — sales pipeline
- `reddit-leadgen-opencli` — Reddit lead mining
- `threads-content` — Threads templates
- `youtube-content-agent-3pl` — YouTube scripts
- `xurl` — X.com API
- `shipping-cow-mvp-launch-plan` — May 1st beta plan
- `usps-zone-chart-scraper` — USPS zone data extraction
