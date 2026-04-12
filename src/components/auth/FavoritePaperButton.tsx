"use client";

import { useEffect, useState } from "react";
import { getFavoritePapers, toggleFavoritePaper } from "@/lib/client-auth";
import styles from "./FavoritePaperButton.module.css";

type FavoritePaperButtonProps = {
  paperId: string;
  paperTitle: string;
};

export default function FavoritePaperButton({ paperId, paperTitle }: FavoritePaperButtonProps) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const favorites = getFavoritePapers();
      setIsSaved(favorites.some((paper) => paper.id === paperId));
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [paperId]);

  const handleToggle = () => {
    const updated = toggleFavoritePaper(paperId, paperTitle);
    setIsSaved(updated.some((paper) => paper.id === paperId));
  };

  return (
    <button
      type="button"
      aria-label={isSaved ? "Remove favorite" : "Save as favorite"}
      onClick={handleToggle}
      className={`${styles.button} ${isSaved ? styles.saved : ""}`.trim()}
    >
      <svg viewBox="0 0 24 24" className={styles.icon}>
        <path d="M7 5H17V20L12 17L7 20V5Z" />
      </svg>
    </button>
  );
}
