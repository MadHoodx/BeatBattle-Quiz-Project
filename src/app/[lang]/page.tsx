"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLangHref } from "@/components/common/LangLink";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { getProfile } from "@/server/services/database/db";
import { useI18n } from '@/context/I18nContext';

const mockLeaderboard = [
  { username: "Jisoo", score: 10 },
  { username: "Minho", score: 9 },
  { username: "Somi", score: 8 },
  { username: "Taeyang", score: 7 },
  { username: "Yuna", score: 6 },
];

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState(mockLeaderboard);
  const [profile, setProfile] = useState<any>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (user) {
      getProfile(user.id).then(setProfile);
    }
  }, [user]);

  // TODO: fetch real leaderboard data here

  const { lang } = useI18n();
  const loginHref = useLangHref("/auth");
  const modeHref = useLangHref("/mode");
  const goToLogin = () => router.push(typeof loginHref === 'string' ? loginHref : `/${lang}/auth`);
  const goToMode = () => {
    console.log('goToMode', { modeHref, lang });
    router.push(typeof modeHref === 'string' ? modeHref : `/${lang}/mode`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#070B1E] text-white px-4 relative overflow-hidden">
      {/* Animated floating music notes background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            className={`absolute text-3xl opacity-30 animate-float-note`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              color: i % 3 === 0 ? '#7c6cff' : i % 3 === 1 ? '#ffb84d' : '#ff4d6d',
            }}
          >
            {i % 2 === 0 ? '🎵' : '🎶'}
          </span>
        ))}
      </div>
      {/* Logo & Title */}
      <header className="mb-8 flex flex-col items-center z-10 animate-fadein">
        <h1 className="text-5xl font-extrabold mt-4 bg-gradient-to-r from-[#7c6cff] via-[#ffb84d] to-[#ff4d6d] bg-clip-text text-transparent animate-gradient-move drop-shadow-lg">
          BeatBattle
        </h1>
        <p className="text-lg text-white/80 mt-3 text-center max-w-md animate-fadein-slow">
        {t('hero_desc')}
        </p>
      </header>

      {/* Main Action Buttons */}
      <div className="z-10 w-full max-w-xs animate-fadein-slow">
        {!user ? (
          <div className="flex flex-col gap-4 mb-8">
            <button
              className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-[#7c6cff] to-[#ff4d6d] font-bold text-xl shadow-xl hover:scale-105 hover:from-[#6c63ff] hover:to-[#ff4d6d] transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-[#7c6cff]"
              onClick={goToLogin}
            >
              {t('login_signup')}
            </button>
            <button
              className="w-full px-8 py-4 rounded-2xl bg-white/10 border border-white/20 text-white/90 font-semibold text-xl shadow-lg hover:bg-white/20 hover:text-white transition"
              onClick={goToMode}
            >
              {t('play_as_guest')}
            </button>
            <button
              className="w-full px-8 py-4 rounded-2xl bg-[#ffb84d]/90 text-[#23244a] font-bold text-xl shadow-lg hover:bg-[#ffb84d] hover:text-[#23244a] transition"
              onClick={goToMode}
            >
              {t('battle_friend')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="text-lg text-white/90 mb-2 animate-fadein">{t('welcome')}, {profile?.username || user.email}!</div>
            <button
              className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-[#7c6cff] to-[#ff4d6d] font-bold text-xl shadow-xl hover:scale-105 hover:from-[#6c63ff] hover:to-[#ff4d6d] transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-[#7c6cff]"
              onClick={goToMode}
            >
              {t('Play now')}
            </button>
            <button
              className="w-full px-8 py-4 rounded-2xl bg-[#ffb84d]/90 text-[#23244a] font-bold text-xl shadow-lg hover:bg-[#ffb84d] hover:text-[#23244a] transition"
              onClick={goToMode}
            >
              {t('battle_friend')}
            </button>
          </div>
        )}
      </div>

      {/* Leaderboard: show only if logged in */}
      {user && (
        <section className="w-full max-w-md mb-8 z-10 animate-fadein-slow">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="inline-block animate-bounce">🏆</span> {t('leaderboard')}
          </h2>
          <ul className="bg-white/5 rounded-xl divide-y divide-white/10 shadow-lg">
            {leaderboard.map((entry, idx) => (
              <li key={entry.username} className="flex justify-between items-center px-6 py-3">
                <span className="font-semibold flex items-center gap-2">
                  <span className={`inline-block w-6 h-6 rounded-full text-center font-bold text-white ${idx === 0 ? 'bg-[#ffd700] text-[#23244a]' : idx === 1 ? 'bg-[#b5baff]' : idx === 2 ? 'bg-[#ffb84d]' : 'bg-[#23244a]/60'}`}>{idx + 1}</span>
                  {entry.username}
                </span>
                <span className="font-bold text-[#7c6cff]">{entry.score}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-auto py-4 text-white/50 text-sm text-center w-full z-10 animate-fadein-slow">
        © 2025 <span className="font-bold text-[#7c6cff]">BeatBattle</span> | <a href="mailto:contact@beatbattle.com" className="underline hover:text-[#ff4d6d] transition">Contact</a>
      </footer>
      {/* Animations */}
      <style jsx global>{`
        @keyframes float-note {
          0% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-30px) scale(1.1); opacity: 0.5; }
          100% { transform: translateY(0) scale(1); opacity: 0.3; }
        }
        .animate-float-note {
          animation: float-note 4s ease-in-out infinite;
        }
        @keyframes gradient-move {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .animate-gradient-move {
          background-size: 200% 200%;
          animation: gradient-move 3s linear infinite alternate;
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fadein {
          animation: fadein 1s cubic-bezier(.4,0,.2,1) both;
        }
        .animate-fadein-slow {
          animation: fadein 1.6s cubic-bezier(.4,0,.2,1) both;
        }
      `}</style>
    </div>
  );
}
