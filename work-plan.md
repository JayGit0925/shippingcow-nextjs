# 🐄 ShippingCow — Proactive Work Plan

> Auto-generated: 2026-04-25 · From 3 parallel audits (widget, social media, competitors)

---

## TL;DR: TOP 5 ACTIONS

| # | What | Impact | Effort |
|---|------|--------|--------|
| 1 | **Fix chat route-change bug** — messages reset on every navigation | 🔴 Revenue-killer | 5 min |
| 2 | **Delay email capture to 4+ messages** with "Not Now" re-prompt | 🟠 +30% conversion | 10 min |
| 3 | **Fix failing daily social cron** — 3 consecutive errors, 0 posts | 🟠 Brand invisible | 15 min |
| 4 | **Add social links to footer** — zero social discoverability | 🟡 Trust signal | 5 min |
| 5 | **Add suggestion chips to chat widget** — "Furniture" / "Fitness" / "Power Tools" | 🟡 Mobile UX | 20 min |

---

## SECTION A: CHAT WIDGET FIXES (from code audit)

### 🔴 CRITICAL (revenue-killers)

| ID | Line | Issue | Fix |
|----|------|-------|-----|
| **A1** | 131-143 | Messages reset on every route change. Navigate from /calculator → /pricing = conversation wiped. User mid-capture loses everything. | Remove `pathname` from useEffect dependency array, or conditionally reset only on actual page entry, not re-renders |
| **A2** | 359-360 | Chat panel `{open && (...)}` unmounts DOM on close. User's partially typed email in capture form is destroyed on accidental close. | Use CSS visibility/display instead of conditional render, or persist capture form state in a ref |

### 🟠 HIGH (conversion impact)

| ID | Line | Issue | Fix |
|----|------|-------|-----|
| **A3** | 267 | Email capture triggers after **only 2 messages**. Users still asking basic questions — too soon, too aggressive. | Increase threshold to 4 messages OR gate on ICP score ≥ 50 |
| **A4** | 443-448 | "Skip" permanently dismisses capture. No re-prompt if user keeps chatting and shows buying signals. | Change to "Not now" and re-prompt after 2 more messages / ICP score increase |
| **A5** | 355 | Toggle button: 🐄 (cow emoji). Users don't associate cow with "chat." Especially bad on mobile where it's the only visual. | Switch to 💬 or speech-bubble icon. Cow icon is on-brand but hurts discoverability |
| **A6** | 175-179 | Auto-open: 33 seconds minimum. High-intent calculator visitors often leave before 30s. | Reduce to 10-15s on /calculator and /big-and-bulky pages |
| **A7** | 381-399 | No quick-reply/chip buttons. After "What are you shipping?" users must type freeform — high friction on mobile. | Add 3 clickable chips: "Furniture" / "Fitness Equipment" / "Power Tools" |
| **A8** | 140+ | Zero conversation persistence. Refresh = opener only. | Save messages to sessionStorage keyed by sessionId; restore on mount |
| **A9** | 63 | Post-calculator opener doesn't reference actual calculator results | Append system message with user's weight/dims from calculator context |

### 🟡 MEDIUM

| ID | Line | Issue | Fix |
|----|------|-------|-----|
| **A10** | 424 | CTA: "Want me to send you a custom savings estimate?" — weak, generic | "I found a way to cut your shipping cost — want the numbers sent to your inbox?" |
| **A11** | 308 | Post-capture: "Usually lands within a few hours" — vague | "Check your inbox in 2 hours (peek at spam). Our team personally reviews every estimate." |
| **A12** | 376-379 | Header: "ShippingCow AI" — no value prop | Add subtext: "3PL experts • 40-80% savings on heavy goods" |
| **A13** | 426-451 | Single-step email capture — high psychological friction | Two-step: 1) "Want savings?" (yes/no button), 2) Collect email only if yes |
| **A14** | 69 | Home opener: "Ship 50lb+ goods?" — excludes 30-50lb shippers | "Ship bulky or heavy items?" |
| **A15** | — | Only email captured. No name, phone, company | Progressive profiling: add name + company after email |
| **A16** | — | No meeting scheduler for hot leads (ICP 85+) | Show Calendly link at score ≥ 85 |

---

## SECTION B: SOCIAL MEDIA (from infrastructure audit)

### 🔴 CRITICAL

| ID | Issue | Fix |
|----|-------|-----|
| **B1** | Daily social cron job FAILING — 3 consecutive errors: "Channel is required (no configured channels detected)" | Fix channel configuration or change delivery target. Content content is generated but dead on arrival |
| **B2** | Website has ZERO social links — footer, nav, nowhere | Add LinkedIn + X.com + Instagram icons to Footer component |

### 🟠 HIGH

| ID | Issue | Fix |
|----|-------|-----|
| **B3** | Only 2 days of content (April 19-20) despite strategy covering 6 platforms | Generate a week of backlog content (15 posts) |
| **B4** | No visual assets — zero images, graphics, templates | Generate 5-10 branded graphics (DIM divisor comparison chart, savings calculator infographic, heavy parcel "death zone" diagram) |
| **B5** | Instagram (0), YouTube (0), standalone Reddit posts (0) — 3/6 platforms dead | Create platform-specific starting content: 3 Instagram posts, 1 YouTube script, 3 Reddit posts |
| **B6** | No content calendar — strategy exists, execution doesn't | Create a 7-day content calendar markdown file with post topics per platform per day |
| **B7** | No UTM parameter strategy — social traffic untracked | Define UTM pattern: utm_source=social&utm_medium={platform}&utm_campaign={topic} |
| **B8** | $3/$200 budget used — 1.5% utilization | Plan one small paid campaign (LinkedIn $20, X.com $20) |

### 🟡 MEDIUM

| ID | Issue | Fix |
|----|-------|-----|
| **B9** | No opengraph-image.tsx — social share cards are blank | Create branded OG image generator |
| **B10** | No content repurposing pipeline — LinkedIn post never becomes X.com thread, etc. | Cross-platform adaptation for each piece |
| **B11** | No competitor social monitoring | Set up list of competitor accounts to track |
| **B12** | Blog directory planned but empty | Create first 2 blog posts |

---

## SECTION C: 3PL INDUSTRY MOVES (content angles)

### Headlines to turn into content:

| # | Angle | Source | Use For |
|---|-------|--------|---------|
| **C1** | FedEx 2026 GRI averaging 5.9% — heavy/large surcharges up 8-12% | FreightWaves, Supply Chain Dive | LinkedIn: "FedEx just raised your rates again. Here's what DIM 225 actually saves." |
| **C2** | UPS SurePost fully insourced — rural last-mile getting more expensive | Multiple | X.com thread: "UPS killed SurePost. Here's what it means for your 50lb+ packages." |
| **C3** | TikTok Shop FBT (Fulfilled by TikTok) expanding — new 3PL demand for 50-150lb | TechCrunch, The Information | LinkedIn: "TikTok Shop just changed heavy goods fulfillment." |
| **C4** | Amazon SFP 2.0 — tighter requirements, seller exodus creating 3PL pipeline | Supply Chain Dive | Landing page: "Amazon kicked you off SFP? We'll handle it." |
| **C5** | DIM divisor debate heating up — parcel consultants calling DIM 139 "antiquated" | Parcel industry blogs | All platforms: position ShippingCow as the vanguard of DIM 225 |

---

## SECTION D: EXECUTION PLAN (what I do next)

### Phase 1 — Bug Fixes (30 min) ⚡ Highest ROI
```
A1: Fix route-change message reset         (5 min)
A2: Fix panel close destroys capture       (10 min)
A3: Delay email capture to 4+ messages     (5 min)
A4: "Skip" → "Not now" with re-prompt      (5 min)
B1: Fix failing daily social cron          (15 min)
B2: Add social links to footer             (5 min)
```

### Phase 2 — Conversion Optimization (45 min)
```
A7: Add suggestion chips below opener     (20 min)
A5: Switch cow emoji → 💬 on mobile       (5 min)
A6: Auto-open: 10s on high-intent pages   (10 min)
A8: sessionStorage conversation persistence (10 min)
```

### Phase 3 — Social Content (60 min)
```
B3: Generate 7 days of backlog content    (25 min)
B6: Create content calendar               (15 min)
B4: Generate visual assets (5 pieces)     (20 min)
```

### Phase 4 — Polish (30 min)
```
A12: Header value prop                    (5 min)
A10: Better CTA copy                      (5 min)
A14: Broaden opener copy                  (5 min)
B9: OG image generator                    (15 min)
```

---

## SECTION E: FULL TASK LIST

| ID | Phase | Category | Task | Time | Status |
|----|-------|----------|------|------|--------|
| A1 | 1 | 🐛 Bug | Fix route-change message reset (line 131-143) | 5m | ⬜ |
| A2 | 1 | 🐛 Bug | Prevent panel close from destroying capture | 10m | ⬜ |
| A3 | 1 | 🚀 CVR | Delay email capture to 4+ messages | 5m | ⬜ |
| A4 | 1 | 🚀 CVR | "Skip" → "Not now" with re-prompt | 5m | ⬜ |
| B1 | 1 | 🔧 Infra | Fix failing daily social cron job | 15m | ⬜ |
| B2 | 1 | 🌐 Web | Add social links to footer component | 5m | ⬜ |
| — | — | — | **Phase 1 subtotal** | **45m** | |
| A7 | 2 | 🚀 CVR | Suggestion chips below opener | 20m | ⬜ |
| A5 | 2 | 📱 UX | Cow emoji → 💬 on mobile | 5m | ⬜ |
| A6 | 2 | 📱 UX | Auto-open 10s on high-intent pages | 10m | ⬜ |
| A8 | 2 | 🚀 CVR | sessionStorage conversation persistence | 10m | ⬜ |
| — | — | — | **Phase 2 subtotal** | **45m** | |
| B3 | 3 | 📱 Social | 7 days backlog content (15 posts) | 25m | ⬜ |
| B6 | 3 | 📱 Social | Content calendar markdown | 15m | ⬜ |
| B4 | 3 | 🎨 Design | 5 branded visual assets | 20m | ⬜ |
| — | — | — | **Phase 3 subtotal** | **60m** | |
| A12 | 4 | 📋 Polish | Header value prop subtext | 5m | ⬜ |
| A10 | 4 | 📋 Polish | Better CTA copy | 5m | ⬜ |
| A14 | 4 | 📋 Polish | Broaden opener "bulky or heavy" | 5m | ⬜ |
| A9 | 4 | 🚀 CVR | Calculator context → chat opener | 15m | ⬜ |
| B9 | 4 | 🌐 Web | OG image generator | 15m | ⬜ |
| — | — | — | **Phase 4 subtotal** | **45m** | |
| A13 | 5 | 🚀 CVR | Two-step email capture | 15m | ⬜ |
| A15 | 5 | 🚀 CVR | Progressive profiling (name/company) | 15m | ⬜ |
| A16 | 5 | 🚀 CVR | Calendly for hot leads (ICP 85+) | 10m | ⬜ |
| B5 | 5 | 📱 Social | Dead platform bootstrapping (IG/YT/Reddit) | 30m | ⬜ |
| — | — | — | **Phase 5 subtotal** | **70m** | |
| **TOTAL** | | | **24 items across 5 phases** | **~4.5 hrs** | |

---

## Priority Decision

**Start with Phase 1** — these are the highest-ROI fixes:
- A1 alone is probably costing you 20-40% of potential leads (conversation nukes mid-qualification)
- B1 means your entire social strategy is dead in the water (content generated but never delivered)
- A2/A3/A4 together will increase chat-to-email conversion rate

**Say "go" and I'll execute Phase 1 immediately.**
