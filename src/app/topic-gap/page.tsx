"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { searchPapers, detectGaps, type GapCard } from "@/lib/api";
import styles from "./topic-gap.module.css";

function getPriorityClass(opportunity: number, s: Record<string, string>) {
  if (opportunity >= 70) return s.priorityCritical;
  if (opportunity >= 45) return s.priorityModerate;
  return s.priorityStable;
}

function getPriorityLabel(opportunity: number) {
  if (opportunity >= 70) return "High priority";
  if (opportunity >= 45) return "Medium priority";
  return "Good coverage";
}

function TopicGapPageContent() {
  const { t } = useAppPreferences();
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim();
  const shownQuery = query && query.length > 0 ? query : "machine learning";
  const normalizedQuery = shownQuery.toLowerCase();

  // ── State ──────────────────────────────────────────────────────────────────
  const [gaps, setGaps] = useState<GapCard[]>([]);
  const [topTags, setTopTags] = useState<{ tag: string; count: number }[]>([]);
  const [paperCount, setPaperCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Fetching papers…");
  const [error, setError] = useState<string | null>(null);

  // ── Notes ──────────────────────────────────────────────────────────────────
  const storageKey = `topic-gap-notes:${normalizedQuery}`;
  const [notes, setNotes] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(storageKey) ?? "";
  });
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // ── Fetch papers then detect gaps ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // Step 1 — fetch real papers with short summaries
        setStatus("Fetching papers from arXiv…");
        const res = await searchPapers(shownQuery, { detail_level: "short" });

        if (cancelled) return;

        setPaperCount(res.papers.length);

        if (res.papers.length === 0) {
          setError("No papers found for this topic.");
          setLoading(false);
          return;
        }

        // Step 2 — extract top tags from real paper titles
        const stopWords = new Set([
          "a","an","the","of","in","for","and","on","with","to","is","are",
          "via","using","based","from","this","that","we","our","its","into",
        ]);
        const wordCounts: Record<string, number> = {};
        res.papers.forEach((p) => {
          p.title.split(/\s+/).forEach((w) => {
            const clean = w.replace(/[^a-zA-Z]/g, "").toLowerCase();
            if (clean.length > 3 && !stopWords.has(clean)) {
              wordCounts[clean] = (wordCounts[clean] ?? 0) + 1;
            }
          });
        });
        const tags = Object.entries(wordCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([tag, count]) => ({ tag, count }));

        if (!cancelled) setTopTags(tags);

        // Step 3 — send summaries to AI for real gap detection
        setStatus("Analyzing gaps with AI…");
        const summaries = res.papers
          .map((p) => p.summary || p.abstract)
          .filter(Boolean);

        const gapRes = await detectGaps(shownQuery, summaries);

        if (!cancelled) {
          setGaps(gapRes.gaps);
          setLoading(false);
        }

      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
          setLoading(false);
        }
      }
    }

    run();
    return () => { cancelled = true; };
  }, [shownQuery]);

  const handleSave = () => {
    window.localStorage.setItem(storageKey, notes);
    setSavedAt(new Date().toLocaleTimeString());
  };

  const handleClear = () => {
    setNotes("");
    window.localStorage.removeItem(storageKey);
    setSavedAt(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className={styles.page}>
      <section className={styles.shell}>

        <header className={styles.header}>
          <div className={styles.headerTop}>
            <Link
              href={`/results?q=${encodeURIComponent(shownQuery)}`}
              className={styles.backLink}
            >
              Back to results
            </Link>
            <span className={styles.status}>
              {loading ? status : error ? "Error" : "AI gap scan complete"}
            </span>
          </div>

          <p className={styles.eyebrow}>Topic Gap Detector</p>
          <h1 className={styles.title}>
            {shownQuery}: uncover the missing opportunities
          </h1>
          <p className={styles.subtitle}>
            The AI reads real arXiv papers on your topic and identifies what
            research areas are missing, underexplored, or not addressed.
          </p>

          <div className={styles.statsRow}>
            <div className={styles.statPill}>
              <strong>{loading ? "…" : paperCount}</strong>
              <span>{t("resultsFoundSuffix")}</span>
            </div>
            <div className={styles.statPill}>
              <strong>{loading ? "…" : `${gaps[0]?.opportunity ?? 0}%`}</strong>
              <span>highest opportunity score</span>
            </div>
          </div>
        </header>

        {/* Loading */}
        {loading && (
          <section className={styles.panel} style={{ textAlign: "center", padding: "48px 32px" }}>
            <p style={{ fontSize: "16px", color: "var(--text-secondary)" }}>
              ⏳ {status}
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>
              Step 1: fetch real papers → Step 2: AI reads summaries → Step 3: identify gaps
            </p>
          </section>
        )}

        {/* Error */}
        {!loading && error && (
          <section className={styles.panel} style={{ padding: "32px" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
              ⚠️ {error}
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "8px" }}>
              Make sure the backend is running at <code>http://localhost:8000</code>.
            </p>
          </section>
        )}

        {/* Main content */}
        {!loading && !error && (
          <section className={styles.grid}>

            {/* Left — AI gap cards */}
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>
                AI-detected research gaps
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px", marginBottom: "12px" }}>
                Based on {paperCount} real arXiv papers about "{shownQuery}"
              </p>
              <div className={styles.gapList}>
                {gaps.map((gap) => (
                  <article key={gap.gap} className={styles.gapCard}>
                    <div className={styles.gapHeader}>
                      <p className={styles.gapName}>{gap.gap}</p>
                      <span className={`${styles.priorityPill} ${getPriorityClass(gap.opportunity, styles)}`}>
                        {getPriorityLabel(gap.opportunity)}
                      </span>
                    </div>

                    {/* Reason from AI */}
                    <p className={styles.gapMeta}>
                      <strong>Why it&apos;s missing: </strong>
                      {gap.reason}
                    </p>

                    <p className={styles.gapMeta} style={{ marginTop: "6px" }}>
                      Opportunity score:{" "}
                      <strong className={styles.opportunityValue}>
                        {gap.opportunity}%
                      </strong>
                    </p>

                    <div className={styles.gapBarTrack} aria-hidden="true">
                      <span
                        className={styles.gapBarFill}
                        style={{ width: `${gap.opportunity}%` }}
                      />
                    </div>

                    <p className={styles.gapAction}>{gap.action}</p>
                  </article>
                ))}
              </div>
            </section>

            {/* Right — tags + notes */}
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Top repeated themes</h2>
              <div className={styles.tagWrap}>
                {topTags.length > 0 ? (
                  topTags.map((entry) => (
                    <span key={entry.tag} className={styles.tag}>
                      {entry.tag} ({entry.count})
                    </span>
                  ))
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                    No themes detected.
                  </p>
                )}
              </div>

              <h3 className={styles.notesHeading}>Research notes</h3>
              <p className={styles.notesHint}>
                Write hypotheses, candidate datasets, baselines, and validation
                criteria for your next paper.
              </p>

              <textarea
                className={styles.notesArea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Example: Address the gaps above by designing experiments that target underexplored areas."
              />

              <div className={styles.noteActions}>
                <button type="button" className={styles.saveButton} onClick={handleSave}>
                  Save notes
                </button>
                <button type="button" className={styles.clearButton} onClick={handleClear}>
                  Clear
                </button>
                {savedAt && (
                  <span className={styles.savedText}>Saved at {savedAt}</span>
                )}
              </div>
            </section>

          </section>
        )}
      </section>
    </main>
  );
}

export default function TopicGapPage() {
  return (
    <Suspense fallback={<main className={styles.page} />}>
      <TopicGapPageContent />
    </Suspense>
  );
}
