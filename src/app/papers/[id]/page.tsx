"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { papers } from "@/components/second-page/results/data";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import type { TranslationKey } from "@/lib/i18n";
import styles from "./paper.module.css";

const DETAIL_PAPER_TITLE_KEYS: Record<string, TranslationKey> = {
  p1: "resultsPaperP1Title",
  p2: "resultsPaperP2Title",
  p3: "resultsPaperP3Title",
  p4: "resultsPaperP4Title",
  p5: "resultsPaperP5Title",
};

const DETAIL_PAPER_INSIGHT_KEYS: Record<string, TranslationKey> = {
  p1: "resultsPaperP1Insight",
  p2: "resultsPaperP2Insight",
  p3: "resultsPaperP3Insight",
  p4: "resultsPaperP4Insight",
  p5: "resultsPaperP5Insight",
};

const DETAIL_TAG_KEYS: Partial<Record<string, TranslationKey>> = {
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

export default function PaperDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useAppPreferences();

  const paper = papers.find((item) => item.id === id);
  const titleKey = paper ? DETAIL_PAPER_TITLE_KEYS[paper.id] : undefined;
  const insightKey = paper ? DETAIL_PAPER_INSIGHT_KEYS[paper.id] : undefined;

  const localizedPaper = paper
    ? {
        ...paper,
        title: titleKey ? t(titleKey) : paper.title,
        insight: insightKey ? t(insightKey) : paper.insight,
        tags: paper.tags.map((tag) => {
          const key = DETAIL_TAG_KEYS[tag];
          return key ? t(key) : tag.replaceAll("-", " ");
        }),
      }
    : null;

  if (!localizedPaper) {
    return (
      <main className={styles.page}>
        <section className={styles.shell}>
          <header className={styles.header}>
            <Link href="/trends" className={styles.backLink}>
              {t("trendsPageBackHome")}
            </Link>
          </header>
          <article className={styles.card}>
            <h1 className={styles.title}>{t("trendsPageEmpty")}</h1>
          </article>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <Link href="/trends" className={styles.backLink}>
            {t("trendsPageBackHome")}
          </Link>
          <Link href={`/results?q=${encodeURIComponent(localizedPaper.title)}`} className={styles.backLink}>
            {t("trendsPageOpenResults")}
          </Link>
        </header>

        <article className={styles.card}>
          {localizedPaper.badges.includes("Trending") && (
            <span className={styles.badge}>{t("resultsBadgeTrending")}</span>
          )}
          <h1 className={styles.title}>{localizedPaper.title}</h1>
          <p className={styles.meta}>
            {localizedPaper.authors} • {localizedPaper.metrics} • {localizedPaper.date}
          </p>

          <p className={styles.insightTitle}>{t("resultsAiInsights")}</p>
          <p className={styles.insight}>{localizedPaper.insight}</p>

          <div className={styles.tags}>
            {localizedPaper.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
