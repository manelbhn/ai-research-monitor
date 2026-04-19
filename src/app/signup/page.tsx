"use client";

import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import styles from "./auth-page.module.css";

export default function SignupPage() {
  const { t } = useAppPreferences();

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>{t("signupTitle")}</h1>
        <p>
          {t("signupText")}
        </p>
        <AuthForm mode="signup" />
        <p className={styles.helperText}>
          {t("signupHaveAccount")} <Link href="/login">{t("signupLogin")}</Link>
        </p>
      </section>
    </main>
  );
}
