"use client";
import React, { useState, useEffect } from "react";
import FlagIconFactory from 'react-flag-icon-css';
const FlagIcon = FlagIconFactory(React, { useCssModules: false });
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "../../context/I18nContext";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../common/Avatar";
import { getProfile } from "../../../backend/services/database/db";


const languages = [
  { code: "en", label: "English", country: "US" },
  { code: "th", label: "ไทย", country: "TH" },
  { code: "jp", label: "日本語", country: "JP" },
  { code: "es", label: "Español", country: "ES" },
  { code: "fr", label: "Français", country: "FR" },
  { code: "de", label: "Deutsch", country: "DE" },
  { code: "pt", label: "Português", country: "PT" },
  { code: "it", label: "Italiano", country: "IT" },
  { code: "ru", label: "Русский", country: "RU" },
  { code: "ar", label: "العربية", country: "SA" },
  { code: "zh", label: "简体中文", country: "CN" },
  { code: "zh-tw", label: "繁體中文", country: "TW" },
  { code: "ko", label: "한국어", country: "KR" },
];


export default function HamburgerMenu({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const { lang, setLang, t } = useI18n();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  useEffect(() => {
    if (!showLangDropdown) return;
    const handle = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest('.relative.w-full')) setShowLangDropdown(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [showLangDropdown]);

  useEffect(() => {
    if (user) {
      getProfile(user.id).then(setProfile);
    }
  }, [user]);

  // change path immediately when language changes
  const handleLangChange = (newLang: string) => {
    if (newLang === lang) return;
    const segments = pathname.split('/');
    // If segment[1] is a language code (2-5 characters)
    if (segments[1] && /^[a-z]{2}(-[a-z]{2,3})?$/i.test(segments[1])) {
      segments[1] = newLang;
    } else {
      segments.splice(1, 0, newLang);
    }
    // Remove duplicate language code segments (e.g. /th/ar/auth -> /th/auth)
    while (segments[2] && /^[a-z]{2}(-[a-z]{2,3})?$/i.test(segments[2])) {
      segments.splice(2, 1);
    }
    const newPath = segments.join('/') || '/';
    router.push(newPath);
    setLang(newLang);
  };

  return (
    <>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setOpen(false)}
          ></div>
          <nav
            className="fixed top-0 left-0 h-full w-[340px] bg-gradient-to-b from-[#23244a] via-[#181a2a] to-[#181a2a] z-[60] shadow-2xl transform transition-transform duration-300 border-r border-[#23244a]"
            aria-label="Sidebar menu"
            style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)' }}
          >
            <div className="flex items-center gap-2 px-6 py-2 border-b border-[#23244a] bg-[#23244a]/80">
              {/* Close (X) button aligned with header hamburger */}
              <button
                className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-[#393a6e] transition"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                style={{ minWidth: 40, minHeight: 40 }}
              >
                <svg width="28" height="28" fill="none" viewBox="0 0 32 32">
                  <line x1="8" y1="8" x2="24" y2="24" stroke="#b5baff" strokeWidth="3" strokeLinecap="round" />
                  <line x1="8" y1="24" x2="24" y2="8" stroke="#b5baff" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <ul className="mt-8 space-y-4 px-7">
              <li>
                <Link href={`/${lang}/category`} onClick={() => setOpen(false)} className="flex items-center gap-4 py-3 px-4 rounded-xl text-white text-xl font-bold bg-[#23244a]/60 hover:bg-[#6c63ff]/20 transition shadow-md">
                  <span className="text-3xl" role="img" aria-label="music-battle">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="12" fill="#7c6cff"/><path d="M12 20V12H20V20" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="14.5" cy="18.5" r="1.5" fill="#fff"/><circle cx="17.5" cy="18.5" r="1.5" fill="#fff"/></svg>
                  </span>
                  {t('music_battle')}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/category`} onClick={() => setOpen(false)} className="flex items-center gap-4 py-3 px-4 rounded-xl text-white text-xl font-bold bg-[#23244a]/60 hover:bg-[#ffb84d]/20 transition shadow-md">
                  <span className="text-3xl" role="img" aria-label="battle-friend">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="6" y="8" width="20" height="16" rx="3" fill="#ffb84d"/><rect x="10" y="4" width="12" height="6" rx="2" fill="#fff"/></svg>
                  </span>
                  {t('battle_friend')}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/leaderboard`} onClick={() => setOpen(false)} className="flex items-center gap-4 py-3 px-4 rounded-xl text-white text-xl font-bold bg-[#23244a]/60 hover:bg-[#ffd700]/20 transition shadow-md">
                  <span className="text-3xl" role="img" aria-label="leaderboard">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="12" fill="#ffd700"/><text x="16" y="22" textAnchor="middle" fontSize="16" fill="#23244a" fontWeight="bold">🏆</text></svg>
                  </span>
                  {t('leaderboard')}
                </Link>
              </li>
            </ul>
            <div className="mt-10 border-t border-[#23244a] pt-6 px-7">
              {user ? (
                <>
                  <div className="flex items-center gap-4 mb-3">
                    <Avatar />
                    <div>
                      <div className="font-bold text-lg text-white">{profile?.username || user?.email}</div>
                      <div className="text-xs text-gray-400">{user?.email}</div>
                    </div>
                  </div>
                  <Link href={`/${lang}/profile`} onClick={() => setOpen(false)} className="block py-2 px-3 rounded-lg bg-[#23244a]/60 hover:bg-[#6c63ff]/20 text-white font-semibold mb-2">{t('profile')}</Link>
                  <button
                    className="w-full text-left py-2 px-3 rounded-lg bg-[#23244a]/60 hover:bg-[#ff4d6d]/20 text-[#ff4d6d] font-bold transition"
                    onClick={() => { signOut(); setOpen(false); }}
                  >{t('logout')}</button>
                </>
              ) : (
                <Link href={`/${lang}/auth`} onClick={() => setOpen(false)} className="block py-2 px-3 rounded-lg bg-[#23244a]/60 hover:bg-[#6c63ff]/20 text-white font-semibold">{t('login')}</Link>
              )}
            </div>
            <div className="mt-4 px-7 pb-7">
              <div className="mb-2 font-semibold text-white">{t('language')}</div>
              <div className="relative w-full">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-2 rounded-2xl border-2 text-base font-bold bg-[#23244a]/80 text-white border-[#23244a] focus:outline-none focus:ring-2 focus:ring-[#7c6cff] transition-colors hover:bg-[#23244a] cursor-pointer shadow-md"
                  onClick={() => setShowLangDropdown(v => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={showLangDropdown ? 'true' : 'false'}
                >
                  <span className="flex items-center gap-2">
                    {(() => {
                      const l = languages.find(l => l.code === lang);
                      return l ? <FlagIcon code={l.country.toLowerCase()} size="lg" className="mr-2 rounded" /> : null;
                    })()} {languages.find(l => l.code === lang)?.label}
                  </span>
                  <svg className="ml-2 h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showLangDropdown && (
                  <ul className="absolute z-20 mt-2 w-full bg-[#23244a] border border-[#23244a] rounded-2xl shadow-lg max-h-72 overflow-auto animate-fadeIn" role="listbox">
                    {languages.map(l => (
                      <li
                        key={l.code}
                        className={`flex items-center gap-2 px-4 py-2 cursor-pointer text-base font-bold transition-colors ${lang === l.code ? 'bg-[#7c6cff]/30 text-[#ffd700]' : 'hover:bg-[#7c6cff]/10 text-white'}`}
                        role="option"
                        aria-selected={lang === l.code}
                        onClick={() => { handleLangChange(l.code); setShowLangDropdown(false); }}
                      >
                        <FlagIcon code={l.country.toLowerCase()} size="lg" className="mr-2 rounded" /> {l.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="px-7 pb-5 text-xs text-[#b5baff] mt-4">
              <Link href={`/${lang}/about`} onClick={() => setOpen(false)} className="hover:underline">{t('about')}</Link> · <Link href={`/${lang}/howto`} onClick={() => setOpen(false)} className="hover:underline">{t('howto')}</Link> · <Link href={`/${lang}/contact`} onClick={() => setOpen(false)} className="hover:underline">{t('contact')}</Link>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
