import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createInquiry } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { sendInquiryNotification, sendInquiryConfirmation, sendGuideEmail } from '@/lib/email';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Valid email required'),
  company: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  monthly_spend: z.string().max(60).optional(),
  product_weight: z.string().max(60).optional(),
  message: z.string().max(2000).optional(),
});

/**
 * Push inquiry to CRM / n8n webhook. Fire-and-forget — never blocks.
 * Set CRM_WEBHOOK_URL in .env.local to enable.
 */
async function pushToCRM(data: Record<string, unknown>, inquiryId: string | number) {
  const url = process.env.CRM_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'inquiry',
        inquiry_id: inquiryId,
        timestamp: new Date().toISOString(),
        ...data,
      }),
    });
  } catch (e) {
    console.warn('[inquiry] CRM webhook failed:', e);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    // If logged in, attach the inquiry to their account
    const user = await getCurrentUser();
    const data = { ...parsed.data, user_id: user?.id };

    const id = await createInquiry(data);

    // Fire-and-forget: push to CRM / n8n (never blocks response)
    pushToCRM({ ...parsed.data, user_id: user?.id }, id).catch(
      (e) => console.warn('[inquiry] CRM push error:', e)
    );

    // Send emails in parallel. Failures don't block the response — the inquiry
    // is already saved in the DB, so the user won't lose their submission.
    const isGuideRequest = parsed.data.message?.includes('Guide');
    const [notif, confirm] = await Promise.allSettled([
      sendInquiryNotification(parsed.data),
      isGuideRequest
        ? sendGuideEmail(parsed.data.email, parsed.data.name)
        : sendInquiryConfirmation(parsed.data),
    ]);

    // Log but don't fail the request
    if (notif.status === 'fulfilled' && !notif.value.ok) {
      console.warn('[inquiry] notification email failed:', notif.value.error);
    }
    if (confirm.status === 'fulfilled' && !confirm.value.ok) {
      console.warn('[inquiry] confirmation email failed:', confirm.value.error);
    }

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error('[inquiry]', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
