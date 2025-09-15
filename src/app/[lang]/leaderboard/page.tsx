"use server";
import React from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { LeaderboardPanel } from '@/components/home/LeaderboardPanel';

export default async function LeaderboardPage({ params }: { params: { lang: string } }) {
  // Attempt to use the service-role client so we can query the full profiles table reliably.
  let entries: Array<{ username: string; score: number }> = [];
  try {
    const supabaseAdmin = getSupabaseClient(true);
    const resp = await supabaseAdmin
      .from('profiles')
      .select('username, casual_high_score')
      .gt('casual_high_score', 0)
      .order('casual_high_score', { ascending: false })
      .limit(100);

    if ((resp as any).error) {
      console.warn('Leaderboard query returned error:', (resp as any).error);
    } else {
      const data = (resp as any).data || [];
      entries = data.map((r: any) => ({ username: r.username || 'User', score: r.casual_high_score || 0 }));
    }
  } catch (err) {
    // If there's no service role in this environment, fall back to empty list and render UI with a helpful note.
    console.warn('Unable to fetch leaderboard server-side (service role client may be missing):', err);
    entries = [];
  }

  // Render a themed page similar to Home but dedicated to the leaderboard
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#070a18] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#31265a_0%,transparent_60%),radial-gradient(circle_at_80%_30%,#3a1d52_0%,transparent_55%),linear-gradient(160deg,#0b0f1f,#090d18)]" />
      <div className="absolute inset-0 opacity-[0.15] mix-blend-screen" style={{backgroundImage:'url(/noise.png),linear-gradient(90deg,transparent,#ffffff08 50%,transparent)',backgroundSize:'300px 300px, 400% 100%', animation:'shift 18s linear infinite'}} />
      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-10 py-16">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-fuchsia-50 to-pink-200 bg-clip-text text-transparent mb-6">Leaderboard</h1>
        <p className="text-sm text-white/60 mb-8">Top casual high scores — friendly competition. Sign in to appear here.</p>

        <div className="w-full bg-transparent">
          <LeaderboardPanel entries={entries} loggedIn={false} />
        </div>
      </div>

      {/* Keyframes are provided globally in the app styles; avoid styled-jsx in server components */}
    </main>
  );
}

