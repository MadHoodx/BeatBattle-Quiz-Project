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
  const [lang, setLang] = useState(initialLang);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const availableLangs = [
    "en", "th", "jp", "es", "fr", "de", "pt", "it", "ru", "ar", "zh", "zh-tw", "ko"
  ];

  useEffect(() => {
  import(`../../locales/${lang}.json`).then(mod => setMessages(mod.default || mod));
  }, [lang]);

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
