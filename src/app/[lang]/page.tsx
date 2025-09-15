"use client";
import { useRouter } from "next/navigation";
import { useLangHref } from "@/components/common/LangLink";
import { useAuth } from "@/context/AuthContext";
import React, { useEffect, useState } from "react";
import { getProfile } from "@/lib/profile";
import { supabase } from '@/lib/supabase';
import { useI18n } from "@/context/I18nContext";
import { Hero } from "@/components/home/Hero";
import { LeaderboardPanel } from "@/components/home/LeaderboardPanel";
import { FooterDisclaimer } from "@/components/common/LegalDisclaimer";

// initial placeholder while fetching
const mockLeaderboard = [
  { username: "Loading...", score: 0 }
];

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [profile, setProfile] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState(mockLeaderboard);

  useEffect(() => { if (user) getProfile(user.id).then(setProfile); }, [user]);

  // Fetch real leaderboard (casual_high_score from profiles)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Only select columns we expect to exist in the DB to avoid 400 errors
        const resp = await supabase
          .from('profiles')
          .select('id, username, casual_high_score');

        // Supabase client may return error at resp.error
        const data = (resp as any).data;
        const error = (resp as any).error;

        if (error) {
          console.warn('Supabase returned error while fetching leaderboard:', error);
          // fallback to empty leaderboard
          if (!cancelled) setLeaderboard([]);
          return;
        }

        if (cancelled) return;

        const entries = (data || [])
          .filter((r: any) => r.casual_high_score && r.casual_high_score > 0)
          .sort((a: any, b: any) => b.casual_high_score - a.casual_high_score)
          .slice(0, 50)
          .map((r: any) => ({ username: r.username || 'User', score: r.casual_high_score || 0 }));

        setLeaderboard(entries);
      } catch (err) {
        console.error('Failed to load leaderboard — unexpected error:', err);
        if (!cancelled) setLeaderboard([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Ensure current user's profile appears in leaderboard list (even if not in top results)
  useEffect(() => {
  if (!profile) return;
  // If leaderboard hasn't loaded yet, skip
  if (!leaderboard || leaderboard.length === 0) return;

  const currentName = profile.username || user?.email || 'User';
  const exists = leaderboard.some((e: any) => e.username === currentName);
  if (!exists) {
    const userEntry = { username: currentName, score: profile.casual_high_score || 0 };
    const merged = [...leaderboard.filter((e:any)=> e.username !== 'Loading...'), userEntry]
      .sort((a,b)=> b.score - a.score);
    setLeaderboard(merged);
  }
  }, [profile, leaderboard]);

  const loginHref = useLangHref("/auth");
  const modeHref = useLangHref("/mode");
  const goLogin = () => router.push(typeof loginHref === 'string' ? loginHref : `/${lang}/auth`);
  const goMode = () => router.push(typeof modeHref === 'string' ? modeHref : `/${lang}/mode`);
  const goHardcore = () => router.push(typeof modeHref === 'string' ? `${modeHref}?difficulty=hardcore` : `/${lang}/mode?difficulty=hardcore`);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#070a18] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#31265a_0%,transparent_60%),radial-gradient(circle_at_80%_30%,#3a1d52_0%,transparent_55%),linear-gradient(160deg,#0b0f1f,#090d18)]" />
      <div className="absolute inset-0 opacity-[0.15] mix-blend-screen" style={{backgroundImage:'url(/noise.png),linear-gradient(90deg,transparent,#ffffff08 50%,transparent)',backgroundSize:'300px 300px, 400% 100%', animation:'shift 18s linear infinite'}} />
      <Hero
        onPrimary={user ? goMode : goLogin}
        onSecondary={goMode}
        onTertiary={goHardcore}
        showAltCta={true}
        loggedIn={!!user}
      >
        <div className="w-full flex justify-center">
          <div className="w-full max-w-3xl">
            <LeaderboardPanel entries={leaderboard} loggedIn={!!user} currentUsername={profile?.username} />
          </div>
        </div>
      </Hero>
      
      {/* Legal Disclaimer Section */}
      <FooterDisclaimer />
      
      <style jsx global>{`
        @keyframes shift {0%{background-position:0 0,0 0;}100%{background-position:0 0,400% 0;}}
      `}</style>
    </main>
  );
}


