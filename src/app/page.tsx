"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import HomeSearchForm from "@/components/home-page/HomeSearchForm";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { papers } from "@/components/second-page/results/data";
import { getAuthUser } from "@/lib/client-auth";
import type { Locale, ThemeMode, TranslationKey, VoicePreference } from "@/lib/i18n";
import styles from "./page.module.css";

const TREND_TITLE_KEYS: Partial<Record<string, TranslationKey>> = {
  p1: "homePaperP1Title",
  p3: "homePaperP3Title",
  p4: "homePaperP4Title",
};

const TREND_INSIGHT_KEYS: Partial<Record<string, TranslationKey>> = {
  p1: "homePaperP1Insight",
  p3: "homePaperP3Insight",
  p4: "homePaperP4Insight",
};

const TREND_TAG_KEYS: Partial<Record<string, TranslationKey>> = {
  transformers: "homeTagTransformers",
  NLP: "homeTagNlp",
  "attention-mechanism": "homeTagAttentionMechanism",
  efficiency: "homeTagEfficiency",
  training: "homeTagTraining",
  "deep-learning": "homeTagDeepLearning",
  multimodal: "homeTagMultimodal",
  "vision-language": "homeTagVisionLanguage",
  "cross-attention": "homeTagCrossAttention",
};

function humanizeTag(tag: string) {
  return tag.replaceAll("-", " ");
}

export default function Home() {
  const {
    t,
    locale,
    themeMode,
    voicePreference,
    setThemeMode,
    setLocale,
    setVoicePreference,
  } = useAppPreferences();
  const headlineSentences = useMemo(
    () => [t("homeHeadline1"), t("homeHeadline2"), t("homeHeadline3")],
    [t],
  );
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const loopCopies = [0, 1] as const;

  const localizedPapers = useMemo(() => {
    return papers.map((paper) => {
      const titleKey = TREND_TITLE_KEYS[paper.id];
      const insightKey = TREND_INSIGHT_KEYS[paper.id];

      return {
        ...paper,
        rawTags: paper.tags,
        title: titleKey ? t(titleKey) : paper.title,
        insight: insightKey ? t(insightKey) : paper.insight,
        tags: paper.tags.map((tag) => {
          const tagKey = TREND_TAG_KEYS[tag];
          return tagKey ? t(tagKey) : humanizeTag(tag);
        }),
      };
    });
  }, [t]);

  const trendingPreview = useMemo(
    () => localizedPapers.filter((paper) => paper.badges.includes("Trending")).slice(0, 3),
    [localizedPapers],
  );
  const trendingTopicTags = useMemo(() => {
    const counts = papers
      .filter((paper) => paper.badges.includes("Trending"))
      .flatMap((paper) => paper.tags)
      .reduce<Record<string, number>>((acc, tag) => {
        acc[tag] = (acc[tag] ?? 0) + 1;
        return acc;
      }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }, []);

  const trendingTopicCards = useMemo(() => {
    return trendingTopicTags.map((topic) => {
      const related = localizedPapers.filter(
        (paper) => paper.badges.includes("Trending") && paper.rawTags.includes(topic),
      );
      const lead = related[0];
      const summaryText = lead?.insight ?? "";
      const clippedSummary =
        summaryText.length > 180 ? `${summaryText.slice(0, 180).trimEnd()}...` : summaryText;
      const topicKey = TREND_TAG_KEYS[topic];

      return {
        topic,
        topicLabel: topicKey ? t(topicKey) : humanizeTag(topic),
        searchTopic: humanizeTag(topic),
        count: related.length,
        leadTitle: lead?.title ?? topic,
        summary: clippedSummary,
      };
    });
  }, [localizedPapers, t, trendingTopicTags]);

  useEffect(() => {
    const storageKey = "homeHeadlineIndex";
    const headlineCount = headlineSentences.length;

    const previousRaw = window.sessionStorage.getItem(storageKey);
    const previousIndex = previousRaw === null ? -1 : Number.parseInt(previousRaw, 10);

    let initialIndex = 0;
    if (headlineCount > 1) {
      initialIndex = Math.floor(Math.random() * headlineCount);
      if (!Number.isNaN(previousIndex) && initialIndex === previousIndex) {
        initialIndex = (initialIndex + 1) % headlineCount;
      }
    }

    setHeadlineIndex(initialIndex);
    window.sessionStorage.setItem(storageKey, String(initialIndex));
  }, [headlineSentences.length, locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowAccountPrompt(!getAuthUser());
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!settingsRef.current?.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onEscape);

    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.navbar}>
        <div className={styles.navbarInner}>
          <p className={styles.navbarBrand}>
            <span className={styles.brandMark} aria-hidden="true">
              <svg viewBox="0 0 24 24" className={styles.brandIcon}>
                <path d="M12 3L14.2 8.1L19.4 10.2L14.2 12.4L12 17.5L9.8 12.4L4.6 10.2L9.8 8.1L12 3Z" />
              </svg>
            </span>
            <span className={styles.brandText}>{t("homeBadge")}</span>
          </p>

          <nav className={styles.navbarMenu} aria-label={t("homeNavAria")}>
            <a href="#search-section" className={styles.menuLink} aria-label={t("homeNavSearch")}>
              <svg viewBox="0 0 24 24" className={styles.navIcon} aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16.2 16.2L20 20" />
              </svg>
              <span>{t("homeNavSearch")}</span>
            </a>
            <a href="#trends-section" className={styles.menuLink} aria-label={t("homeNavTrends")}>
              <svg viewBox="0 0 24 24" className={styles.navIcon} aria-hidden="true">
                <path d="M4 15L9.5 9.5L13 13L20 6" />
                <path d="M20 10V6H16" />
              </svg>
              <span>{t("homeNavTrends")}</span>
            </a>
            <a href="#features-section" className={styles.menuLink} aria-label={t("homeNavFeatures")}>
              <svg viewBox="0 0 24 24" className={styles.navIcon} aria-hidden="true">
                <path d="M12 4L13.7 8.3L18 10L13.7 11.7L12 16L10.3 11.7L6 10L10.3 8.3L12 4Z" />
                <path d="M18 4V7" />
                <path d="M19.5 5.5H16.5" />
              </svg>
              <span>{t("homeNavFeatures")}</span>
            </a>
            <Link href="/profile" className={styles.menuLink} aria-label={t("homeNavProfile")}>
              <svg viewBox="0 0 24 24" className={styles.navIcon} aria-hidden="true">
                <circle cx="12" cy="8" r="3" />
                <path d="M5 20C5 16.4 7.7 14 12 14C16.3 14 19 16.4 19 20" />
              </svg>
              <span>{t("homeNavProfile")}</span>
            </Link>
          </nav>

          <div className={styles.navbarSettings} ref={settingsRef}>
            <button
              type="button"
              className={styles.settingsTrigger}
              aria-haspopup="dialog"
              aria-expanded={settingsOpen}
              aria-label={t("homeNavSettings")}
              onClick={() => setSettingsOpen((prev) => !prev)}
            >
              <svg viewBox="0 0 24 24" className={styles.settingsIcon} aria-hidden="true">
                <path d="M19.4 14.9C19.5 14.3 19.6 13.7 19.6 13C19.6 12.3 19.5 11.7 19.4 11.1L21.1 9.8C21.3 9.7 21.3 9.4 21.2 9.2L19.6 6.8C19.5 6.6 19.2 6.5 19 6.6L17 7.4C16.5 7 16 6.7 15.4 6.4L15.1 4.3C15.1 4.1 14.9 4 14.7 4H11.3C11.1 4 10.9 4.1 10.9 4.3L10.6 6.4C10 6.7 9.5 7 9 7.4L7 6.6C6.8 6.5 6.5 6.6 6.4 6.8L4.8 9.2C4.7 9.4 4.7 9.7 4.9 9.8L6.6 11.1C6.5 11.7 6.4 12.3 6.4 13C6.4 13.7 6.5 14.3 6.6 14.9L4.9 16.2C4.7 16.3 4.7 16.6 4.8 16.8L6.4 19.2C6.5 19.4 6.8 19.5 7 19.4L9 18.6C9.5 19 10 19.3 10.6 19.6L10.9 21.7C10.9 21.9 11.1 22 11.3 22H14.7C14.9 22 15.1 21.9 15.1 21.7L15.4 19.6C16 19.3 16.5 19 17 18.6L19 19.4C19.2 19.5 19.5 19.4 19.6 19.2L21.2 16.8C21.3 16.6 21.3 16.3 21.1 16.2L19.4 14.9Z" />
                <circle cx="13" cy="13" r="3.2" />
              </svg>
              <span className={styles.settingsLabel}>{t("homeNavSettings")}</span>
            </button>

            {settingsOpen && (
              <div className={styles.settingsPanel} role="dialog" aria-label={t("homeNavSettings")}>
                <label className={styles.settingsFieldLabel} htmlFor="theme-mode">
                  {t("controlsTheme")}
                </label>
                <select
                  id="theme-mode"
                  className={styles.settingsSelect}
                  value={themeMode}
                  onChange={(e) => setThemeMode(e.target.value as ThemeMode)}
                >
                  <option value="light">{t("controlsLight")}</option>
                  <option value="dark">{t("controlsDark")}</option>
                  <option value="system">{t("controlsSystem")}</option>
                </select>

                <label className={styles.settingsFieldLabel} htmlFor="locale-mode">
                  {t("controlsLanguage")}
                </label>
                <select
                  id="locale-mode"
                  className={styles.settingsSelect}
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as Locale)}
                >
                  <option value="en">{t("controlsEnglish")}</option>
                  <option value="fr">{t("controlsFrench")}</option>
                  <option value="ar">{t("controlsArabic")}</option>
                </select>

                <label className={styles.settingsFieldLabel} htmlFor="voice-mode">
                  {t("controlsVoice")}
                </label>
                <select
                  id="voice-mode"
                  className={styles.settingsSelect}
                  value={voicePreference}
                  onChange={(e) => setVoicePreference(e.target.value as VoicePreference)}
                >
                  <option value="female">{t("controlsVoiceFemale")}</option>
                  <option value="male">{t("controlsVoiceMale")}</option>
                  <option value="auto">{t("controlsVoiceAuto")}</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className={styles.heroSection}>
        <div className={styles.heroAurora} aria-hidden="true">
          <div className={`${styles.heroOrb} ${styles.heroOrbPurple}`} />
          <div className={`${styles.heroOrb} ${styles.heroOrbRose}`} />
          <div className={`${styles.heroOrb} ${styles.heroOrbMauve}`} />
        </div>
        <div className={styles.heroInner}>
          <p className={styles.badge}>{t("homeBadge")}</p>
          <div className={styles.titleStable}>
            <p className={`${styles.title} ${styles.titleRotating}`}>
              {headlineSentences[headlineIndex]}
            </p>
          </div>
          <div className={styles.subtitleStable}>
            <p className={styles.subtitle}>
              {t("homeSubtitle1")}
              <br />
              {t("homeSubtitle2")}
            </p>
          </div>
          <div className={styles.heroActionRow}>
            <a href="#search-section" className={styles.primaryHeroBtn}>
              {t("homeStart")}
            </a>
          </div>
        </div>
      </section>

      <section id="search-section" className={styles.searchSection}>
        <div className={styles.searchInner}>
          <HomeSearchForm />
        </div>
      </section>

      <section id="features-section" className={styles.featuresSection}>
        <div className={styles.featuresInner}>
          <section className={styles.features}>
            <article className={styles.card}>
              <div className={styles.cardIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" className={styles.cardIconSvg}>
                  <path d="M12 3.5L13.8 8.2L18.5 10L13.8 11.8L12 16.5L10.2 11.8L5.5 10L10.2 8.2L12 3.5Z" />
                  <path d="M18.5 4.5V8.5" />
                  <path d="M20.5 6.5H16.5" />
                  <circle cx="7" cy="16.5" r="1" />
                </svg>
              </div>
              <h2>{t("homeFeature1Title")}</h2>
              <p>{t("homeFeature1Body")}</p>
            </article>

            <article className={styles.card}>
              <div className={styles.cardIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" className={styles.cardIconSvg}>
                  <path d="M4 15L9.5 9.5L13 13L20 6" />
                  <path d="M20 10V6H16" />
                </svg>
              </div>
              <h2>{t("homeFeature2Title")}</h2>
              <p>{t("homeFeature2Body")}</p>
            </article>

            <article className={styles.card}>
              <div className={styles.cardIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" className={styles.cardIconSvg}>
                  <circle cx="12" cy="12" r="7.5" />
                  <circle cx="12" cy="12" r="4.5" />
                  <circle cx="12" cy="12" r="1.8" />
                </svg>
              </div>
              <h2>{t("homeFeature3Title")}</h2>
              <p>{t("homeFeature3Body")}</p>
            </article>
          </section>
        </div>
      </section>

      <section id="trends-section" className={styles.trendsSection}>
        <div className={styles.trendsInner}>
          <div className={styles.trendsHeader}>
            <div>
              <p className={styles.trendsEyebrow}>{t("homeTrendsEyebrow")}</p>
              <h2 className={styles.trendsTitle}>{t("homeTrendsTitle")}</h2>
              <p className={styles.trendsSubtitle}>{t("homeTrendsSubtitle")}</p>
            </div>
            <Link href="/trends" className={styles.trendsViewAllBtn}>
              {t("homeTrendsViewAll")}
            </Link>
          </div>

          <section className={styles.topicsPanel}>
            <h3 className={styles.trendsBlockTitle}>{t("homeTrendsTopicsTitle")}</h3>
            <div className={styles.topicsGrid}>
              <div className={styles.topicsTrack}>
                {loopCopies.map((copy) => (
                  <div
                    key={`topic-copy-${copy}`}
                    className={styles.trackGroup}
                    aria-hidden={copy > 0 ? "true" : undefined}
                  >
                    {trendingTopicCards.map((entry) => (
                      <article key={`${entry.topic}-${copy}`} className={styles.topicCard}>
                        <span className={styles.trendBadge}>{t("resultsBadgeTrending")}</span>
                        <h3 className={styles.topicName}>{entry.topicLabel}</h3>
                        <p className={styles.topicLeadTitle}>{entry.leadTitle}</p>
                        <p className={styles.topicSummary}>{entry.summary}</p>
                        <Link
                          href={`/results?q=${encodeURIComponent(entry.searchTopic)}`}
                          className={styles.topicAction}
                          tabIndex={copy > 0 ? -1 : undefined}
                        >
                          {t("homeTrendsFollow")}
                        </Link>
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={styles.papersPanel}>
            <h3 className={styles.trendsBlockTitle}>{t("homeTrendsPapersTitle")}</h3>
            <div className={styles.trendsGrid}>
              <div className={styles.trendsTrack}>
                {loopCopies.map((copy) => (
                  <div
                    key={`paper-copy-${copy}`}
                    className={styles.trackGroup}
                    aria-hidden={copy > 0 ? "true" : undefined}
                  >
                    {trendingPreview.map((paper) => (
                      <article key={`${paper.id}-${copy}`} className={styles.trendCard}>
                        <span className={styles.trendBadge}>{t("resultsBadgeTrending")}</span>
                        <h3>{paper.title}</h3>
                        <p className={styles.trendMeta}>
                          {paper.authors} • {paper.date}
                        </p>
                        <div className={styles.trendTags}>
                          {paper.tags.slice(0, 3).map((tag) => (
                            <span key={`${paper.id}-${copy}-${tag}`}>{tag}</span>
                          ))}
                        </div>
                        <Link
                          href={`/papers/${paper.id}`}
                          className={styles.trendOpenBtn}
                          tabIndex={copy > 0 ? -1 : undefined}
                        >
                          {t("homeTrendsOpen")}
                        </Link>
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>

      {showAccountPrompt && (
        <section className={styles.ctaSection}>
          <div className={styles.ctaInner}>
            <section className={styles.accountPrompt}>
              <div className={styles.accountIconWrap} aria-hidden="true">
                <svg viewBox="0 0 24 24" className={styles.accountIcon}>
                  <circle cx="12" cy="8" r="3" />
                  <path d="M5 20C5 16 7.8 14 12 14C16.2 14 19 16 19 20" />
                </svg>
              </div>

              <div className={styles.accountCopy}>
                <p className={styles.accountTitle}>{t("homeAccountTitle")}</p>
                <p className={styles.accountText}>
                  {t("homeAccountText")}
                </p>
              </div>

              <div className={styles.accountActions}>
                <Link href="/login" className={styles.accountSecondaryBtn}>
                  {t("homeHaveAccount")}
                </Link>
                <Link href="/signup" className={styles.accountPrimaryBtn}>
                  {t("homeSignUp")}
                </Link>
              </div>
            </section>
          </div>
        </section>
      )}

    </main>
  );
}
