import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Put the DB file in ./data/shippingcow.sqlite (gitignored)
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'shippingcow.sqlite');

// In development, Next.js hot-reloads and can create many DB instances.
// Cache on globalThis to reuse the same connection.
const globalForDb = globalThis as unknown as { db?: Database.Database };

export const db =
  globalForDb.db ??
  (() => {
    const instance = new Database(dbPath);
    instance.pragma('journal_mode = WAL');
    instance.pragma('foreign_keys = ON');

    // Users table
    instance.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        company TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Inquiries table
    instance.exec(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        company TEXT,
        phone TEXT,
        monthly_spend TEXT,
        product_weight TEXT,
        message TEXT,
        user_id INTEGER,
        status TEXT DEFAULT 'new',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Simple in-memory-style tracking (mock data for demo)
    instance.exec(`
      CREATE TABLE IF NOT EXISTS tracking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tracking_number TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL,
        origin TEXT,
        destination TEXT,
        est_delivery TEXT,
        user_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Seed some demo tracking numbers so the track feature works out of the box
    const hasTracking = instance.prepare('SELECT COUNT(*) as c FROM tracking').get() as { c: number };
    if (hasTracking.c === 0) {
      const seed = instance.prepare(
        'INSERT INTO tracking (tracking_number, status, origin, destination, est_delivery) VALUES (?, ?, ?, ?, ?)'
      );
      seed.run('SC123456789', 'out_for_delivery', 'Dallas, TX', 'Austin, TX', 'Tomorrow, 2 PM');
      seed.run('SC987654321', 'in_transit', 'Reno, NV', 'Denver, CO', '2 days');
      seed.run('SC111222333', 'delivered', 'Knoxville, TN', 'Atlanta, GA', 'Delivered');
    }

    return instance;
  })();

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;

// ============ Query helpers ============

export type User = {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  company: string | null;
  created_at: string;
};

export function getUserByEmail(email: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as User | undefined;
}

export function getUserById(id: number): User | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

export function createUser(params: {
  email: string;
  password_hash: string;
  name: string;
  company?: string;
}): User {
  const result = db
    .prepare(
      'INSERT INTO users (email, password_hash, name, company) VALUES (?, ?, ?, ?)'
    )
    .run(params.email.toLowerCase(), params.password_hash, params.name, params.company ?? null);
  return getUserById(result.lastInsertRowid as number)!;
}

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

export function createInquiry(data: Inquiry): number {
  const result = db
    .prepare(
      `INSERT INTO inquiries (name, email, company, phone, monthly_spend, product_weight, message, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.name,
      data.email,
      data.company ?? null,
      data.phone ?? null,
      data.monthly_spend ?? null,
      data.product_weight ?? null,
      data.message ?? null,
      data.user_id ?? null
    );
  return result.lastInsertRowid as number;
}

export function getTracking(trackingNumber: string) {
  return db
    .prepare('SELECT * FROM tracking WHERE tracking_number = ?')
    .get(trackingNumber.toUpperCase().trim());
}

export function getInquiriesForUser(userId: number) {
  return db
    .prepare('SELECT * FROM inquiries WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId);
}
