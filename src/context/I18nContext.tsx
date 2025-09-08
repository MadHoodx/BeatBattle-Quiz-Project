"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { usePathname } from "next/navigation";

export type I18nContextType = {
  lang: string;
  setLang: (lang: string) => void;
  t: (key: string) => string;
  availableLangs: string[];
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);


export function I18nProvider({ lang: propLang, children }: { lang?: string; children: ReactNode }) {
  const availableLangs = ["en","th","jp","es","fr","de","pt","it","ru","ar","zh","zh-tw","ko"];

  // Determine initial lang (SSR + client hydration safe)
  const computeInitial = () => {
    // Explicit prop from route param
    if (propLang && availableLangs.includes(propLang)) return propLang;
    // 2. If running in browser, attempt to parse first path segment
    if (typeof window !== 'undefined') {
      const seg = window.location.pathname.split('/').filter(Boolean)[0];
      if (seg && availableLangs.includes(seg)) return seg;
      const stored = window.localStorage.getItem('lang');
      if (stored && availableLangs.includes(stored)) return stored;
      const cookieMatch = document.cookie.match(/(?:^|; )lang=([^;]*)/);
      if (cookieMatch && availableLangs.includes(cookieMatch[1])) return cookieMatch[1];
      // 3. Browser language heuristic
      const nav = (navigator.languages && navigator.languages[0]) || navigator.language || '';
      const short = nav.toLowerCase().split('-')[0];
      if (short && availableLangs.includes(short)) return short;
    }
    return 'en';
  };

  const [lang, setLangState] = useState<string>(computeInitial);
  const pathname = usePathname();
  const lastPropLang = useRef<string | undefined>(propLang);
  // If route param (propLang) changes (remount or key) sync state.
  useEffect(() => {
    if (propLang && propLang !== lastPropLang.current && availableLangs.includes(propLang)) {
      lastPropLang.current = propLang;
      setLangState(propLang);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('lang', propLang);
        document.cookie = `lang=${propLang}; path=/; max-age=31536000`;
      }
    }
  }, [propLang, availableLangs]);

  // Fallback: when navigating client-side without remount (shouldn't happen with key but safe)
  useEffect(() => {
    if (!pathname) return;
    const seg = pathname.split('/').filter(Boolean)[0];
    if (seg && availableLangs.includes(seg) && seg !== lang) {
      setLangState(seg);
    }
  }, [pathname, lang, availableLangs]);
  const [messages, setMessages] = useState<Record<string, string>>({});

  // Load messages when lang changes
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const mod = await import(`../locales/${lang}.json`);
        if (active) setMessages(mod.default || mod);
      } catch (e) {
        console.warn('[i18n] failed to load locale', lang, e);
        if (active) setMessages({});
      }
    })();
    return () => { active = false; };
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
    // Only update state + persistence; actual navigation is handled via router.push elsewhere
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
