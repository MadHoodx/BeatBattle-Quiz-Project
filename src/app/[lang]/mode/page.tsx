
"use client";
import { useI18n } from '../../../frontend/context/I18nContext';

export default function ModePage() {
  const { t } = useI18n();
  const modes = [
    {
      key: 'solo',
      title: t('solo'),
      desc: t('play_kdrama_ost'),
      icon: '�',
      color: 'from-[#23244a] via-[#393a6e] to-[#6c63ff]',
      ring: 'ring-4 ring-[#6c63ff]/40',
      onClick: () => window.location.assign('../quiz'),
    },
    {
      key: 'multiplayer',
      title: t('multiplayer'),
      desc: t('playwithfriend'),
      icon: '👫',
      color: 'from-[#23244a] via-[#393a6e] to-[#ffb84d]',
      ring: 'ring-4 ring-[#ffb84d]/40',
      onClick: () => alert('Coming soon!'),
    },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#181a2a] via-[#23244a] to-[#181a2a] px-4 py-10">
      <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#7c6cff] to-[#ffb84d] drop-shadow mb-2 animate-fadein">
        {t('mode')}
      </h1>
      <p className="text-lg text-[#b5baff] mb-8 animate-fadein-slow">{t('selectcategory')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-2xl">
        {modes.map(mode => (
          <div
            key={mode.key}
            className={`relative flex flex-col items-center rounded-3xl p-8 transition-all duration-300 cursor-pointer bg-gradient-to-br ${mode.color} ${mode.ring} hover:scale-105 shadow-2xl`}
            style={{ minHeight: 220 }}
            onClick={mode.onClick}
          >
            <div className="absolute top-4 right-4 text-3xl animate-bounce-x">
              {mode.icon}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white drop-shadow">{mode.title}</h2>
            <p className="text-base md:text-lg text-center text-white/90">{mode.desc}</p>
            {mode.key === 'solo' && (
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#7c6cff]/90 text-white font-bold px-4 py-1 rounded-full text-xs shadow animate-fadein-slow">{t('solo')}</span>
            )}
            {mode.key === 'multiplayer' && (
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#ffb84d]/90 text-[#23244a] font-bold px-4 py-1 rounded-full text-xs shadow animate-fadein-slow">{t('multiplayer')}</span>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
