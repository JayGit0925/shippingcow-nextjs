import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createVerificationCode, invalidateOldCodes } from '@/lib/db';
import { sendVerificationCode } from '@/lib/email';
import { isRateLimited } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited(`resend-verify:${ip}`, 3, 300)) {
    return NextResponse.json({ error: 'Too many resend requests. Try again in 5 minutes.' }, { status: 429 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    if (user.email_verified) {
      return NextResponse.json({ ok: true, message: 'Email already verified.' });
    }

    // Invalidate old codes, generate new one
    await invalidateOldCodes(user.id);
    const code = await createVerificationCode(user.id);
    await sendVerificationCode(user.email, user.name, code);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[resend-verification]', err);
    return NextResponse.json({ error: 'Failed to send code. Try again.' }, { status: 500 });
  }
}
