"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import robotMascot from "../robot-mascot.png";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import type { Locale, ThemeMode, VoicePreference } from "@/lib/i18n";
import styles from "./waitlist.module.css";

type WaitlistResponse = {
  success: boolean;
  message: string;
  position?: number;
};

const WEBSITE_IS_LAUNCHED = false;

type WaitlistCopy = {
  navAbout: string;
  navFeatures: string;
  navBenefits: string;
  navRegister: string;
  kicker: string;
  title: string;
  subtitle: string;
  heroPrimary: string;
  heroSecondary: string;
  exploreLockedNotice: string;
  proofPoints: ReadonlyArray<{ label: string; value: string }>;
  aboutEyebrow: string;
  aboutTitle: string;
  aboutText: string;
  featuresEyebrow: string;
  featuresTitle: string;
  featureCards: ReadonlyArray<{ title: string; body: string }>;
  benefitsEyebrow: string;
  benefitsTitle: string;
  benefits: ReadonlyArray<string>;
  registerEyebrow: string;
  registerTitle: string;
  registerSubtitle: string;
  ctaJoinNow: string;
  fullName: string;
  fullNamePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  companyName: string;
  companyNamePlaceholder: string;
  phoneNumber: string;
  phoneNumberPlaceholder: string;
  role: string;
  roles: ReadonlyArray<{ value: string; label: string }>;
  focus: string;
  focusPlaceholder: string;
  joinWaitlist: string;
  joining: string;
  queuePositionPrefix: string;
  msgCouldNotJoin: string;
  msgNetworkIssue: string;
  msgAlreadyOnWaitlist: string;
  msgJoinedWaitlist: string;
  msgServerError: string;
  mascotEarlyAccess: string;
  mascotLimitedSlots: string;
  mascotFounderBadge: string;
  mascotPriorityAccess: string;
  mascotLaunchSoon: string;
  mascotExclusiveAccess: string;
};

const WAITLIST_COPY: Record<Locale, WaitlistCopy> = {
  en: {
    navAbout: "About",
    navFeatures: "Features",
    navBenefits: "Benefits",
    navRegister: "Register",
    kicker: "Limited Edition Access",
    title: "Join the launch waitlist for our AI research platform",
    subtitle:
      "We turn complex papers into clear summaries, detect research gaps, and surface what matters first. Join now to secure early access.",
    heroPrimary: "Register now",
    heroSecondary: "Explore website",
    exploreLockedNotice: "Website access will open after launch announcement.",
    proofPoints: [
      { label: "AI summaries", value: "Fast" },
      { label: "Gap detection", value: "Actionable" },
      { label: "Topic trends", value: "Live" },
    ],
    aboutEyebrow: "What we do",
    aboutTitle: "A research platform built to move faster than the pile of papers",
    aboutText:
      "Our website helps researchers and teams read faster, spot missing ideas, and stay aligned with what is trending next. It is designed to feel premium, clear, and calm on both light and dark modes.",
    featuresEyebrow: "Features",
    featuresTitle: "Everything is designed to feel fast, clear, and useful",
    featureCards: [
      {
        title: "Paper summaries",
        body: "Get concise answers from long articles without losing the core scientific meaning.",
      },
      {
        title: "Gap detection",
        body: "Identify weak spots, open questions, and unexplored ideas in a topic cluster.",
      },
      {
        title: "Trend radar",
        body: "Track what is rising now so you can move before the rest of the field catches up.",
      },
    ],
    benefitsEyebrow: "Why join",
    benefitsTitle: "What you get as an early member",
    benefits: [
      "Priority access to AI paper summaries and topic digests",
      "Limited-edition founder badge on your profile",
      "First access to gap-detection tools and trend alerts",
    ],
    registerEyebrow: "Register",
    registerTitle: "Reserve your slot",
    registerSubtitle: "Spots are limited for the first launch wave.",
    ctaJoinNow: "Join the waitlist now",
    fullName: "Full name",
    fullNamePlaceholder: "Your name",
    email: "Email",
    emailPlaceholder: "you@example.com",
    companyName: "Company name (optional)",
    companyNamePlaceholder: "Your company",
    phoneNumber: "Phone number (optional)",
    phoneNumberPlaceholder: "+1 555 123 4567",
    role: "You are",
    roles: [
      { value: "student", label: "Student" },
      { value: "researcher", label: "Researcher" },
      { value: "engineer", label: "Engineer" },
      { value: "founder", label: "Founder" },
      { value: "other", label: "Other" },
    ],
    focus: "Main research interest (optional)",
    focusPlaceholder: "NLP, multimodal, healthcare AI...",
    joinWaitlist: "Register interest",
    joining: "Registering...",
    queuePositionPrefix: "Your queue position",
    msgCouldNotJoin: "Could not join the waitlist. Please try again.",
    msgNetworkIssue: "Network issue. Please try again in a few minutes.",
    msgAlreadyOnWaitlist: "You are already on the waitlist.",
    msgJoinedWaitlist: "You are in. Welcome to the early-access list.",
    msgServerError: "Server error. Please try again.",
    mascotEarlyAccess: "Early access",
    mascotLimitedSlots: "Limited slots",
    mascotFounderBadge: "Founder badge",
    mascotPriorityAccess: "Priority access",
    mascotLaunchSoon: "Launching soon",
    mascotExclusiveAccess: "Exclusive invite",
  },
  fr: {
    navAbout: "A propos",
    navFeatures: "Fonctionnalites",
    navBenefits: "Avantages",
    navRegister: "Inscription",
    kicker: "Acces edition limitee",
    title: "Rejoignez la liste d'attente de lancement de notre plateforme IA",
    subtitle:
      "Nous transformons des articles complexes en resumes clairs, detectons les lacunes de recherche et mettons en avant l'essentiel. Rejoignez-nous pour un acces anticipe.",
    heroPrimary: "S'inscrire maintenant",
    heroSecondary: "Explorer le site",
    exploreLockedNotice: "L'acces au site sera disponible apres l'annonce officielle du lancement.",
    proofPoints: [
      { label: "Resumes IA", value: "Rapide" },
      { label: "Detection de lacunes", value: "Actionnable" },
      { label: "Tendances", value: "En direct" },
    ],
    aboutEyebrow: "Ce que nous faisons",
    aboutTitle: "Une plateforme de recherche concue pour aller plus vite que la masse d'articles",
    aboutText:
      "Notre site aide les chercheurs et les equipes a lire plus vite, detecter les idees manquantes et suivre les sujets qui montent. L'ensemble est pense pour etre elegant, clair et apaisant en mode clair comme en mode sombre.",
    featuresEyebrow: "Fonctionnalites",
    featuresTitle: "Tout est pense pour aller vite, rester clair, et etre utile",
    featureCards: [
      {
        title: "Resumes d'articles",
        body: "Obtenez des reponses concises a partir de longs articles sans perdre le sens scientifique principal.",
      },
      {
        title: "Detection de lacunes",
        body: "Identifiez les points faibles, les questions ouvertes et les idees encore peu explorees.",
      },
      {
        title: "Radar des tendances",
        body: "Suivez les sujets qui montent pour agir avant le reste du domaine.",
      },
    ],
    benefitsEyebrow: "Pourquoi rejoindre",
    benefitsTitle: "Ce que vous obtenez en tant que membre prioritaire",
    benefits: [
      "Acces prioritaire aux resumes IA et aux digests de sujets",
      "Badge fondateur edition limitee sur votre profil",
      "Acces prioritaire aux outils de detection de lacunes et alertes de tendances",
    ],
    registerEyebrow: "Inscription",
    registerTitle: "Reservez votre place",
    registerSubtitle: "Les places sont limitees pour la premiere vague de lancement.",
    ctaJoinNow: "Rejoindre la liste d'attente",
    fullName: "Nom complet",
    fullNamePlaceholder: "Votre nom",
    email: "Email",
    emailPlaceholder: "vous@exemple.com",
    companyName: "Nom de l'entreprise (optionnel)",
    companyNamePlaceholder: "Votre entreprise",
    phoneNumber: "Numero de telephone (optionnel)",
    phoneNumberPlaceholder: "+33 6 12 34 56 78",
    role: "Vous etes",
    roles: [
      { value: "student", label: "Etudiant" },
      { value: "researcher", label: "Chercheur" },
      { value: "engineer", label: "Ingenieur" },
      { value: "founder", label: "Fondateur" },
      { value: "other", label: "Autre" },
    ],
    focus: "Interet de recherche principal (optionnel)",
    focusPlaceholder: "NLP, multimodal, IA sante...",
    joinWaitlist: "S'inscrire",
    joining: "Inscription...",
    queuePositionPrefix: "Votre position dans la file",
    msgCouldNotJoin: "Impossible de rejoindre la liste d'attente. Veuillez reessayer.",
    msgNetworkIssue: "Probleme reseau. Reessayez dans quelques minutes.",
    msgAlreadyOnWaitlist: "Vous etes deja sur la liste d'attente.",
    msgJoinedWaitlist: "Bienvenue. Vous etes bien inscrit a la liste d'acces anticipe.",
    msgServerError: "Erreur serveur. Veuillez reessayer.",
    mascotEarlyAccess: "Acces anticipe",
    mascotLimitedSlots: "Places limitees",
    mascotFounderBadge: "Badge fondateur",
    mascotPriorityAccess: "Acces prioritaire",
    mascotLaunchSoon: "Lancement bientot",
    mascotExclusiveAccess: "Invitation exclusive",
  },
  ar: {
    navAbout: "حول الموقع",
    navFeatures: "المميزات",
    navBenefits: "الفوائد",
    navRegister: "التسجيل",
    kicker: "وصول بنسخة محدودة",
    title: "انضم الى قائمة انتظار الاطلاق لمنصتنا البحثية بالذكاء الاصطناعي",
    subtitle:
      "نحول الاوراق المعقدة الى ملخصات واضحة، ونكشف فجوات البحث، ونبرز ما يهمك اولا. انضم الآن لتحصل على وصول مبكر.",
    heroPrimary: "سجل الآن",
    heroSecondary: "استكشف الموقع",
    exploreLockedNotice: "استكشاف الموقع سيتاح بعد اعلان الاطلاق الرسمي.",
    proofPoints: [
      { label: "ملخصات ذكية", value: "سريعة" },
      { label: "كشف الفجوات", value: "عملي" },
      { label: "اتجاهات المواضيع", value: "مباشر" },
    ],
    aboutEyebrow: "ما الذي نقدمه",
    aboutTitle: "منصة بحثية تساعدك على التحرك اسرع من تراكم الاوراق",
    aboutText:
      "يساعد موقعنا الباحثين والفرق على القراءة بسرعة اكبر، واكتشاف الافكار الناقصة، ومتابعة المواضيع الصاعدة. صممناه ليكون انيقا وواضحا ومريحا في الوضعين الفاتح والداكن.",
    featuresEyebrow: "المميزات",
    featuresTitle: "كل شيء مصمم ليكون سريعا وواضحا ومفيدا",
    featureCards: [
      {
        title: "ملخصات الاوراق",
        body: "احصل على اجابات مختصرة من المقالات الطويلة من دون خسارة المعنى العلمي الاساسي.",
      },
      {
        title: "كشف الفجوات",
        body: "حدد النقاط الضعيفة والاسئلة المفتوحة والافكار غير المستكشفة ضمن كل موضوع.",
      },
      {
        title: "رادار الاتجاهات",
        body: "تابع ما يرتفع الآن حتى تتحرك قبل ان يلحق بك بقية المجال.",
      },
    ],
    benefitsEyebrow: "لماذا تنضم",
    benefitsTitle: "ما الذي ستحصل عليه كعضو مبكر",
    benefits: [
      "وصول اولوي إلى ملخصات الاوراق وتنبيهات المواضيع",
      "شارة مؤسس محدودة على ملفك الشخصي",
      "وصول مبكر إلى ادوات كشف الفجوات وتنبيهات الاتجاهات",
    ],
    registerEyebrow: "التسجيل",
    registerTitle: "احجز مكانك",
    registerSubtitle: "الاماكن محدودة في دفعة الاطلاق الاولى.",
    ctaJoinNow: "انضم الى قائمة الانتظار الآن",
    fullName: "الاسم الكامل",
    fullNamePlaceholder: "اسمك",
    email: "البريد الالكتروني",
    emailPlaceholder: "you@example.com",
    companyName: "اسم الشركة (اختياري)",
    companyNamePlaceholder: "اسم شركتك",
    phoneNumber: "رقم الهاتف (اختياري)",
    phoneNumberPlaceholder: "+212 6 12 34 56 78",
    role: "انت",
    roles: [
      { value: "student", label: "طالب" },
      { value: "researcher", label: "باحث" },
      { value: "engineer", label: "مهندس" },
      { value: "founder", label: "مؤسس" },
      { value: "other", label: "اخرى" },
    ],
    focus: "الاهتمام البحثي الرئيسي (اختياري)",
    focusPlaceholder: "معالجة اللغة، متعدد الوسائط، الذكاء الاصطناعي الصحي...",
    joinWaitlist: "سجل اهتمامك",
    joining: "جار التسجيل...",
    queuePositionPrefix: "ترتيبك في القائمة",
    msgCouldNotJoin: "تعذر الانضمام الى قائمة الانتظار. يرجى المحاولة مرة اخرى.",
    msgNetworkIssue: "مشكلة في الشبكة. حاول مرة اخرى بعد بضع دقائق.",
    msgAlreadyOnWaitlist: "انت مسجل بالفعل في قائمة الانتظار.",
    msgJoinedWaitlist: "تم التسجيل بنجاح. اهلا بك في قائمة الوصول المبكر.",
    msgServerError: "خطأ في الخادم. يرجى المحاولة مرة اخرى.",
    mascotEarlyAccess: "وصول مبكر",
    mascotLimitedSlots: "اماكن محدودة",
    mascotFounderBadge: "شارة المؤسس",
    mascotPriorityAccess: "وصول اولوي",
    mascotLaunchSoon: "الاطلاق قريبا",
    mascotExclusiveAccess: "دعوة حصرية",
  },
};

function localizeWaitlistMessage(message: string, copy: WaitlistCopy): string {
  if (message === "You are already on the waitlist.") {
    return copy.msgAlreadyOnWaitlist;
  }

  if (message === "You are in. Welcome to the early-access list.") {
    return copy.msgJoinedWaitlist;
  }

  if (message === "Server error. Please try again.") {
    return copy.msgServerError;
  }

  if (message === "Please provide a valid name." || message === "Please provide a valid email address.") {
    return copy.msgCouldNotJoin;
  }

  return message;
}

export default function WaitlistPage() {
  const {
    t,
    locale,
    themeMode,
    voicePreference,
    setThemeMode,
    setLocale,
    setVoicePreference,
  } = useAppPreferences();
  const copy = WAITLIST_COPY[locale];
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState("student");
  const [focus, setFocus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<WaitlistResponse | null>(null);
  const [exploreNotice, setExploreNotice] = useState<string | null>(null);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          fullName: name.trim(),
          email: normalizedEmail,
          companyName: companyName.trim(),
          phoneNumber: phoneNumber.trim(),
          role,
          focus: focus.trim(),
        }),
      });

      const payload = (await response.json()) as WaitlistResponse;

      if (!response.ok) {
        setResult({
          success: false,
          message: payload.message ? localizeWaitlistMessage(payload.message, copy) : copy.msgCouldNotJoin,
        });
        return;
      }

      setResult({
        ...payload,
        message: localizeWaitlistMessage(payload.message, copy),
      });
      setName("");
      setEmail("");
      setCompanyName("");
      setPhoneNumber("");
      setRole("student");
      setFocus("");
    } catch {
      setResult({
        success: false,
        message: copy.msgNetworkIssue,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function onExploreClick() {
    if (WEBSITE_IS_LAUNCHED) {
      return;
    }
    setExploreNotice(copy.exploreLockedNotice);
  }

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!settingsRef.current?.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, []);

  useEffect(() => {
    setExploreNotice(null);
  }, [locale]);

  return (
    <main className={styles.page}>
      <header className={styles.navbar}>
        <div className={styles.navbarInner}>
          <Link href="/" className={styles.navbarBrand}>
            <span className={styles.brandMark} aria-hidden="true">
              <svg viewBox="0 0 24 24" className={styles.brandIcon}>
                <path d="M12 3L14.2 8.1L19.4 10.2L14.2 12.4L12 17.5L9.8 12.4L4.6 10.2L9.8 8.1L12 3Z" />
              </svg>
            </span>
            <span className={styles.brandText}>{t("homeBadge")}</span>
          </Link>

          <nav className={styles.navbarMenu} aria-label="Waitlist navigation">
            <a href="#about" className={styles.menuLink}>
              <svg viewBox="0 0 24 24" className={styles.navIcon} aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8V12" />
                <path d="M12 16H12.01" />
              </svg>
              <span>{copy.navAbout}</span>
            </a>
            <a href="#features" className={styles.menuLink}>
              <svg viewBox="0 0 24 24" className={styles.navIcon} aria-hidden="true">
                <path d="M12 4L13.7 8.3L18 10L13.7 11.7L12 16L10.3 11.7L6 10L10.3 8.3L12 4Z" />
                <path d="M18 4V7" />
                <path d="M19.5 5.5H16.5" />
              </svg>
              <span>{copy.navFeatures}</span>
            </a>
            <a href="#benefits" className={styles.menuLink}>
              <svg viewBox="0 0 24 24" className={styles.navIcon} aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
              <span>{copy.navBenefits}</span>
            </a>
            <a href="#register" className={styles.menuLink}>
              <svg viewBox="0 0 24 24" className={styles.navIcon} aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <path d="M20 8v6" />
                <path d="M23 11h-6" />
              </svg>
              <span>{copy.navRegister}</span>
            </a>
          </nav>

          <div className={styles.navbarSettings} ref={settingsRef}>
            <button
              type="button"
              className={styles.settingsTrigger}
              aria-haspopup="dialog"
              aria-expanded={settingsOpen}
              aria-label={t("homeNavSettings")}
              onClick={() => setSettingsOpen((prev) => !prev)}
            >
              <svg viewBox="0 0 24 24" className={styles.settingsIcon} aria-hidden="true">
                <path d="M19.4 14.9C19.5 14.3 19.6 13.7 19.6 13C19.6 12.3 19.5 11.7 19.4 11.1L21.1 9.8C21.3 9.7 21.3 9.4 21.2 9.2L19.6 6.8C19.5 6.6 19.2 6.5 19 6.6L17 7.4C16.5 7 16 6.7 15.4 6.4L15.1 4.3C15.1 4.1 14.9 4 14.7 4H11.3C11.1 4 10.9 4.1 10.9 4.3L10.6 6.4C10 6.7 9.5 7 9 7.4L7 6.6C6.8 6.5 6.5 6.6 6.4 6.8L4.8 9.2C4.7 9.4 4.7 9.7 4.9 9.8L6.6 11.1C6.5 11.7 6.4 12.3 6.4 13C6.4 13.7 6.5 14.3 6.6 14.9L4.9 16.2C4.7 16.3 4.7 16.6 4.8 16.8L6.4 19.2C6.5 19.4 6.8 19.5 7 19.4L9 18.6C9.5 19 10 19.3 10.6 19.6L10.9 21.7C10.9 21.9 11.1 22 11.3 22H14.7C14.9 22 15.1 21.9 15.1 21.7L15.4 19.6C16 19.3 16.5 19 17 18.6L19 19.4C19.2 19.5 19.5 19.4 19.6 19.2L21.2 16.8C21.3 16.6 21.3 16.3 21.1 16.2L19.4 14.9Z" />
                <circle cx="13" cy="13" r="3.2" />
              </svg>
              <span className={styles.settingsLabel}>{t("homeNavSettings")}</span>
            </button>

            {settingsOpen && (
              <div className={styles.settingsPanel} role="dialog" aria-label={t("homeNavSettings")}>
                <label className={styles.settingsFieldLabel} htmlFor="wl-theme-mode">
                  {t("controlsTheme")}
                </label>
                <select
                  id="wl-theme-mode"
                  className={styles.settingsSelect}
                  value={themeMode}
                  onChange={(e) => setThemeMode(e.target.value as ThemeMode)}
                >
                  <option value="light">{t("controlsLight")}</option>
                  <option value="dark">{t("controlsDark")}</option>
                  <option value="system">{t("controlsSystem")}</option>
                </select>

                <label className={styles.settingsFieldLabel} htmlFor="wl-locale-mode">
                  {t("controlsLanguage")}
                </label>
                <select
                  id="wl-locale-mode"
                  className={styles.settingsSelect}
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as Locale)}
                >
                  <option value="en">{t("controlsEnglish")}</option>
                  <option value="fr">{t("controlsFrench")}</option>
                  <option value="ar">{t("controlsArabic")}</option>
                </select>

                <label className={styles.settingsFieldLabel} htmlFor="wl-voice-mode">
                  {t("controlsVoice")}
                </label>
                <select
                  id="wl-voice-mode"
                  className={styles.settingsSelect}
                  value={voicePreference}
                  onChange={(e) => setVoicePreference(e.target.value as VoicePreference)}
                >
                  <option value="female">{t("controlsVoiceFemale")}</option>
                  <option value="male">{t("controlsVoiceMale")}</option>
                  <option value="auto">{t("controlsVoiceAuto")}</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className={styles.heroSection}>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <p className={styles.kicker}>{copy.kicker}</p>
            <h1 className={styles.title}>{copy.title}</h1>
            <p className={styles.subtitle}>{copy.subtitle}</p>


            <div className={styles.heroActions}>
              <a href="#register" className={styles.primaryButton}>
                {copy.heroPrimary}
              </a>
              <button
                type="button"
                className={`${styles.secondaryButton} ${styles.secondaryButtonLocked}`}
                aria-disabled="true"
                onClick={onExploreClick}
              >
                {copy.heroSecondary}
              </button>
            </div>
            {exploreNotice && <p className={styles.launchNotice}>{exploreNotice}</p>}
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.visualFrame}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={robotMascot.src} alt="Robot mascot" className={styles.mascotImg} />
              <span className={styles.mascotTag} style={{ top: "24%", right: "-8%" }}>
                <span className={styles.mascotTagDot} />
                {copy.mascotExclusiveAccess}
              </span>
              <span className={styles.mascotTag} style={{ bottom: "20%", left: "-6%" }}>
                <span className={styles.mascotTagDot} />
                {copy.mascotFounderBadge}
              </span>
              <span className={styles.mascotTag} style={{ bottom: "-4%", right: "-2%" }}>
                <span className={styles.mascotTagDot} />
                {copy.mascotPriorityAccess}
              </span>
              <span className={`${styles.mascotTag} ${styles.mascotTagEdge}`}>
                <span className={styles.mascotTagDot} />
                {copy.mascotLaunchSoon}
              </span>

            </div>
          </div>
        </div>
      </section>

      <section id="about" className={styles.section}>
        <div className={styles.sectionShell}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionEyebrow}>{copy.aboutEyebrow}</p>
            <h2 className={styles.sectionTitle}>{copy.aboutTitle}</h2>
            <p className={styles.sectionText}>{copy.aboutText}</p>
          </div>
        </div>
      </section>

      <section id="features" className={styles.section}>
        <div className={styles.sectionShell}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionEyebrow}>{copy.featuresEyebrow}</p>
            <h2 className={styles.sectionTitle}>{copy.featuresTitle}</h2>
          </div>

          <div className={styles.detailGrid}>
            {copy.featureCards.map((item, index) => (
              <article key={item.title} className={styles.detailCard} style={{ animationDelay: `${0.08 + index * 0.08}s` }}>
                <span className={styles.detailIndex}>0{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="benefits" className={styles.section}>
        <div className={styles.sectionShell}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionEyebrow}>{copy.benefitsEyebrow}</p>
            <h2 className={styles.sectionTitle}>{copy.benefitsTitle}</h2>
          </div>

          <div className={styles.benefitsGrid}>
            {copy.benefits.map((benefit, index) => (
              <article key={benefit} className={styles.benefitCard} style={{ animationDelay: `${0.08 + index * 0.08}s` }}>
                <span className={styles.benefitDot} />
                <p>{benefit}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="register" className={styles.section}>
        <div className={styles.sectionShell}>
          <div className={styles.registerCard}>
            <div className={styles.registerCopy}>
              <p className={styles.sectionEyebrow}>{copy.registerEyebrow}</p>
              <h2 className={styles.sectionTitle}>{copy.registerTitle}</h2>
              <p className={styles.sectionText}>{copy.registerSubtitle}</p>
              <div className={styles.registerSummary}>
                <button
                  type="button"
                  className={`${styles.summaryLink} ${styles.secondaryButtonLocked}`}
                  aria-disabled="true"
                  onClick={onExploreClick}
                >
                  {copy.heroSecondary}
                </button>
              </div>
            </div>

            <form className={styles.form} onSubmit={onSubmit}>
              <label className={styles.field}>
                <span>{copy.fullName}</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={copy.fullNamePlaceholder}
                  minLength={2}
                  maxLength={80}
                  required
                />
              </label>

              <label className={styles.field}>
                <span>{copy.email}</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={copy.emailPlaceholder}
                  type="email"
                  required
                />
              </label>

              <label className={styles.field}>
                <span>{copy.companyName}</span>
                <input
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder={copy.companyNamePlaceholder}
                  maxLength={160}
                />
              </label>

              <label className={styles.field}>
                <span>{copy.phoneNumber}</span>
                <input
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder={copy.phoneNumberPlaceholder}
                  maxLength={40}
                />
              </label>

              <label className={styles.field}>
                <span>{copy.role}</span>
                <select value={role} onChange={(event) => setRole(event.target.value)}>
                  {copy.roles.map((roleOption) => (
                    <option key={roleOption.value} value={roleOption.value}>
                      {roleOption.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span>{copy.focus}</span>
                <input
                  value={focus}
                  onChange={(event) => setFocus(event.target.value)}
                  placeholder={copy.focusPlaceholder}
                  maxLength={120}
                />
              </label>

              <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                {isSubmitting ? copy.joining : copy.joinWaitlist}
              </button>

              {result && (
                <p className={result.success ? styles.successMessage : styles.errorMessage}>
                  {result.message}
                  {result.success && result.position ? ` ${copy.queuePositionPrefix}: #${result.position}.` : ""}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

