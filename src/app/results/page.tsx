"use client";

import AuthButtons from "@/components/auth/AuthButtons";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import FavoritePaperButton from "@/components/auth/FavoritePaperButton";
import FollowTopicButton from "@/components/auth/FollowTopicButton";
import SearchHistoryTracker from "@/components/auth/SearchHistoryTracker";
import {
  categories,
  publicationYears,
  researchGaps,
  trendingTopics,
} from "@/components/second-page/results/data";
import {
  BackIcon,
  CalendarIcon,
  FilterIcon,
  GapIcon,
  SearchIcon,
  ToggleFilterIcon,
  TopicIcon,
  TrendIcon,
} from "@/components/second-page/results/icons";
import PaperSummaryActions from "@/components/second-page/results/PaperSummaryActions";
import SearchCompleteToast from "@/components/second-page/results/SearchCompleteToast";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import styles from "./results.module.css";
import { searchPapers, type ApiPaper } from "@/lib/api";

// ── Adapt ApiPaper → the shape the existing template expects ─────────────────

interface DisplayPaper {
  id: string;
  title: string;
  authors: string;       // template renders as a string
  date: string;
  metrics: string;       // template slot — we use relevance score here
  insight: string;       // template slot — we use the AI summary here
  badges: string[];
  tags: string[];
  pdf: string;
  abstract: string;
}

function adaptPaper(paper: ApiPaper, index: number): DisplayPaper {
  // Derive a short display date from the ISO string
  const displayDate = paper.date
    ? new Date(paper.date).toLocaleDateString("en-US", { year: "numeric", month: "short" })
    : "Unknown date";

  // Relevance score formatted as a metric
  const score = Math.round(paper.relevance_score);
  const metrics = `Score: ${score}`;

  // Use first 3 authors max to keep the meta line readable
  const authorStr =
    paper.authors.length > 0
      ? paper.authors.slice(0, 3).join(", ") + (paper.authors.length > 3 ? " et al." : "")
      : "Unknown authors";

  // Simple tag extraction from title words (fallback since arXiv has no tags)
  const stopWords = new Set(["a", "an", "the", "of", "in", "for", "and", "on", "with", "to", "is"]);
  const tags = paper.title
    .split(/\s+/)
    .filter((w) => w.length > 4 && !stopWords.has(w.toLowerCase()))
    .slice(0, 4)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""));

  // Badge: mark top-ranked papers as Trending
  const badges: string[] = score >= 30 ? ["Trending"] : [];

  return {
    id: `paper-${index}`,
    title: paper.title,
    authors: authorStr,
    date: displayDate,
    metrics,
    insight: paper.summary || paper.abstract.slice(0, 300),
    badges,
    tags: tags.length > 0 ? tags : ["Research"],
    pdf: paper.pdf,
    abstract: paper.abstract,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

function ResultsPageContent() {
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

  // ── Real API data ──────────────────────────────────────────────────────────
  const [papers, setPapers] = useState<DisplayPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    searchPapers(shownQuery)
      .then((res) => {
        if (!cancelled) {
          setPapers(res.papers.map(adaptPaper));
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

  // ── Speech synthesis (unchanged from original) ────────────────────────────
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

  // ── Derived stats (same logic as original, now from real data) ─────────────
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

  const topicLabel = (label: string) => {
    const map: Record<string, string> = {
      "Large Language Models": t("resultsTopicLlm"),
      "Diffusion Models": t("resultsTopicDiffusion"),
      Transformers: t("resultsTopicTransformers"),
      "Federated Learning": t("resultsTopicFederated"),
    };
    return map[label] ?? label;
  };

  const gapLabel = (gap: string) => {
    const map: Record<string, string> = {
      "Ethical frameworks for AI deployment": t("resultsGapEthics"),
      "Energy-efficient model architectures": t("resultsGapEfficiency"),
      "Multilingual NLP capabilities": t("resultsGapMultilingual"),
      "Cross-domain transfer learning": t("resultsGapTransfer"),
    };
    return map[gap] ?? gap;
  };

  const categoryLabel = (category: string) => {
    const map: Record<string, string> = {
      "Machine Learning": t("resultsCategoryMl"),
      "Deep Learning": t("resultsCategoryDl"),
      "Natural Language Processing": t("resultsCategoryNlp"),
      "Computer Vision": t("resultsCategoryCv"),
      "Reinforcement Learning": t("resultsCategoryRl"),
    };
    return map[category] ?? category;
  };

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
            <div className={styles.filterGroup}>
              <h3><TopicIcon className={styles.groupIcon} /> {t("resultsTrendingTopics")}</h3>
              <ul>
                {trendingTopics.map((topic) => (
                  <li key={topic.label}>{topicLabel(topic.label)} <span>{topic.count}</span></li>
                ))}
              </ul>
            </div>
            <div className={styles.filterGroup}>
              <h3><GapIcon className={styles.groupIcon} /> {t("resultsResearchGaps")}</h3>
              <div className={styles.gapBox}>
                {researchGaps.map((gap) => <p key={gap}>{gapLabel(gap)}</p>)}
              </div>
            </div>
            <div className={styles.filterGroup}>
              <h3><CalendarIcon className={styles.groupIcon} /> {t("resultsPublicationYear")}</h3>
              <ul className={styles.checkboxList}>
                {publicationYears.map((year) => (
                  <li key={year}>
                    <input id={`y${year}`} type="checkbox" />
                    <label htmlFor={`y${year}`}>{year}</label>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.filterGroup}>
              <h3>{t("resultsCategories")}</h3>
              <ul className={styles.checkboxList}>
                {categories.map((category) => {
                  const id = `c-${category.toLowerCase().replaceAll(" ", "-")}`;
                  return (
                    <li key={category}>
                      <input id={id} type="checkbox" />
                      <label htmlFor={id}>{categoryLabel(category)}</label>
                    </li>
                  );
                })}
              </ul>
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
                No papers found for <strong>{shownQuery}</strong>. Try a different topic.
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

              {/* View Paper button → opens the real PDF */}
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

export default function ResultsPage() {
  return (
    <Suspense fallback={<main className={styles.page} />}>
      <ResultsPageContent />
    </Suspense>
  );
}
