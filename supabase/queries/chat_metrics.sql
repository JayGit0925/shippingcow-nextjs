-- ============================================================
-- ShippingCow — Chat Widget v2 Metrics
-- Run in Supabase SQL Editor or any Postgres client
-- ============================================================

-- ── 1. Daily funnel ──────────────────────────────────────────
SELECT
  DATE_TRUNC('day', created_at) AS day,
  COUNT(*) FILTER (WHERE event_type = 'widget_opened')       AS opens,
  COUNT(*) FILTER (WHERE event_type = 'widget_auto_opened')  AS auto_opens,
  COUNT(*) FILTER (WHERE event_type = 'first_message')       AS first_messages,
  COUNT(*) FILTER (WHERE event_type = 'email_captured')      AS emails,
  COUNT(*) FILTER (WHERE event_type = 'qualified')           AS qualified,
  COUNT(*) FILTER (WHERE event_type = 'handoff_slack')       AS slack_handoffs
FROM chat_events
GROUP BY 1
ORDER BY 1 DESC
LIMIT 30;


-- ── 2. Overall funnel (all time) ─────────────────────────────
WITH counts AS (
  SELECT
    COUNT(DISTINCT session_id)                                  AS total_sessions,
    COUNT(DISTINCT session_id) FILTER (WHERE message_count > 0) AS had_message,
    COUNT(DISTINCT session_id) FILTER (WHERE email IS NOT NULL) AS had_email,
    COUNT(DISTINCT session_id) FILTER (WHERE qualified_score >= 70) AS qualified,
    COUNT(DISTINCT session_id) FILTER (WHERE slack_notified_at IS NOT NULL) AS slack_pinged
  FROM chat_sessions
)
SELECT
  total_sessions,
  had_message,
  ROUND(had_message::numeric / NULLIF(total_sessions, 0) * 100, 1) AS msg_rate_pct,
  had_email,
  ROUND(had_email::numeric / NULLIF(total_sessions, 0) * 100, 1)   AS email_rate_pct,
  qualified,
  ROUND(qualified::numeric / NULLIF(total_sessions, 0) * 100, 1)   AS qual_rate_pct,
  slack_pinged
FROM counts;


-- ── 3. Avg turns to email capture ────────────────────────────
SELECT
  ROUND(AVG(message_count), 1) AS avg_msgs_before_email
FROM chat_sessions
WHERE email IS NOT NULL;


-- ── 4. Opener variant performance ────────────────────────────
SELECT
  COALESCE(opener_variant, 'unknown')                            AS variant,
  COUNT(*)                                                        AS sessions,
  ROUND(AVG(message_count), 1)                                   AS avg_msgs,
  ROUND(AVG(qualified_score), 1)                                 AS avg_score,
  COUNT(*) FILTER (WHERE email IS NOT NULL)                      AS emails,
  ROUND(COUNT(*) FILTER (WHERE email IS NOT NULL)::numeric /
        NULLIF(COUNT(*), 0) * 100, 1)                            AS email_rate_pct
FROM chat_sessions
GROUP BY 1
ORDER BY email_rate_pct DESC;


-- ── 5. High-value sessions (score >= 70, no slack yet) ───────
SELECT
  session_id,
  email,
  qualified_score,
  message_count,
  opener_variant,
  last_seen,
  calculator_context
FROM chat_sessions
WHERE qualified_score >= 70
  AND slack_notified_at IS NULL
ORDER BY qualified_score DESC, last_seen DESC
LIMIT 25;


-- ── 6. Recent email captures (last 7 days) ───────────────────
SELECT
  s.session_id,
  s.email,
  s.qualified_score,
  s.message_count,
  s.opener_variant,
  s.slack_notified_at IS NOT NULL AS slack_sent,
  s.last_seen
FROM chat_sessions s
WHERE s.email IS NOT NULL
  AND s.last_seen > NOW() - INTERVAL '7 days'
ORDER BY s.last_seen DESC;


-- ── 7. Auto-open vs manual open comparison ───────────────────
WITH auto AS (
  SELECT session_id FROM chat_events WHERE event_type = 'widget_auto_opened'
),
manual AS (
  SELECT session_id FROM chat_events WHERE event_type = 'widget_opened'
  EXCEPT
  SELECT session_id FROM chat_events WHERE event_type = 'widget_auto_opened'
)
SELECT
  'auto_open'   AS open_type,
  COUNT(*)      AS sessions,
  ROUND(AVG(s.message_count), 1)  AS avg_msgs,
  ROUND(AVG(s.qualified_score), 1) AS avg_score,
  COUNT(*) FILTER (WHERE s.email IS NOT NULL) AS emails
FROM auto a
JOIN chat_sessions s ON s.session_id = a.session_id
UNION ALL
SELECT
  'manual_open' AS open_type,
  COUNT(*),
  ROUND(AVG(s.message_count), 1),
  ROUND(AVG(s.qualified_score), 1),
  COUNT(*) FILTER (WHERE s.email IS NOT NULL)
FROM manual m
JOIN chat_sessions s ON s.session_id = m.session_id;
