import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createLead } from '@/lib/db';

const bodySchema = z.object({
  monthly_spend:    z.string().min(1),
  weight_class:     z.string().min(1),
  product_category: z.string().min(1),
  source_url:       z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }

  const { source_url, ...step1_data } = parsed.data;

  try {
    const lead = await createLead({ step1_data, source_url });
    return NextResponse.json({ id: lead.id }, { status: 201 });
  } catch (err) {
    console.error('[leads POST]', err);
    return NextResponse.json({ error: 'Could not create lead' }, { status: 500 });
  }
}
