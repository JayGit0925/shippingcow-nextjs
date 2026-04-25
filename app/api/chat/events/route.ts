import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logChatEvent } from '@/lib/db';

const ALLOWED_EVENTS = [
  'widget_opened',
  'widget_auto_opened',
  'first_message',
  'email_captured',
  'qualified',
  'handoff_slack',
  'session_end',
] as const;

const bodySchema = z.object({
  session_id: z.string().min(1),
  event_type: z.enum(ALLOWED_EVENTS),
  metadata:   z.record(z.unknown()).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
  }

  try {
    await logChatEvent(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[chat/events] log error:', err);
    return NextResponse.json({ ok: false });
  }
}
