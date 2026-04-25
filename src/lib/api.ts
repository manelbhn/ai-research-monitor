const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ApiPaper {
  title: string;
  abstract: string;
  authors: string[];
  date: string;
  pdf: string;
  source: string;
  summary: string;
  relevance_score: number;
}

export interface SearchResponse {
  topic: string;
  total: number;
  papers: ApiPaper[];
}

export interface AuthResponse {
  token: string;
  full_name: string;
  email: string;
}

export interface GapCard {
  gap: string;          // name of the gap
  reason: string;       // why it's missing
  opportunity: number;  // 0-100
  action: string;       // recommended action
}

export interface GapResponse {
  topic: string;
  gaps: GapCard[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function post<T>(path: string, body: object): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail ?? `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export async function signup(
  fullName: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  return post<AuthResponse>("/api/auth/signup", {
    full_name: fullName,
    email,
    password,
  });
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  return post<AuthResponse>("/api/auth/login", { email, password });
}

// ── Search ─────────────────────────────────────────────────────────────────────

export async function searchPapers(
  topic: string,
  options?: {
    date_from?: string;
    date_to?: string;
    detail_level?: "short" | "medium" | "detailed";
  }
): Promise<SearchResponse> {
  return post<SearchResponse>("/api/search", {
    topic,
    date_from: options?.date_from ?? null,
    date_to: options?.date_to ?? null,
    sources: ["arxiv"],
    detail_level: options?.detail_level ?? "medium",
  });
}

// ── Gap Detection ──────────────────────────────────────────────────────────────

export async function detectGaps(
  topic: string,
  summaries: string[]
): Promise<GapResponse> {
  return post<GapResponse>("/api/gap", { topic, summaries });
}