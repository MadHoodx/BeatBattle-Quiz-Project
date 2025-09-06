
"use client";
import { useI18n } from '../../../frontend/context/I18nContext';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useLangHref } from '../../../frontend/components/common/LangLink';

function MusicNotesBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      {[...Array(16)].map((_, i) => (
        <span
          key={i}
          className="absolute text-3xl opacity-20 animate-float-note"
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
  );
}

export default function ModePage() {
  const { t } = useI18n();
  const router = useRouter();
  const categoryHref = useLangHref('/category');
  const modes = [
    {
      key: 'solo',
      title: t('solo'),
      desc: t('play_kdrama_ost'),
      color: 'from-[#23244a] via-[#393a6e] to-[#6c63ff]',
      ring: 'ring-4 ring-[#6c63ff]/40',
      onClick: () => router.push(categoryHref as string),
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
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#181a2a] via-[#23244a] to-[#181a2a] px-4 py-10 overflow-hidden">
      <MusicNotesBackground />
      <div className="z-10 w-full flex flex-col items-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-center mb-2 bg-gradient-to-r from-[#7c6cff] via-[#ffb84d] to-[#ff4d6d] bg-clip-text text-transparent drop-shadow-lg animate-fadein">
          {t('choose_mode')}
        </h1>
        <p className="text-lg text-white/80 mb-8 text-center animate-fadein-slow max-w-2xl">
          {t('choose_mode_desc')}
        </p>
        <div className="flex flex-col sm:flex-row gap-12 w-full max-w-5xl justify-center items-stretch animate-fadein-slow">
          {modes.map(mode => (
            <div
              key={mode.key}
              className={`group relative flex flex-col items-center rounded-3xl p-12 transition-all duration-300 cursor-pointer bg-gradient-to-br ${mode.color} ${mode.ring} hover:scale-105 shadow-2xl flex-1 min-w-[320px] max-w-[500px] min-h-[520px]`}
              onClick={mode.onClick}
            >
              <div className="flex items-center justify-center w-full mb-12">
                <img
                  src={mode.key === 'solo' ? '/Solo.png' : '/Multi.png'}
                  alt={mode.key === 'solo' ? 'Solo mode' : 'Multiplayer mode'}
                  className="transition-transform duration-300 group-hover:scale-[1.25] drop-shadow-xl"
                  style={{ width: 240, height: 240, objectFit: 'contain' }}
                />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white drop-shadow text-center">{mode.title}</h2>
              <p className="text-lg md:text-xl text-center text-white/90 mb-12">{mode.desc}</p>
              <span className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full text-base font-bold shadow ${mode.key === 'solo' ? 'bg-[#7c6cff]/90 text-white' : 'bg-[#ffb84d]/90 text-[#23244a]'}`}>{mode.title}</span>
            </div>
          ))}
        </div>
        <div className="mt-14 text-white/60 text-center animate-fadein-slow text-base md:text-lg">
          <span role="img" aria-label="tip">💡</span> {t('tip_invite_friend')}
        </div>
      </div>
      <style jsx global>{`
        @keyframes float-note {
          0% { transform: translateY(0) scale(1); opacity: 0.2; }
          50% { transform: translateY(-30px) scale(1.1); opacity: 0.4; }
          100% { transform: translateY(0) scale(1); opacity: 0.2; }
        }
        .animate-float-note {
          animation: float-note 4s ease-in-out infinite;
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
    </main>
  );
}
