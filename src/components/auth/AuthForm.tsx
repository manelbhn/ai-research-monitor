"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { setAuthUser } from "@/lib/client-auth";
import { login, signup } from "@/lib/api";
import styles from "./AuthForm.module.css";

type AuthFormProps = {
  mode: "login" | "signup";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const { t } = useAppPreferences();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = isSignup
        ? await signup(fullName.trim(), email.trim(), password)
        : await login(email.trim(), password);

      setAuthUser(
        {
          email: result.email,
          fullName: result.full_name,
          createdAt: new Date().toISOString(),
          token: result.token,
        },
        { remember: rememberMe }
      );

      // ── Redirect to home page after login/signup ──
      const params = new URLSearchParams(window.location.search);
      const redirectTarget = params.get("redirect") || "/";
      router.push(redirectTarget);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {isSignup && (
        <label className={styles.field}>
          <span>{t("authFullName")}</span>
          <input
            required
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t("authFullNamePlaceholder")}
          />
        </label>
      )}

      <label className={styles.field}>
        <span>{t("authEmail")}</span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("authEmailPlaceholder")}
        />
      </label>

      <label className={styles.field}>
        <span>{t("authPassword")}</span>
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          minLength={8}
        />
      </label>

      <label className={styles.rememberField}>
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />
        <span>{t("authRememberMe")}</span>
      </label>

      {error && (
        <p style={{
          color: "red",
          fontSize: "13px",
          marginTop: "4px",
          padding: "8px 12px",
          background: "rgba(255,0,0,0.06)",
          borderRadius: "8px",
          border: "1px solid rgba(255,0,0,0.15)"
        }}>
          {error}
        </p>
      )}

      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading
          ? (isSignup ? "Creating account…" : "Logging in…")
          : (isSignup ? t("authCreateAccount") : t("authLogin"))
        }
      </button>
    </form>
  );
}