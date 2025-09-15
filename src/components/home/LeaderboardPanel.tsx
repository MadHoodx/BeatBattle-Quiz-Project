"use client";
import { useI18n } from "@/context/I18nContext";
import React from "react";

// A leaderboard entry. _prevRank/_prevScore are optional previous snapshot values
// used for micro‑interaction (rank change indicators & animations).
interface Entry { username: string; score: number; avatarUrl?: string; country?: string; _prevScore?: number; _prevRank?: number; }

interface LeaderboardPanelProps { entries: Entry[]; loggedIn: boolean; currentUsername?: string }

// Professional global-style leaderboard with podium + filters
export function LeaderboardPanel({ entries, loggedIn, currentUsername }: LeaderboardPanelProps) {
  const { t } = useI18n();
  const [period, setPeriod] = React.useState<'day' | 'week' | 'all'>('day');
  // Always sort by score desc
  const sorted = [...entries].sort((a,b) => b.score - a.score);
  const filtered = sorted;
  const top = filtered.slice(0,3);
  const rest = filtered.slice(3);
  const topScore = Math.max(...filtered.map(e=>e.score),1);
  // Only highlight if currentUsername exists in the entries list
  const highlightUser = currentUsername && filtered.find(e => e.username === currentUsername) ? currentUsername : undefined;
  return (
    <section aria-labelledby="leaderboard-heading" className="relative rounded-3xl border border-white/10 bg-[#101523]/80 backdrop-blur-xl px-6 md:px-10 pt-7 pb-10 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.65)] overflow-hidden">
      <BackgroundFX />
      <header className="relative z-10 flex flex-wrap items-center gap-5 mb-8">
        <div className="flex items-center gap-3 min-w-[190px]">
          <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 via-pink-400 to-fuchsia-500 flex items-center justify-center text-xl font-black text-[#1B1535] shadow-lg ring-2 ring-white/20">
            🏆
            <span className="absolute inset-0 rounded-2xl ring-1 ring-white/30 pointer-events-none" />
          </div>
          <div>
            <h2 id="leaderboard-heading" className="text-lg md:text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-fuchsia-50 to-pink-200 bg-clip-text text-transparent">{t('leaderboard')}</h2>
            {!loggedIn && <p className="text-[0.65rem] md:text-xs text-white/50 mt-1">Login to appear here.</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <PeriodSelect period={period} onChange={setPeriod} />
        </div>
      </header>
      <Podium entries={top} />
      <RankList entries={rest} topScore={topScore} highlightUser={highlightUser} />
    </section>
  );
}

// Background decorative layers (subtle)
function BackgroundFX() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,160,255,0.15),transparent_60%),radial-gradient(circle_at_85%_75%,rgba(120,160,255,0.15),transparent_65%)]" />
      <div className="absolute inset-0 opacity-60 mix-blend-overlay bg-[linear-gradient(120deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_55%)] animate-[panelSheen_7s_linear_infinite]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(10,12,26,0.4),rgba(10,12,26,0.85))]" />
      <style jsx>{`
        @keyframes panelSheen {0%{transform:translateX(-60%);}100%{transform:translateX(120%);}}
      `}</style>
    </div>
  );
}

function ScopeToggle({ scope, onChange }: { scope:'global'|'friends'; onChange:(s:any)=>void }) {
  return (
    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 text-[0.6rem] font-semibold uppercase tracking-wide">
      {['global','friends'].map(s => (
        <button key={s} onClick={()=>onChange(s)} className={`px-3 py-1 rounded-lg transition ${scope===s? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow':'text-white/55 hover:text-white/80'}`}>{s}</button>
      ))}
    </div>
  );
}

function PeriodSelect({ period, onChange }: { period:'day'|'week'|'all'; onChange:(p:any)=>void }) {
  return (
    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 text-[0.6rem] font-semibold uppercase tracking-wide">
      {['day','week','all'].map(p => (
        <button key={p} onClick={()=>onChange(p)} className={`px-2.5 py-1 rounded-lg transition ${period===p? 'bg-white/15 text-white':'text-white/45 hover:text-white/75'}`}>{p}</button>
      ))}
    </div>
  );
}

function SortToggle({ sort, onChange }: { sort:'score'|'name'; onChange:(s:any)=>void }) {
  return (
    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 text-[0.6rem] font-semibold uppercase tracking-wide">
      {['score','name'].map(s => (
        <button key={s} onClick={()=>onChange(s)} className={`px-2.5 py-1 rounded-lg transition ${sort===s? 'bg-white/15 text-white':'text-white/45 hover:text-white/75'}`}>{s}</button>
      ))}
    </div>
  );
}

function Podium({ entries }: { entries: Entry[] }) {
  if (!entries.length) return null;
  // reorder to center 1st, left 2nd, right 3rd visually
  const podiumOrder = [entries[1], entries[0], entries[2]].filter(Boolean);
  return (
    <div className="relative grid grid-cols-3 gap-4 mb-8 max-w-xl mx-auto">
      {podiumOrder.map((e, idx) => {
        // Compute the real place by looking up the entry's index in the original entries array.
        // This ensures a single entry will be place 1 (instead of mapping by the visual slot index).
        const place = entries.indexOf(e) + 1;
        const height = place===1? 'h-40': place===2?'h-32':'h-28';
        const gradient = place===1? 'from-amber-400 via-pink-400 to-fuchsia-500': place===2? 'from-slate-300 via-slate-400 to-slate-600':'from-amber-700 via-amber-600 to-amber-500';
        return (
          <div key={e.username} className={`relative flex flex-col items-center justify-end ${height} rounded-2xl bg-white/3 backdrop-blur-sm pt-4 pb-3 overflow-hidden group`}>            
            <div className={`absolute inset-0 bg-gradient-to-t ${place===1? 'from-fuchsia-500/10 via-transparent':'from-white/5 to-transparent'} opacity-60`} />
            <Avatar name={e.username} size={place===1?70:56} highlight={place===1} />
            <div className="mt-2 flex flex-col items-center gap-1">
              <span className="text-xs font-medium text-white/70 group-hover:text-white transition truncate max-w-[90%]">{e.username}</span>
              <span className={`text-[0.55rem] px-2 py-0.5 rounded-full bg-gradient-to-r ${gradient} text-[#1B1535] font-semibold tracking-wider shadow`}>#{place}</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition" />
          </div>
        );
      })}
    </div>
  );
}

function RankList({ entries, topScore, highlightUser }: { entries: Entry[]; topScore:number; highlightUser?: string }) {
  if (!entries.length) return <div className="text-center text-xs text-white/40">No more players.</div>;
  return (
    <ol className="space-y-1" start={4}>
      {entries.map((e, i) => {
        const rank = i + 4;
        const pct = Math.min(100, (e.score/topScore)*100);
        const highlight = !!(highlightUser && e.username === highlightUser);
        const direction: 'up' | 'down' | 'same' = typeof e._prevRank === 'number'
          ? (e._prevRank > rank ? 'up' : e._prevRank < rank ? 'down' : 'same')
          : 'same';
        const rowAnimation = direction === 'same' ? 'animate-[fadeInRow_.5s_ease]' : 'animate-[rowFlash_1.2s_ease]';
        return (
          <li key={e.username} className={`relative group flex items-center gap-4 rounded-2xl px-3 py-3 overflow-hidden border border-white/5 hover:border-white/15 transition ${highlight? 'ring-2 ring-fuchsia-400/40':''} ${rowAnimation}`}>
            <div className="absolute inset-0 bg-[linear-gradient(95deg,rgba(255,255,255,0.08),rgba(255,255,255,0)_65%)] opacity-0 group-hover:opacity-100 transition" />
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[0.7rem] font-bold text-white/70 group-hover:text-white">{rank}</div>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Avatar name={e.username} size={40} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-white/80 group-hover:text-white">{e.username}</span>
                  {highlight && <span className="text-[0.55rem] px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-200 font-semibold tracking-wider">YOU</span>}
                  {direction !== 'same' && (
                    <span className={`text-[0.55rem] px-1 py-0.5 rounded-md font-semibold tracking-wider flex items-center gap-0.5 ${direction==='up'?'bg-emerald-400/20 text-emerald-300':'bg-rose-400/20 text-rose-300'}`}
                      title={`Rank ${direction==='up' ? 'improved' : 'dropped'} from ${e._prevRank}`}
                      aria-label={`Rank ${direction==='up' ? 'up' : 'down'} from ${e._prevRank}`}
                    >{direction==='up'?'▲':'▼'}</span>
                  )}
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-fuchsia-400 via-pink-400 to-violet-400 transition-[width] duration-700 ease-out" style={{width:`${pct}%`}} />
                </div>
              </div>
            </div>
            <div className="ms-auto text-sm font-bold num-tabular bg-gradient-to-r from-fuchsia-300 to-pink-200 bg-clip-text text-transparent drop-shadow">{e.score}</div>
          </li>
        );
      })}
      <style jsx>{`
        @keyframes fadeInRow { from { opacity:0; transform:translateY(4px);} to { opacity:1; transform:translateY(0);} }
        @keyframes rowFlash { 0% { box-shadow:0 0 0 0 rgba(236,72,153,0.0); background:rgba(236,72,153,0.08);} 40% { box-shadow:0 0 0 0 rgba(236,72,153,0.0); background:rgba(236,72,153,0.18);} 100% { box-shadow:0 0 0 0 rgba(236,72,153,0.0); background:transparent;} }
      `}</style>
    </ol>
  );
}

function Avatar({ name, size=48, highlight=false }: { name:string; size?:number; highlight?:boolean }) {
  const initial = name.charAt(0).toUpperCase();
  const palette = [
    'from-fuchsia-500 to-pink-500',
    'from-indigo-500 to-violet-600',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-sky-500 to-cyan-400'
  ];
  const idx = initial.charCodeAt(0) % palette.length;
  return (
    <div className={`relative shrink-0 rounded-xl bg-gradient-to-br ${palette[idx]} flex items-center justify-center text-white font-bold text-sm shadow-lg ${highlight? 'ring-2 ring-amber-300/60':'ring-1 ring-white/20'}`} style={{width:size, height:size}}>
      {initial}
      {highlight && <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-300/40 to-pink-300/30 blur-sm animate-pulse" />}
    </div>
  );
}

