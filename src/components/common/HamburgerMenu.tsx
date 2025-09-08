"use client";
import React, { useState, useEffect, useRef } from "react";
import 'flag-icons/css/flag-icons.min.css';
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/context/I18nContext";
import LangLink, { useLangHref } from "./LangLink";
import { useAuth } from "@/context/AuthContext";
import Avatar from "./Avatar";
import { getProfile } from "@/server/services/database/db";


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
  const langBoxRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!showLangDropdown) return;
    const handle = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (langBoxRef.current && !langBoxRef.current.contains(target)) {
        setShowLangDropdown(false);
      }
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
    if (newLang === lang) { setShowLangDropdown(false); return; }
    const raw = pathname || '/';
    const segs = raw.split('/').filter(Boolean);
    if (segs[0] && languages.some(l => l.code === segs[0])) segs.shift();
    const rest = segs.join('/');
    const next = '/' + [newLang, rest].filter(Boolean).join('/');
    setLang(newLang); 
    setShowLangDropdown(false);
    setOpen(false);
    router.push(next);
  };

  return (
    <>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setOpen(false)}
          />
          <nav
            className="fixed top-0 left-0 h-full w-[360px] max-w-[85vw] z-[60] shadow-2xl overflow-hidden"
            aria-label="Sidebar menu"
          >
            <div className="absolute inset-0 bg-[#0d101d]/95 backdrop-blur-xl pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-500/10 via-transparent to-indigo-600/10 pointer-events-none" />
            <div className="absolute -right-32 top-1/3 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-xl overflow-hidden shadow-lg ring-1 ring-white/10 bg-white/5 flex items-center justify-center">
                  <img src="/logo.png" alt="BeatBattle Logo" className="h-full w-full object-contain" />
                </span>
                <span className="font-semibold text-white/80 text-sm tracking-wide">BeatBattle</span>
              </div>
              <button
                className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" /></svg>
              </button>
            </div>
            <div className="relative h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
              <ul className="mt-6 px-5 space-y-2 text-[13px]">
                <SidebarItem href="/category" onClick={() => setOpen(false)} icon={<MusicIcon />}>{t('music_battle')}</SidebarItem>
                <SidebarItem href="/category" onClick={() => setOpen(false)} icon={<FriendIcon />} accent="amber">{t('battle_friend')}</SidebarItem>
                <SidebarItem href="/leaderboard" onClick={() => setOpen(false)} icon={<TrophyIcon />} accent="yellow">{t('leaderboard')}</SidebarItem>
              </ul>
              <div className="mt-8 px-5">
                {user ? (
                  <div className="rounded-2xl p-4 bg-white/5/50 backdrop-blur border border-white/10 flex items-center gap-3">
                    <Avatar />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{profile?.username || user?.email}</p>
                      <p className="text-xs text-white/40 truncate">{user?.email}</p>
                    </div>
                  </div>
                ) : (
                  <LangLink href="/auth" onClick={() => setOpen(false)} className="block text-center w-full rounded-xl border border-fuchsia-400/40 bg-gradient-to-r from-fuchsia-600/30 to-pink-500/30 text-fuchsia-100 hover:from-fuchsia-600/40 hover:to-pink-500/40 hover:text-white px-4 py-2 text-sm font-semibold transition">{t('login')}</LangLink>
                )}
                {user && (
                  <div className="flex gap-3 mt-3">
                    <LangLink href="/profile" onClick={() => setOpen(false)} className="flex-1 text-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-[11px] font-medium text-white/75 hover:text-white transition">{t('profile')}</LangLink>
                    <button onClick={() => { signOut(); setOpen(false); }} className="flex-1 text-center rounded-xl border border-rose-400/30 bg-rose-600/15 hover:bg-rose-600/25 px-4 py-2 text-[11px] font-medium text-rose-200/90 hover:text-rose-100 transition">{t('logout')}</button>
                  </div>
                )}
              </div>
              <div className="mt-10 px-5">
                <p className="text-[11px] font-semibold tracking-wider text-white/45 mb-2 uppercase">{t('language')}</p>
                <div ref={langBoxRef} className="relative">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 h-11 rounded-xl border border-white/10 text-[13px] font-medium bg-white/5 text-white/75 hover:text-white hover:bg-white/[0.08] transition"
                    onClick={() => setShowLangDropdown(v => !v)}
                    aria-haspopup="listbox"
                    aria-expanded={showLangDropdown ? 'true' : 'false'}
                  >
                    <span className="flex items-center gap-2">
                      {(() => {
                        const l = languages.find(l => l.code === lang);
                        return l ? <span className={`fi fi-${l.country.toLowerCase()} mr-1.5 rounded`} style={{ fontSize: '1.25em' }} /> : null;
                      })()} {languages.find(l => l.code === lang)?.label}
                    </span>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {showLangDropdown && (
                    <ul className="absolute z-20 mt-2 w-full bg-[#121829]/95 border border-white/10 rounded-xl shadow-xl max-h-72 overflow-auto animate-fadeIn backdrop-blur-xl" role="listbox">
                      {languages.map(l => (
                        <li
                          key={l.code}
                          className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer text-[13px] font-medium transition-colors select-none ${lang === l.code ? 'bg-fuchsia-500/25 text-fuchsia-100' : 'hover:bg-white/5 text-white/70 hover:text-white'}`}
                          role="option"
                          aria-selected={lang === l.code}
                          onClick={(e) => { e.stopPropagation(); handleLangChange(l.code); setShowLangDropdown(false); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { handleLangChange(l.code); setShowLangDropdown(false); } }}
                          tabIndex={0}
                        >
                          <span className={`fi fi-${l.country.toLowerCase()} mr-2 rounded`} style={{ fontSize: '1.25em' }} /> {l.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="mt-12 px-5 pb-8">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/35 font-semibold mb-3">Info</p>
                <div className="flex flex-wrap gap-3 text-[11px] text-white/40">
                  <LangLink href="/about" onClick={() => setOpen(false)} className="hover:text-white/70 transition">{t('about')}</LangLink>
                  <LangLink href="/howto" onClick={() => setOpen(false)} className="hover:text-white/70 transition">{t('howto')}</LangLink>
                  <LangLink href="/contact" onClick={() => setOpen(false)} className="hover:text-white/70 transition">{t('contact')}</LangLink>
                </div>
                <div className="mt-6 text-[10px] text-white/25">© 2025 BeatBattle</div>
              </div>
            </div>
          </nav>
        </>
      )}
    </>
  );
}

function SidebarItem({ href, onClick, icon, children, accent }: any) {
  const base = accent === 'amber' ? 'hover:border-amber-400/40 hover:bg-amber-500/10' : accent === 'yellow' ? 'hover:border-yellow-300/40 hover:bg-yellow-400/10' : 'hover:border-fuchsia-400/40 hover:bg-fuchsia-500/10';
  return (
    <li>
      <LangLink
        href={href}
        onClick={onClick}
        className={`group flex items-center gap-4 py-3.5 px-4 rounded-xl text-sm font-medium border border-white/10 bg-white/5 text-white/80 hover:text-white transition ${base}`}
      >
        <span className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-xl text-white/60 group-hover:text-white group-hover:scale-105 transition">{icon}</span>
        <span className="tracking-wide">{children}</span>
        <span className="ml-auto opacity-0 group-hover:opacity-100 text-[10px] text-white/40 transition">›</span>
      </LangLink>
    </li>
  );
}

const MusicIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
);
const FriendIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5z"/><path d="M2 22c0-4.4 4-8 10-8s10 3.6 10 8"/></svg>
);
const TrophyIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8"/><path d="M12 17c3 0 5-2 5-5V4H7v8c0 3 2 5 5 5z"/><path d="M5 4H2v2c0 2 2 4 4 4"/><path d="M19 4h3v2c0 2-2 4-4 4"/></svg>
);
