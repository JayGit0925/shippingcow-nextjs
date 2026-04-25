# Chat Widget v2 — A/B Experiment Framework

Use this template to define and track post-launch experiments.
Do not run experiments until baseline data exists (≥ 500 sessions).

---

## Template

```
## EXP-XXX: [Experiment Name]

Hypothesis: [If we change X, then Y will happen because Z]
Variant A (Control): [current behavior]
Variant B (Treatment): [proposed change]
Traffic split: 50/50
Primary metric: [e.g., email_capture_rate = email_captured / widget_opened]
Secondary metrics: [e.g., messages_per_session, qualified_rate]
Sample size needed: [use calculator: α=0.05, power=0.8, baseline rate, MDE]
Kill rule: Variant B below Variant A by ≥20% after 200 sessions → kill immediately
Start date: [TBD]
End date: [TBD]
Result: [Pending]
```

---

## Planned Experiments (Not Running)

### EXP-001: Auto-open timing

Hypothesis: 15s auto-open captures more high-intent visitors than 30s without increasing bounce.
Variant A: 30s delay (current)
Variant B: 15s delay
Primary metric: email_capture_rate
Sample size: ~400 sessions per variant
Kill rule: bounce rate increases >10% vs baseline

---

### EXP-002: Email capture prompt copy

Hypothesis: Specificity ("Send you the DIM 225 savings estimate for your product") outperforms generic ask.
Variant A: "Want me to send you a custom savings estimate? Drop your email."
Variant B: "I can calculate your exact DIM 225 savings — send it to your email?"
Primary metric: email_capture_rate (emails submitted / prompt shown)
Sample size: ~300 sessions per variant

---

### EXP-003: Opener variant by page

Hypothesis: Page-specific openers have higher first-message rate than the default opener.
Variant A: default opener (all pages)
Variant B: page-specific openers (current implementation)
Primary metric: first_message_rate (first_message / widget_opened)
Sample size: ~200 sessions per variant per page

---

## Tracking Implementation (v2)

`opener_variant` stored on `chat_sessions` row.
Use this SQL to compare variants:

```sql
SELECT
  opener_variant,
  COUNT(*)                                                        AS sessions,
  COUNT(*) FILTER (WHERE message_count > 0)                      AS had_message,
  COUNT(*) FILTER (WHERE email IS NOT NULL)                       AS had_email,
  ROUND(AVG(qualified_score), 1)                                  AS avg_score,
  ROUND(COUNT(*) FILTER (WHERE email IS NOT NULL)::numeric /
        NULLIF(COUNT(*), 0) * 100, 1)                            AS email_rate_pct
FROM chat_sessions
GROUP BY opener_variant
ORDER BY email_rate_pct DESC;
```
