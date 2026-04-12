import AuthButtons from "@/components/auth/AuthButtons";
import FavoritePaperButton from "@/components/auth/FavoritePaperButton";
import FollowTopicButton from "@/components/auth/FollowTopicButton";
import SearchHistoryTracker from "@/components/auth/SearchHistoryTracker";
import Link from "next/link";
import PaperSummaryActions from "./PaperSummaryActions";
import SearchCompleteToast from "./SearchCompleteToast";
import {
  categories,
  papers,
  publicationTrendData,
  publicationYears,
  QueryParams,
  researchers,
  researchGaps,
  stats,
  trendingTopics,
} from "./data";
import {
  AnalyticsIcon,
  BackIcon,
  CalendarIcon,
  DocumentIcon,
  FilterIcon,
  GapIcon,
  RankIcon,
  SearchIcon,
  ShareIcon,
  TopicIcon,
  TrendIcon,
  UsersIcon,
} from "./icons";
import styles from "./results.module.css";

export default async function ResultsPage(props: {
  searchParams: Promise<QueryParams>;
}) {
  const searchParams = await props.searchParams;
  const queryValue = searchParams.q;
  const query = Array.isArray(queryValue) ? queryValue[0] : queryValue;
  const shownQuery = query && query.trim().length > 0 ? query : "machine learning";
  const maxPapers = Math.max(...publicationTrendData.map((point) => point.papers));

  const prettyTag = (tag: string) => tag.replaceAll("-", " ");

  const tagCounts = papers
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
    (papers.filter((paper) => paper.badges.includes("Trending")).length / papers.length) * 100
  );

  const avgMetric = Math.round(
    papers.reduce((total, paper) => total + Number.parseInt(paper.metrics, 10), 0) / papers.length
  );

  const recentShare = Math.round(
    (papers.filter((paper) => /2026|2025/.test(paper.date)).length / papers.length) * 100
  );

  const queryLower = shownQuery.toLowerCase();

  const dynamicLens =
    queryLower.includes("health") || queryLower.includes("medical")
      ? "clinical reliability and privacy compliance"
      : queryLower.includes("vision")
        ? "multimodal performance and deployment cost"
        : queryLower.includes("ethic") || queryLower.includes("policy")
          ? "governance quality and measurable fairness"
          : "model quality, reliability, and operational efficiency";

  const trendSignal =
    trendingShare >= 50
      ? "strong momentum with cross-paper convergence"
      : "steady momentum with multiple emerging directions";

  return (
    <main className={styles.page}>
      <SearchHistoryTracker query={shownQuery} />
      <header className={styles.topbar}>
        <div className={styles.topLeft}>
          <Link href="/" className={styles.backLink} aria-label="Back to home">
            <BackIcon className={styles.topIcon} />
          </Link>
          <div>
            <p className={styles.queryLine}>
              <SearchIcon className={styles.queryIcon} />
              {shownQuery}
            </p>
            <p className={styles.countLine}>{papers.length} papers found</p>
          </div>
        </div>
        <div className={styles.topActions}>
          <button type="button" className={styles.sortButton}>
            Most Relevant
          </button>
          <AuthButtons compact className={styles.topAuthButtons} />
        </div>
      </header>

      <section className={styles.contentWrap}>
        <aside className={styles.leftPanel}>
          <h2>
            <FilterIcon className={styles.sectionIcon} />
            Filters
          </h2>

          <div className={styles.filterGroup}>
            <h3>
              <TopicIcon className={styles.groupIcon} /> Trending Topics
            </h3>
            <ul>
              {trendingTopics.map((topic) => (
                <li key={topic.label}>
                  {topic.label} <span>{topic.count}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.filterGroup}>
            <h3>
              <GapIcon className={styles.groupIcon} /> Research Gaps
            </h3>
            <div className={styles.gapBox}>
              {researchGaps.map((gap) => (
                <p key={gap}>{gap}</p>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <h3>
              <CalendarIcon className={styles.groupIcon} /> Publication Year
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
            <h3>Categories</h3>
            <ul className={styles.checkboxList}>
              {categories.map((category) => {
                const id = `c-${category.toLowerCase().replaceAll(" ", "-")}`;
                return (
                  <li key={category}>
                    <input id={id} type="checkbox" />
                    <label htmlFor={id}>{category}</label>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        <section className={styles.centerPanel}>
          <article className={styles.topicSummaryCard}>
            <p className={styles.topicSummaryEyebrow}>Research Summary</p>
            <h2>{shownQuery}: Overall topic synthesis</h2>
            <p className={styles.topicSummaryLead}>
              This result set shows {trendSignal}. About {trendingShare}% of papers are marked as
              trending, the average impact indicator is {avgMetric}, and {recentShare}% of the papers
              were published in 2025-2026.
            </p>

            <p className={styles.topicSummaryDetail}>
              Repeated themes: {commonInsightThemes.join(", ")}. For {shownQuery}, the strongest
              opportunities are where teams optimize {dynamicLens} while maintaining reproducibility
              and long-term value.
            </p>
            <div className={styles.topicSummaryTags}>
              {topTags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </article>

          {papers.map((paper) => (
            <article key={paper.id} className={styles.paperCard}>
              <div className={styles.cardTopRow}>
                <div className={styles.badgeRow}>
                  {paper.badges.map((badge) => (
                    <span key={badge} className={styles.miniBadge}>
                      {badge === "Trending" && <TrendIcon className={styles.badgeIcon} />}
                      {badge}
                    </span>
                  ))}
                </div>
                <div className={styles.cardActions}>
                  <FavoritePaperButton paperId={paper.id} paperTitle={paper.title} />
                  <button type="button" aria-label="Share paper" className={styles.iconButton}>
                    <ShareIcon className={styles.actionIcon} />
                  </button>
                </div>
              </div>

              <h3>{paper.title}</h3>
              <p className={styles.metaLine}>
                {paper.authors} • {paper.metrics} • {paper.date}
              </p>

              <div className={styles.insightBox}>
                <p className={styles.insightTitle}>AI INSIGHTS</p>
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
              />

              <button type="button" className={styles.paperButton}>
                View Full Paper
              </button>
              <FollowTopicButton topic={paper.tags[0] ?? paper.title} />
            </article>
          ))}
        </section>

        <aside className={styles.rightPanel}>
          <h2>
            <AnalyticsIcon className={styles.sectionIcon} /> Analytics
          </h2>

          {stats.map((stat) => (
            <div
              key={stat.id}
              className={stat.accent ? styles.statCardAccent : styles.statCard}
            >
              <span className={styles.statIconWrap}>
                {stat.id === "total-papers" && <DocumentIcon className={styles.statIcon} />}
                {stat.id === "total-citations" && <TrendIcon className={styles.statIcon} />}
                {stat.id === "active-researchers" && <UsersIcon className={styles.statIcon} />}
              </span>
              <strong>{stat.value}</strong>
              <p>{stat.label}</p>
            </div>
          ))}

          <div className={styles.chartCard}>
            <h3>Publication Trends</h3>
            <div className={styles.chartPlot}>
              <div className={styles.yAxis}>
                <span>160</span>
                <span>120</span>
                <span>80</span>
                <span>40</span>
                <span>0</span>
              </div>
              <div className={styles.bars}>
                {publicationTrendData.map((point) => {
                  const height = `${Math.max((point.papers / maxPapers) * 100, 8)}%`;
                  const isActive = point.year === 2025;

                  return (
                    <div key={point.year} className={styles.barColumn}>
                      {isActive && (
                        <div className={styles.barTooltip}>
                          <strong>{point.year}</strong>
                          <span>papers: {point.papers}</span>
                        </div>
                      )}
                      <span
                        className={`${styles.bar} ${isActive ? styles.barActive : ""}`}
                        style={{ height }}
                      />
                      <small>{point.year}</small>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={styles.researcherCard}>
            <h3>Leading Researchers</h3>
            {researchers.map((researcher) => (
              <div key={researcher.id} className={styles.researcherRow}>
                <span className={styles.avatar}>{researcher.initials}</span>
                <div>
                  <p>{researcher.name}</p>
                  <small>{researcher.citations}</small>
                </div>
                <span className={styles.rank}>
                  <RankIcon className={styles.rankIcon} /> {researcher.rank}
                </span>
              </div>
            ))}
          </div>

          <div className={styles.impactCard}>
            <p className={styles.impactHeader}>
              <svg viewBox="0 0 24 24" className={styles.impactIcon}>
                <path d="M5 15L10 10L13 13L19 7" />
                <path d="M19 11V7H15" />
              </svg>
              Impact Score
            </p>
            <p className={styles.impactValue}>
              8.4 <span>/10</span>
            </p>
            <p className={styles.impactText}>
              High-impact research area with increasing publication trends and
              strong citation rates.
            </p>
          </div>
        </aside>
      </section>

      <SearchCompleteToast query={shownQuery} />
    </main>
  );
}