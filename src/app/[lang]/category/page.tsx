
"use client";
import { useRouter, useParams } from "next/navigation";
import { useI18n } from "@/context/I18nContext";
import { useMemo } from "react";

const categories = [
  {
    key: "all",
    label: "All OSTs",
    emoji: "🎵",
    gradient: "from-[#7c6cff] via-[#393a6e] to-[#23244a]",
    ring: "ring-4 ring-[#7c6cff]/40",
    desc: "All K-Drama OSTs in one challenge!",
  },
  {
    key: "romance",
    label: "Romance",
    emoji: "💖",
    gradient: "from-[#ffb84d] via-[#ff6f91] to-[#23244a]",
    ring: "ring-4 ring-[#ffb84d]/40",
    desc: "Heart-fluttering love songs from top dramas.",
  },
  {
    key: "action",
    label: "Action",
    emoji: "⚡",
    gradient: "from-[#6c63ff] via-[#23244a] to-[#ffb84d]",
    ring: "ring-4 ring-[#6c63ff]/40",
    desc: "Epic and intense OSTs for thrill seekers!",
  },
  {
    key: "classic",
    label: "Classic",
    emoji: "🌟",
    gradient: "from-[#393a6e] via-[#7c6cff] to-[#ffb84d]",
    ring: "ring-4 ring-[#393a6e]/40",
    desc: "Legendary OSTs everyone should know.",
  },
];

export default function CategoryPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const lang = params?.lang || "en";

  // Memoize for performance
  const catList = useMemo(() => categories, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#181a2a] via-[#23244a] to-[#181a2a] px-4 py-10">
      <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#7c6cff] to-[#ffb84d] drop-shadow mb-2 animate-fadein">
        {t("selectcategory")}
      </h1>
      <p className="text-lg text-[#b5baff] mb-8 animate-fadein-slow">
        {t("choose_category_desc") || "Pick your vibe!"}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-5xl mt-6 auto-rows-fr">
        {catList.map((cat) => (
          <button
            key={cat.key}
            className={`relative flex flex-col items-center rounded-2xl p-6 transition-all duration-300 cursor-pointer bg-gradient-to-br ${cat.gradient} ${cat.ring} hover:scale-[1.035] hover:shadow-[0_4px_24px_0_rgba(124,108,255,0.18)] shadow-xl focus:outline-none focus:ring-2 focus:ring-[#ffb84d] group min-h-[200px] min-w-[180px]`}
            onClick={() => router.push(useLangHref(`/quiz?category=${cat.key}`) as string)}
            aria-label={cat.label}
            style={{}}
          >
            {/* Floating emoji badge */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
              <span className="inline-flex items-center justify-center text-3xl md:text-4xl drop-shadow bg-white/10 rounded-full w-12 h-12 border-2 border-white/20 group-hover:scale-110 transition-transform duration-300">
                {cat.emoji}
              </span>
            </div>
            <div className="flex-1 flex flex-col justify-end items-center pt-10 w-full">
              <h2 className="text-xl md:text-2xl font-extrabold mb-2 text-white drop-shadow text-center tracking-tight">
                {cat.label}
              </h2>
              <p className="text-sm md:text-base text-center text-white/90 mb-4 max-w-xs mx-auto leading-relaxed">
                {cat.desc}
              </p>
            </div>
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#7c6cff] to-[#ffb84d] text-white font-bold px-5 py-1.5 rounded-full text-xs shadow-md animate-fadein-slow border group-hover:scale-105 transition-transform duration-300">
              {cat.label}
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}
