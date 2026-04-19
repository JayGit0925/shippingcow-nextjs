import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserByEmail } from '@/lib/db';
import { verifyPassword, setSessionCookie, publicUser } from '@/lib/auth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const user = getUserByEmail(email);

    // Constant-time message to avoid leaking which step failed
    const invalid = NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );

    if (!user) return invalid;
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return invalid;

    await setSessionCookie(user.id);
    return NextResponse.json({ user: publicUser(user) });
  } catch (err) {
    console.error('[login]', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
