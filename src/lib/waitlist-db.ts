import { Pool } from "pg";
import { promises as fs } from "node:fs";
import path from "node:path";

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
const WAITLIST_FALLBACK_FILE = path.join(process.cwd(), "backend", "waitlist-signups.json");

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }
  return url;
}

function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function shouldUseFileFallback(): boolean {
  return process.env.NODE_ENV !== "production" && !hasDatabaseUrl();
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
  if (shouldUseFileFallback()) {
    return;
  }

  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is required in production.");
  }

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

type LegacyWaitlistEntry = {
  name?: string;
  fullName?: string;
  email: string;
  companyName?: string;
  phoneNumber?: string;
  role?: string;
  focus?: string;
  createdAt?: string;
};

async function readFallbackEntries(): Promise<LegacyWaitlistEntry[]> {
  try {
    const raw = await fs.readFile(WAITLIST_FALLBACK_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as LegacyWaitlistEntry[]) : [];
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeFallbackEntries(entries: LegacyWaitlistEntry[]): Promise<void> {
  await fs.mkdir(path.dirname(WAITLIST_FALLBACK_FILE), { recursive: true });
  await fs.writeFile(WAITLIST_FALLBACK_FILE, JSON.stringify(entries, null, 2), "utf8");
}

async function createFallbackSignup(input: NewWaitlistInput): Promise<{ inserted: boolean; position: number }> {
  const entries = await readFallbackEntries();
  const normalizedEmail = input.email.toLowerCase();
  const existingIndex = entries.findIndex((entry) => entry.email?.toLowerCase() === normalizedEmail);

  if (existingIndex >= 0) {
    return { inserted: false, position: existingIndex + 1 };
  }

  entries.push({
    fullName: input.fullName,
    email: normalizedEmail,
    companyName: input.companyName,
    phoneNumber: input.phoneNumber,
    role: input.role,
    focus: input.focus,
    createdAt: new Date().toISOString(),
  });

  await writeFallbackEntries(entries);
  return { inserted: true, position: entries.length };
}

function mapFallbackEntryToRow(entry: LegacyWaitlistEntry, index: number): WaitlistRow {
  return {
    id: index + 1,
    full_name: entry.fullName || entry.name || "",
    email: entry.email,
    company_name: entry.companyName || null,
    phone_number: entry.phoneNumber || null,
    role: entry.role || null,
    focus: entry.focus || null,
    created_at: entry.createdAt ? new Date(entry.createdAt) : new Date(0),
  };
}

export async function createWaitlistSignup(input: NewWaitlistInput): Promise<{ inserted: boolean; position: number }> {
  if (shouldUseFileFallback()) {
    return createFallbackSignup(input);
  }

  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is required in production.");
  }

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
  if (shouldUseFileFallback()) {
    const entries = await readFallbackEntries();
    return entries
      .map((entry, index) => mapFallbackEntryToRow(entry, index))
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is required in production.");
  }

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
