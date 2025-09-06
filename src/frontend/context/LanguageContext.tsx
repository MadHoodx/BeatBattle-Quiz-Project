"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = {
  code: string;
  label: string;
  flag: string;
};

const defaultLanguages: Language[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "th", label: "ไทย", flag: "🇹🇭" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
];

export const LanguageContext = createContext<{
  lang: string;
  setLang: (code: string) => void;
  languages: Language[];
} | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("lang") : null;
    if (stored) setLang(stored);
  }, []);

  const handleSetLang = (code: string) => {
    setLang(code);
    if (typeof window !== "undefined") localStorage.setItem("lang", code);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, languages: defaultLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
