"use client";

import { FormEvent, useState } from "react";
import styles from "@/app/page.module.css";

export default function HomeSearchForm() {
  const [query, setQuery] = useState("");

  const isDisabled = query.trim().length === 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (isDisabled) {
      event.preventDefault();
    }
  };

  return (
    <section className={styles.searchPanel}>
      <label htmlFor="topic" className={styles.label}>
        Research Topic
      </label>
      <form className={styles.form} action="/results" method="get" onSubmit={handleSubmit}>
        <div className={styles.inputWrap}>
          <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.searchIcon}>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20L16 16" />
          </svg>
          <input
            id="topic"
            name="q"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g., Machine Learning, Quantum Computing, Climate Science..."
            className={styles.input}
            autoComplete="off"
          />
        </div>
        <button type="submit" className={styles.button} disabled={isDisabled}>
          Search Papers
        </button>
      </form>
    </section>
  );
}
