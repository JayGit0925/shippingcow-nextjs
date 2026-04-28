import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import {
  getPasswordResetToken,
  markPasswordResetTokenUsed,
  updateUserPassword,
  getUserById,
} from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { isRateLimited } from '@/lib/rate-limit';

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: Request) {
  // Rate limit: 5 attempts/min per IP
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited(`reset-pw:${ip}`, 5, 60)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message || 'Invalid request';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { token, password } = parsed.data;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const record = await getPasswordResetToken(tokenHash);

  if (!record || record.used) {
    return NextResponse.json({ error: 'This reset link is invalid or has already been used.' }, { status: 400 });
  }

  if (new Date(record.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 });
  }

  const user = await getUserById(record.user_id);
  if (!user) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  await updateUserPassword(user.id, passwordHash);
  await markPasswordResetTokenUsed(record.id);

  return NextResponse.json({ ok: true });
}
