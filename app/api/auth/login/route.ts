import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserByEmail } from '@/lib/db';
import { verifyPassword, setSessionCookie, publicUser } from '@/lib/auth';
import { isRateLimited } from '@/lib/rate-limit';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  // Rate limit: 10 req/min per IP
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited(`login:${ip}`, 10, 60)) {
    return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 });
  }
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const user = await getUserByEmail(email);

    // Constant-time message to avoid leaking which step failed
    const invalid = NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );

    if (!user) return invalid;
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return invalid;

    // Block login if email not verified
    if (!user.email_verified) {
      await setSessionCookie(user.id);
      return NextResponse.json(
        { error: 'Please verify your email first. Check your inbox for a 4-digit code.', requires_verification: true },
        { status: 403 }
      );
    }

    await setSessionCookie(user.id);
    return NextResponse.json({ user: publicUser(user) });
  } catch (err) {
    console.error('[login]', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
