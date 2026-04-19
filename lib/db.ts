import postgres from 'postgres';

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
