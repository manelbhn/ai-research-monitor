"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearAuthUser, getAuthUser, type AuthUser } from "@/lib/client-auth";
import styles from "./AuthButtons.module.css";

type AuthButtonsProps = {
  compact?: boolean;
  className?: string;
};

export default function AuthButtons({ compact = false, className }: AuthButtonsProps) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setUser(getAuthUser());
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const handleLogout = () => {
    clearAuthUser();
    setUser(null);
  };

  return (
    <div className={`${styles.group} ${compact ? styles.compact : ""} ${className ?? ""}`.trim()}>
      {user ? (
        <>
          <Link href="/profile" className={styles.profileBtn} aria-label="Open profile">
            <svg viewBox="0 0 24 24" className={styles.profileIcon}>
              <circle cx="12" cy="8" r="3" />
              <path d="M5 20C5 16 7.8 14 12 14C16.2 14 19 16 19 20" />
            </svg>
          </Link>
          <button type="button" className={styles.textBtn} onClick={handleLogout}>
            Log out
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className={styles.secondaryBtn}>
            Log in
          </Link>
          <Link href="/signup" className={styles.primaryBtn}>
            Sign up
          </Link>
        </>
      )}
    </div>
  );
}
