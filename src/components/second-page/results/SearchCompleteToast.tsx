"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { CloseIcon, SuccessIcon } from "./icons";
import styles from "@/app/results/results.module.css";

type SearchCompleteToastProps = {
  query: string;
};

export default function SearchCompleteToast({ query }: SearchCompleteToastProps) {
  const { t } = useAppPreferences();
  const [visible, setVisible] = useState(false);
  const storageKey = useMemo(
    () => `rdp.toast.search-complete.${query.trim().toLowerCase() || "default"}`,
    [query],
  );

  useEffect(() => {
    const shownBefore = window.sessionStorage.getItem(storageKey);
    if (shownBefore) {
      return;
    }

    window.sessionStorage.setItem(storageKey, "1");

    const showTimer = window.setTimeout(() => {
      setVisible(true);
    }, 0);

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
    }, 2800);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [storageKey]);

  if (!visible) {
    return null;
  }

  return (
    <div className={`${styles.toast} animate-slideIn`} role="status" aria-live="polite">
      <SuccessIcon className={styles.toastIcon} />
      <span>{t("toastSearchComplete")}</span>
      <button
        type="button"
        className={styles.toastClose}
        aria-label={t("toastDismissAria")}
        onClick={() => setVisible(false)}
      >
        <CloseIcon className={styles.toastCloseIcon} />
      </button>
    </div>
  );
}