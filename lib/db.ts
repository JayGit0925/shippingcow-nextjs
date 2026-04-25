import postgres from 'postgres';

// postgres.js requires JSONValue for sql.json(); this cast bridges our loose types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asJson = (v: Record<string, unknown>) => v as any;

const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };

export const sql =
  globalForDb.sql ??
  postgres(process.env.DATABASE_URL!, {
    ssl: 'require',
    // Transaction poolers (Supabase port 6543) don't support prepared
    // statements. Setting prepare:false works for both pooler and direct.
    prepare: false,
    max: 10,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  });

if (process.env.NODE_ENV !== 'production') globalForDb.sql = sql;

// ============ Types ============

export type User = {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  company: string | null;
  created_at: string;
};

export type Inquiry = {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  monthly_spend?: string;
  product_weight?: string;
  message?: string;
  user_id?: number;
};

export type PasswordResetToken = {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: string;
  used: boolean;
  created_at: string;
};

// ============ User helpers ============

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const rows = await sql<User[]>`
    SELECT * FROM users WHERE email = ${email.toLowerCase()} LIMIT 1
  `;
  return rows[0];
}

export async function getUserById(id: number): Promise<User | undefined> {
  const rows = await sql<User[]>`
    SELECT * FROM users WHERE id = ${id} LIMIT 1
  `;
  return rows[0];
}

export async function createUser(params: {
  email: string;
  password_hash: string;
  name: string;
  company?: string;
}): Promise<User> {
  const rows = await sql<User[]>`
    INSERT INTO users (email, password_hash, name, company)
    VALUES (${params.email.toLowerCase()}, ${params.password_hash}, ${params.name}, ${params.company ?? null})
    RETURNING *
  `;
  return rows[0];
}

export async function updateUserPassword(userId: number, passwordHash: string): Promise<void> {
  await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId}`;
}

// ============ Inquiry helpers ============

export async function createInquiry(data: Inquiry): Promise<number> {
  const rows = await sql<{ id: number }[]>`
    INSERT INTO inquiries (name, email, company, phone, monthly_spend, product_weight, message, user_id)
    VALUES (
      ${data.name},
      ${data.email},
      ${data.company ?? null},
      ${data.phone ?? null},
      ${data.monthly_spend ?? null},
      ${data.product_weight ?? null},
      ${data.message ?? null},
      ${data.user_id ?? null}
    )
    RETURNING id
  `;
  return rows[0].id;
}

export async function getInquiriesForUser(userId: number) {
  return sql`
    SELECT * FROM inquiries WHERE user_id = ${userId} ORDER BY created_at DESC
  `;
}

export async function getAllInquiries() {
  return sql`
    SELECT i.*, u.name AS user_name
    FROM inquiries i
    LEFT JOIN users u ON i.user_id = u.id
    ORDER BY i.created_at DESC
  `;
}

// ============ Tracking helpers ============

export async function getTracking(trackingNumber: string) {
  const rows = await sql`
    SELECT * FROM tracking
    WHERE tracking_number = ${trackingNumber.toUpperCase().trim()}
    LIMIT 1
  `;
  return rows[0];
}

// ============ Lead helpers ============

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted'

export type Lead = {
  id: string
  created_at: string
  updated_at: string
  step_completed: number
  step_timestamps: Record<string, string>
  step1_data: Record<string, unknown> | null
  step2_data: Record<string, unknown> | null
  step3_data: Record<string, unknown> | null
  step4_data: Record<string, unknown> | null
  savings_estimate: Record<string, unknown> | null
  source_url: string | null
  status: LeadStatus
  followup_sent_at: string | null
}

export async function createLead(params: {
  step1_data: Record<string, unknown>
  source_url?: string
}): Promise<Lead> {
  const rows = await sql<Lead[]>`
    INSERT INTO leads (step1_data, source_url, step_completed, step_timestamps)
    VALUES (
      ${sql.json(asJson(params.step1_data))},
      ${params.source_url ?? null},
      1,
      ${sql.json({ 1: new Date().toISOString() })}
    )
    RETURNING *
  `
  return rows[0]
}

export async function updateLead(
  id: string,
  params: {
    step_completed: number
    step2_data?: Record<string, unknown>
    step3_data?: Record<string, unknown>
    step4_data?: Record<string, unknown>
    savings_estimate?: Record<string, unknown>
    status?: LeadStatus
  },
): Promise<Lead> {
  const stepKey = `${params.step_completed}`
  const rows = await sql<Lead[]>`
    UPDATE leads
    SET
      step_completed   = GREATEST(step_completed, ${params.step_completed}),
      step_timestamps  = step_timestamps || ${sql.json(asJson({ [stepKey]: new Date().toISOString() }))},
      step2_data       = COALESCE(${params.step2_data ? sql.json(asJson(params.step2_data)) : sql`step2_data`}, step2_data),
      step3_data       = COALESCE(${params.step3_data ? sql.json(asJson(params.step3_data)) : sql`step3_data`}, step3_data),
      step4_data       = COALESCE(${params.step4_data ? sql.json(asJson(params.step4_data)) : sql`step4_data`}, step4_data),
      savings_estimate = COALESCE(${params.savings_estimate ? sql.json(asJson(params.savings_estimate)) : sql`savings_estimate`}, savings_estimate),
      status           = COALESCE(${params.status ?? null}, status)
    WHERE id = ${id}
    RETURNING *
  `
  return rows[0]
}

export async function getAllLeads(): Promise<Lead[]> {
  return sql<Lead[]>`SELECT * FROM leads ORDER BY created_at DESC`
}

export async function getStaleNewLeads(): Promise<Lead[]> {
  return sql<Lead[]>`
    SELECT * FROM leads
    WHERE status = 'new'
      AND created_at < NOW() - INTERVAL '48 hours'
      AND followup_sent_at IS NULL
    ORDER BY created_at ASC
  `
}

export async function markLeadFollowupSent(id: string): Promise<void> {
  await sql`
    UPDATE leads
    SET status = 'contacted', followup_sent_at = NOW()
    WHERE id = ${id}
  `
}

// ============ Calculator session helpers ============

export type CalculatorSession = {
  id: string
  created_at: string
  session_id: string | null
  inputs: Record<string, unknown> | null
  dim_weight_139: number | null
  dim_weight_166: number | null
  dim_weight_225: number | null
  billable_weight_139: number | null
  billable_weight_225: number | null
  savings_per_package: number | null
  annual_savings: number | null
  converted_to_lead: boolean
  lead_id: string | null
}

export async function saveCalculatorSession(params: {
  session_id?: string
  inputs: { length: number; width: number; height: number; actual_weight: number; monthly_volume: number }
  dim_weight_139: number
  dim_weight_166: number
  dim_weight_225: number
  billable_weight_139: number
  billable_weight_225: number
  savings_per_package: number
  annual_savings: number
}): Promise<CalculatorSession> {
  const rows = await sql<CalculatorSession[]>`
    INSERT INTO calculator_sessions (
      session_id, inputs,
      dim_weight_139, dim_weight_166, dim_weight_225,
      billable_weight_139, billable_weight_225,
      savings_per_package, annual_savings
    ) VALUES (
      ${params.session_id ?? null},
      ${sql.json(asJson(params.inputs))},
      ${params.dim_weight_139},
      ${params.dim_weight_166},
      ${params.dim_weight_225},
      ${params.billable_weight_139},
      ${params.billable_weight_225},
      ${params.savings_per_package},
      ${params.annual_savings}
    )
    RETURNING *
  `
  return rows[0]
}

// ============ Chat message helpers ============

export async function saveChatMessage(params: {
  session_id: string
  role: 'user' | 'assistant'
  content: string
  page_url?: string
  lead_id?: string
}): Promise<void> {
  await sql`
    INSERT INTO chat_messages (session_id, role, content, page_url, lead_id)
    VALUES (
      ${params.session_id},
      ${params.role},
      ${params.content},
      ${params.page_url ?? null},
      ${params.lead_id ?? null}
    )
  `
}

export async function linkChatToLead(sessionId: string, leadId: string): Promise<void> {
  await sql`
    UPDATE chat_messages
    SET lead_id = ${leadId}
    WHERE session_id = ${sessionId} AND lead_id IS NULL
  `
}

// ============ Password reset helpers ============

export async function createPasswordResetToken(userId: number, tokenHash: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await sql`
    INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
    VALUES (${userId}, ${tokenHash}, ${expiresAt.toISOString()})
  `;
}

export async function getPasswordResetToken(tokenHash: string): Promise<PasswordResetToken | undefined> {
  const rows = await sql<PasswordResetToken[]>`
    SELECT * FROM password_reset_tokens WHERE token_hash = ${tokenHash} LIMIT 1
  `;
  return rows[0];
}

export async function markPasswordResetTokenUsed(id: number): Promise<void> {
  await sql`UPDATE password_reset_tokens SET used = true WHERE id = ${id}`;
}

// ============ Chat session helpers (v2) ============

export type ChatSessionRow = {
  session_id: string
  first_seen: string
  last_seen: string
  page_count: number
  opener_variant: string | null
  email: string | null
  qualified_score: number
  lead_id: string | null
  slack_notified_at: string | null
  follow_up_sent_at: string | null
  message_count: number
  calculator_context: Record<string, unknown> | null
}

export async function upsertChatSession(params: {
  session_id: string
  opener_variant?: string
  calculator_context?: Record<string, unknown>
}): Promise<void> {
  await sql`
    INSERT INTO chat_sessions (session_id, opener_variant, calculator_context)
    VALUES (
      ${params.session_id},
      ${params.opener_variant ?? null},
      ${params.calculator_context ? sql.json(asJson(params.calculator_context)) : null}
    )
    ON CONFLICT (session_id) DO UPDATE SET
      last_seen = NOW(),
      page_count = chat_sessions.page_count + 1,
      opener_variant = COALESCE(chat_sessions.opener_variant, EXCLUDED.opener_variant),
      calculator_context = COALESCE(EXCLUDED.calculator_context, chat_sessions.calculator_context)
  `
}

export async function incrementSessionMessageCount(session_id: string): Promise<number> {
  const rows = await sql<{ message_count: number }[]>`
    UPDATE chat_sessions
    SET message_count = message_count + 1, last_seen = NOW()
    WHERE session_id = ${session_id}
    RETURNING message_count
  `
  return rows[0]?.message_count ?? 0
}

export async function updateSessionQualification(params: {
  session_id: string
  qualified_score: number
  email?: string
}): Promise<void> {
  await sql`
    UPDATE chat_sessions
    SET
      qualified_score = GREATEST(qualified_score, ${params.qualified_score}),
      email = COALESCE(${params.email ?? null}, email)
    WHERE session_id = ${params.session_id}
  `
}

export async function markSessionSlackNotified(session_id: string): Promise<void> {
  await sql`
    UPDATE chat_sessions SET slack_notified_at = NOW()
    WHERE session_id = ${session_id}
  `
}

export async function getChatSession(session_id: string): Promise<ChatSessionRow | undefined> {
  const rows = await sql<ChatSessionRow[]>`
    SELECT * FROM chat_sessions WHERE session_id = ${session_id} LIMIT 1
  `
  return rows[0]
}

export async function getChatSessionByEmail(email: string): Promise<ChatSessionRow | undefined> {
  const rows = await sql<ChatSessionRow[]>`
    SELECT * FROM chat_sessions
    WHERE email = ${email.toLowerCase()}
    ORDER BY last_seen DESC LIMIT 1
  `
  return rows[0]
}

export async function getRecentChatMessages(session_id: string, limit = 20): Promise<{ role: string; content: string; created_at: string }[]> {
  return sql<{ role: string; content: string; created_at: string }[]>`
    SELECT role, content, created_at FROM chat_messages
    WHERE session_id = ${session_id}
    ORDER BY created_at ASC LIMIT ${limit}
  `
}

export async function logChatEvent(params: {
  session_id: string
  event_type: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  await sql`
    INSERT INTO chat_events (session_id, event_type, metadata)
    VALUES (
      ${params.session_id},
      ${params.event_type},
      ${params.metadata ? sql.json(asJson(params.metadata)) : null}
    )
  `
}

export async function getAllChatSessions(limit = 50): Promise<ChatSessionRow[]> {
  return sql<ChatSessionRow[]>`
    SELECT * FROM chat_sessions
    ORDER BY last_seen DESC LIMIT ${limit}
  `
}

// ============ ZIP coordinate helpers ============

export async function getZipCoords(zip: string): Promise<{lat: number, lng: number} | undefined> {
  const rows = await sql<{lat: number, lng: number}[]>`
    SELECT lat, lng FROM zip_coords WHERE zip = ${zip.padStart(5, '0')} LIMIT 1
  `;
  return rows[0];
}

// ============ Audit helpers ============

export type AuditReport = {
  id: string
  created_at: string
  lead_id?: string
  input_data: Record<string, unknown>
  report_data: Record<string, unknown>
  row_count: number
  total_savings: number
}

export async function saveAudit(params: {
  input_data: Record<string, unknown>
  report_data: Record<string, unknown>
  row_count: number
  total_savings: number
  lead_id?: string
}): Promise<string> {
  const rows = await sql<{id: string}[]>`
    INSERT INTO audits (input_data, report_data, row_count, total_savings, lead_id)
    VALUES (
      ${sql.json(asJson(params.input_data))},
      ${sql.json(asJson(params.report_data))},
      ${params.row_count},
      ${params.total_savings},
      ${params.lead_id ?? null}
    )
    RETURNING id
  `;
  return rows[0].id;
}

export async function getAudit(id: string): Promise<AuditReport | undefined> {
  const rows = await sql<AuditReport[]>`
    SELECT * FROM audits WHERE id = ${id} LIMIT 1
  `;
  return rows[0];
}
