"use client";
import { useI18n } from '@/context/I18nContext';

export default function AboutPage() {
  const { t } = useI18n();
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#070a18] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#31265a_0%,transparent_60%),radial-gradient(circle_at_80%_30%,#3a1d52_0%,transparent_55%),linear-gradient(160deg,#0b0f1f,#090d18)]" />
      <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 py-20">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-fuchsia-50 to-pink-200 bg-clip-text text-transparent mb-6">{t('about')}</h1>
        <div className="rounded-2xl bg-[#0f1724]/60 border border-white/6 p-6 text-white/80">
          <p className="mb-4">BeatBattle is a lightweight music-quiz game that lets you guess songs from short YouTube clips. Play solo or join friends for realtime rounds (coming soon!).</p>
          <p className="mb-2">We source songs via YouTube playlists and store lightweight metadata in Supabase for quick quizzes and leaderboards.</p>
          <p className="text-sm text-white/60">Built with Next.js, Supabase, and love. </p>
        </div>
      </div>
    </main>
  );
}
