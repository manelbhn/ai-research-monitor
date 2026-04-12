"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  clearAuthUser,
  getAuthUser,
  getFavoritePapers,
  getFollowedTopics,
  getSearchHistory,
  updateTopicPreference,
  type FavoritePaper,
  type FollowedTopic,
  type SearchHistoryItem,
  type TrendPreference,
} from "@/lib/client-auth";
import styles from "./page.module.css";

export default function ProfilePage() {
  const [ready, setReady] = useState(false);
  const [userName, setUserName] = useState("");
  const [topics, setTopics] = useState<FollowedTopic[]>([]);
  const [favorites, setFavorites] = useState<FavoritePaper[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

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

  if (!ready) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <section className={styles.loadingCard}>Loading your profile...</section>
        </div>
      </main>
    );
  }

  if (!userName) {
    return (
      <main className={styles.page}>
        <section className={styles.emptyState}>
          <h1>Log in required</h1>
          <p>Sign in to access your profile, favorites, history, and trend preferences.</p>
          <div className={styles.actions}>
            <Link href="/login" className={styles.secondaryBtn}>
              Log in
            </Link>
            <Link href="/signup" className={styles.primaryBtn}>
              Sign up
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
          <div className={styles.heroIdentity}>
            <div className={styles.avatar} aria-hidden="true">
              {userName.charAt(0).toUpperCase()}
            </div>

            <div>
              <p className={styles.kicker}>Research Profile</p>
              <h1>{userName}&apos;s Profile</h1>
              <p className={styles.subtitle}>
                Your search history, favorite papers, and followed trends in one place.
              </p>
            </div>
          </div>

          <div className={styles.statsRow}>
            <span className={styles.statPill}>{history.length} searches</span>
            <span className={styles.statPill}>{favorites.length} favorites</span>
            <span className={styles.statPill}>{topics.length} followed trends</span>
          </div>

          <div className={styles.actions}>
            <Link href="/results" className={styles.secondaryBtn}>
              Explore results
            </Link>
            <button type="button" className={styles.ghostBtn} onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>

        <section className={styles.quickLinks} aria-label="Quick links">
          <Link href="/" className={styles.quickLinkCard}>
            <span className={styles.quickLinkIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M3 11.5L12 4L21 11.5" />
                <path d="M6.5 10.5V20H17.5V10.5" />
              </svg>
            </span>
            <span className={styles.quickLinkText}>Back to Home</span>
          </Link>
          <Link href="/results" className={styles.quickLinkCard}>
            <span className={styles.quickLinkIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="6.8" />
                <path d="M20 20L16.2 16.2" />
              </svg>
            </span>
            <span className={styles.quickLinkText}>New Search</span>
          </Link>
          <Link href="/my-trends" className={styles.quickLinkCard}>
            <span className={styles.quickLinkIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M4.5 16.5L9.5 11.5L13 15L19.5 8.5" />
                <path d="M19.5 12V8.5H16" />
              </svg>
            </span>
            <span className={styles.quickLinkText}>Manage Trends</span>
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
              Search History
              <span className={styles.countBadge}>{history.length}</span>
            </h2>
            <p className={styles.sectionHint}>Your recent queries and quick links back to results.</p>
            {history.length === 0 ? (
              <p className={styles.emptyText}>No searches yet. Start from the home or results page.</p>
            ) : (
              <ul className={styles.list}>
                {history.map((item) => (
                  <li key={item.id} className={styles.row}>
                    <div>
                      <strong>{item.query}</strong>
                      <p>{new Date(item.searchedAt).toLocaleString()}</p>
                    </div>
                    <Link
                      href={`/results?q=${encodeURIComponent(item.query)}`}
                      className={styles.linkBtn}
                    >
                      Open
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
              Favorite Papers
              <span className={styles.countBadge}>{favorites.length}</span>
            </h2>
            <p className={styles.sectionHint}>Papers you bookmarked for later review and comparison.</p>
            {favorites.length === 0 ? (
              <p className={styles.emptyText}>
                No favorite papers yet. Use the bookmark icon on results cards.
              </p>
            ) : (
              <ul className={styles.list}>
                {favorites.map((paper) => (
                  <li key={paper.id} className={styles.row}>
                    <div>
                      <strong>{paper.title}</strong>
                      <p>Saved on {new Date(paper.addedAt).toLocaleDateString()}</p>
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
              Followed Trends
              <span className={styles.countBadge}>{topics.length}</span>
            </h2>
            <p className={styles.sectionHint}>Manage the update frequency for each followed topic.</p>
            {topics.length === 0 ? (
              <p className={styles.emptyText}>
                No topics followed yet. Follow topics from the results page.
              </p>
            ) : (
              <ul className={styles.list}>
                {topics.map((topic) => (
                  <li key={topic.id} className={styles.row}>
                    <div>
                      <strong>{topic.label}</strong>
                      <p>Followed on {new Date(topic.followedAt).toLocaleDateString()}</p>
                    </div>
                    <label className={styles.preferenceWrap}>
                      <span>Digest</span>
                      <select
                        value={topic.preference}
                        onChange={(e) =>
                          handlePreferenceChange(topic.id, e.target.value as TrendPreference)
                        }
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </label>
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
