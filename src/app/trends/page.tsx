"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { papers } from "@/components/second-page/results/data";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import type { TranslationKey } from "@/lib/i18n";
import styles from "./trends.module.css";

const TRENDS_PAPER_TITLE_KEYS: Record<string, TranslationKey> = {
  p1: "resultsPaperP1Title",
  p2: "resultsPaperP2Title",
  p3: "resultsPaperP3Title",
  p4: "resultsPaperP4Title",
  p5: "resultsPaperP5Title",
};

const TRENDS_PAPER_INSIGHT_KEYS: Record<string, TranslationKey> = {
  p1: "resultsPaperP1Insight",
  p2: "resultsPaperP2Insight",
  p3: "resultsPaperP3Insight",
  p4: "resultsPaperP4Insight",
  p5: "resultsPaperP5Insight",
};

const TRENDS_TAG_KEYS: Partial<Record<string, TranslationKey>> = {
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

function TrendsPageContent() {
  const { locale, t } = useAppPreferences();
  const searchParams = useSearchParams();
  const activeTopic = searchParams.get("topic")?.trim().toLowerCase() ?? "";

  const localizedPapers = useMemo(() => {
    return papers.map((paper) => {
      const titleKey = TRENDS_PAPER_TITLE_KEYS[paper.id];
      const insightKey = TRENDS_PAPER_INSIGHT_KEYS[paper.id];

      return {
        ...paper,
        title: titleKey ? t(titleKey) : paper.title,
        insight: insightKey ? t(insightKey) : paper.insight,
        rawTags: paper.tags,
        tags: paper.tags.map((tag) => {
          const key = TRENDS_TAG_KEYS[tag];
          return key ? t(key) : tag.replaceAll("-", " ");
        }),
      };
    });
  }, [t]);

  const trendingPapers = useMemo(() => {
    const allTrending = localizedPapers.filter((paper) => paper.badges.includes("Trending"));

    if (!activeTopic) {
      return allTrending;
    }

    return allTrending.filter((paper) =>
      paper.rawTags.some((tag) => tag.toLowerCase().includes(activeTopic)) ||
      paper.tags.some((tag) => tag.toLowerCase().includes(activeTopic)),
    );
  }, [activeTopic, localizedPapers]);

  return (
    <main className={`${styles.page} ${locale === "ar" ? styles.rtl : ""}`}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <Link href="/" className={styles.backLink}>
              {t("trendsPageBackHome")}
            </Link>
            <span className={styles.status}>{t("trendsPageUpdated")}</span>
          </div>

          <h1 className={styles.title}>{t("trendsPageTitle")}</h1>
          <p className={styles.subtitle}>{t("trendsPageSubtitle")}</p>

          <p className={styles.stats}>
            <strong>{trendingPapers.length}</strong>
            <span>{t("trendsPageTotal")}</span>
          </p>

          {activeTopic && (
            <div className={styles.filterRow}>
              <span className={styles.filterPill}>{t("trendsPageFilteredBy")}: {activeTopic}</span>
              <Link href="/trends" className={styles.clearFilterLink}>
                {t("trendsPageClearFilter")}
              </Link>
            </div>
          )}
        </header>

        {trendingPapers.length === 0 ? (
          <p className={styles.empty}>{t("trendsPageEmpty")}</p>
        ) : (
          <>
            <h2 className={styles.sectionHeading}>{t("resultsTrendingTopics")}</h2>
            <section className={styles.grid}>
              {trendingPapers.map((paper) => (
                <article
                  key={paper.id}
                  className={styles.card + " " + styles.selected}
                >
                  <span className={styles.badge}>{t("resultsBadgeTrending")}</span>
                  <h2 className={styles.paperTitle}>{paper.title}</h2>
                  <p className={styles.meta}>
                    {paper.authors} - {paper.metrics} - {paper.date}
                  </p>
                  <p className={styles.insight}>{paper.insight}</p>

                  <div className={styles.tags}>
                    {paper.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/papers/${paper.id}`}
                    className={styles.openBtn}
                  >
                    {t("trendsPageOpenPaper")}
                  </Link>
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

