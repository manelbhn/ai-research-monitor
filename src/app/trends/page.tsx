"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { getFollowedTopics, type FollowedTopic } from "@/lib/client-auth";
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
}

interface TrendingResponse {
  total: number;
  papers: TrendingPaper[];
  trends: Record<string, Record<string, number>>;
  topics: string[];
}

// ── Fetch ──────────────────────────────────────────────────────────────────────

async function fetchTrending(topic: string): Promise<TrendingResponse> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const url = topic
    ? `${base}/api/trending?topic=${encodeURIComponent(topic)}`
    : `${base}/api/trending`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load trending papers");
  return res.json();
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return "Unknown date";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

function extractTags(title: string): string[] {
  const stopWords = new Set(["a","an","the","of","in","for","and","on","with","to","is","are","via","using","based"]);
  return title
    .split(/\s+/)
    .filter((w) => w.length > 4 && !stopWords.has(w.toLowerCase()))
    .slice(0, 3)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""));
}

function formatAuthors(authors: string[]): string {
  if (!authors || authors.length === 0) return "Unknown authors";
  return authors.slice(0, 2).join(", ") + (authors.length > 2 ? " et al." : "");
}

// ── Trend chart ────────────────────────────────────────────────────────────────

function TrendChart({ trends }: { trends: Record<string, Record<string, number>> }) {
  const keywords = Object.keys(trends);
  if (keywords.length === 0) return null;

  const allMonths = [...new Set(
    keywords.flatMap((kw) => Object.keys(trends[kw]))
  )].sort();

  if (allMonths.length === 0) return null;

  const maxCount = Math.max(
    ...keywords.flatMap((kw) => Object.values(trends[kw]))
  );

  return (
    <div style={{ marginTop: "16px" }}>
      <h3 style={{ fontSize: "16px", color: "var(--hero-text-primary)", marginBottom: "12px" }}>
        Keyword Trends by Month
      </h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--hero-text-secondary)" }}>
                Keyword
              </th>
              {allMonths.map((m) => (
                <th key={m} style={{ padding: "4px 8px", color: "var(--hero-text-secondary)" }}>
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keywords.map((kw) => (
              <tr key={kw}>
                <td style={{ padding: "4px 8px", color: "var(--hero-text-primary)", fontWeight: 700 }}>
                  {kw}
                </td>
                {allMonths.map((m) => {
                  const count = trends[kw][m] ?? 0;
                  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <td key={m} style={{ padding: "4px 8px", textAlign: "center" }}>
                      <div style={{
                        height: "20px",
                        background: pct > 0 ? "linear-gradient(90deg, var(--primary), var(--secondary))" : "transparent",
                        width: `${Math.max(pct, count > 0 ? 20 : 0)}%`,
                        borderRadius: "4px",
                        margin: "0 auto",
                        minWidth: count > 0 ? "20px" : "0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: "10px",
                        fontWeight: 700,
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

// ── Followed Topics Section ────────────────────────────────────────────────────

function FollowedTopicsSection({ followedTopics }: { followedTopics: FollowedTopic[] }) {
  if (followedTopics.length === 0) return null;

  return (
    <div style={{
      borderRadius: "20px",
      border: "1px solid rgba(255,255,255,0.26)",
      background: "linear-gradient(160deg, rgba(255,255,255,0.14), rgba(255,255,255,0.05))",
      backdropFilter: "blur(8px)",
      padding: "18px",
      marginBottom: "16px",
    }}>
      <h2 style={{
        fontSize: "20px",
        color: "var(--hero-text-primary)",
        marginBottom: "14px",
        fontWeight: 800,
      }}>
        📌 Your Followed Topics
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {followedTopics.map((topic) => (
          <Link
            key={topic.id}
            href={`/results?q=${encodeURIComponent(topic.label)}`}
            style={{
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.3)",
              background: "rgba(255,255,255,0.12)",
              color: "var(--hero-text-primary)",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              transition: "background 0.2s ease",
            }}
          >
            {topic.label}
            <span style={{
              fontSize: "11px",
              opacity: 0.7,
              background: "rgba(255,255,255,0.15)",
              borderRadius: "999px",
              padding: "2px 7px",
            }}>
              {topic.preference}
            </span>
          </Link>
        ))}
      </div>
      <p style={{
        marginTop: "10px",
        fontSize: "12px",
        color: "var(--hero-text-secondary)",
      }}>
        Click any topic to search for the latest papers.
      </p>
    </div>
  );
}

// ── Page content ──────────────────────────────────────────────────────────────

function TrendsPageContent() {
  const { locale, t } = useAppPreferences();
  const searchParams = useSearchParams();
  const activeTopic = searchParams.get("topic")?.trim().toLowerCase() ?? "";

  const [data, setData] = useState<TrendingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followedTopics, setFollowedTopics] = useState<FollowedTopic[]>([]);

  // Load followed topics from localStorage
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFollowedTopics(getFollowedTopics());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Fetch trending papers from backend
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchTrending(activeTopic)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load.");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [activeTopic]);

  return (
    <main className={`${styles.page} ${locale === "ar" ? styles.rtl : ""}`}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <Link href="/" className={styles.backLink}>
              {t("trendsPageBackHome")}
            </Link>
            <span className={styles.status}>
              {loading ? "Loading…" : error ? "Error" : t("trendsPageUpdated")}
            </span>
          </div>

          <h1 className={styles.title}>{t("trendsPageTitle")}</h1>
          <p className={styles.subtitle}>{t("trendsPageSubtitle")}</p>

          <p className={styles.stats}>
            <strong>{loading ? "…" : data?.total ?? 0}</strong>
            <span>{t("trendsPageTotal")}</span>
          </p>

          {/* Cached topic filter pills */}
          {data && data.topics.length > 0 && (
            <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <Link
                href="/trends"
                className={styles.filterPill}
                style={{ textDecoration: "none", cursor: "pointer" }}
              >
                All
              </Link>
              {data.topics.map((topic) => (
                <Link
                  key={topic}
                  href={`/trends?topic=${encodeURIComponent(topic)}`}
                  className={styles.filterPill}
                  style={{
                    textDecoration: "none",
                    cursor: "pointer",
                    background: activeTopic === topic.toLowerCase()
                      ? "rgba(255,255,255,0.3)"
                      : undefined,
                  }}
                >
                  {topic}
                </Link>
              ))}
            </div>
          )}

          {activeTopic && (
            <div className={styles.filterRow}>
              <span className={styles.filterPill}>
                {t("trendsPageFilteredBy")}: {activeTopic}
              </span>
              <Link href="/trends" className={styles.clearFilterLink}>
                {t("trendsPageClearFilter")}
              </Link>
            </div>
          )}
        </header>

        {/* ── Followed Topics Section ── */}
        <FollowedTopicsSection followedTopics={followedTopics} />

        {/* Loading */}
        {loading && (
          <p className={styles.empty}>⏳ Loading trending papers…</p>
        )}

        {/* Error */}
        {!loading && error && (
          <p className={styles.empty}>⚠️ {error}</p>
        )}

        {/* Empty */}
        {!loading && !error && (!data || data.total === 0) && (
          <p className={styles.empty}>
            No papers found. Search for a topic first to populate trending papers.
          </p>
        )}

        {/* Trend chart */}
        {!loading && !error && data && Object.keys(data.trends).length > 0 && (
          <div className={styles.card} style={{ marginBottom: "16px", padding: "16px" }}>
            <TrendChart trends={data.trends} />
          </div>
        )}

        {/* Papers grid */}
        {!loading && !error && data && data.papers.length > 0 && (
          <>
            <h2 className={styles.sectionHeading}>{t("resultsTrendingTopics")}</h2>
            <section className={styles.grid}>
              {data.papers.map((paper, index) => (
                <article key={index} className={`${styles.card} ${styles.selected}`}>
                  <span className={styles.badge}>{t("resultsBadgeTrending")}</span>
                  <h2 className={styles.paperTitle}>{paper.title}</h2>
                  <p className={styles.meta}>
                    {formatAuthors(paper.authors)} — {formatDate(paper.date)}
                  </p>
                  <p className={styles.insight}>
                    {paper.summary && !paper.summary.toLowerCase().includes("unavailable")
                      ? paper.summary.slice(0, 200)
                      : paper.abstract.slice(0, 200)}
                    {((paper.summary || paper.abstract).length > 200) ? "..." : ""}
                  </p>
                  <div className={styles.tags}>
                    {extractTags(paper.title).map((tag) => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                  {paper.pdf ? (
                    <a
                      href={paper.pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.openBtn}
                    >
                      {t("trendsPageOpenPaper")}
                    </a>
                  ) : (
                    <button type="button" className={styles.openBtn} disabled>
                      {t("trendsPageOpenPaper")}
                    </button>
                  )}
                </article>
              ))}
            </section>
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