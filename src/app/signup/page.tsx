import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";
import styles from "./auth-page.module.css";

export default function SignupPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>Become a permanent research client</h1>
        <p>
          Create your account to follow topics, save papers, and get daily or weekly trend
          updates.
        </p>
        <AuthForm mode="signup" />
        <p className={styles.helperText}>
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}
