"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { papers } from "@/components/second-page/results/data";
import styles from "./topic-gap.module.css";

type GapRule = {
  gap: string;
  keywords: string[];
  action: string;
};

const GAP_RULES: GapRule[] = [
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
];

function normalize(value: string) {
  return value.toLowerCase();
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

export default function TopicGapPage() {
  const { t } = useAppPreferences();
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim();
  const shownQuery = query && query.length > 0 ? query : "machine learning";
  const normalizedQuery = normalize(shownQuery);

  const queryTokens = useMemo(() => {
    return normalizedQuery
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2);
  }, [normalizedQuery]);

  const relatedPapers = useMemo(() => {
    const matched = papers.filter((paper) => {
      const source = normalize(`${paper.title} ${paper.insight} ${paper.tags.join(" ")}`);
      return queryTokens.length === 0 || includesAny(source, queryTokens);
    });

    return matched.length > 0 ? matched : papers;
  }, [queryTokens]);

  const tagCounts = useMemo(() => {
    return relatedPapers
      .flatMap((paper) => paper.tags)
      .reduce<Record<string, number>>((acc, tag) => {
        acc[tag] = (acc[tag] ?? 0) + 1;
        return acc;
      }, {});
  }, [relatedPapers]);

  const topTags = useMemo(() => {
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({
        tag: tag.replaceAll("-", " "),
        count,
      }));
  }, [tagCounts]);

  const gapCards = useMemo(() => {
    return GAP_RULES.map((rule) => {
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
    }).sort((a, b) => b.opportunity - a.opportunity);
  }, [relatedPapers]);

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
      return "High priority";
    }

    if (opportunity >= 45) {
      return "Medium priority";
    }

    return "Good coverage";
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
              Back to results
            </Link>
            <span className={styles.status}>Live gap scan</span>
          </div>

          <p className={styles.eyebrow}>Topic Gap Detector</p>
          <h1 className={styles.title}>{shownQuery}: uncover the missing opportunities</h1>
          <p className={styles.subtitle}>
            This page highlights weakly-covered themes in your current result set and gives you a
            workspace to capture research notes and next experiments.
          </p>

          <div className={styles.statsRow}>
            <div className={styles.statPill}>
              <strong>{relatedPapers.length}</strong>
              <span>{t("resultsFoundSuffix")}</span>
            </div>
            <div className={styles.statPill}>
              <strong>{gapCards[0]?.opportunity ?? 0}%</strong>
              <span>highest opportunity score</span>
            </div>
          </div>
        </header>

        <section className={styles.grid}>
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Detected gap areas</h2>
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
                    Coverage: <strong className={styles.coverageValue}>{gap.coverage}%</strong> • Opportunity:{" "}
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
            <h2 className={styles.panelTitle}>Top repeated themes</h2>
            <div className={styles.tagWrap}>
              {topTags.map((entry) => (
                <span key={entry.tag} className={styles.tag}>
                  {entry.tag} ({entry.count})
                </span>
              ))}
            </div>

            <h3 className={styles.notesHeading}>Research notes</h3>
            <p className={styles.notesHint}>
              Write hypotheses, candidate datasets, baselines, and validation criteria for your next paper.
            </p>

            <textarea
              className={styles.notesArea}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Example: Evaluate multilingual transfer with low-resource benchmarks and track fairness drift per language."
            />

            <div className={styles.noteActions}>
              <button type="button" className={styles.saveButton} onClick={handleSave}>
                Save notes
              </button>
              <button type="button" className={styles.clearButton} onClick={handleClear}>
                Clear
              </button>
              {savedAt && <span className={styles.savedText}>Saved at {savedAt}</span>}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}
