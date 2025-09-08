"use client";
import { useI18n } from "@/context/I18nContext";
import { ReactNode } from "react";

interface HeroProps {
  onPrimary: () => void;
  onSecondary: () => void;
  onTertiary?: () => void;
  showAltCta: boolean;
  children?: ReactNode;
  loggedIn: boolean;
}

// --- CTA Subcomponents (moved above Hero to avoid rare runtime ordering issues) ---
interface CtaProps { onClick?: () => void; label?: string; }

function SparklesIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M5 3v4M3 5h4M6.5 16l1.3 2.6L10.5 20l-2.7 1.4L6.5 24l-1.3-2.6L2.5 20l2.7-1.4zM18 2l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" />
    </svg>
  );
}

function PrimaryCta({ onClick, label }: CtaProps) {
  return (
    <button
      onClick={onClick}
      className="group relative px-9 py-4 rounded-2xl font-semibold text-lg text-white bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500 shadow-lg shadow-fuchsia-700/30 hover:shadow-pink-700/40 active:scale-[0.97] transition duration-300 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300/60"
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)] opacity-0 group-hover:opacity-100 transition" />
      <span className="relative flex items-center gap-2">
        <SparklesIcon className="w-5 h-5 drop-shadow" />
        {label}
      </span>
      <span className="pointer-events-none absolute -inset-px rounded-2xl border border-white/15" />
    </button>
  );
}

function SecondaryCta({ onClick, label }: CtaProps) {
  return (
    <button
      onClick={onClick}
      className="relative px-9 py-4 rounded-2xl font-semibold text-lg bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/15 text-white/90 backdrop-blur shadow-lg transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
    >
      {label}
      <span className="pointer-events-none absolute -inset-px rounded-2xl border border-white/10" />
    </button>
  );
}

function HardcoreCta({ onClick }: CtaProps) {
  return (
    <button
      onClick={onClick}
      className="group relative px-9 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-[#2d2244] shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_4px_25px_-4px_rgba(255,120,40,0.55)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_4px_30px_-2px_rgba(255,120,40,0.7)] active:scale-[0.96] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 overflow-hidden"
      title="2s clip – no mercy"
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_65%)] opacity-0 group-hover:opacity-100 transition duration-500" />
      <span className="relative flex items-center gap-2">
        <span className="inline-flex h-5 w-5 items-center justify-center text-[#2d2244]">🔥</span>
        Hardcore
      </span>
      <span className="pointer-events-none absolute -inset-px rounded-2xl border border-white/20" />
    </button>
  );
}

export function Hero({ onPrimary, onSecondary, onTertiary, showAltCta, loggedIn, children }: HeroProps) {
  const { t } = useI18n();
  return (
  <section className="relative w-full flex flex-col items-center text-center pt-32 pb-20 lg:pt-40 z-10">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 bg-fuchsia-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-40 h-[30rem] w-[30rem] bg-indigo-500/20 rounded-full blur-3xl animate-[pulse_9s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-80 w-[50rem] bg-gradient-to-r from-transparent via-pink-500/10 to-transparent blur-2xl" />
      </div>
      <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur text-xs font-medium tracking-wide text-white/70 shadow hover:bg-white/10 transition">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="relative pr-2">Realtime Music Guess Battle</span>
      </div>
      <h1 className="mt-6 text-5xl md:text-6xl font-extrabold leading-[1.15] tracking-tight bg-gradient-to-br from-[#ffffff] via-[#e8d3ff] to-[#ff88d3] bg-clip-text text-transparent drop-shadow-xl animate-[fadeIn_1s_ease] pb-1">
        BeatBattle
        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#7c6cff] via-[#ffb84d] to-[#ff4d6d] text-4xl md:text-5xl mt-3 font-black leading-[1.2] animate-[gradientFlow_6s_linear_infinite] bg-[length:200%_auto]">Rhythm Arena</span>
      </h1>
      <p className="mt-6 max-w-2xl text-base md:text-lg text-white/70 leading-relaxed animate-[fadeIn_1.2s_ease]">
        {t('hero_desc')}
      </p>
  <div className="mt-10 flex flex-col sm:flex-row gap-5 w-full max-w-3xl justify-center animate-[fadeIn_1.3s_ease] px-4">
        <PrimaryCta onClick={onPrimary} label={loggedIn ? t('Play now') : t('login_signup')} />
        <SecondaryCta onClick={onSecondary} label={loggedIn ? t('battle_friend') : t('play_as_guest')} />
        {showAltCta && <HardcoreCta onClick={onTertiary} />}
      </div>
  {children && <div className="mt-14 w-full max-w-[1400px] px-4 animate-[fadeIn_1.4s_ease]">{children}</div>}
      <style jsx global>{`
        @keyframes gradientFlow {0%{background-position:0% 50%;}100%{background-position:100% 50%;}}
        @keyframes fadeIn {from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:none;}}
      `}</style>
    </section>
  );
}

