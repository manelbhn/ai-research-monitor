export type AuthUser = {
  email: string;
  fullName: string;
  createdAt: string;
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

const AUTH_KEY = "rdp.auth.user";
const TOPICS_KEY = "rdp.trends.topics";
const FAVORITES_KEY = "rdp.profile.favorites";
const HISTORY_KEY = "rdp.profile.history";

function safeWindow(): Window | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window;
}

export function getAuthUser(): AuthUser | null {
  const w = safeWindow();
  if (!w) {
    return null;
  }

  const raw = w.localStorage.getItem(AUTH_KEY) ?? w.sessionStorage.getItem(AUTH_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthUser(user: AuthUser, options?: { remember?: boolean }): void {
  const w = safeWindow();
  if (!w) {
    return;
  }

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
  if (!w) {
    return;
  }
  w.localStorage.removeItem(AUTH_KEY);
  w.sessionStorage.removeItem(AUTH_KEY);
}

export function getFollowedTopics(): FollowedTopic[] {
  const w = safeWindow();
  if (!w) {
    return [];
  }

  const raw = w.localStorage.getItem(TOPICS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as FollowedTopic[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setFollowedTopics(topics: FollowedTopic[]): void {
  const w = safeWindow();
  if (!w) {
    return;
  }
  w.localStorage.setItem(TOPICS_KEY, JSON.stringify(topics));
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
    topic.id === id
      ? {
          ...topic,
          preference,
        }
      : topic,
  );
  setFollowedTopics(updated);
  return updated;
}

export function getFavoritePapers(): FavoritePaper[] {
  const w = safeWindow();
  if (!w) {
    return [];
  }

  const raw = w.localStorage.getItem(FAVORITES_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as FavoritePaper[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setFavoritePapers(papers: FavoritePaper[]): void {
  const w = safeWindow();
  if (!w) {
    return;
  }

  w.localStorage.setItem(FAVORITES_KEY, JSON.stringify(papers));
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

export function getSearchHistory(): SearchHistoryItem[] {
  const w = safeWindow();
  if (!w) {
    return [];
  }

  const raw = w.localStorage.getItem(HISTORY_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as SearchHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addSearchHistory(query: string): SearchHistoryItem[] {
  const cleaned = query.trim();
  if (!cleaned) {
    return getSearchHistory();
  }

  const history = getSearchHistory();
  const deduped = history.filter((item) => item.query.toLowerCase() !== cleaned.toLowerCase());

  const next: SearchHistoryItem = {
    id: crypto.randomUUID(),
    query: cleaned,
    searchedAt: new Date().toISOString(),
  };

  const updated = [next, ...deduped].slice(0, 30);

  const w = safeWindow();
  if (w) {
    w.localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  }

  return updated;
}

export function getTopicGapNotes(): TopicGapNote[] {
  const w = safeWindow();
  if (!w) {
    return [];
  }

  const notes: TopicGapNote[] = [];
  const prefix = "topic-gap-notes:";

  for (let index = 0; index < w.localStorage.length; index += 1) {
    const key = w.localStorage.key(index);
    if (!key || !key.startsWith(prefix)) {
      continue;
    }

    const query = key.slice(prefix.length).trim();
    const content = w.localStorage.getItem(key)?.trim() ?? "";
    if (!query || !content) {
      continue;
    }

    notes.push({
      id: key,
      query,
      content,
    });
  }

  return notes.sort((a, b) => a.query.localeCompare(b.query));
}
