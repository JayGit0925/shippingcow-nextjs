import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateLead } from '@/lib/db';

const skuSchema = z.object({
  name:   z.string().optional(),
  length: z.number().positive(),
  width:  z.number().positive(),
  height: z.number().positive(),
  weight: z.number().positive(),
});

const bodySchema = z.object({
  step_completed:   z.number().int().min(2).max(4),
  step2_data:       z.record(z.unknown()).optional(),
  step3_data:       z.object({
    skus:                 z.array(skuSchema).min(1).max(3),
    origin_zip:          z.string().optional(),
    top_destination_zips: z.array(z.string()).max(3).optional(),
  }).optional(),
  step4_data:       z.object({
    email:               z.string().email(),
    phone:               z.string().optional(),
    frustration:         z.string().max(1000).optional(),
    uploaded_file_urls:  z.array(z.string()).optional(),
  }).optional(),
  savings_estimate: z.record(z.unknown()).optional(),
  status:           z.enum(['new', 'contacted', 'qualified', 'converted']).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }

  try {
    const lead = await updateLead(id, {
      step_completed:  parsed.data.step_completed,
      step2_data:      parsed.data.step2_data as Record<string, unknown> | undefined,
      step3_data:      parsed.data.step3_data as Record<string, unknown> | undefined,
      step4_data:      parsed.data.step4_data as Record<string, unknown> | undefined,
      savings_estimate: parsed.data.savings_estimate as Record<string, unknown> | undefined,
      status:          parsed.data.status,
    });

    if (parsed.data.step_completed === 4 && process.env.N8N_WEBHOOK_URL) {
      const s1 = lead.step1_data as Record<string, unknown> | null;
      const s2 = lead.step2_data as Record<string, unknown> | null;
      const s3 = lead.step3_data as Record<string, unknown> | null;
      fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id:          lead.id,
          email:            parsed.data.step4_data?.email ?? null,
          phone:            parsed.data.step4_data?.phone ?? null,
          company:          s2?.company_name ?? null,
          shopify_url:      s2?.shopify_url ?? null,
          monthly_orders:   s2?.monthly_orders ?? null,
          skus:             s3?.skus ?? [],
          origin_zip:       s3?.origin_zip ?? null,
          product_category: s1?.product_category ?? null,
          monthly_spend:    s1?.monthly_spend ?? null,
          savings_estimate: lead.savings_estimate ?? null,
          source:           'inquiry_funnel',
          submitted_at:     new Date().toISOString(),
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ id: lead.id });
  } catch (err) {
    console.error('[leads PATCH]', err);
    return NextResponse.json({ error: 'Could not update lead' }, { status: 500 });
  }
}
