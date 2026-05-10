export type AuthUser = {
  email: string;
  fullName: string;
  createdAt: string;
  token: string;
};

export type TrendPreference = "daily" | "weekly" | "monthly";

export type FollowedTopic = {
  id: string;
  label: string;
  followedAt: string;
  preference: TrendPreference;
};

export type FavoritePaper = {
  id: string;
  title: string;
  addedAt: string;
};

export type SearchHistoryItem = {
  id: string;
  query: string;
  searchedAt: string;
};

export type TopicGapNote = {
  id: string;
  query: string;
  content: string;
};

// ── Auth key (shared — not per user) ──────────────────────────────────────────
const AUTH_KEY = "rdp.auth.user";

// ── Per-user key helpers ───────────────────────────────────────────────────────
// Each user gets their own namespace based on their email
// e.g. "rdp.user:alice@example.com.favorites"

function userKey(email: string, suffix: string): string {
  return `rdp.user:${email}.${suffix}`;
}

function getCurrentEmail(): string | null {
  const user = getAuthUser();
  return user?.email ?? null;
}

function safeWindow(): Window | null {
  if (typeof window === "undefined") return null;
  return window;
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export function getAuthUser(): AuthUser | null {
  const w = safeWindow();
  if (!w) return null;

  const raw = w.localStorage.getItem(AUTH_KEY) ?? w.sessionStorage.getItem(AUTH_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthUser(user: AuthUser, options?: { remember?: boolean }): void {
  const w = safeWindow();
  if (!w) return;

  const remember = options?.remember ?? true;
  const serialized = JSON.stringify(user);

  if (remember) {
    w.localStorage.setItem(AUTH_KEY, serialized);
    w.sessionStorage.removeItem(AUTH_KEY);
    return;
  }

  w.sessionStorage.setItem(AUTH_KEY, serialized);
  w.localStorage.removeItem(AUTH_KEY);
}

export function clearAuthUser(): void {
  const w = safeWindow();
  if (!w) return;
  w.localStorage.removeItem(AUTH_KEY);
  w.sessionStorage.removeItem(AUTH_KEY);
}

// ── Followed Topics ────────────────────────────────────────────────────────────

export function getFollowedTopics(): FollowedTopic[] {
  const w = safeWindow();
  if (!w) return [];

  const email = getCurrentEmail();
  if (!email) return [];

  const raw = w.localStorage.getItem(userKey(email, "topics"));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as FollowedTopic[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setFollowedTopics(topics: FollowedTopic[]): void {
  const w = safeWindow();
  if (!w) return;

  const email = getCurrentEmail();
  if (!email) return;

  w.localStorage.setItem(userKey(email, "topics"), JSON.stringify(topics));
}

export function toggleFollowTopic(label: string): FollowedTopic[] {
  const topics = getFollowedTopics();
  const normalizedLabel = label.trim();
  const existing = topics.find((topic) => topic.label === normalizedLabel);

  if (existing) {
    const updated = topics.filter((topic) => topic.label !== normalizedLabel);
    setFollowedTopics(updated);
    return updated;
  }

  const nextTopic: FollowedTopic = {
    id: crypto.randomUUID(),
    label: normalizedLabel,
    followedAt: new Date().toISOString(),
    preference: "weekly",
  };

  const updated = [nextTopic, ...topics];
  setFollowedTopics(updated);
  return updated;
}

export function updateTopicPreference(id: string, preference: TrendPreference): FollowedTopic[] {
  const topics = getFollowedTopics();
  const updated = topics.map((topic) =>
    topic.id === id ? { ...topic, preference } : topic,
  );
  setFollowedTopics(updated);
  return updated;
}

// ── Favorite Papers ────────────────────────────────────────────────────────────

export function getFavoritePapers(): FavoritePaper[] {
  const w = safeWindow();
  if (!w) return [];

  const email = getCurrentEmail();
  if (!email) return [];

  const raw = w.localStorage.getItem(userKey(email, "favorites"));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as FavoritePaper[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setFavoritePapers(papers: FavoritePaper[]): void {
  const w = safeWindow();
  if (!w) return;

  const email = getCurrentEmail();
  if (!email) return;

  w.localStorage.setItem(userKey(email, "favorites"), JSON.stringify(papers));
}

export function toggleFavoritePaper(id: string, title: string): FavoritePaper[] {
  const papers = getFavoritePapers();
  const existing = papers.find((paper) => paper.id === id);

  if (existing) {
    const updated = papers.filter((paper) => paper.id !== id);
    setFavoritePapers(updated);
    return updated;
  }

  const next: FavoritePaper = {
    id,
    title,
    addedAt: new Date().toISOString(),
  };

  const updated = [next, ...papers];
  setFavoritePapers(updated);
  return updated;
}

// ── Search History ─────────────────────────────────────────────────────────────

export function getSearchHistory(): SearchHistoryItem[] {
  const w = safeWindow();
  if (!w) return [];

  const email = getCurrentEmail();
  if (!email) return [];

  const raw = w.localStorage.getItem(userKey(email, "history"));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as SearchHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addSearchHistory(query: string): SearchHistoryItem[] {
  const cleaned = query.trim();
  if (!cleaned) return getSearchHistory();

  const email = getCurrentEmail();
  if (!email) return [];

  const history = getSearchHistory();
  const deduped = history.filter(
    (item) => item.query.toLowerCase() !== cleaned.toLowerCase()
  );

  const next: SearchHistoryItem = {
    id: crypto.randomUUID(),
    query: cleaned,
    searchedAt: new Date().toISOString(),
  };

  const updated = [next, ...deduped].slice(0, 30);

  const w = safeWindow();
  if (w) {
    w.localStorage.setItem(userKey(email, "history"), JSON.stringify(updated));
  }

  return updated;
}

// ── Topic Gap Notes ────────────────────────────────────────────────────────────

export function getTopicGapNotes(): TopicGapNote[] {
  const w = safeWindow();
  if (!w) return [];

  const email = getCurrentEmail();
  if (!email) return [];

  const notes: TopicGapNote[] = [];
  const prefix = `rdp.user:${email}.note:`;

  for (let index = 0; index < w.localStorage.length; index += 1) {
    const key = w.localStorage.key(index);
    if (!key || !key.startsWith(prefix)) continue;

    const query = key.slice(prefix.length).trim();
    const content = w.localStorage.getItem(key)?.trim() ?? "";
    if (!query || !content) continue;

    notes.push({ id: key, query, content });
  }

  return notes.sort((a, b) => a.query.localeCompare(b.query));
}

// ── Note key helper (used by topic-gap page) ───────────────────────────────────
// Call this to get the localStorage key for a note for the current user

export function getNoteKey(query: string): string | null {
  const email = getCurrentEmail();
  if (!email) return null;
  return `rdp.user:${email}.note:${query.toLowerCase()}`;
}