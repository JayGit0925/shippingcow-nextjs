import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import {
  getVerificationCode,
  markVerificationCodeUsed,
  setEmailVerified,
  invalidateOldCodes,
} from '@/lib/db';
import { isRateLimited } from '@/lib/rate-limit';

const schema = z.object({
  code: z.string().length(4, 'Verification code must be 4 digits'),
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited(`verify:${ip}`, 10, 60)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated. Please sign up first.' }, { status: 401 });
    }

    if (user.email_verified) {
      return NextResponse.json({ ok: true, message: 'Email already verified.' });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid code' },
        { status: 400 }
      );
    }

    const { code } = parsed.data;
    const row = await getVerificationCode(user.id, code);

    if (!row) {
      return NextResponse.json(
        { error: 'Invalid or expired code. Request a new one.' },
        { status: 400 }
      );
    }

    await markVerificationCodeUsed(row.id);
    await setEmailVerified(user.id);
    await invalidateOldCodes(user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[verify-email]', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
