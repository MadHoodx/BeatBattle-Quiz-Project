"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type I18nContextType = {
  lang: string;
  setLang: (lang: string) => void;
  t: (key: string) => string;
  availableLangs: string[];
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);


export function I18nProvider({ lang: initialLang, children }: { lang: string; children: ReactNode }) {
  const availableLangs = [
    "en", "th", "jp", "es", "fr", "de", "pt", "it", "ru", "ar", "zh", "zh-tw", "ko"
  ];
  // Hydrate lang from initialLang, cookie, or localStorage
  const getInitialLang = () => {
    if (initialLang && availableLangs.includes(initialLang)) return initialLang;
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('lang');
      if (stored && availableLangs.includes(stored)) return stored;
      const cookieMatch = document.cookie.match(/(?:^|; )lang=([^;]*)/);
      if (cookieMatch && availableLangs.includes(cookieMatch[1])) return cookieMatch[1];
    }
    return 'en';
  };
  const [lang, setLangState] = useState(getInitialLang);
  const [messages, setMessages] = useState<Record<string, string>>({});

  // Load messages when lang changes
  useEffect(() => {
    import(`../locales/${lang}.json`).then(mod => setMessages(mod.default || mod));
  }, [lang]);

  // Persist lang to localStorage and cookie
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lang', lang);
      document.cookie = `lang=${lang}; path=/; max-age=31536000`;
    }
  }, [lang]);

  // setLang: update URL, cookie, and localStorage
  const setLang = (newLang: string) => {
    if (!availableLangs.includes(newLang) || newLang === lang) return;
    // Update URL: replace [lang] segment
    if (typeof window !== 'undefined') {
      const { pathname, search, hash } = window.location;
      const segments = pathname.split('/');
      if (segments[1] && availableLangs.includes(segments[1])) {
        segments[1] = newLang;
      } else {
        segments.splice(1, 0, newLang);
      }
      // Remove duplicate lang segments
      while (segments[2] && availableLangs.includes(segments[2])) {
        segments.splice(2, 1);
      }
      const newPath = segments.join('/') || '/';
      const newUrl = `${newPath}${search || ''}${hash || ''}`;
      window.history.replaceState({}, '', newUrl);
    }
    // Persist
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lang', newLang);
      document.cookie = `lang=${newLang}; path=/; max-age=31536000`;
    }
    setLangState(newLang);
  };

  const t = (key: string) => messages[key] || key;

  return (
    <I18nContext.Provider value={{ lang, setLang, t, availableLangs }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
