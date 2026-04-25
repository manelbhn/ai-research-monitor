"use client";

import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import styles from "../signup/auth-page.module.css";

export default function LoginPage() {
  const { t } = useAppPreferences();

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>{t("loginTitle")}</h1>
        <p>{t("loginText")}</p>
        <AuthForm mode="login" />
        <p className={styles.helperText}>
          {t("loginNewHere")} <Link href="/signup">{t("loginCreateAccount")}</Link>
        </p>
      </section>
    </main>
  );
}
