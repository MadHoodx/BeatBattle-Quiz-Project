
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLangHref, computeLangHref } from "@/components/common/LangLink";
import { supabase } from "@/lib/supabase";
import { useI18n } from '@/context/I18nContext';

export default function AuthPage() {
  const { t, lang, availableLangs } = useI18n();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
  if (mode === 'signup') {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    // username setup page
    const usernameHref = computeLangHref("/profile/username", lang, availableLangs) as string;
    setTimeout(() => router.push(usernameHref), 500);
      } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setSuccess("Login success! Redirecting...");
    const homeHref = computeLangHref("/", lang, availableLangs) as string;
    setTimeout(() => router.push(homeHref), 1000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#070B1E] text-white px-4">
      <div className="w-full max-w-md bg-white/5 rounded-2xl p-8 shadow-xl border border-white/10">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {mode === 'login' ? t('login_beatbattle') : t('signup_beatbattle')}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm mb-1 text-white/70">{t('email')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-white/30"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm mb-1 text-white/70">{t('password') || 'Password'}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-white/30"
              placeholder="••••••••"
            />
          </div>
          {error && <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm">{error}</div>}
          {success && <div className="text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-sm">{success}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50"
          >
            {loading ? t('loading') : mode === 'login' ? t('login') : t('create_account')}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button
            className="text-purple-300 hover:underline text-sm"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? t('no_account') : t('already_have_account')}
          </button>
        </div>
      </div>
    </div>
  );
}
