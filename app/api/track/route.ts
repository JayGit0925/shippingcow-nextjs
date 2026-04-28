import { NextResponse } from 'next/server';
import { getTracking } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const number = searchParams.get('number');
  if (!number) {
    return NextResponse.json({ error: 'Tracking number required' }, { status: 400 });
  }

  let record;
  try {
    record = await getTracking(number);
  } catch (err) {
    console.error('[track GET] DB error', err);
    return NextResponse.json({ error: 'Tracking lookup failed. Try again shortly.' }, { status: 500 });
  }
  if (!record) {
    // Even unknown numbers return a playful mock result so the demo flows.
    // In production you'd return 404 or call a real carrier API.
    return NextResponse.json({
      found: false,
      tracking_number: number.toUpperCase(),
      status: 'unknown',
      message: "We couldn't find that one in our herd. Try SC123456789 or SC987654321 for a demo.",
    });
  }

  return NextResponse.json({ found: true, ...(record as object) });
}
