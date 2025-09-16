"use client";
import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import YouTubeAudioPlayer from '@/components/audio/YouTubeAudioPlayer';
import { useI18n } from '@/context/I18nContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function RoomPage() {
  const { t } = useI18n();
  // useParams unwraps dynamic params in client components
  const params = useParams() as { roomId?: string };
  const roomId = params?.roomId ?? '';
  const [questions, setQuestions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [players, setPlayers] = React.useState<Array<{id:string; username:string}>>([]);
  const [isHost, setIsHost] = React.useState(false);
  const [currentPlaying, setCurrentPlaying] = React.useState<number | null>(null);
  const { user } = useAuth();

  React.useEffect(()=>{
    let cancelled = false;
    (async ()=>{
      try {
        // First try to fetch persisted room data
        try {
          const roomRes = await fetch(`/api/rooms/${roomId}`);
          const roomJson = await roomRes.json();
          if (roomJson?.success && roomJson.room) {
            setQuestions(roomJson.room.questions || []);
          } else {
            // Try to load from sessionStorage (host just created)
            const cached = sessionStorage.getItem(`room:${roomId}:questions`);
            if (cached) {
              const parsed = JSON.parse(cached);
              setQuestions(parsed || []);
            } else {
              // Fallback: call server to create a transient set (non-persistent)
              const res = await fetch('/api/rooms', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ roomId, num:5 }) });
              const json = await res.json();
              if (json?.success) setQuestions(json.questions || []);
            }
          }
        } catch (err) {
          // If any error, fallback to sessionStorage/POST
          const cached = sessionStorage.getItem(`room:${roomId}:questions`);
          if (cached) {
            const parsed = JSON.parse(cached);
            setQuestions(parsed || []);
          } else {
            const res = await fetch('/api/rooms', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ roomId, num:5 }) });
            const json = await res.json();
            if (json?.success) setQuestions(json.questions || []);
          }
        }

        // Join Supabase channel for realtime events
        const channel = supabase.channel(`room:${roomId}`);

        channel.on('broadcast', { event: 'join' }, (payload) => {
          setPlayers(prev => {
            const exists = prev.find(p=>p.id===payload.userId);
            if (exists) return prev;
            return [...prev, { id: payload.userId, username: payload.username }];
          });
        });

        channel.on('broadcast', { event: 'host_start' }, (payload) => {
          // payload: { questionIndex, serverTs }
          setCurrentPlaying(payload.questionIndex);
        });

        await channel.subscribe();

        // Broadcast join
        try {
          await channel.send({ type: 'broadcast', event: 'join', payload: { userId: user?.id || 'anon', username: user?.email || 'Guest' } });
          // If creator (host) seeded questions, mark as host
          if (sessionStorage.getItem(`room:${roomId}:questions`)) setIsHost(true);
        } catch (e) { console.warn('Failed to broadcast join', e); }

        return () => {
          try { channel.unsubscribe(); } catch (e) {}
        };
      } catch (err) {
        console.error(err);
      } finally { if (!cancelled) setLoading(false); }
    })();
    return ()=>{ cancelled = true; };
  }, [roomId]);

  if (loading) return <div className="p-6">Loading room...</div>;

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#070a18] text-white">
      <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 py-12">
        <h2 className="text-2xl font-bold mb-4">Room: {roomId}</h2>
        <div className="rounded-2xl bg-[#0f1724]/60 border border-white/6 p-6 space-y-4">
          <div className="mb-3">
            <div className="text-sm text-white/60">Players in room:</div>
            <div className="flex gap-2 mt-2">
              {players.length===0 && <div className="text-white/60">No players yet</div>}
              {players.map(p=> <div key={p.id} className="px-2 py-1 rounded bg-white/5">{p.username}</div>)}
            </div>
          </div>

          {questions.length===0 && <div className="text-white/60">No questions available.</div>}
          {questions.map((q:any, i:number)=> (
            <div key={i} className="p-3 border border-white/6 rounded">
              <div className="font-semibold">{i+1}. {q.title} — {q.artist}</div>
              <div className="mt-2">
                <YouTubeAudioPlayer videoId={q.videoId} startTime={q.startTime} endTime={q.endTime ?? (q.startTime + 30)} isPlaying={currentPlaying===i} />
              </div>
              {isHost && (
                <div className="mt-2">
                  <button onClick={async ()=>{
                    try {
                      const channel = supabase.channel(`room:${roomId}`);
                      await channel.send({ type: 'broadcast', event: 'host_start', payload: { questionIndex: i, serverTs: Date.now() } });
                    } catch (e) { console.error(e); }
                  }} className="px-3 py-1 rounded bg-fuchsia-500 text-black">Start</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
