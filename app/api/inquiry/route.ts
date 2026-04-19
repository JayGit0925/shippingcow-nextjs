import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createInquiry } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { sendInquiryNotification, sendInquiryConfirmation } from '@/lib/email';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Valid email required'),
  company: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  monthly_spend: z.string().max(60).optional(),
  product_weight: z.string().max(60).optional(),
  message: z.string().max(2000).optional(),
});

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

    const id = createInquiry(data);

    // Send emails in parallel. Failures don't block the response — the inquiry
    // is already saved in the DB, so the user won't lose their submission.
    const [notif, confirm] = await Promise.allSettled([
      sendInquiryNotification(parsed.data),
      sendInquiryConfirmation(parsed.data),
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
