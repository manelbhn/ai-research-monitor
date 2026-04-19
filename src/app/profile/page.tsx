"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import {
  clearAuthUser,
  getAuthUser,
  getFavoritePapers,
  getFollowedTopics,
  getSearchHistory,
  getTopicGapNotes,
  updateTopicPreference,
  type FavoritePaper,
  type FollowedTopic,
  type SearchHistoryItem,
  type TopicGapNote,
  type TrendPreference,
} from "@/lib/client-auth";
import { getIntlLocale } from "@/lib/i18n";
import styles from "./page.module.css";

export default function ProfilePage() {
  const { locale, t } = useAppPreferences();
  const intlLocale = getIntlLocale(locale);
  const [ready, setReady] = useState(false);
  const [userName, setUserName] = useState("");
  const [topics, setTopics] = useState<FollowedTopic[]>([]);
  const [favorites, setFavorites] = useState<FavoritePaper[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [savedNotes, setSavedNotes] = useState<TopicGapNote[]>([]);
  const [exportingId, setExportingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const user = getAuthUser();
      if (!user) {
        setReady(true);
        return;
      }

      setUserName(user.fullName);
      setTopics(getFollowedTopics());
      setFavorites(getFavoritePapers());
      setHistory(getSearchHistory());
      setSavedNotes(getTopicGapNotes());
      setReady(true);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const handlePreferenceChange = (id: string, preference: TrendPreference) => {
    setTopics(updateTopicPreference(id, preference));
  };

  const handleLogout = () => {
    clearAuthUser();
    window.location.href = "/";
  };

  const toFileSafeName = (value: string) => {
    const trimmed = value.trim().toLowerCase().replace(/\s+/g, "-");
    const cleaned = trimmed.replace(/[^a-z0-9-_]/g, "");
    return cleaned.length > 0 ? cleaned : "topic-gap-note";
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async (note: TopicGapNote) => {
    setExportingId(`${note.id}-pdf`);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "pt", format: "a4" });

      const margin = 48;
      const maxWidth = 500;
      let cursorY = 64;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text(`Topic Gap Notes: ${note.query}`, margin, cursorY);

      cursorY += 24;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      const lines = pdf.splitTextToSize(note.content, maxWidth) as string[];

      lines.forEach((line) => {
        if (cursorY > 780) {
          pdf.addPage();
          cursorY = 64;
        }
        pdf.text(line, margin, cursorY);
        cursorY += 18;
      });

      pdf.save(`${toFileSafeName(note.query)}-notes.pdf`);
    } finally {
      setExportingId(null);
    }
  };

  const handleExportDocx = async (note: TopicGapNote) => {
    setExportingId(`${note.id}-docx`);
    try {
      const { Document, Packer, Paragraph, TextRun } = await import("docx");

      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Topic Gap Notes: ${note.query}`,
                    bold: true,
                    size: 34,
                  }),
                ],
                spacing: { after: 260 },
              }),
              ...note.content.split("\n").map(
                (line) =>
                  new Paragraph({
                    children: [new TextRun({ text: line || " " })],
                    spacing: { after: 150 },
                  }),
              ),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      downloadBlob(blob, `${toFileSafeName(note.query)}-notes.docx`);
    } finally {
      setExportingId(null);
    }
  };

  if (!ready) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <section className={styles.loadingCard}>{t("profileLoading")}</section>
        </div>
      </main>
    );
  }

  if (!userName) {
    return (
      <main className={styles.page}>
        <section className={styles.emptyState}>
          <h1>{t("profileLoginRequired")}</h1>
          <p>{t("profileLoginRequiredText")}</p>
          <div className={styles.actions}>
            <Link href="/login" className={styles.secondaryBtn}>
              {t("authLogin")}
            </Link>
            <Link href="/signup" className={styles.primaryBtn}>
              {t("authSignUp")}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.headerCard}>
          <div className={styles.headerMainRow}>
            <div className={styles.heroIdentity}>
              <h1>{userName}</h1>
              <p className={styles.subtitle}>
                {t("profileSubtitle")}
              </p>
            </div>

            <div className={styles.actions}>
              <Link href="/results" className={styles.secondaryBtn}>
                {t("profileExploreResults")}
              </Link>
              <button
                type="button"
                className={styles.iconActionBtn}
                onClick={handleLogout}
                aria-label={t("profileLogoutAria")}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M14 7L19 12L14 17" />
                  <path d="M19 12H10" />
                  <path d="M10 5H7C5.9 5 5 5.9 5 7V17C5 18.1 5.9 19 7 19H10" />
                </svg>
              </button>
            </div>
          </div>

          <div className={styles.statsRow}>
            <span className={styles.statPill}>
              <strong>{history.length}</strong>
              <small>{t("profileSearches")}</small>
            </span>
            <span className={styles.statPill}>
              <strong>{favorites.length}</strong>
              <small>{t("profileFavorites")}</small>
            </span>
            <span className={styles.statPill}>
              <strong>{topics.length}</strong>
              <small>{t("profileFollowedTrends")}</small>
            </span>
            <span className={styles.statPill}>
              <strong>{savedNotes.length}</strong>
              <small>{t("profileSavedNotes")}</small>
            </span>
          </div>
        </header>

        <section className={styles.quickLinks} aria-label={t("profileQuickLinksAria")}>
          <Link href="/" className={styles.quickLinkCard}>
            <span className={styles.quickLinkIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M3 11.5L12 4L21 11.5" />
                <path d="M6.5 10.5V20H17.5V10.5" />
              </svg>
            </span>
            <span className={styles.quickLinkText}>{t("profileBackHome")}</span>
          </Link>
          <Link href="/results" className={styles.quickLinkCard}>
            <span className={styles.quickLinkIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="6.8" />
                <path d="M20 20L16.2 16.2" />
              </svg>
            </span>
            <span className={styles.quickLinkText}>{t("profileNewSearch")}</span>
          </Link>
          <Link href="/trends" className={styles.quickLinkCard}>
            <span className={styles.quickLinkIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M4.5 16.5L9.5 11.5L13 15L19.5 8.5" />
                <path d="M19.5 12V8.5H16" />
              </svg>
            </span>
            <span className={styles.quickLinkText}>{t("profileManageTrends")}</span>
          </Link>
        </section>

        <section className={styles.sectionsGrid}>
          <section className={styles.panel}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="8" />
                  <path d="M12 8V12L14.8 13.7" />
                </svg>
              </span>
              {t("profileSearchHistory")}
              <span className={styles.countBadge}>{history.length}</span>
            </h2>
            <p className={styles.sectionHint}>{t("profileSearchHistoryHint")}</p>
            {history.length === 0 ? (
              <p className={styles.emptyText}>{t("profileNoSearches")}</p>
            ) : (
              <ul className={styles.list}>
                {history.map((item) => (
                  <li key={item.id} className={styles.row}>
                    <div>
                      <strong>{item.query}</strong>
                      <p>{new Date(item.searchedAt).toLocaleString(intlLocale)}</p>
                    </div>
                    <Link
                      href={`/results?q=${encodeURIComponent(item.query)}`}
                      className={styles.linkBtn}
                    >
                      {t("profileOpen")}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.panel}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 20L5.6 14.4C3.6 12.6 3.2 9.6 5.1 7.7C6.9 5.9 9.9 6.1 11.6 8L12 8.4L12.4 8C14.1 6.1 17.1 5.9 18.9 7.7C20.8 9.6 20.4 12.6 18.4 14.4L12 20Z" />
                </svg>
              </span>
              {t("profileFavoritePapers")}
              <span className={styles.countBadge}>{favorites.length}</span>
            </h2>
            <p className={styles.sectionHint}>{t("profileFavoritePapersHint")}</p>
            {favorites.length === 0 ? (
              <div className={styles.emptyBox}>
                <span className={styles.emptyIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M7 5H17V20L12 17L7 20V5Z" />
                  </svg>
                </span>
                <p className={styles.emptyText}>
                  {t("profileNoFavorites")}
                </p>
              </div>
            ) : (
              <ul className={styles.list}>
                {favorites.map((paper) => (
                  <li key={paper.id} className={styles.row}>
                    <div>
                      <strong>{paper.title}</strong>
                      <p>{t("profileSavedOn")} {new Date(paper.addedAt).toLocaleDateString(intlLocale)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={`${styles.panel} ${styles.trendsPanel}`}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M4.5 16.5L9.5 11.5L13 15L19.5 8.5" />
                  <path d="M19.5 12V8.5H16" />
                </svg>
              </span>
              {t("profileFollowedTopics")}
              <span className={styles.countBadge}>{topics.length}</span>
            </h2>
            <p className={styles.sectionHint}>{t("profileFollowedTopicsHint")}</p>
            {topics.length === 0 ? (
              <p className={styles.emptyText}>
                {t("profileNoTopics")}
              </p>
            ) : (
              <ul className={styles.list}>
                {topics.map((topic) => (
                  <li key={topic.id} className={styles.row}>
                    <div>
                      <strong>{topic.label}</strong>
                      <p>{t("profileFollowedOn")} {new Date(topic.followedAt).toLocaleDateString(intlLocale)}</p>
                    </div>
                    <label className={styles.preferenceWrap}>
                      <span>{t("profileDigest")}</span>
                      <select
                        value={topic.preference}
                        onChange={(e) =>
                          handlePreferenceChange(topic.id, e.target.value as TrendPreference)
                        }
                      >
                        <option value="daily">{t("profileDaily")}</option>
                        <option value="weekly">{t("profileWeekly")}</option>
                        <option value="monthly">{t("profileMonthly")}</option>
                      </select>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={`${styles.panel} ${styles.trendsPanel}`}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M7 4.5H17C18.1 4.5 19 5.4 19 6.5V17.5C19 18.6 18.1 19.5 17 19.5H7C5.9 19.5 5 18.6 5 17.5V6.5C5 5.4 5.9 4.5 7 4.5Z" />
                  <path d="M8.5 9H15.5" />
                  <path d="M8.5 12H15.5" />
                  <path d="M8.5 15H12.5" />
                </svg>
              </span>
              {t("profileSavedNotes")}
              <span className={styles.countBadge}>{savedNotes.length}</span>
            </h2>
            <p className={styles.sectionHint}>{t("profileSavedNotesHint")}</p>
            {savedNotes.length === 0 ? (
              <p className={styles.emptyText}>{t("profileNoSavedNotes")}</p>
            ) : (
              <ul className={styles.list}>
                {savedNotes.map((note) => (
                  <li key={note.id} className={styles.row}>
                    <div className={styles.noteContent}>
                      <strong>{note.query}</strong>
                      <p>{note.content.length > 170 ? `${note.content.slice(0, 170)}...` : note.content}</p>
                    </div>
                    <div className={styles.noteActions}>
                      <Link
                        href={`/topic-gap?q=${encodeURIComponent(note.query)}`}
                        className={styles.linkBtn}
                      >
                        {t("profileOpen")}
                      </Link>
                      <button
                        type="button"
                        className={styles.ghostBtn}
                        onClick={() => handleExportPdf(note)}
                        disabled={exportingId !== null}
                      >
                        {exportingId === `${note.id}-pdf` ? t("profileExporting") : t("profileExportPdf")}
                      </button>
                      <button
                        type="button"
                        className={styles.ghostBtn}
                        onClick={() => handleExportDocx(note)}
                        disabled={exportingId !== null}
                      >
                        {exportingId === `${note.id}-docx` ? t("profileExporting") : t("profileExportDocx")}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
