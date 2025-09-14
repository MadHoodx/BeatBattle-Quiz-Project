
"use client";
import { useI18n } from '@/context/I18nContext';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useLangHref } from '@/components/common/LangLink';

function Atmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#31265a_0%,transparent_60%),radial-gradient(circle_at_80%_30%,#3a1d52_0%,transparent_55%),linear-gradient(160deg,#0b0f1f,#090d18)]" />
      <div className="absolute inset-0 opacity-[0.15] mix-blend-screen" style={{backgroundImage:'url(/noise.png),linear-gradient(90deg,transparent,#ffffff08 50%,transparent)',backgroundSize:'300px 300px, 400% 100%', animation:'shift 18s linear infinite'}} />
    </div>
  );
}

export default function ModePage() {
  const { t } = useI18n();
  const router = useRouter();
  const categoryHref = useLangHref('/category');
  // Solo difficulties (Hardcore is a difficulty, not a separate mode)
  const [soloDifficulty, setSoloDifficulty] = React.useState<'casual'|'hardcore'>('casual');
  const startSolo = () => {
    router.push(`${categoryHref}?difficulty=${soloDifficulty}`);
  };
  const startMultiplayer = () => {
    alert('Coming soon!');
  };

  return (
  <main className="relative min-h-screen w-full overflow-hidden px-5 py-24 md:py-28 bg-[#070a18] text-white">
      <Atmosphere />
      <div className="relative mx-auto max-w-7xl">
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-fuchsia-200 to-pink-200 bg-clip-text text-transparent drop-shadow-lg animate-[fadeIn_0.8s_ease]">
            {t('choose_mode')}
          </h1>
          <p className="mt-4 text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed animate-[fadeIn_1s_ease]">
            {t('choose_mode_desc')}
          </p>
        </div>
        <div className="grid gap-10 md:gap-12 md:grid-cols-2 items-stretch">
          {/* Solo Mode Card */}
          <div
            role="button"
            tabIndex={0}
            onClick={startSolo}
            onKeyDown={(e)=>{ if(e.key==='Enter'|| e.key===' ') { e.preventDefault(); startSolo(); } }}
            aria-label={`Start solo ${soloDifficulty} mode`}
            className="cursor-pointer group relative rounded-3xl p-8 md:p-10 border border-white/10 bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-indigo-500/10 backdrop-blur-xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_50px_-5px_rgba(100,50,200,0.5)] overflow-hidden text-left transition transform hover:-translate-y-1 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-fuchsia-400/60"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_70%)]" />
            <div className="flex flex-col h-full relative z-10">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-1 bg-white/10 border border-white/15 rounded-full p-1">
                    {(['casual','hardcore'] as const).map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSoloDifficulty(d); }}
                        className={`px-3 py-1 text-[11px] font-bold tracking-wider uppercase rounded-full transition ${(soloDifficulty===d)?'bg-fuchsia-500/40 text-white shadow-inner':'text-white/60 hover:text-white/80'}`}
                      >{t(d)}</button>
                    ))}
                  </div>
                  <span className="text-xs text-white/40 font-medium">{t('solo')}</span>
                </div>
                <div className="w-full flex items-center justify-center mb-6">
                  <img src="/Solo.png" alt="Solo" className="h-40 md:h-48 w-auto object-contain drop-shadow-[0_4px_18px_rgba(255,255,255,0.08)] transition-transform duration-500 group-hover:scale-110" />
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold mb-4 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent drop-shadow">
                  {t('solo')}
                </h2>
                <p className="text-sm md:text-base leading-relaxed text-white/70 pr-2">
                  {soloDifficulty==='hardcore' ? t('solo_hardcore_desc') : t('solo_casual_desc')}
                </p>
              </div>
              <div className="mt-8 pt-4 flex items-center justify-between text-xs text-white/40 border-t border-white/10">
                <span className="inline-flex items-center gap-1">▶ <span className="opacity-70">{soloDifficulty==='hardcore' ? '2s clip' : '15s clip'}</span></span>
                <span className="inline-flex items-center gap-1 group-hover:text-fuchsia-200 transition">Start <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7"/></svg></span>
              </div>
            </div>
          </div>
          {/* Multiplayer Mode Card */}
          <div
            role="button"
            tabIndex={0}
            onClick={startMultiplayer}
            onKeyDown={(e)=>{ if(e.key==='Enter'|| e.key===' ') { e.preventDefault(); startMultiplayer(); } }}
            aria-label="Start multiplayer mode (coming soon)"
            className="cursor-pointer group relative rounded-3xl p-8 md:p-10 border border-white/10 bg-gradient-to-br from-amber-400/30 via-orange-500/10 to-pink-500/10 backdrop-blur-xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_50px_-5px_rgba(180,120,40,0.4)] overflow-hidden text-left transition transform hover:-translate-y-1 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-fuchsia-400/60"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_70%)]" />
            <div className="flex flex-col h-full relative z-10">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-white/10 text-white/70 border border-white/15 backdrop-blur">Beta</span>
                  <span className="text-xs text-white/40 font-medium">multiplayer</span>
                </div>
                <div className="w-full flex items-center justify-center mb-6">
                  <img src="/Multi.png" alt={t('multiplayer')} className="h-40 md:h-48 w-auto object-contain drop-shadow-[0_4px_18px_rgba(255,255,255,0.08)] transition-transform duration-500 group-hover:scale-110" />
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold mb-4 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent drop-shadow">
                  {t('multiplayer')}
                </h2>
                <p className="text-sm md:text-base leading-relaxed text-white/70 pr-2">
                  {t('playwithfriend')}
                </p>
              </div>
              <div className="mt-8 pt-4 flex items-center justify-between text-xs text-white/40 border-t border-white/10">
                <span className="inline-flex items-center gap-1">▶ <span className="opacity-70">15s clip</span></span>
                <span className="inline-flex items-center gap-1 group-hover:text-fuchsia-200 transition">Start <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7"/></svg></span>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-16 text-center text-white/40 text-sm max-w-md mx-auto animate-[fadeIn_1.2s_ease]">💡 {t('tip_invite_friend')}</p>
      </div>
      <style jsx global>{`
        @keyframes gridShift {0%{background-position:0 0;}100%{background-position:280px 280px;}}
        @keyframes fadeIn {from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:none;}}
      `}</style>
    </main>
  );
}
