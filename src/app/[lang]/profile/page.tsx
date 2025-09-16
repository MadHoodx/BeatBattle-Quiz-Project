
"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { getProfile } from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useLangHref } from "@/components/common/LangLink";
import { useI18n } from '@/context/I18nContext';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { t } = useI18n();
  // compute localized home href once (hooks must be used in the component body)
  const homeHref = useLangHref('/');

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then(setProfile).finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#070B1E] text-white px-4">
      <div className="w-full max-w-md bg-white/5 rounded-2xl p-8 shadow-xl border border-white/10">
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold mb-2">
            {profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="text-xl font-bold">{profile?.username || "-"}</div>
          <div className="text-white/70 text-sm">{user.email}</div>
        </div>
        <div className="mb-6">
          <div className="font-semibold">{t('casual_high_score')}</div>
          <div className="text-2xl text-purple-300 font-bold">{profile?.casual_high_score ?? '-'}</div>
        </div>
        <button
          className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 font-semibold text-lg hover:from-pink-600 hover:to-purple-600 transition"
          onClick={async () => { await signOut(); router.push(homeHref as string); }}
        >
          {t('logout')}
        </button>
      </div>
    </div>
  );
}
