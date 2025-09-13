"use client";
import { useRouter } from "next/navigation";
import { useLangHref } from "@/components/common/LangLink";
import { useAuth } from "@/context/AuthContext";
import React, { useEffect, useState } from "react";
import { getProfile } from "@/lib/profile";
import { useI18n } from "@/context/I18nContext";
import { Hero } from "@/components/home/Hero";
import { LeaderboardPanel } from "@/components/home/LeaderboardPanel";
import { FooterDisclaimer } from "@/components/common/LegalDisclaimer";

const mockLeaderboard = [
  { username: "Jisoo", score: 10 },
  { username: "Minho", score: 9 },
  { username: "Somi", score: 8 },
  { username: "Taeyang", score: 7 },
  { username: "Yuna", score: 6 }
];

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [profile, setProfile] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState(mockLeaderboard);

  useEffect(() => { if (user) getProfile(user.id).then(setProfile); }, [user]);

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
            <LeaderboardPanel entries={leaderboard} loggedIn={!!user} />
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


