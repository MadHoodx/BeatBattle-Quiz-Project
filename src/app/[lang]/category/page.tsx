
"use client";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useI18n } from "@/context/I18nContext";
import { useMemo, useCallback } from "react";
import { useLangHref } from "@/components/common/LangLink";

interface Category {
  key: string;
  label: string;
  emoji: string;
  gradient: string;
  ring: string;
  desc: string;
}

const categories: Category[] = [
  { key: "kpop",    label: "K-Pop",     emoji: "KR", gradient: "from-violet-500/35 via-fuchsia-500/10 to-indigo-700/20", ring:"ring-violet-400/35", desc: "Korean pop hits from BTS, BLACKPINK & more!" },
  { key: "jpop",    label: "J-Pop",     emoji: "JP", gradient: "from-rose-400/40 via-pink-500/15 to-violet-700/20",   ring:"ring-rose-300/40",    desc: "Japanese pop from YOASOBI, Official髭男dism!" },
  { key: "thai",    label: "Thai Pop",  emoji: "TH", gradient: "from-amber-300/40 via-indigo-600/20 to-fuchsia-600/20", ring:"ring-amber-300/40", desc: "Thai pop hits and classics!" },
  { key: "western", label: "Pop Hits",  emoji: "US", gradient: "from-indigo-400/40 via-violet-600/20 to-amber-500/25", ring:"ring-indigo-300/40",  desc: "Top Western pop from Taylor Swift, Dua Lipa!" },
  { key: "indie",   label: "Indie Rock", emoji: "🎸", gradient: "from-emerald-400/40 via-teal-500/15 to-cyan-600/20", ring:"ring-emerald-300/40", desc: "Independent & alternative music vibes!" },
  { key: "rock",    label: "Rock/Metal", emoji: "🤘", gradient: "from-red-400/40 via-orange-500/15 to-yellow-600/20", ring:"ring-red-300/40", desc: "Heavy rock and metal classics!" },
];

function Atmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#31265a_0%,transparent_60%),radial-gradient(circle_at_80%_30%,#3a1d52_0%,transparent_55%),linear-gradient(160deg,#0b0f1f,#090d18)]" />
      <div className="absolute inset-0 opacity-[0.15] mix-blend-screen" style={{backgroundImage:'url(/noise.png),linear-gradient(90deg,transparent,#ffffff08 50%,transparent)',backgroundSize:'300px 300px, 400% 100%', animation:'shift 18s linear infinite'}} />
    </div>
  );
}

function CategoryCard({ cat, onClick, delay }: { cat: Category; onClick:()=>void; delay:number }) {
  return (
    <button
      onClick={onClick}
  className={`group relative overflow-hidden rounded-3xl px-7 pt-10 pb-7 flex flex-col items-center border border-white/12 bg-gradient-to-br ${cat.gradient} backdrop-blur-xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.55)] hover:shadow-[0_15px_55px_-5px_rgba(120,60,255,0.55)] transition transform hover:-translate-y-1 active:scale-[0.985] min-h-[300px] animate-[fadeInUp_.7s_cubic-bezier(.4,.8,.3,1)]`}
      style={{animationDelay:`${delay}ms`}}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.18),transparent_70%)]" />
  {/* Elevated icon capsule (ensure no clipping) */}
  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 h-20 w-20 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/15 shadow-lg group-hover:scale-110 transition text-3xl ring-2 ${cat.ring}`}>
        <span className="relative z-10">{cat.emoji}</span>
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition" />
      </div>
  <div className="pt-12 flex-1 flex flex-col items-center text-center w-full">
        <h2 className="text-[1.35rem] md:text-2xl font-bold mb-3 bg-gradient-to-r from-white via-white/85 to-white/60 bg-clip-text text-transparent drop-shadow-sm tracking-tight">
          {cat.label}
        </h2>
        <p className="text-xs md:text-sm text-white/65 leading-relaxed max-w-xs mx-auto">
          {cat.desc}
        </p>
      </div>
      <div className="mt-4 flex flex-col items-center gap-3 w-full">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/40">
          <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 font-semibold group-hover:text-white/75 transition">OST</span>
          <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 font-semibold group-hover:text-white/75 transition">Quiz</span>
        </div>
        <span className="relative inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-violet-500 text-[11px] font-bold tracking-wider uppercase text-[#18152e] shadow-lg shadow-fuchsia-500/30 group-hover:shadow-pink-500/40 group-hover:scale-105 transition overflow-hidden">
          <span className="relative z-10">Start</span>
          <svg className="w-3.5 h-3.5 relative z-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7"/></svg>
          <span className="absolute inset-0 bg-[linear-gradient(95deg,rgba(255,255,255,0),rgba(255,255,255,0.6)_50%,rgba(255,255,255,0))] opacity-0 group-hover:opacity-60 animate-[cardSheen_2.4s_linear_infinite]" />
        </span>
      </div>
    </button>
  );
}

export default function CategoryPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const difficulty = (searchParams?.get('difficulty') === 'hardcore') ? 'hardcore' : 'casual';
  const params = useParams<{ lang: string }>();
  const currentLang = params?.lang || lang || "en";

  // Memoize for performance
  const catList = useMemo(() => categories, []);

  const goQuiz = useCallback((key: string) => {
    // preserve current lang and difficulty - build URL manually instead of using hook
    const href = `/${currentLang}/quiz?category=${key}&difficulty=${difficulty}`;
    router.push(href);
  }, [router, difficulty, currentLang]);

  return (
  <main className="relative min-h-screen w-full overflow-hidden px-5 py-24 md:py-28 bg-[#070a18] text-white">
      <Atmosphere />
      <div className="relative mx-auto max-w-7xl">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-white/5 border border-white/10 text-white/60 backdrop-blur animate-[fadeIn_.9s_ease]">{difficulty==='hardcore' ? 'Hardcore' : 'Casual'} Mode</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-fuchsia-200 to-amber-200 bg-clip-text text-transparent drop-shadow animate-[fadeIn_.8s_ease]">
            {t("selectcategory")}
          </h1>
          <p className="mt-4 text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed animate-[fadeIn_1s_ease]">
            {t("choose_category_desc") || "Pick your vibe!"}
          </p>
        </div>
        <div className="grid gap-8 md:gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {catList.map((cat,i) => (
            <CategoryCard key={cat.key} cat={cat} delay={i*80} onClick={() => goQuiz(cat.key)} />
          ))}
        </div>
      </div>
      <style jsx global>{`
        @keyframes fadeIn {from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:none;}}
        @keyframes fadeInUp {from{opacity:0;transform:translateY(26px);}to{opacity:1;transform:translateY(0);}}
        @keyframes gridShift {0%{background-position:0 0;}100%{background-position:320px 320px;}}
        @keyframes cardSheen {0%{transform:translateX(-120%);}100%{transform:translateX(120%);}}
      `}</style>
    </main>
  );
}
