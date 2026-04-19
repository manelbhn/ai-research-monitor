"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LOCALE_STORAGE_KEY,
  THEME_STORAGE_KEY,
  VOICE_STORAGE_KEY,
  translations,
  type Locale,
  type ThemeMode,
  type TranslationKey,
  type VoicePreference,
} from "@/lib/i18n";

type AppPreferencesContextValue = {
  locale: Locale;
  themeMode: ThemeMode;
  voicePreference: VoicePreference;
  setLocale: (locale: Locale) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setVoicePreference: (preference: VoicePreference) => void;
  t: (key: TranslationKey) => string;
  format: (template: string, values: Record<string, string | number>) => string;
};

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null);

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const useDark = mode === "dark" || (mode === "system" && prefersDark);

  root.classList.toggle("dark", useDark);
  root.style.colorScheme = useDark ? "dark" : "light";
}

function applyLocale(locale: Locale) {
  const root = document.documentElement;
  root.lang = locale;
  root.dir = locale === "ar" ? "rtl" : "ltr";
}

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [voicePreference, setVoicePreference] = useState<VoicePreference>("female");

  useEffect(() => {
    const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const savedVoice = window.localStorage.getItem(VOICE_STORAGE_KEY);

    if (savedLocale === "en" || savedLocale === "fr" || savedLocale === "ar") {
      setLocale(savedLocale);
    }

    if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system") {
      setThemeMode(savedTheme);
    }

    if (savedVoice === "female" || savedVoice === "male" || savedVoice === "auto") {
      setVoicePreference(savedVoice);
    }
  }, []);

  useEffect(() => {
    applyTheme(themeMode);
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme(themeMode);
    media.addEventListener("change", onChange);

    return () => media.removeEventListener("change", onChange);
  }, [themeMode]);

  useEffect(() => {
    applyLocale(locale);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    window.localStorage.setItem(VOICE_STORAGE_KEY, voicePreference);
  }, [voicePreference]);

  const value = useMemo<AppPreferencesContextValue>(() => {
    const dict = translations[locale];

    return {
      locale,
      themeMode,
      voicePreference,
      setLocale,
      setThemeMode,
      setVoicePreference,
      t: (key) => dict[key] ?? translations.en[key],
      format: (template, values) => {
        return Object.entries(values).reduce((acc, [key, value]) => {
          return acc.replaceAll(`{${key}}`, String(value));
        }, template);
      },
    };
  }, [locale, themeMode, voicePreference]);

  return (
    <AppPreferencesContext.Provider value={value}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);

  if (!context) {
    throw new Error("useAppPreferences must be used within AppPreferencesProvider");
  }

  return context;
}
