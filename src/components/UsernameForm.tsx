"use client";
import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { updateProfile } from '@/lib/profile';
import { useI18n } from '@/context/I18nContext';

export default function UsernameForm() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useParams();
  const lang = (params && (params as any).lang) || 'en';
  const { t } = useI18n();
  const [username, setUsername] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const MAX_USERNAME = 30;
  const usernamePattern = /^[A-Za-z0-9_-]+$/;

  const submit = async () => {
    setError(null);
    if (!username || username.length < 3) { setError(t('username_too_short')); return; }
    if (username.length > MAX_USERNAME) { setError(t('username_too_long', { max: MAX_USERNAME })); return; }
    if (!usernamePattern.test(username)) { setError(t('username_invalid')); return; }
    if (!user?.id) { setError(t('must_be_logged_in') || 'Must be logged in'); return; }
    setLoading(true);
    try {
      const resp = await fetch('/api/profiles/upsert', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: user.id, username })
      });
      const js = await resp.json().catch(()=>({ success: false, error: 'invalid-json' }));
      if (resp.ok && js?.success) {
        router.push(`/${lang}`);
      } else {
        try {
          const fallback = await updateProfile(user.id, { username });
          if (fallback) { router.push(`/${lang}`); return; }
        } catch(_){ }
        setError(js?.error || t('save_failed'));
      }
    } catch (e) {
      setError(t('save_failed') || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0b1020] via-[#241033] to-[#341a3a] text-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-[#0f1724]/70 border border-white/6 rounded-2xl p-8">
  <h1 className="text-3xl font-bold mb-2">{t('set_username_title')}</h1>
  <p className="text-sm text-white/70 mb-6">{t('set_username_desc')}</p>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input value={username} onChange={e=>setUsername(e.target.value)} placeholder={t('username_placeholder')} className="flex-1 p-3 rounded bg-[#0b1220] border border-white/10" maxLength={MAX_USERNAME} />
            <div className="text-sm text-white/60">{username.length}/{MAX_USERNAME}</div>
          </div>
          {error && <div className="text-rose-400">{error}</div>}
          <div className="flex gap-3">
            <button onClick={submit} disabled={loading} className="px-4 py-2 rounded bg-fuchsia-500 text-black font-semibold">{loading ? t('loading') : t('save_and_home')}</button>
            <button onClick={()=>router.push(`/${lang}`)} className="px-4 py-2 rounded border border-white/10">{t('cancel')}</button>
          </div>
        </div>
      </div>
    </main>
  );
}
