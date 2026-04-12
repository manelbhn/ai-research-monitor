import Link from "next/link";
import HomeSearchForm from "@/components/home/HomeSearchForm";
import TypewriterTitle from "@/components/home/TypewriterTitle";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.heroSection}>
        <div className={styles.heroInner}>
          <p className={styles.badge}>AI-Powered Research Discovery</p>
          <div className={styles.titleStable}>
            <TypewriterTitle
              as="span"
              text="Discover Research,"
              className={`${styles.title} ${styles.titleLine}`}
              typingClassName={styles.typingTitleLine}
              typingActiveClassName={styles.typingActive}
              charDelayMs={100}
            />
            <TypewriterTitle
              as="span"
              text="Effortlessly"
              className={`${styles.title} ${styles.titleLine}`}
              typingClassName={styles.typingTitleLine}
              typingActiveClassName={styles.typingActive}
              charDelayMs={100}
              startDelayMs={1900}
            />
          </div>
          <div className={styles.subtitleStable}>
            <TypewriterTitle
              as="p"
              text={"Explore cutting-edge scientific papers with intelligent insights\nand comprehensive analytics"}
              className={styles.subtitle}
              typingClassName={styles.typingSubtitle}
              typingActiveClassName={styles.typingActive}
              charDelayMs={28}
              startDelayMs={3200}
            />
          </div>
        </div>
      </section>

      <section className={styles.searchSection}>
        <div className={styles.searchInner}>
          <HomeSearchForm />
        </div>
      </section>

      <section className={styles.featuresSection}>
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
              <h2>AI-Powered Insights</h2>
              <p>Get intelligent summaries and key findings from every paper</p>
            </article>

            <article className={styles.card}>
              <div className={styles.cardIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" className={styles.cardIconSvg}>
                  <path d="M4 15L9.5 9.5L13 13L20 6" />
                  <path d="M20 10V6H16" />
                </svg>
              </div>
              <h2>Trending Topics</h2>
              <p>Stay current with the latest developments in your field</p>
            </article>

            <article className={styles.card}>
              <div className={styles.cardIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" className={styles.cardIconSvg}>
                  <circle cx="12" cy="12" r="7.5" />
                  <circle cx="12" cy="12" r="4.5" />
                  <circle cx="12" cy="12" r="1.8" />
                </svg>
              </div>
              <h2>Research Gaps</h2>
              <p>Discover untapped opportunities for groundbreaking research</p>
            </article>
          </section>
        </div>
      </section>

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
              <p className={styles.accountTitle}>Create your research account.</p>
              <p className={styles.accountText}>
                Track trends, receive notifications, and focus on your key fields.
              </p>
            </div>

            <div className={styles.accountActions}>
              <Link href="/login" className={styles.accountSecondaryBtn}>
                Have an account?
              </Link>
              <Link href="/signup" className={styles.accountPrimaryBtn}>
                Sign up
              </Link>
            </div>
          </section>
        </div>
      </section>

    </main>
  );
}
