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
