import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendAuditReport } from '@/lib/email';
import { getAudit } from '@/lib/db';

const bodySchema = z.object({
  email: z.string().email(),
  audit_id: z.string().uuid(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { email, audit_id } = parsed.data;

  // Verify audit exists; trust DB for savings, never client input
  const audit = await getAudit(audit_id);
  if (!audit) {
    return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
  }

  const annual_savings = Number(audit.total_savings) * 12;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shippingcow.com';

  sendAuditReport(email, audit_id, annual_savings, siteUrl).catch(
    (e) => console.error('[audit/unlock] email error:', e)
  );

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (webhookUrl) {
    const savings = `$${Math.round(annual_savings).toLocaleString()}/yr`;
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🔓 *Audit report unlocked* — ${email} | ${savings} | audit_id: ${audit_id}`,
      }),
    }).catch((e) => console.error('[audit/unlock] slack error:', e));
  }

  return NextResponse.json({ ok: true });
}
