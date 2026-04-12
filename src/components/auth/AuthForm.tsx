"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { setAuthUser } from "@/lib/client-auth";
import styles from "./AuthForm.module.css";

type AuthFormProps = {
  mode: "login" | "signup";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const isSignup = mode === "signup";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const userName = isSignup ? fullName.trim() : email.split("@")[0] || "Researcher";

    const params = new URLSearchParams(window.location.search);
    const redirectTarget = params.get("redirect") || "/results";

    setAuthUser({
      email: email.trim(),
      fullName: userName,
      createdAt: new Date().toISOString(),
    });

    router.push(redirectTarget);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {isSignup && (
        <label className={styles.field}>
          <span>Full name</span>
          <input
            required
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Sarah Chen"
          />
        </label>
      )}

      <label className={styles.field}>
        <span>Email</span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@researchlab.com"
        />
      </label>

      <label className={styles.field}>
        <span>Password</span>
        <input required type="password" placeholder="••••••••" minLength={8} />
      </label>

      <button type="submit" className={styles.submitBtn}>
        {isSignup ? "Create account" : "Log in"}
      </button>
    </form>
  );
}
