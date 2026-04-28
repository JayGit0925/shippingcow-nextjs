import { NextResponse } from 'next/server';
import { z } from 'zod';
import { allocateInbound } from '@/lib/allocation';

const itemSchema = z.object({
  sku: z.string().min(1),
  label: z.string().min(1),
  length: z.number().positive().max(120),
  width: z.number().positive().max(120),
  height: z.number().positive().max(120),
  weight: z.number().positive().max(500),
  qty: z.number().int().positive().max(1_000_000),
});

const destSchema = z.object({
  zip: z.string().regex(/^\d{5}$/, 'ZIP must be 5 digits'),
  pct: z.number().min(0.01).max(1),
});

const schema = z.object({
  origin_zip: z.string().regex(/^\d{5}$/, 'Origin ZIP must be 5 digits'),
  items: z.array(itemSchema).min(1).max(20),
  destinations: z.array(destSchema).min(1).max(10),
  label: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { error: first?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const result = await allocateInbound(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[allocation]', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
