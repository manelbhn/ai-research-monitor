"use client";

import AuthButtons from "@/components/auth/AuthButtons";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import FavoritePaperButton from "@/components/auth/FavoritePaperButton";
import FollowTopicButton from "@/components/auth/FollowTopicButton";
import SearchHistoryTracker from "@/components/auth/SearchHistoryTracker";
import {
  BackIcon,
  CalendarIcon,
  FilterIcon,
  GapIcon,
  SearchIcon,
  ToggleFilterIcon,
  TrendIcon,
} from "@/components/second-page/results/icons";
import PaperSummaryActions from "@/components/second-page/results/PaperSummaryActions";
import SearchCompleteToast from "@/components/second-page/results/SearchCompleteToast";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useMemo } from "react";
import styles from "./results.module.css";
import { searchPapers, type ApiPaper } from "@/lib/api";

// ── Adapt ApiPaper → display shape ────────────────────────────────────────────

interface DisplayPaper {
  id: string;
  title: string;
  authors: string;
  date: string;
  year: string;
  metrics: string;
  insight: string;
  badges: string[];
  tags: string[];
  pdf: string;
  abstract: string;
}

function adaptPaper(paper: ApiPaper, index: number): DisplayPaper {
  const displayDate = paper.date
    ? new Date(paper.date).toLocaleDateString("en-US", { year: "numeric", month: "short" })
    : "Unknown date";

  const year = paper.date ? paper.date.slice(0, 4) : "";
  const score = Math.round(paper.relevance_score);
  const metrics = `Score: ${score}`;

  const authorStr =
    paper.authors.length > 0
      ? paper.authors.slice(0, 3).join(", ") + (paper.authors.length > 3 ? " et al." : "")
      : "Unknown authors";

  const stopWords = new Set(["a", "an", "the", "of", "in", "for", "and", "on", "with", "to", "is"]);
  const tags = paper.title
    .split(/\s+/)
    .filter((w) => w.length > 4 && !stopWords.has(w.toLowerCase()))
    .slice(0, 4)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""));

  const badges: string[] = score >= 30 ? ["Trending"] : [];

  return {
    id: `paper-${index}`,
    title: paper.title,
    authors: authorStr,
    date: displayDate,
    year,
    metrics,
    insight: paper.summary || paper.abstract.slice(0, 300),
    badges,
    tags: tags.length > 0 ? tags : ["Research"],
    pdf: paper.pdf,
    abstract: paper.abstract,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const { t, format, locale, voicePreference } = useAppPreferences();
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const shownQuery = query && query.trim().length > 0 ? query : "machine learning";

  // ── State ──────────────────────────────────────────────────────────────────
  const [showFilters, setShowFilters] = useState(true);
  const [speakingPaperId, setSpeakingPaperId] = useState<string | null>(null);
  const [paperSummaries, setPaperSummaries] = useState<Record<string, string>>({});
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const fallbackAudioRef = useRef<HTMLAudioElement | null>(null);

  // ── Filter state ───────────────────────────────────────────────────────────
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [maxPapers, setMaxPapers] = useState<number>(20);

  // ── Real API data ──────────────────────────────────────────────────────────
  const [allPapers, setAllPapers] = useState<DisplayPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    searchPapers(shownQuery)
      .then((res) => {
        if (!cancelled) {
          setAllPapers(res.papers.map(adaptPaper));
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Search failed.");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [shownQuery]);

  // ── Available years from real papers ──────────────────────────────────────
  const availableYears = useMemo(() => {
    const years = [...new Set(allPapers.map((p) => p.year).filter(Boolean))].sort((a, b) => b.localeCompare(a));
    return years;
  }, [allPapers]);

  // ── Filtered papers ────────────────────────────────────────────────────────
  const papers = useMemo(() => {
    let filtered = allPapers;

    // Filter by selected years
    if (selectedYears.length > 0) {
      filtered = filtered.filter((p) => selectedYears.includes(p.year));
    }

    // Limit by max papers
    return filtered.slice(0, maxPapers);
  }, [allPapers, selectedYears, maxPapers]);

  const toggleYear = (year: string) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  // ── Speech synthesis ───────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const syncVoices = () => setAvailableVoices(window.speechSynthesis.getVoices());
    syncVoices();
    window.speechSynthesis.addEventListener("voiceschanged", syncVoices);

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.removeEventListener("voiceschanged", syncVoices);
        window.speechSynthesis.cancel();
      }
      fallbackAudioRef.current?.pause();
      fallbackAudioRef.current = null;
    };
  }, []);

  const getSpeechLanguage = (text: string) => {
    if (/[\u0600-\u06FF]/.test(text)) return "ar";
    if (locale === "fr") return "fr-FR";
    if (locale === "ar") return "ar-SA";
    return "en-US";
  };

  const pickVoiceByPreference = (voices: SpeechSynthesisVoice[], lang: string) => {
    const normalizedLang = lang.toLowerCase();
    const primaryLanguage = normalizedLang.split("-")[0];
    const femaleHints = ["female","woman","girl","zira","samantha","victoria","hazel","jenny","aria","ava","emma","olivia","amelie","marie","laila","hanan","mouna"];
    const maleHints = ["male","man","boy","david","daniel","george","thomas","alex","james","oliver","hassan","karim","nizar"];
    const sameLanguage = voices.filter((v) => v.lang.toLowerCase().startsWith(primaryLanguage));

    if (primaryLanguage === "ar" && sameLanguage.length > 0) {
      if (voicePreference === "female") {
        const f = sameLanguage.find((v) => femaleHints.some((h) => `${v.name} ${v.voiceURI}`.toLowerCase().includes(h)));
        if (f) return f;
      }
      if (voicePreference === "male") {
        const m = sameLanguage.find((v) => maleHints.some((h) => `${v.name} ${v.voiceURI}`.toLowerCase().includes(h)));
        if (m) return m;
      }
      return sameLanguage[0];
    }
    if (voicePreference === "female") {
      const f = sameLanguage.find((v) => femaleHints.some((h) => `${v.name} ${v.voiceURI}`.toLowerCase().includes(h)));
      if (f) return f;
    }
    if (voicePreference === "male") {
      const m = sameLanguage.find((v) => maleHints.some((h) => `${v.name} ${v.voiceURI}`.toLowerCase().includes(h)));
      if (m) return m;
    }
    return sameLanguage[0] ?? voices[0] ?? null;
  };

  const speakPaper = (paperId: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    fallbackAudioRef.current?.pause();
    fallbackAudioRef.current = null;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(trimmed);
    const speechLanguage = getSpeechLanguage(trimmed);
    utterance.lang = speechLanguage;
    const voicesPool = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    const hasArabicVoice = voicesPool.some((v) => v.lang.toLowerCase().startsWith("ar"));

    if (speechLanguage.startsWith("ar") && !hasArabicVoice) {
      const shortText = trimmed.length > 220 ? `${trimmed.slice(0, 220)}...` : trimmed;
      const audio = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ar&q=${encodeURIComponent(shortText)}`);
      audio.onended = () => setSpeakingPaperId((c) => (c === paperId ? null : c));
      audio.onerror = () => setSpeakingPaperId((c) => (c === paperId ? null : c));
      fallbackAudioRef.current = audio;
      setSpeakingPaperId(paperId);
      void audio.play().catch(() => setSpeakingPaperId((c) => (c === paperId ? null : c)));
      return;
    }

    const preferredVoice = pickVoiceByPreference(voicesPool, speechLanguage);
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 0.95;
    utterance.pitch = 1.08;
    utterance.onend = () => setSpeakingPaperId((c) => (c === paperId ? null : c));
    utterance.onerror = () => setSpeakingPaperId((c) => (c === paperId ? null : c));
    setSpeakingPaperId(paperId);
    window.speechSynthesis.speak(utterance);
  };

  const togglePaperSpeech = (paperId: string, paperText: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingPaperId === paperId) {
      window.speechSynthesis.cancel();
      fallbackAudioRef.current?.pause();
      fallbackAudioRef.current = null;
      setSpeakingPaperId(null);
      return;
    }
    speakPaper(paperId, paperText);
  };

  const handleSummaryChange = (paperId: string, summary: string) => {
    setPaperSummaries((current) => {
      if ((current[paperId] ?? "") === summary) return current;
      return { ...current, [paperId]: summary };
    });
  };

  const buildPaperSpeechText = (paperTitle: string, paperInsight: string) => {
    if (locale !== "ar") return `${paperTitle}. ${paperInsight}`;
    const normalizedInsight = paperInsight.trim();
    const firstSentence = normalizedInsight.split(". ")[0] ?? normalizedInsight;
    return format(t("summaryQuickTemplate"), { title: paperTitle, firstSentence });
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const trendingShare = papers.length > 0
    ? Math.round((papers.filter((p) => p.badges.includes("Trending")).length / papers.length) * 100)
    : 0;

  const topTags = [...new Set(papers.flatMap((p) => p.tags))].slice(0, 6);
  const commonInsightThemes = topTags.slice(0, 4);

  const recentShare = papers.length > 0
    ? Math.round((papers.filter((p) => /2026|2025|2024/.test(p.date)).length / papers.length) * 100)
    : 0;

  const avgScore = papers.length > 0
    ? Math.round(papers.reduce((sum, p) => sum + Number(p.metrics.replace("Score: ", "")), 0) / papers.length)
    : 0;

  const queryLower = shownQuery.toLowerCase();
  const dynamicLens =
    queryLower.includes("health") || queryLower.includes("medical") ? t("resultsLensClinical")
    : queryLower.includes("vision") ? t("resultsLensVision")
    : queryLower.includes("ethic") || queryLower.includes("policy") ? t("resultsLensEthics")
    : t("resultsLensDefault");

  const trendSignal = trendingShare >= 50 ? t("resultsTrendStrong") : t("resultsTrendSteady");
  const contentWrapClass = `${styles.contentWrap} ${showFilters ? "" : styles.contentWrapOne}`;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className={styles.page}>
      <SearchHistoryTracker query={shownQuery} />
      <header className={styles.topbar}>
        <div className={styles.topLeft}>
          <Link href="/" className={styles.backLink} aria-label={t("resultsBackHomeAria")}>
            <BackIcon className={styles.topIcon} />
            <span>{t("resultsBackHomeAria")}</span>
          </Link>
          <div>
            <p className={styles.queryLine}>
              <SearchIcon className={styles.queryIcon} />
              {shownQuery}
            </p>
            <p className={styles.countLine}>
              {loading ? "Searching…" : error ? "Error" : `${papers.length} ${t("resultsFoundSuffix")}`}
            </p>
          </div>
        </div>
        <div className={styles.topActions}>
          <Link href="/#trends-section" className={styles.sortButton}>
            <TrendIcon className={styles.topButtonIcon} />
            {t("resultsMostRelevant")}
          </Link>
          <AuthButtons compact className={styles.topAuthButtons} />
          <div className={styles.panelToggleGroup}>
            <button
              type="button"
              className={`${styles.panelToggleButton} ${showFilters ? styles.panelToggleButtonActive : ""}`}
              onClick={() => setShowFilters((v) => !v)}
              aria-pressed={showFilters}
              aria-label={showFilters ? t("resultsHideFiltersAria") : t("resultsShowFiltersAria")}
            >
              <ToggleFilterIcon className={styles.toggleIcon} />
            </button>
          </div>
        </div>
      </header>

      <section className={contentWrapClass}>
        {showFilters && (
          <aside className={styles.leftPanel}>
            <h2>
              <FilterIcon className={styles.sectionIcon} />
              {t("resultsFilters")}
            </h2>

            {/* ── Publication Year filter ── */}
            <div className={styles.filterGroup}>
              <h3>
                <CalendarIcon className={styles.groupIcon} /> {t("resultsPublicationYear")}
              </h3>
              {loading ? (
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Loading years…</p>
              ) : availableYears.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No years available</p>
              ) : (
                <ul className={styles.checkboxList}>
                  {availableYears.map((year) => (
                    <li key={year}>
                      <input
                        id={`y${year}`}
                        type="checkbox"
                        checked={selectedYears.includes(year)}
                        onChange={() => toggleYear(year)}
                      />
                      <label htmlFor={`y${year}`}>
                        {year}
                        <span style={{
                          marginLeft: "6px",
                          fontSize: "11px",
                          color: "var(--text-muted)",
                        }}>
                          ({allPapers.filter((p) => p.year === year).length})
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              {selectedYears.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedYears([])}
                  style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0",
                    textDecoration: "underline",
                  }}
                >
                  Clear year filter
                </button>
              )}
            </div>

            {/* ── Number of papers filter ── */}
            <div className={styles.filterGroup}>
              <h3>Number of Papers</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "10px" }}>
                Showing <strong>{Math.min(maxPapers, papers.length)}</strong> of <strong>{allPapers.length}</strong> papers
              </p>
              <input
                type="range"
                min={1}
                max={allPapers.length || 20}
                value={maxPapers}
                onChange={(e) => setMaxPapers(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--primary)" }}
              />
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "4px",
              }}>
                <span>1</span>
                <span>{allPapers.length || 20}</span>
              </div>
            </div>
          </aside>
        )}

        <section className={styles.centerPanel}>
          {/* ── Topic summary card ── */}
          <article className={styles.topicSummaryCard}>
            <div className={styles.topicSummaryHeader}>
              <p className={styles.topicSummaryEyebrow}>{t("resultsSummaryEyebrow")}</p>
              <Link
                href={`/topic-gap?q=${encodeURIComponent(shownQuery)}`}
                className={styles.detectGapButton}
              >
                <GapIcon className={styles.detectGapIcon} />
                {t("resultsDetectGap")}
              </Link>
            </div>
            <h2>{shownQuery}: {t("resultsSummaryHeadingSuffix")}</h2>
            <p className={styles.topicSummaryLead}>
              {format(t("resultsSummaryLeadTemplate"), {
                trendSignal,
                trendingShare,
                avgMetric: avgScore,
                recentShare,
              })}
            </p>
            <p className={styles.topicSummaryDetail}>
              {format(t("resultsSummaryDetailTemplate"), {
                themes: commonInsightThemes.join(", "),
                query: shownQuery,
                dynamicLens,
              })}
            </p>
            <div className={styles.topicSummaryTags}>
              {topTags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
          </article>

          {/* ── Loading state ── */}
          {loading && (
            <article className={styles.paperCard} style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
                ⏳ Fetching and summarizing papers for <strong>{shownQuery}</strong>…
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "8px" }}>
                This takes 10–30 seconds while the AI summarizes each paper.
              </p>
            </article>
          )}

          {/* ── Error state ── */}
          {!loading && error && (
            <article className={styles.paperCard} style={{ padding: "32px" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
                ⚠️ Could not load papers: {error}
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "8px" }}>
                Make sure the backend is running at <code>http://localhost:8000</code> and your GROQ_API_KEY is set in <code>backend/.env</code>.
              </p>
            </article>
          )}

          {/* ── Empty state ── */}
          {!loading && !error && papers.length === 0 && (
            <article className={styles.paperCard} style={{ padding: "32px" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
                {selectedYears.length > 0
                  ? `No papers found for years: ${selectedYears.join(", ")}. Try clearing the year filter.`
                  : `No papers found for "${shownQuery}". Try a different topic.`}
              </p>
            </article>
          )}

          {/* ── Real paper cards ── */}
          {papers.map((paper) => (
            <article key={paper.id} className={styles.paperCard}>
              <div className={styles.cardTopRow}>
                <div className={styles.badgeRow}>
                  {paper.badges.map((badge) => (
                    <span key={badge} className={styles.miniBadge}>
                      {badge === "Trending" && <TrendIcon className={styles.badgeIcon} />}
                      {badge === "Trending" ? t("resultsBadgeTrending") : badge}
                    </span>
                  ))}
                </div>
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    aria-label={speakingPaperId === paper.id ? t("resultsStopSpeech") : t("resultsSpeakPaper")}
                    title={speakingPaperId === paper.id ? t("resultsStopSpeech") : t("resultsSpeakPaper")}
                    className={`${styles.iconButton} ${styles.soundToggleButton} ${speakingPaperId === paper.id ? styles.soundOn : styles.soundOff}`}
                    onClick={() =>
                      togglePaperSpeech(
                        paper.id,
                        paperSummaries[paper.id]?.trim()
                          ? paperSummaries[paper.id]
                          : buildPaperSpeechText(paper.title, paper.insight),
                      )
                    }
                  >
                    {speakingPaperId === paper.id ? (
                      <svg viewBox="0 0 24 24" className={styles.soundIcon} aria-hidden="true">
                        <path d="M4 10H8L13 6V18L8 14H4Z" />
                        <path d="M16 9C17.3 10.3 17.3 13.7 16 15" />
                        <path d="M18.5 7.5C20.8 10.1 20.8 13.9 18.5 16.5" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className={styles.soundIcon} aria-hidden="true">
                        <path d="M4 10H8L13 6V18L8 14H4Z" />
                        <path d="M16 9L20 15" />
                        <path d="M20 9L16 15" />
                      </svg>
                    )}
                  </button>
                  <FavoritePaperButton paperId={paper.id} paperTitle={paper.title} />
                </div>
              </div>

              <h3>{paper.title}</h3>
              <p className={styles.metaLine}>
                {paper.authors} • {paper.metrics} • {paper.date}
              </p>

              <div className={styles.insightBox}>
                <p className={styles.insightTitle}>{t("resultsAiInsights")}</p>
                <p>{paper.insight}</p>
              </div>

              <div className={styles.tagRow}>
                {paper.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>

              <PaperSummaryActions
                paperId={paper.id}
                paperTitle={paper.title}
                paperInsight={paper.insight}
                onSummaryChange={handleSummaryChange}
              />

              {paper.pdf ? (
                <a
                  href={paper.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.paperButton}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                >
                  {t("resultsViewPaper")}
                </a>
              ) : (
                <button type="button" className={styles.paperButton} disabled>
                  {t("resultsViewPaper")}
                </button>
              )}

              <FollowTopicButton topic={paper.tags[0] ?? paper.title} />
            </article>
          ))}
        </section>
      </section>

      <SearchCompleteToast query={shownQuery} />
    </main>
  );
}