import { Pool } from "pg";

type WaitlistRow = {
  id: number;
  full_name: string;
  email: string;
  company_name: string | null;
  phone_number: string | null;
  role: string | null;
  focus: string | null;
  created_at: Date;
};

type NewWaitlistInput = {
  fullName: string;
  email: string;
  companyName?: string;
  phoneNumber?: string;
  role?: string;
  focus?: string;
};

let pool: Pool | null = null;
let schemaReady = false;

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }
  return url;
}

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

async function ensureSchema(): Promise<void> {
  if (schemaReady) {
    return;
  }

  await getPool().query(`
    CREATE TABLE IF NOT EXISTS waitlist_signups (
      id BIGSERIAL PRIMARY KEY,
      full_name VARCHAR(120) NOT NULL,
      email VARCHAR(320) NOT NULL UNIQUE,
      company_name VARCHAR(160),
      phone_number VARCHAR(40),
      role VARCHAR(60),
      focus VARCHAR(220),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  schemaReady = true;
}

export async function createWaitlistSignup(input: NewWaitlistInput): Promise<{ inserted: boolean; position: number }> {
  await ensureSchema();
  const db = getPool();

  const insertResult = await db.query<{ id: string }>(
    `
      INSERT INTO waitlist_signups (full_name, email, company_name, phone_number, role, focus)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `,
    [
      input.fullName,
      input.email,
      input.companyName || null,
      input.phoneNumber || null,
      input.role || null,
      input.focus || null,
    ],
  );

  const positionResult = await db.query<{ position: string }>(
    `
      SELECT position FROM (
        SELECT email, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS position
        FROM waitlist_signups
      ) ranked
      WHERE email = $1
      LIMIT 1
    `,
    [input.email],
  );

  const position = Number(positionResult.rows[0]?.position || 0);

  return {
    inserted: insertResult.rowCount === 1,
    position,
  };
}

export async function listWaitlistSignups(): Promise<WaitlistRow[]> {
  await ensureSchema();
  const result = await getPool().query<WaitlistRow>(
    `
      SELECT id, full_name, email, company_name, phone_number, role, focus, created_at
      FROM waitlist_signups
      ORDER BY created_at DESC, id DESC
    `,
  );
  return result.rows;
}
