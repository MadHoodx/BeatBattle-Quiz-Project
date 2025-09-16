"use client";
import { useI18n } from '@/context/I18nContext';

export default function HowtoPage() {
  const { t } = useI18n();
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#070a18] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#31265a_0%,transparent_60%),radial-gradient(circle_at_80%_30%,#3a1d52_0%,transparent_55%),linear-gradient(160deg,#0b0f1f,#090d18)]" />
      <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 py-20">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-fuchsia-50 to-pink-200 bg-clip-text text-transparent mb-6">{t('howto')}</h1>
        <div className="rounded-2xl bg-[#0f1724]/60 border border-white/6 p-6 text-white/80 space-y-4">
          <ol className="list-decimal list-inside space-y-2">
            <li>Choose a mode: Solo or Multiplayer (create a room).</li>
            <li>Each question plays a short song clip — pick the correct artist or title.</li>
            <li>Points depend on speed and correctness. Casual high scores are saved to your profile.</li>
            <li>In multiplayer, one player (host) starts rounds; others join and answer in real time.</li>
          </ol>
          <p className="text-sm text-white/60">Tip: allow third-party cookies for the YouTube player to behave reliably in some browsers.</p>
        </div>
      </div>
    </main>
  );
}
