import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createUser, getUserByEmail, createVerificationCode } from '@/lib/db';
import { hashPassword, setSessionCookie, publicUser } from '@/lib/auth';
import { sendVerificationCode } from '@/lib/email';
import { isRateLimited } from '@/lib/rate-limit';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
  company: z.string().max(100).optional(),
});

export async function POST(req: Request) {
  // Rate limit: 5 signups/min per IP
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited(`signup:${ip}`, 5, 60)) {
    return NextResponse.json({ error: 'Too many signup attempts. Try again later.' }, { status: 429 });
  }
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { email, password, name, company } = parsed.data;

    if (await getUserByEmail(email)) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Try logging in instead.' },
        { status: 409 }
      );
    }

    const password_hash = await hashPassword(password);
    const user = await createUser({ email, password_hash, name, company });

    // Send verification code (non-blocking — don't fail signup if email send fails)
    try {
      const code = await createVerificationCode(user.id);
      await sendVerificationCode(user.email, user.name, code);
    } catch (emailErr) {
      console.warn('[signup] verification email send failed:', emailErr);
    }

    // Set session so user can access /verify-email immediately (dashboard is gated)
    await setSessionCookie(user.id);

    return NextResponse.json({ user: publicUser(user), requires_verification: true });
  } catch (err) {
    console.error('[signup]', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
