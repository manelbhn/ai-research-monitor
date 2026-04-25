"use client";

import AuthButtons from "@/components/auth/AuthButtons";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import FavoritePaperButton from "@/components/auth/FavoritePaperButton";
import FollowTopicButton from "@/components/auth/FollowTopicButton";
import SearchHistoryTracker from "@/components/auth/SearchHistoryTracker";
import {
  categories,
  papers,
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
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { TranslationKey } from "@/lib/i18n";
import styles from "./results.module.css";

const RESULTS_PAPER_TITLE_KEYS: Record<string, TranslationKey> = {
  p1: "resultsPaperP1Title",
  p2: "resultsPaperP2Title",
  p3: "resultsPaperP3Title",
  p4: "resultsPaperP4Title",
  p5: "resultsPaperP5Title",
};

const RESULTS_PAPER_INSIGHT_KEYS: Record<string, TranslationKey> = {
  p1: "resultsPaperP1Insight",
  p2: "resultsPaperP2Insight",
  p3: "resultsPaperP3Insight",
  p4: "resultsPaperP4Insight",
  p5: "resultsPaperP5Insight",
};

const RESULTS_TAG_KEYS: Partial<Record<string, TranslationKey>> = {
  transformers: "resultsTagTransformers",
  NLP: "resultsTagNlp",
  "attention-mechanism": "resultsTagAttentionMechanism",
  ethics: "resultsTagEthics",
  LLM: "resultsTagLlm",
  "responsible-AI": "resultsTagResponsibleAi",
  efficiency: "resultsTagEfficiency",
  training: "resultsTagTraining",
  "deep-learning": "resultsTagDeepLearning",
  multimodal: "resultsTagMultimodal",
  "vision-language": "resultsTagVisionLanguage",
  "cross-attention": "resultsTagCrossAttention",
  "federated-learning": "resultsTagFederatedLearning",
  healthcare: "resultsTagHealthcare",
  privacy: "resultsTagPrivacy",
};

function ResultsPageContent() {
  const { t, format, locale, voicePreference } = useAppPreferences();
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const shownQuery = query && query.trim().length > 0 ? query : "machine learning";
  const [showFilters, setShowFilters] = useState(true);
  const [speakingPaperId, setSpeakingPaperId] = useState<string | null>(null);
  const [paperSummaries, setPaperSummaries] = useState<Record<string, string>>({});
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const fallbackAudioRef = useRef<HTMLAudioElement | null>(null);

  const localizedPapers = useMemo(() => {
    return papers.map((paper) => {
      const titleKey = RESULTS_PAPER_TITLE_KEYS[paper.id];
      const insightKey = RESULTS_PAPER_INSIGHT_KEYS[paper.id];

      return {
        ...paper,
        title: titleKey ? t(titleKey) : paper.title,
        insight: insightKey ? t(insightKey) : paper.insight,
        tags: paper.tags.map((tag) => {
          const tagKey = RESULTS_TAG_KEYS[tag];
          return tagKey ? t(tagKey) : tag.replaceAll("-", " ");
        }),
      };
    });
  }, [t]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const syncVoices = () => {
      const nextVoices = window.speechSynthesis.getVoices();
      setAvailableVoices(nextVoices);
    };

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
    if (/[\u0600-\u06FF]/.test(text)) {
      return "ar";
    }

    if (locale === "fr") {
      return "fr-FR";
    }

    if (locale === "ar") {
      return "ar-SA";
    }

    return "en-US";
  };

  const pickVoiceByPreference = (voices: SpeechSynthesisVoice[], lang: string) => {
    const normalizedLang = lang.toLowerCase();
    const primaryLanguage = normalizedLang.split("-")[0];
    const femaleHints = [
      "female",
      "woman",
      "girl",
      "zira",
      "samantha",
      "victoria",
      "hazel",
      "jenny",
      "aria",
      "ava",
      "emma",
      "olivia",
      "amelie",
      "marie",
      "laila",
      "hanan",
      "mouna",
    ];

    const maleHints = [
      "male",
      "man",
      "boy",
      "david",
      "daniel",
      "george",
      "thomas",
      "alex",
      "james",
      "oliver",
      "hassan",
      "karim",
      "nizar",
    ];

    const sameLanguage = voices.filter((voice) =>
      voice.lang.toLowerCase().startsWith(primaryLanguage),
    );

    // Arabic should always prioritize Arabic voices first regardless of gender preference.
    if (primaryLanguage === "ar" && sameLanguage.length > 0) {
      if (voicePreference === "female") {
        const femaleArabic = sameLanguage.find((voice) => {
          const meta = `${voice.name} ${voice.voiceURI}`.toLowerCase();
          return femaleHints.some((hint) => meta.includes(hint));
        });

        if (femaleArabic) {
          return femaleArabic;
        }
      }

      if (voicePreference === "male") {
        const maleArabic = sameLanguage.find((voice) => {
          const meta = `${voice.name} ${voice.voiceURI}`.toLowerCase();
          return maleHints.some((hint) => meta.includes(hint));
        });

        if (maleArabic) {
          return maleArabic;
        }
      }

      return sameLanguage[0];
    }

    if (voicePreference === "female") {
      const femaleInLanguage = sameLanguage.find((voice) => {
        const meta = `${voice.name} ${voice.voiceURI}`.toLowerCase();
        return femaleHints.some((hint) => meta.includes(hint));
      });

      if (femaleInLanguage) {
        return femaleInLanguage;
      }
    }

    if (voicePreference === "male") {
      const maleInLanguage = sameLanguage.find((voice) => {
        const meta = `${voice.name} ${voice.voiceURI}`.toLowerCase();
        return maleHints.some((hint) => meta.includes(hint));
      });

      if (maleInLanguage) {
        return maleInLanguage;
      }
    }

    return sameLanguage[0] ?? voices[0] ?? null;
  };

  const speakPaper = (paperId: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    fallbackAudioRef.current?.pause();
    fallbackAudioRef.current = null;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(trimmed);
    const speechLanguage = getSpeechLanguage(trimmed);
    utterance.lang = speechLanguage;
    const voicesPool = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    const hasArabicVoice = voicesPool.some((voice) => voice.lang.toLowerCase().startsWith("ar"));

    if (speechLanguage.startsWith("ar") && !hasArabicVoice) {
      const shortText = trimmed.length > 220 ? `${trimmed.slice(0, 220)}...` : trimmed;
      const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ar&q=${encodeURIComponent(shortText)}`;
      const audio = new Audio(fallbackUrl);
      audio.onended = () => setSpeakingPaperId((current) => (current === paperId ? null : current));
      audio.onerror = () => setSpeakingPaperId((current) => (current === paperId ? null : current));

      fallbackAudioRef.current = audio;
      setSpeakingPaperId(paperId);
      void audio.play().catch(() => {
        setSpeakingPaperId((current) => (current === paperId ? null : current));
      });
      return;
    }

    const preferredVoice = pickVoiceByPreference(voicesPool, speechLanguage);
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.08;
    utterance.onend = () => setSpeakingPaperId((current) => (current === paperId ? null : current));
    utterance.onerror = () => setSpeakingPaperId((current) => (current === paperId ? null : current));

    setSpeakingPaperId(paperId);
    window.speechSynthesis.speak(utterance);
  };

  const togglePaperSpeech = (paperId: string, paperText: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

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
      if ((current[paperId] ?? "") === summary) {
        return current;
      }

      return {
        ...current,
        [paperId]: summary,
      };
    });
  };

  const buildPaperSpeechText = (paperTitle: string, paperInsight: string) => {
    if (locale !== "ar") {
      return `${paperTitle}. ${paperInsight}`;
    }

    const normalizedInsight = paperInsight.trim();
    const firstSentence = normalizedInsight.split(". ")[0] ?? normalizedInsight;

    return format(t("summaryQuickTemplate"), {
      title: paperTitle,
      firstSentence,
    });
  };

  const prettyTag = (tag: string) => tag.replaceAll("-", " ");

  const tagCounts = localizedPapers
    .flatMap((paper) => paper.tags)
    .reduce<Record<string, number>>((acc, tag) => {
      acc[tag] = (acc[tag] ?? 0) + 1;
      return acc;
    }, {});

  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => prettyTag(tag));

  const topTags = sortedTags.slice(0, 6);
  const commonInsightThemes = sortedTags.slice(0, 4);

  const trendingShare = Math.round(
    (localizedPapers.filter((paper) => paper.badges.includes("Trending")).length / localizedPapers.length) *
      100,
  );

  const avgMetric = Math.round(
    localizedPapers.reduce((total, paper) => total + Number.parseInt(paper.metrics, 10), 0) /
      localizedPapers.length,
  );

  const recentShare = Math.round(
    (localizedPapers.filter((paper) => /2026|2025/.test(paper.date)).length / localizedPapers.length) * 100,
  );

  const queryLower = shownQuery.toLowerCase();

  const dynamicLens =
    queryLower.includes("health") || queryLower.includes("medical")
      ? t("resultsLensClinical")
      : queryLower.includes("vision")
        ? t("resultsLensVision")
        : queryLower.includes("ethic") || queryLower.includes("policy")
          ? t("resultsLensEthics")
          : t("resultsLensDefault");

  const trendSignal =
    trendingShare >= 50
      ? t("resultsTrendStrong")
      : t("resultsTrendSteady");

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
            <p className={styles.countLine}>{localizedPapers.length} {t("resultsFoundSuffix")}</p>
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
              onClick={() => setShowFilters((value) => !value)}
              aria-pressed={showFilters}
              aria-label={showFilters ? t("resultsHideFiltersAria") : t("resultsShowFiltersAria")}
            >
              <ToggleFilterIcon className={styles.toggleIcon} />
            </button>
          </div>
        </div>
      </header>

      <section className={contentWrapClass}>
        {showFilters && <aside className={styles.leftPanel}>
          <h2>
            <FilterIcon className={styles.sectionIcon} />
            {t("resultsFilters")}
          </h2>

          <div className={styles.filterGroup}>
            <h3>
              <TopicIcon className={styles.groupIcon} /> {t("resultsTrendingTopics")}
            </h3>
            <ul>
              {trendingTopics.map((topic) => (
                <li key={topic.label}>
                  {topicLabel(topic.label)} <span>{topic.count}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.filterGroup}>
            <h3>
              <GapIcon className={styles.groupIcon} /> {t("resultsResearchGaps")}
            </h3>
            <div className={styles.gapBox}>
              {researchGaps.map((gap) => (
                <p key={gap}>{gapLabel(gap)}</p>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <h3>
              <CalendarIcon className={styles.groupIcon} /> {t("resultsPublicationYear")}
            </h3>
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
        </aside>}

        <section className={styles.centerPanel}>
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
                avgMetric,
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
              {topTags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </article>

          {localizedPapers.map((paper) => (
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
                {paper.authors} - {paper.metrics} - {paper.date}
              </p>

              <div className={styles.insightBox}>
                <p className={styles.insightTitle}>{t("resultsAiInsights")}</p>
                <p>{paper.insight}</p>
              </div>

              <div className={styles.tagRow}>
                {paper.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              <PaperSummaryActions
                paperId={paper.id}
                paperTitle={paper.title}
                paperInsight={paper.insight}
                onSummaryChange={handleSummaryChange}
              />

              <button type="button" className={styles.paperButton}>
                {t("resultsViewPaper")}
              </button>
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

