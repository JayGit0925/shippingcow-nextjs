import { describe, it, expect, vi, beforeEach } from 'vitest';

// captureEvent must be safe to call from any component in any environment:
// no-op without a browser, no-op before posthog.init, never throws.

const capture = vi.fn();
const posthogMock = { __loaded: false, capture };
vi.mock('posthog-js', () => ({ default: posthogMock }));

describe('lib/analytics captureEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    posthogMock.__loaded = false;
    // vitest node env has no window
    // @ts-expect-error cleanup between tests
    delete globalThis.window;
  });

  it('no-ops when window is undefined (server)', async () => {
    posthogMock.__loaded = true;
    const { captureEvent } = await import('@/lib/analytics');
    captureEvent('audit_submitted', { shipment_count: 3 });
    expect(capture).not.toHaveBeenCalled();
  });

  it('no-ops when posthog is not loaded', async () => {
    (globalThis as Record<string, unknown>).window = {};
    const { captureEvent } = await import('@/lib/analytics');
    captureEvent('audit_submitted');
    expect(capture).not.toHaveBeenCalled();
  });

  it('captures name + props when loaded in a browser', async () => {
    (globalThis as Record<string, unknown>).window = {};
    posthogMock.__loaded = true;
    const { captureEvent } = await import('@/lib/analytics');
    captureEvent('audit_submitted', { shipment_count: 3 });
    expect(capture).toHaveBeenCalledWith('audit_submitted', { shipment_count: 3 });
  });

  it('never throws even if posthog.capture throws', async () => {
    (globalThis as Record<string, unknown>).window = {};
    posthogMock.__loaded = true;
    capture.mockImplementation(() => { throw new Error('boom'); });
    const { captureEvent } = await import('@/lib/analytics');
    expect(() => captureEvent('audit_submitted')).not.toThrow();
  });
});
