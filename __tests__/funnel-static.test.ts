import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const calc = readFileSync('components/DimCalculator.tsx', 'utf8');
const chat = readFileSync('components/ChatWidget.tsx', 'utf8');
const provider = readFileSync('components/PostHogProvider.tsx', 'utf8');
const doc = readFileSync('docs/analytics/funnel-events.md', 'utf8');

describe('funnel instrumentation: DimCalculator', () => {
  it('imports typed helpers from lib/funnel (no raw event strings)', () => {
    expect(calc).toMatch(/from '@\/lib\/funnel'/);
    expect(calc).not.toMatch(/captureEvent\(/);
  });

  it('fires calculator_start via trackCalculatorStart', () => {
    expect(calc).toMatch(/trackCalculatorStart\(/);
  });

  it('fires calculator_complete via trackCalculatorComplete, gated on start', () => {
    expect(calc).toMatch(/trackCalculatorComplete\(/);
    expect(calc).toMatch(/startedRef\.current && !completedRef\.current/);
  });

  it('sends no dollar or savings properties to the funnel', () => {
    const trackCalls = calc.match(/trackCalculator\w+\(\{[^}]*\}/g) ?? [];
    expect(trackCalls.length).toBeGreaterThan(0);
    for (const call of trackCalls) {
      expect(call).not.toMatch(/savings|cost|price|\$/i);
    }
  });
});

describe('funnel instrumentation: ChatWidget', () => {
  it('fires email_captured via trackEmailCaptured with source only', () => {
    expect(chat).toMatch(/trackEmailCaptured\(\{ source: 'chat' \}\)/);
  });

  it('never passes the email address to PostHog', () => {
    expect(chat).not.toMatch(/trackEmailCaptured\([^)]*email/i);
    expect(chat).not.toMatch(/captureEvent\(/);
    expect(chat).not.toMatch(/trackQualified\([^)]*email/i);
  });

  it('fires qualified against the shared threshold with a session guard', () => {
    expect(chat).toMatch(/QUALIFIED_SCORE_THRESHOLD/);
    expect(chat).toMatch(/trackQualified\(/);
    expect(chat).toMatch(/sc_qualified/);
  });

  it('mirrors qualified into the internal chat-events pipe', () => {
    expect(chat).toMatch(/fireEvent\('qualified'/);
  });
});

describe('funnel stage 1: PostHogProvider', () => {
  it('still fires $pageview on route change', () => {
    expect(provider).toMatch(/\$pageview/);
  });
});

describe('funnel schema doc', () => {
  it('documents all six stages in order', () => {
    const idx = [
      '`$pageview`',
      '`calculator_start`',
      '`calculator_complete`',
      '`audit_submitted`',
      '`email_captured`',
      '`qualified`',
    ].map((s) => doc.indexOf(s));
    for (const i of idx) expect(i).toBeGreaterThan(-1);
    expect([...idx]).toEqual([...idx].sort((a, b) => a - b));
  });
});
