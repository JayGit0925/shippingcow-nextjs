import { describe, it, expect, vi, beforeEach } from 'vitest';

// A-1 hardening (TSK-WEB-09): the unlock POST is the funnel's lead-capture
// moment. It must (a) persist a lead row, (b) report email delivery honestly,
// (c) rate-limit per IP, (d) log failures to Sentry. lib/db is mocked — no
// real database is reachable here (CURRENT_STATE.md DATABASE_URL blocker).

const getAudit = vi.fn();
const createLead = vi.fn();
const linkAuditLead = vi.fn();
vi.mock('@/lib/db', () => ({ getAudit, createLead, linkAuditLead }));

const sendAuditReport = vi.fn();
vi.mock('@/lib/email', () => ({ sendAuditReport }));

const isRateLimited = vi.fn();
vi.mock('@/lib/rate-limit', () => ({ isRateLimited }));

const captureException = vi.fn();
vi.mock('@sentry/nextjs', () => ({ captureException }));

const AUDIT_ID = '123e4567-e89b-42d3-a456-426614174000';
const AUDIT_ROW = { id: AUDIT_ID, total_savings: 100 };

function makeReq(body: unknown) {
  return new Request('http://test/api/audit/unlock', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/audit/unlock (A-1 hardening)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isRateLimited.mockReturnValue(false);
    getAudit.mockResolvedValue(AUDIT_ROW);
    createLead.mockResolvedValue({ id: 'lead-1' });
    linkAuditLead.mockResolvedValue(undefined);
    sendAuditReport.mockResolvedValue({ ok: true });
  });

  it('creates a lead row from the captured email and links it to the audit', async () => {
    const { POST } = await import('@/app/api/audit/unlock/route');
    const res = await POST(makeReq({ email: 'buyer@example.com', audit_id: AUDIT_ID }));
    expect(res.status).toBe(200);
    expect(createLead).toHaveBeenCalledTimes(1);
    const arg = createLead.mock.calls[0][0];
    expect(arg.step1_data.email).toBe('buyer@example.com');
    expect(arg.step1_data.audit_id).toBe(AUDIT_ID);
    expect(arg.source_url).toBe('/audit');
    expect(linkAuditLead).toHaveBeenCalledWith(AUDIT_ID, 'lead-1');
  });

  it('reports email delivery honestly: email_sent true on success', async () => {
    const { POST } = await import('@/app/api/audit/unlock/route');
    const res = await POST(makeReq({ email: 'buyer@example.com', audit_id: AUDIT_ID }));
    const json = await res.json();
    expect(json).toEqual({ ok: true, email_sent: true });
  });

  it('reports email_sent false (still 200) when the send fails, and captures to Sentry', async () => {
    sendAuditReport.mockResolvedValue({ ok: false, error: 'resend down' });
    const { POST } = await import('@/app/api/audit/unlock/route');
    const res = await POST(makeReq({ email: 'buyer@example.com', audit_id: AUDIT_ID }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true, email_sent: false });
    expect(captureException).toHaveBeenCalled();
  });

  it('still succeeds (and captures to Sentry) when lead persistence throws — email capture must not 500', async () => {
    createLead.mockRejectedValue(new Error('db down'));
    const { POST } = await import('@/app/api/audit/unlock/route');
    const res = await POST(makeReq({ email: 'buyer@example.com', audit_id: AUDIT_ID }));
    expect(res.status).toBe(200);
    expect(captureException).toHaveBeenCalled();
    expect(sendAuditReport).toHaveBeenCalled(); // email still goes out
  });

  it('rate-limits per IP with 429', async () => {
    isRateLimited.mockReturnValue(true);
    const { POST } = await import('@/app/api/audit/unlock/route');
    const res = await POST(makeReq({ email: 'buyer@example.com', audit_id: AUDIT_ID }));
    expect(res.status).toBe(429);
    expect(sendAuditReport).not.toHaveBeenCalled();
    expect(createLead).not.toHaveBeenCalled();
  });

  it('404s on unknown audit without creating a lead', async () => {
    getAudit.mockResolvedValue(undefined);
    const { POST } = await import('@/app/api/audit/unlock/route');
    const res = await POST(makeReq({ email: 'buyer@example.com', audit_id: AUDIT_ID }));
    expect(res.status).toBe(404);
    expect(createLead).not.toHaveBeenCalled();
  });

  it('400s on invalid body', async () => {
    const { POST } = await import('@/app/api/audit/unlock/route');
    const res = await POST(makeReq({ email: 'not-an-email', audit_id: 'nope' }));
    expect(res.status).toBe(400);
  });
});

describe('report link longevity (A-1: valid ≥ 30 days)', () => {
  it('getAudit has no TTL/date filter and no cleanup job exists', async () => {
    const { readFileSync } = await import('node:fs');
    const db = readFileSync('lib/db.ts', 'utf8');
    const getAuditSrc = db.slice(db.indexOf('export async function getAudit'));
    const fnBody = getAuditSrc.slice(0, getAuditSrc.indexOf('}'));
    expect(fnBody).not.toMatch(/INTERVAL|created_at\s*[<>]|expires/i);
    expect(db).not.toMatch(/DELETE FROM audits/i);
  });
});
