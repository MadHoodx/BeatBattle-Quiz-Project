
"use client";
import { useI18n } from '../../../frontend/context/I18nContext';
import React from 'react';

export default function ModePage() {
  const { t } = useI18n();
  const modes = [
    {
      key: 'solo',
      title: t('solo'),
      desc: t('play_kdrama_ost'),
      color: 'from-[#23244a] via-[#393a6e] to-[#6c63ff]',
      ring: 'ring-4 ring-[#6c63ff]/40',
      onClick: () => window.location.assign(`[lang]../../category`),
      icon: (
        <img
          src="/Solo.png"
          alt="Solo mode"
          className="transition-transform duration-300 group-hover:scale-125"
          style={{ width: 90, height: 90, objectFit: 'contain' }}
        />
      ),
    },
    {
      key: 'multiplayer',
      title: t('multiplayer'),
      desc: t('playwithfriend'),
      color: 'from-[#23244a] via-[#393a6e] to-[#ffb84d]',
      ring: 'ring-4 ring-[#ffb84d]/40',
      onClick: () => alert('Coming soon!'),
      icon: (
        <img
          src="/Multi.png"
          alt="Multiplayer mode"
          className="transition-transform duration-300 group-hover:scale-125"
          style={{ width: 90, height: 90, objectFit: 'contain' }}
        />
      ),
    },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#181a2a] via-[#23244a] to-[#181a2a] px-4 py-10">
      <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#7c6cff] to-[#ffb84d] drop-shadow mb-2 animate-fadein">
        {t('mode')}
      </h1>
      <p className="text-lg text-[#b5baff] mb-8 animate-fadein-slow">{t('selectcategory')}</p>
      <div className="flex flex-col sm:flex-row gap-12 w-full max-w-5xl justify-center items-stretch">
        {modes.map(mode => (
          <div
            key={mode.key}
            className={`group relative flex flex-col items-center rounded-3xl p-12 transition-all duration-300 cursor-pointer bg-gradient-to-br ${mode.color} ${mode.ring} hover:scale-105 shadow-2xl flex-1 min-w-[320px] max-w-[500px] min-h-[520px]`}
            onClick={mode.onClick}
            style={{}}
          >
            <div className="flex items-center justify-center w-full mb-12">
              <img
                src={mode.key === 'solo' ? '/Solo.png' : '/Multi.png'}
                alt={mode.key === 'solo' ? 'Solo mode' : 'Multiplayer mode'}
                className="transition-transform duration-300 group-hover:scale-[1.25]"
                style={{ width: 240, height: 240, objectFit: 'contain' }}
              />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white drop-shadow text-center">{mode.title}</h2>
            <p className="text-lg md:text-xl text-center text-white/90 mb-12">{mode.desc}</p>
            <span className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full text-base font-bold shadow ${mode.key === 'solo' ? 'bg-[#7c6cff]/90 text-white' : 'bg-[#ffb84d]/90 text-[#23244a]'}`}>{mode.title}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
