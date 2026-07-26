import { describe, it, expect, vi, beforeEach } from 'vitest';

const capture = vi.fn();
const posthogMock = { __loaded: true, capture };
vi.mock('posthog-js', () => ({ default: posthogMock }));

describe('lib/funnel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as Record<string, unknown>).window = {};
    posthogMock.__loaded = true;
  });

  it('declares the F-1 funnel stages in order', async () => {
    const { FUNNEL_STAGES } = await import('@/lib/funnel');
    expect(FUNNEL_STAGES).toEqual([
      '$pageview',
      'calculator_start',
      'calculator_complete',
      'audit_submitted',
      'email_captured',
      'qualified',
    ]);
  });

  it('qualified threshold matches the chat route override (70)', async () => {
    const { QUALIFIED_SCORE_THRESHOLD } = await import('@/lib/funnel');
    expect(QUALIFIED_SCORE_THRESHOLD).toBe(70);
    const fs = await import('node:fs');
    const route = fs.readFileSync('app/api/chat/route.ts', 'utf8');
    expect(route).toMatch(/qualify\.score >= 70/);
  });

  it('trackCalculatorStart fires calculator_start with first_field', async () => {
    const { trackCalculatorStart } = await import('@/lib/funnel');
    trackCalculatorStart({ first_field: 'length' });
    expect(capture).toHaveBeenCalledWith('calculator_start', { first_field: 'length' });
  });

  it('trackCalculatorComplete fires calculator_complete', async () => {
    const { trackCalculatorComplete } = await import('@/lib/funnel');
    trackCalculatorComplete({ used_zone_check: true, monthly_volume: 100 });
    expect(capture).toHaveBeenCalledWith('calculator_complete', { used_zone_check: true, monthly_volume: 100 });
  });

  it('trackEmailCaptured fires email_captured with source only (no email)', async () => {
    const { trackEmailCaptured } = await import('@/lib/funnel');
    trackEmailCaptured({ source: 'chat' });
    expect(capture).toHaveBeenCalledWith('email_captured', { source: 'chat' });
  });

  it('trackQualified fires qualified with score + intent', async () => {
    const { trackQualified } = await import('@/lib/funnel');
    trackQualified({ score: 82, intent: 'pricing' });
    expect(capture).toHaveBeenCalledWith('qualified', { score: 82, intent: 'pricing' });
  });
});
