import { NextResponse } from 'next/server';
import { getCurrentUser, publicUser } from '@/lib/auth';
import { isRateLimited } from '@/lib/rate-limit';

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited(`me:${ip}`, 30, 60)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: publicUser(user) });
}
