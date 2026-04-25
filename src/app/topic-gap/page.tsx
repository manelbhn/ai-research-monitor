"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { papers } from "@/components/second-page/results/data";
import type { Locale } from "@/lib/i18n";
import styles from "./topic-gap.module.css";

type GapRule = {
  gap: string;
  keywords: string[];
  action: string;
};

type TopicGapCopy = {
  defaultQuery: string;
  highPriority: string;
  mediumPriority: string;
  goodCoverage: string;
  backToResults: string;
  liveGapScan: string;
  detectorEyebrow: string;
  titleTemplate: string;
  subtitle: string;
  highestOpportunity: string;
  detectedGapAreas: string;
  coverage: string;
  opportunity: string;
  topRepeatedThemes: string;
  researchNotes: string;
  notesHint: string;
  notesPlaceholder: string;
  saveNotes: string;
  clear: string;
  savedAt: string;
  gapRules: GapRule[];
};

const TOPIC_GAP_COPY: Record<Locale, TopicGapCopy> = {
  en: {
    defaultQuery: "machine learning",
    highPriority: "High priority",
    mediumPriority: "Medium priority",
    goodCoverage: "Good coverage",
    backToResults: "Back to results",
    liveGapScan: "Live gap scan",
    detectorEyebrow: "Topic Gap Detector",
    titleTemplate: "{query}: uncover the missing opportunities",
    subtitle:
      "This page highlights weakly-covered themes in your current result set and gives you a workspace to capture research notes and next experiments.",
    highestOpportunity: "highest opportunity score",
    detectedGapAreas: "Detected gap areas",
    coverage: "Coverage",
    opportunity: "Opportunity",
    topRepeatedThemes: "Top repeated themes",
    researchNotes: "Research notes",
    notesHint:
      "Write hypotheses, candidate datasets, baselines, and validation criteria for your next paper.",
    notesPlaceholder:
      "Example: Evaluate multilingual transfer with low-resource benchmarks and track fairness drift per language.",
    saveNotes: "Save notes",
    clear: "Clear",
    savedAt: "Saved at",
    gapRules: [
      {
        gap: "Ethical frameworks for AI deployment",
        keywords: ["ethic", "fair", "bias", "responsible", "policy", "govern"],
        action:
          "Define measurable safety and fairness acceptance criteria, then evaluate every experiment against that checklist.",
      },
      {
        gap: "Energy-efficient model architectures",
        keywords: ["efficien", "energy", "cost", "latency", "compute", "green"],
        action:
          "Track energy and runtime per training run, and compare architecture choices using quality-per-watt metrics.",
      },
      {
        gap: "Multilingual NLP capabilities",
        keywords: ["multilingual", "cross-lingual", "language", "translation", "nlp"],
        action:
          "Add language coverage targets and benchmark underrepresented languages before scaling to production.",
      },
      {
        gap: "Cross-domain transfer learning",
        keywords: ["transfer", "cross-domain", "generalization", "adaptation", "domain"],
        action:
          "Build a transfer matrix across domains and identify where representations fail to generalize reliably.",
      },
    ],
  },
  fr: {
    defaultQuery: "machine learning",
    highPriority: "Priorite elevee",
    mediumPriority: "Priorite moyenne",
    goodCoverage: "Bonne couverture",
    backToResults: "Retour aux resultats",
    liveGapScan: "Analyse des lacunes en direct",
    detectorEyebrow: "Detecteur de lacunes",
    titleTemplate: "{query} : identifiez les opportunites manquantes",
    subtitle:
      "Cette page met en avant les themes faiblement couverts dans vos resultats actuels et vous offre un espace pour noter hypotheses et prochaines experiences.",
    highestOpportunity: "score d'opportunite le plus eleve",
    detectedGapAreas: "Zones de lacunes detectees",
    coverage: "Couverture",
    opportunity: "Opportunite",
    topRepeatedThemes: "Themes repetes principaux",
    researchNotes: "Notes de recherche",
    notesHint:
      "Ajoutez hypotheses, jeux de donnees candidats, baselines et criteres de validation pour votre prochain article.",
    notesPlaceholder:
      "Exemple : Evaluer le transfert multilingue avec des benchmarks low-resource et suivre la derive d'equite par langue.",
    saveNotes: "Enregistrer les notes",
    clear: "Effacer",
    savedAt: "Enregistre a",
    gapRules: [
      {
        gap: "Cadres ethiques pour le deploiement de l'IA",
        keywords: ["ethic", "fair", "bias", "responsible", "policy", "govern"],
        action:
          "Definissez des criteres mesurables de securite et d'equite, puis evaluez chaque experience selon cette checklist.",
      },
      {
        gap: "Architectures de modeles economes en energie",
        keywords: ["efficien", "energy", "cost", "latency", "compute", "green"],
        action:
          "Suivez l'energie et le temps d'execution par entrainement, puis comparez les architectures via des metriques qualite-par-watt.",
      },
      {
        gap: "Capacites NLP multilingues",
        keywords: ["multilingual", "cross-lingual", "language", "translation", "nlp"],
        action:
          "Ajoutez des objectifs de couverture linguistique et benchmarkez les langues sous-representees avant le passage en production.",
      },
      {
        gap: "Transfert inter-domaines",
        keywords: ["transfer", "cross-domain", "generalization", "adaptation", "domain"],
        action:
          "Construisez une matrice de transfert entre domaines et identifiez les cas ou les representations se generalisent mal.",
      },
    ],
  },
  ar: {
    defaultQuery: "تعلم الآلة",
    highPriority: "أولوية عالية",
    mediumPriority: "أولوية متوسطة",
    goodCoverage: "تغطية جيدة",
    backToResults: "العودة إلى النتائج",
    liveGapScan: "فحص الفجوات المباشر",
    detectorEyebrow: "كاشف فجوات الموضوع",
    titleTemplate: "{query}: اكتشف الفرص البحثية المفقودة",
    subtitle:
      "تُظهر هذه الصفحة المواضيع ضعيفة التغطية في نتائجك الحالية وتمنحك مساحة لتسجيل ملاحظات البحث والتجارب القادمة.",
    highestOpportunity: "أعلى درجة فرصة",
    detectedGapAreas: "مناطق الفجوات المكتشفة",
    coverage: "التغطية",
    opportunity: "الفرصة",
    topRepeatedThemes: "أكثر المواضيع تكراراً",
    researchNotes: "ملاحظات بحثية",
    notesHint:
      "اكتب الفرضيات ومجموعات البيانات المرشحة وخطوط الأساس ومعايير التحقق للورقة القادمة.",
    notesPlaceholder:
      "مثال: قيّم النقل متعدد اللغات مع اختبارات منخفضة الموارد وتتبع انحراف العدالة لكل لغة.",
    saveNotes: "حفظ الملاحظات",
    clear: "مسح",
    savedAt: "تم الحفظ عند",
    gapRules: [
      {
        gap: "أطر أخلاقية لنشر الذكاء الاصطناعي",
        keywords: ["ethic", "fair", "bias", "responsible", "policy", "govern"],
        action:
          "حدّد معايير قابلة للقياس للسلامة والعدالة، ثم قيّم كل تجربة وفق قائمة تحقق واضحة.",
      },
      {
        gap: "معماريات نماذج موفرة للطاقة",
        keywords: ["efficien", "energy", "cost", "latency", "compute", "green"],
        action:
          "تتبّع الطاقة ووقت التشغيل لكل تدريب، وقارن خيارات المعمارية باستخدام جودة-لكل-واط.",
      },
      {
        gap: "قدرات NLP متعددة اللغات",
        keywords: ["multilingual", "cross-lingual", "language", "translation", "nlp"],
        action:
          "أضف أهدافاً لتغطية اللغات واختبر اللغات الأقل تمثيلاً قبل التوسع نحو الإنتاج.",
      },
      {
        gap: "نقل التعلم بين المجالات",
        keywords: ["transfer", "cross-domain", "generalization", "adaptation", "domain"],
        action:
          "ابنِ مصفوفة نقل بين المجالات وحدد الأماكن التي تفشل فيها التمثيلات في التعميم بشكل موثوق.",
      },
    ],
  },
};

function normalize(value: string) {
  return value.toLowerCase();
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function TopicGapPageContent() {
  const { t, locale, format } = useAppPreferences();
  const copy = TOPIC_GAP_COPY[locale];
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim();
  const shownQuery = query && query.length > 0 ? query : copy.defaultQuery;
  const normalizedQuery = normalize(shownQuery);

  const queryTokens = normalizedQuery
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);

  const relatedPapers = (() => {
    const matched = papers.filter((paper) => {
      const source = normalize(`${paper.title} ${paper.insight} ${paper.tags.join(" ")}`);
      return queryTokens.length === 0 || includesAny(source, queryTokens);
    });

    return matched.length > 0 ? matched : papers;
  })();

  const tagCounts = relatedPapers
    .flatMap((paper) => paper.tags)
    .reduce<Record<string, number>>((acc, tag) => {
      acc[tag] = (acc[tag] ?? 0) + 1;
      return acc;
    }, {});

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag, count]) => ({
      tag: tag.replaceAll("-", " "),
      count,
    }));

  const gapCards = copy.gapRules
    .map((rule) => {
      const aligned = relatedPapers.filter((paper) => {
        const source = normalize(`${paper.title} ${paper.insight} ${paper.tags.join(" ")}`);
        return includesAny(source, rule.keywords);
      }).length;

      const coverage = Math.round((aligned / relatedPapers.length) * 100);
      const opportunity = Math.max(15, 100 - coverage);

      return {
        gap: rule.gap,
        coverage,
        opportunity,
        action: rule.action,
      };
    })
    .sort((a, b) => b.opportunity - a.opportunity);

  const storageKey = `topic-gap-notes:${normalizedQuery}`;
  const [notes, setNotes] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem(storageKey) ?? "";
  });
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const getPriorityClass = (opportunity: number) => {
    if (opportunity >= 70) {
      return styles.priorityCritical;
    }

    if (opportunity >= 45) {
      return styles.priorityModerate;
    }

    return styles.priorityStable;
  };

  const getPriorityLabel = (opportunity: number) => {
    if (opportunity >= 70) {
      return copy.highPriority;
    }

    if (opportunity >= 45) {
      return copy.mediumPriority;
    }

    return copy.goodCoverage;
  };

  const handleSave = () => {
    window.localStorage.setItem(storageKey, notes);
    setSavedAt(new Date().toLocaleTimeString());
  };

  const handleClear = () => {
    setNotes("");
    window.localStorage.removeItem(storageKey);
    setSavedAt(null);
  };

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <Link href={`/results?q=${encodeURIComponent(shownQuery)}`} className={styles.backLink}>
              {copy.backToResults}
            </Link>
            <span className={styles.status}>{copy.liveGapScan}</span>
          </div>

          <p className={styles.eyebrow}>{copy.detectorEyebrow}</p>
          <h1 className={styles.title}>{format(copy.titleTemplate, { query: shownQuery })}</h1>
          <p className={styles.subtitle}>{copy.subtitle}</p>

          <div className={styles.statsRow}>
            <div className={styles.statPill}>
              <strong>{relatedPapers.length}</strong>
              <span>{t("resultsFoundSuffix")}</span>
            </div>
            <div className={styles.statPill}>
              <strong>{gapCards[0]?.opportunity ?? 0}%</strong>
              <span>{copy.highestOpportunity}</span>
            </div>
          </div>
        </header>

        <section className={styles.grid}>
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>{copy.detectedGapAreas}</h2>
            <div className={styles.gapList}>
              {gapCards.map((gap) => (
                <article key={gap.gap} className={styles.gapCard}>
                  <div className={styles.gapHeader}>
                    <p className={styles.gapName}>{gap.gap}</p>
                    <span className={`${styles.priorityPill} ${getPriorityClass(gap.opportunity)}`}>
                      {getPriorityLabel(gap.opportunity)}
                    </span>
                  </div>
                  <p className={styles.gapMeta}>
                    {copy.coverage}: <strong className={styles.coverageValue}>{gap.coverage}%</strong> - {copy.opportunity}:{" "}
                    <strong className={styles.opportunityValue}>{gap.opportunity}%</strong>
                  </p>
                  <div className={styles.gapBarTrack} aria-hidden="true">
                    <span className={styles.gapBarFill} style={{ width: `${gap.opportunity}%` }} />
                  </div>
                  <p className={styles.gapAction}>{gap.action}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>{copy.topRepeatedThemes}</h2>
            <div className={styles.tagWrap}>
              {topTags.map((entry) => (
                <span key={entry.tag} className={styles.tag}>
                  {entry.tag} ({entry.count})
                </span>
              ))}
            </div>

            <h3 className={styles.notesHeading}>{copy.researchNotes}</h3>
            <p className={styles.notesHint}>{copy.notesHint}</p>

            <textarea
              className={styles.notesArea}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={copy.notesPlaceholder}
            />

            <div className={styles.noteActions}>
              <button type="button" className={styles.saveButton} onClick={handleSave}>
                {copy.saveNotes}
              </button>
              <button type="button" className={styles.clearButton} onClick={handleClear}>
                {copy.clear}
              </button>
              {savedAt && <span className={styles.savedText}>{copy.savedAt} {savedAt}</span>}
            </div>
          </section>
        </section>
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
