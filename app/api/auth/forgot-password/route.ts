import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { getUserByEmail, createPasswordResetToken } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const { email } = parsed.data;

  // Always return success to prevent email enumeration
  const user = getUserByEmail(email);
  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    createPasswordResetToken(user.id, tokenHash);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(user.email, user.name, resetUrl);
  }

  return NextResponse.json({ ok: true });
}
