# Chat Widget v2 — Test Results

## Instructions
Run these manually after deploying migration 003_chat_v2.sql to staging.
Check each box as you verify. Do not merge PR until all pass.

---

## Functional Tests

### Openers
- [ ] `/` — opener says "Ship 50lb+ goods?"
- [ ] `/big-and-bulky` — opener mentions "Heavy items"
- [ ] `/calculator` — opener says "Ran the numbers already?"
- [ ] `/blog/*` — opener says "Question about what you just read?"
- [ ] `/calculator` with `sc_calc_result` in localStorage — opener says "Saw you ran the numbers"
- [ ] `/inquiry` — widget suppressed (no button visible)
- [ ] `/dashboard/*` — widget suppressed

### Conversation
- [ ] Send 10 varied messages across 5 sessions. No invented prices or SLAs.
- [ ] All responses reference KB (DIM 225, warehouses, guarantees, pricing tiers).
- [ ] Message with "how much does it cost?" → routes to pricing KB, suggests /inquiry.
- [ ] Message with "2-day delivery" → warehouses KB injected.

### Email capture
- [ ] After turn 3 OR message asking for pricing → email prompt appears in chat
- [ ] Submit invalid email → shows validation error, does not submit
- [ ] Submit valid email → confirmation message appears in chat
- [ ] Check Supabase `chat_sessions` — email column populated
- [ ] Slack ping received in configured channel within 30s

### Slack handoff
- [ ] Send "I want to talk to a human" → Slack ping fires within 60s
- [ ] Session with `qualified_score >= 85` (high-ICP messages) → Slack ping fires
- [ ] Slack ping NOT sent twice for same session (`slack_notified_at` check)
- [ ] Slack message includes: email, score, page, last 5 messages

### Auto-open trigger
- [ ] Sit on page for 30s → widget opens automatically
- [ ] Exit intent (move mouse above viewport on desktop) → widget opens
- [ ] Auto-open suppressed on `/inquiry`, `/dashboard/*`
- [ ] Auto-open suppressed within first 3s of page load
- [ ] Auto-open does not fire twice in same browser session (`sc_auto_opened`)
- [ ] Close widget → reload within 7 days → widget does NOT auto-open

### Rate limit
- [ ] Send 20 messages → 21st receives rate limit message (not API error)
- [ ] Rate limit message is friendly, suggests email contact

### Analytics events
- [ ] Open Supabase `chat_events` table
- [ ] `widget_opened` event logged on manual open
- [ ] `widget_auto_opened` event logged with trigger (timer/exit_intent)
- [ ] `first_message` event logged on first user send
- [ ] `email_captured` event logged after email submit
- [ ] `handoff_slack` event logged when Slack ping fires

### Calculator context
- [ ] Set `sc_calc_result` in localStorage with calc data → open chat → opener reflects calc data
- [ ] Sonnet reply references user's specific dimensions/savings in context

### Dashboard (read-only admin)
- [ ] `/dashboard/chat` lists sessions with email, score, message count, Slack status
- [ ] Click "View →" → transcript page shows full message history
- [ ] Session meta shows opener variant, first/last seen, slack notified time

---

## Mobile Tests (375px, 414px, 768px viewports)

See MOBILE_CHECK.md for per-page results.

- [ ] Widget button does NOT cover "Get Free Cost Audit" CTA on home page
- [ ] Widget button does NOT cover /calculator submit button
- [ ] Widget button does NOT cover /inquiry submit button
- [ ] Chat panel opens correctly (auto-width on mobile)
- [ ] Keyboard on iOS does not push widget off screen
- [ ] Widget closes on tap outside panel (test at 375px)

---

## Performance Tests

- [ ] First message reply < 3s (Sonnet 4.6 warm)
- [ ] KB retrieval < 200ms (in-memory, should be < 10ms)
- [ ] No visible layout shift from widget mount
- [ ] Build size: widget chunk not significantly larger than baseline

---

## Cost Guard

See COST.md for projected monthly cost.
- [ ] Log 100 test messages total API cost from Anthropic dashboard
- [ ] Projected cost at 1,000 sessions/month under $150

---

## Status

**Build:** ✅ Passing (verified)  
**TypeScript:** ✅ Clean (scripts/seed-zips.ts pre-existing issue fixed)  
**Functional:** ⏳ Pending staging deploy + migration  
**Mobile:** ⏳ Pending manual check  
**Cost:** ⏳ Pending 100-message test run  
