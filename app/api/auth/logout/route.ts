import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';
import { isRateLimited } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited(`logout:${ip}`, 20, 60)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}