"use client";

import { useMemo, useState } from "react";
import styles from "./results.module.css";

type SummaryMode = "quick" | "medium" | "detailed";

type PaperSummaryActionsProps = {
  paperId: string;
  paperTitle: string;
  paperInsight: string;
};

function buildSummary(mode: SummaryMode, title: string, insight: string) {
  const normalizedInsight = insight.trim();
  const firstSentence = normalizedInsight.split(". ")[0] ?? normalizedInsight;

  if (mode === "quick") {
    return `Quick summary for ${title}: ${firstSentence}. In practical terms, this paper highlights a focused contribution that can be applied quickly by teams working on similar model families. The core takeaway is that the proposed improvement is not only theoretical; it is positioned as a usable method with measurable impact on research workflows.`;
  }

  if (mode === "medium") {
    return `Medium summary for ${title}: ${normalizedInsight} Beyond the headline result, the paper appears to combine method design with explicit evaluation signals, making it easier to compare against prior approaches. For practitioners, this means the work can inform both short-term experimentation and medium-term roadmap choices, especially when balancing model quality, reliability, and deployment constraints. Overall, the contribution is meaningful because it links conceptual innovation to a clear performance narrative.`;
  }

  return `Detailed summary for ${title}: ${normalizedInsight} At a deeper level, the work likely advances the field through three layers: a concrete technical mechanism, an evidence-backed validation strategy, and a discussion of broader implications for downstream systems. The technical mechanism suggests a reusable pattern that future papers can extend; the validation strategy gives researchers confidence that gains are reproducible across realistic settings; and the downstream implications clarify where this contribution matters most in production or policy-sensitive environments. The paper is also valuable because it frames trade-offs explicitly, helping teams decide when to prioritize efficiency, fairness, robustness, or scalability depending on context. Taken together, this is the type of research that not only reports a result but also shapes how subsequent experiments are designed and how future benchmarks should be interpreted.`;
}

export default function PaperSummaryActions({
  paperId,
  paperTitle,
  paperInsight,
}: PaperSummaryActionsProps) {
  const [activeMode, setActiveMode] = useState<SummaryMode | null>(null);

  const summaryText = useMemo(() => {
    if (!activeMode) {
      return "";
    }

    return buildSummary(activeMode, paperTitle, paperInsight);
  }, [activeMode, paperInsight, paperTitle]);

  return (
    <div className={styles.summaryActions}>
      <div className={styles.summaryButtons}>
        <button
          type="button"
          className={`${styles.summaryButton} ${activeMode === "quick" ? styles.summaryButtonActive : ""}`}
          onClick={() => setActiveMode("quick")}
          aria-controls={`paper-summary-${paperId}`}
        >
          Quick
        </button>
        <button
          type="button"
          className={`${styles.summaryButton} ${activeMode === "medium" ? styles.summaryButtonActive : ""}`}
          onClick={() => setActiveMode("medium")}
          aria-controls={`paper-summary-${paperId}`}
        >
          Medium
        </button>
        <button
          type="button"
          className={`${styles.summaryButton} ${activeMode === "detailed" ? styles.summaryButtonActive : ""}`}
          onClick={() => setActiveMode("detailed")}
          aria-controls={`paper-summary-${paperId}`}
        >
          Detailed
        </button>
      </div>

      <div id={`paper-summary-${paperId}`} className={styles.paperSummaryPanel} aria-live="polite">
        {summaryText || "Choose Quick, Medium, or Detailed to get a paper-specific summary."}
      </div>
    </div>
  );
}
