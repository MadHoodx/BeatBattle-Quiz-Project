"use client";
import { useI18n } from '@/context/I18nContext';

export default function ContactPage() {
  const { t } = useI18n();
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#070a18] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#31265a_0%,transparent_60%),radial-gradient(circle_at_80%_30%,#3a1d52_0%,transparent_55%),linear-gradient(160deg,#0b0f1f,#090d18)]" />
      <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-10 py-20">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-fuchsia-50 to-pink-200 bg-clip-text text-transparent mb-6">{t('contact')}</h1>
        <div className="rounded-2xl bg-[#0f1724]/60 border border-white/6 p-6 text-white/80">
          <p className="mb-4">Have feedback or want to report a bug? Drop a quick message below or email us at <a className="text-fuchsia-300 underline" href="mailto:hello@beetbattle.example">hello@beetbattle.example</a>.</p>
          <form className="space-y-3">
            <input className="w-full rounded-md p-3 bg-[#0b1220] border border-white/6" placeholder="Your name" />
            <input className="w-full rounded-md p-3 bg-[#0b1220] border border-white/6" placeholder="Your email" />
            <textarea className="w-full rounded-md p-3 bg-[#0b1220] border border-white/6" rows={5} placeholder="Message" />
            <div className="flex items-center justify-end">
              <button type="button" className="px-4 py-2 rounded-md bg-fuchsia-500 text-black font-semibold">Send</button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
