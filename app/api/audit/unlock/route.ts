import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { sendAuditReport } from '@/lib/email';
import { getAudit, createLead, linkAuditLead } from '@/lib/db';
import { isRateLimited } from '@/lib/rate-limit';
import { SITE_URL } from '@/lib/site';

const bodySchema = z.object({
  email: z.string().email(),
  audit_id: z.string().uuid(),
});

// A-1 hardening (TSK-WEB-09): this POST is the audit funnel's lead-capture
// moment. The captured email must survive even if Slack/Resend are down, and
// the caller must learn whether their email copy actually went out.
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited(`audit-unlock:${ip}`, 10, 3600)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { email, audit_id } = parsed.data;

  // Verify audit exists; trust DB, never client input. The savings figure below
  // is INTERNAL ONLY — it goes to our Slack alert, never to the customer email.
  const audit = await getAudit(audit_id);
  if (!audit) {
    return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
  }

  // Persist the lead FIRST — the email address must not depend on Slack or
  // Resend being up. A lead-write failure is logged, not surfaced: losing the
  // row is bad, but refusing the prospect their report is worse.
  try {
    const lead = await createLead({
      step1_data: { email, audit_id, source: 'audit_unlock' },
      source_url: '/audit',
    });
    await linkAuditLead(audit_id, lead.id);
  } catch (err) {
    Sentry.captureException(err);
    console.error('[audit/unlock] lead persist error:', err);
  }

  // Awaited (was fire-and-forget): the client shows a resend UI on failure.
  let email_sent = false;
  try {
    const sent = await sendAuditReport(email, audit_id, SITE_URL);
    email_sent = sent.ok;
    if (!sent.ok) {
      Sentry.captureException(new Error(`[audit/unlock] report email failed: ${sent.error}`));
    }
  } catch (err) {
    Sentry.captureException(err);
    console.error('[audit/unlock] email error:', err);
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (webhookUrl) {
    const annual_savings = Number(audit.total_savings) * 12;
    const savings = `$${Math.round(annual_savings).toLocaleString()}/yr`;
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🔓 *Audit report unlocked* — ${email} | ${savings} | audit_id: ${audit_id}`,
      }),
    }).catch((e) => console.error('[audit/unlock] slack error:', e));
  }

  return NextResponse.json({ ok: true, email_sent });
}
