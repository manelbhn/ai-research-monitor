"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { getFollowedTopics, getAuthUser, type FollowedTopic } from "@/lib/client-auth";
import styles from "./trends.module.css";

// ── Types ──────────────────────────────────────────────────────────────────────

interface TrendingPaper {
  title: string;
  abstract: string;
  authors: string[];
  date: string;
  pdf: string;
  source: string;
  summary: string;
  relevance_score: number;
  citation_count: number;
  is_rising: boolean;
}

interface RisingKeyword {
  keyword: string;
  recent_count: number;
  older_count: number;
  growth: number;
}

interface TrendingResponse {
  total: number;
  papers: TrendingPaper[];
  most_cited: TrendingPaper[];
  trends: Record<string, Record<string, number>>;
  rising_keywords: RisingKeyword[];
  topics: string[];
}

// ── Fetch ──────────────────────────────────────────────────────────────────────

async function fetchTrending(
  topic: string,
  period: string,
  followedTopics: string[]
): Promise<TrendingResponse> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const params = new URLSearchParams();
  if (topic) params.set("topic", topic);
  if (period) params.set("period", period);
  // Send followed topics so backend filters to user's interests
  if (followedTopics.length > 0) params.set("followed", followedTopics.join(","));

  const res = await fetch(`${base}/api/trending?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load trending papers");
  return res.json();
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return "Unknown date";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short" });
  } catch { return dateStr; }
}

function extractTags(title: string): string[] {
  const stopWords = new Set(["a","an","the","of","in","for","and","on","with","to","is","are","via","using","based"]);
  return title.split(/\s+/)
    .filter((w) => w.length > 4 && !stopWords.has(w.toLowerCase()))
    .slice(0, 3)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""));
}

function formatAuthors(authors: string[]): string {
  if (!authors || authors.length === 0) return "Unknown authors";
  return authors.slice(0, 2).join(", ") + (authors.length > 2 ? " et al." : "");
}

function goodSummary(paper: TrendingPaper): string {
  if (paper.summary && !paper.summary.toLowerCase().includes("unavailable")) {
    return paper.summary.slice(0, 200);
  }
  return paper.abstract.slice(0, 200);
}

// ── Paper Card ─────────────────────────────────────────────────────────────────

function PaperCard({ paper, t, badge }: {
  paper: TrendingPaper;
  t: (key: string) => string;
  badge?: string;
}) {
  return (
    <article className={`${styles.card} ${styles.selected}`}>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        <span className={styles.badge}>{badge ?? t("resultsBadgeTrending")}</span>
        {paper.is_rising && (
          <span style={{
            borderRadius: "999px", padding: "4px 9px", fontSize: "11px",
            fontWeight: 800, background: "rgba(255,180,0,0.2)",
            color: "#ffb400", border: "1px solid rgba(255,180,0,0.4)",
          }}>
            🔥 Rising
          </span>
        )}
        {paper.citation_count > 0 && (
          <span style={{
            borderRadius: "999px", padding: "4px 9px", fontSize: "11px",
            fontWeight: 700, background: "rgba(255,255,255,0.1)",
            color: "var(--hero-text-secondary)",
          }}>
            📚 {paper.citation_count} citations
          </span>
        )}
      </div>
      <h2 className={styles.paperTitle}>{paper.title}</h2>
      <p className={styles.meta}>
        {formatAuthors(paper.authors)} — {formatDate(paper.date)}
      </p>
      <p className={styles.insight}>
        {goodSummary(paper)}
        {(paper.summary || paper.abstract).length > 200 ? "..." : ""}
      </p>
      <div className={styles.tags}>
        {extractTags(paper.title).map((tag) => (
          <span key={tag} className={styles.tag}>{tag}</span>
        ))}
      </div>
      {paper.pdf ? (
        <a href={paper.pdf} target="_blank" rel="noopener noreferrer" className={styles.openBtn}>
          {t("trendsPageOpenPaper")}
        </a>
      ) : (
        <button type="button" className={styles.openBtn} disabled>
          {t("trendsPageOpenPaper")}
        </button>
      )}
    </article>
  );
}

// ── Trend Chart ────────────────────────────────────────────────────────────────

function TrendChart({ trends }: { trends: Record<string, Record<string, number>> }) {
  const keywords = Object.keys(trends);
  if (keywords.length === 0) return null;

  const allMonths = [...new Set(keywords.flatMap((kw) => Object.keys(trends[kw])))].sort();
  if (allMonths.length === 0) return null;

  const maxCount = Math.max(...keywords.flatMap((kw) => Object.values(trends[kw])));

  return (
    <div style={{ marginTop: "16px" }}>
      <h3 style={{ fontSize: "16px", color: "var(--hero-text-primary)", marginBottom: "12px" }}>
        📈 Keyword Trends by Month
      </h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--hero-text-secondary)" }}>Keyword</th>
              {allMonths.map((m) => (
                <th key={m} style={{ padding: "4px 8px", color: "var(--hero-text-secondary)" }}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keywords.map((kw) => (
              <tr key={kw}>
                <td style={{ padding: "4px 8px", color: "var(--hero-text-primary)", fontWeight: 700 }}>{kw}</td>
                {allMonths.map((m) => {
                  const count = trends[kw][m] ?? 0;
                  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <td key={m} style={{ padding: "4px 8px", textAlign: "center" }}>
                      <div style={{
                        height: "20px",
                        background: pct > 0 ? "linear-gradient(90deg, var(--primary), var(--secondary))" : "transparent",
                        width: `${Math.max(pct, count > 0 ? 20 : 0)}%`,
                        borderRadius: "4px", margin: "0 auto",
                        minWidth: count > 0 ? "20px" : "0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: "10px", fontWeight: 700,
                      }}>
                        {count > 0 ? count : ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Rising Keywords ────────────────────────────────────────────────────────────

function RisingKeywordsSection({ keywords }: { keywords: RisingKeyword[] }) {
  if (keywords.length === 0) return null;
  return (
    <div style={{
      borderRadius: "20px", border: "1px solid rgba(255,180,0,0.3)",
      background: "linear-gradient(160deg, rgba(255,180,0,0.08), rgba(255,255,255,0.04))",
      backdropFilter: "blur(8px)", padding: "18px", marginBottom: "16px",
    }}>
      <h2 style={{ fontSize: "20px", color: "var(--hero-text-primary)", marginBottom: "14px", fontWeight: 800 }}>
        🔥 Rising Keywords
      </h2>
      <p style={{ fontSize: "13px", color: "var(--hero-text-secondary)", marginBottom: "12px" }}>
        Keywords appearing more frequently in recent papers vs older ones.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {keywords.map((kw) => (
          <Link
            key={kw.keyword}
            href={`/results?q=${encodeURIComponent(kw.keyword)}`}
            style={{
              borderRadius: "999px", border: "1px solid rgba(255,180,0,0.4)",
              background: "rgba(255,180,0,0.15)", color: "var(--hero-text-primary)",
              padding: "8px 14px", fontSize: "13px", fontWeight: 700,
              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px",
            }}
          >
            {kw.keyword}
            <span style={{
              fontSize: "11px", background: "rgba(255,180,0,0.25)",
              borderRadius: "999px", padding: "2px 7px", color: "#ffb400",
            }}>
              +{kw.growth > 999 ? "new" : `${Math.round(kw.growth)}%`}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Followed Topics Section ────────────────────────────────────────────────────

function FollowedTopicsSection({ followedTopics, isLoggedIn }: {
  followedTopics: FollowedTopic[];
  isLoggedIn: boolean;
}) {
  if (!isLoggedIn) return (
    <div style={{
      borderRadius: "20px", border: "1px solid rgba(255,255,255,0.2)",
      background: "rgba(255,255,255,0.06)", padding: "18px", marginBottom: "16px",
      textAlign: "center",
    }}>
      <p style={{ color: "var(--hero-text-secondary)", fontSize: "14px" }}>
        <Link href="/login" style={{ color: "var(--hero-text-primary)", fontWeight: 700 }}>Log in</Link>
        {" "}to see your personalized trending feed based on your followed topics.
      </p>
    </div>
  );

  if (followedTopics.length === 0) return (
    <div style={{
      borderRadius: "20px", border: "1px solid rgba(255,255,255,0.2)",
      background: "rgba(255,255,255,0.06)", padding: "18px", marginBottom: "16px",
    }}>
      <p style={{ color: "var(--hero-text-secondary)", fontSize: "14px" }}>
        You haven&apos;t followed any topics yet. Search for papers and click{" "}
        <strong>Follow Topic</strong> to personalize your trending feed.
      </p>
    </div>
  );

  return (
    <div style={{
      borderRadius: "20px", border: "1px solid rgba(255,255,255,0.26)",
      background: "linear-gradient(160deg, rgba(255,255,255,0.14), rgba(255,255,255,0.05))",
      backdropFilter: "blur(8px)", padding: "18px", marginBottom: "16px",
    }}>
      <h2 style={{ fontSize: "20px", color: "var(--hero-text-primary)", marginBottom: "14px", fontWeight: 800 }}>
        📌 Your Followed Topics
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {followedTopics.map((topic) => (
          <Link
            key={topic.id}
            href={`/trends?topic=${encodeURIComponent(topic.label)}`}
            style={{
              borderRadius: "999px", border: "1px solid rgba(255,255,255,0.3)",
              background: "rgba(255,255,255,0.12)", color: "var(--hero-text-primary)",
              padding: "8px 16px", fontSize: "13px", fontWeight: 700,
              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px",
            }}
          >
            {topic.label}
            <span style={{
              fontSize: "11px", opacity: 0.7,
              background: "rgba(255,255,255,0.15)", borderRadius: "999px", padding: "2px 7px",
            }}>
              {topic.preference}
            </span>
          </Link>
        ))}
      </div>
      <p style={{ marginTop: "10px", fontSize: "12px", color: "var(--hero-text-secondary)" }}>
        Click a topic to filter trending papers for that topic.
      </p>
    </div>
  );
}

// ── Page content ──────────────────────────────────────────────────────────────

function TrendsPageContent() {
  const { locale, t } = useAppPreferences();
  const searchParams = useSearchParams();
  const activeTopic = searchParams.get("topic")?.trim().toLowerCase() ?? "";

  // ── Period filter state ──────────────────────────────────────────────────
  const [period, setPeriod] = useState("all");

  const [data, setData] = useState<TrendingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followedTopics, setFollowedTopics] = useState<FollowedTopic[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Load user data from localStorage
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const user = getAuthUser();
      setIsLoggedIn(Boolean(user));
      setFollowedTopics(getFollowedTopics());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Fetch trending — pass followed topics for personalization
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // If user has followed topics and no active topic filter,
    // show trending for their followed topics
    const topicToFetch = activeTopic;
    const followedLabels = followedTopics.map((t) => t.label);

    fetchTrending(topicToFetch, period, followedLabels)
      .then((res) => {
        if (!cancelled) { setData(res); setLoading(false); }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load.");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [activeTopic, period, followedTopics]);

  return (
    <main className={`${styles.page} ${locale === "ar" ? styles.rtl : ""}`}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <Link href="/" className={styles.backLink}>{t("trendsPageBackHome")}</Link>
            <span className={styles.status}>
              {loading ? "Loading…" : error ? "Error" : t("trendsPageUpdated")}
            </span>
          </div>

          <h1 className={styles.title}>{t("trendsPageTitle")}</h1>
          <p className={styles.subtitle}>{t("trendsPageSubtitle")}</p>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginTop: "12px" }}>
            <p className={styles.stats}>
              <strong>{loading ? "…" : data?.total ?? 0}</strong>
              <span>{t("trendsPageTotal")}</span>
            </p>

            {/* ── Time period filter ── */}
            <div style={{ display: "flex", gap: "6px" }}>
              {[
                { value: "3months", label: "3 Months" },
                { value: "6months", label: "6 Months" },
                { value: "1year", label: "1 Year" },
                { value: "all", label: "All Time" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPeriod(opt.value)}
                  style={{
                    borderRadius: "999px", padding: "6px 12px", fontSize: "12px",
                    fontWeight: 700, cursor: "pointer",
                    border: period === opt.value
                      ? "1px solid rgba(255,255,255,0.6)"
                      : "1px solid rgba(255,255,255,0.2)",
                    background: period === opt.value
                      ? "rgba(255,255,255,0.25)"
                      : "rgba(255,255,255,0.08)",
                    color: "var(--hero-text-primary)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic filter pills */}
          {data && data.topics.length > 0 && (
            <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <Link href="/trends" className={styles.filterPill} style={{ textDecoration: "none" }}>
                All
              </Link>
              {data.topics.map((topic) => (
                <Link
                  key={topic}
                  href={`/trends?topic=${encodeURIComponent(topic)}`}
                  className={styles.filterPill}
                  style={{
                    textDecoration: "none",
                    background: activeTopic === topic.toLowerCase()
                      ? "rgba(255,255,255,0.3)" : undefined,
                  }}
                >
                  {topic}
                </Link>
              ))}
            </div>
          )}

          {activeTopic && (
            <div className={styles.filterRow}>
              <span className={styles.filterPill}>{t("trendsPageFilteredBy")}: {activeTopic}</span>
              <Link href="/trends" className={styles.clearFilterLink}>{t("trendsPageClearFilter")}</Link>
            </div>
          )}
        </header>

        {/* ── Followed Topics (per user) ── */}
        <FollowedTopicsSection followedTopics={followedTopics} isLoggedIn={isLoggedIn} />

        {/* Loading / Error / Empty */}
        {loading && <p className={styles.empty}>⏳ Loading trending papers…</p>}
        {!loading && error && <p className={styles.empty}>⚠️ {error}</p>}
        {!loading && !error && (!data || data.total === 0) && (
          <p className={styles.empty}>
            No papers found. Search for a topic first to populate trending papers.
          </p>
        )}

        {!loading && !error && data && (
          <>
            {/* ── Rising Keywords ── */}
            {data.rising_keywords && data.rising_keywords.length > 0 && (
              <RisingKeywordsSection keywords={data.rising_keywords} />
            )}

            {/* ── Trend Chart ── */}
            {Object.keys(data.trends).length > 0 && (
              <div className={styles.card} style={{ marginBottom: "16px", padding: "16px" }}>
                <TrendChart trends={data.trends} />
              </div>
            )}

            {/* ── Most Cited Papers ── */}
            {data.most_cited && data.most_cited.length > 0 && (
              <>
                <h2 className={styles.sectionHeading}>📚 Most Cited Papers</h2>
                <section className={styles.grid} style={{ marginBottom: "24px" }}>
                  {data.most_cited.map((paper, index) => (
                    <PaperCard key={`cited-${index}`} paper={paper} t={t} badge="Most Cited" />
                  ))}
                </section>
              </>
            )}

            {/* ── All Trending Papers ── */}
            {data.papers.length > 0 && (
              <>
                <h2 className={styles.sectionHeading}>{t("resultsTrendingTopics")}</h2>
                <section className={styles.grid}>
                  {data.papers.map((paper, index) => (
                    <PaperCard key={`paper-${index}`} paper={paper} t={t} />
                  ))}
                </section>
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default function TrendsPage() {
  return (
    <Suspense fallback={<main className={styles.page} />}>
      <TrendsPageContent />
    </Suspense>
  );
}