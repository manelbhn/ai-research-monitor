import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";
import styles from "../signup/auth-page.module.css";

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>Welcome back</h1>
        <p>Log in to track topics and receive daily or weekly trend digests.</p>
        <AuthForm mode="login" />
        <p className={styles.helperText}>
          New here? <Link href="/signup">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
