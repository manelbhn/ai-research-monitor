"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import styles from "@/app/results/results.module.css";

type SummaryMode = "quick" | "medium" | "detailed";

type PaperSummaryActionsProps = {
  paperId: string;
  paperTitle: string;
  paperInsight: string;
  onSummaryChange?: (paperId: string, summary: string) => void;
};

function buildSummary(
  mode: SummaryMode,
  title: string,
  insight: string,
  format: (template: string, values: Record<string, string | number>) => string,
  quickTemplate: string,
  mediumTemplate: string,
  detailedTemplate: string,
) {
  const normalizedInsight = insight.trim();
  const firstSentence = normalizedInsight.split(". ")[0] ?? normalizedInsight;

  if (mode === "quick") {
    return format(quickTemplate, { title, firstSentence });
  }

  if (mode === "medium") {
    return format(mediumTemplate, { title, insight: normalizedInsight });
  }

  return format(detailedTemplate, { title, insight: normalizedInsight });
}

export default function PaperSummaryActions({
  paperId,
  paperTitle,
  paperInsight,
  onSummaryChange,
}: PaperSummaryActionsProps) {
  const { t, format } = useAppPreferences();
  const [activeMode, setActiveMode] = useState<SummaryMode | null>(null);

  const summaryText = useMemo(() => {
    if (!activeMode) {
      return "";
    }

    return buildSummary(
      activeMode,
      paperTitle,
      paperInsight,
      format,
      t("summaryQuickTemplate"),
      t("summaryMediumTemplate"),
      t("summaryDetailedTemplate"),
    );
  }, [activeMode, format, paperInsight, paperTitle, t]);

  useEffect(() => {
    onSummaryChange?.(paperId, summaryText);
  }, [onSummaryChange, paperId, summaryText]);

  return (
    <div className={styles.summaryActions}>
      <div className={styles.summaryButtons}>
        <button
          type="button"
          className={`${styles.summaryButton} ${activeMode === "quick" ? styles.summaryButtonActive : ""}`}
          onClick={() => setActiveMode("quick")}
          aria-controls={`paper-summary-${paperId}`}
        >
          {t("summaryQuick")}
        </button>
        <button
          type="button"
          className={`${styles.summaryButton} ${activeMode === "medium" ? styles.summaryButtonActive : ""}`}
          onClick={() => setActiveMode("medium")}
          aria-controls={`paper-summary-${paperId}`}
        >
          {t("summaryMedium")}
        </button>
        <button
          type="button"
          className={`${styles.summaryButton} ${activeMode === "detailed" ? styles.summaryButtonActive : ""}`}
          onClick={() => setActiveMode("detailed")}
          aria-controls={`paper-summary-${paperId}`}
        >
          {t("summaryDetailed")}
        </button>
      </div>

      {summaryText && (
        <div id={`paper-summary-${paperId}`} className={styles.paperSummaryPanel} aria-live="polite">
          {summaryText}
        </div>
      )}
    </div>
  );
}
