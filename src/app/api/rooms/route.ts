import { NextResponse } from 'next/server';
import { getSongsByCategory, upsertSongFromPlaylistItem } from '@/lib/songs';
import { YouTubePlaylistService } from '@/services/youtube-playlist';
import { SongCategory } from '@/types/songs';
import crypto from 'crypto';
import { getSupabaseClient } from '@/lib/supabase';

const YT_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const playlistService = new YouTubePlaylistService(YT_API_KEY);

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const category = (body.category || 'kpop') as SongCategory;
    const numQuestions = Number(body.num || 5);

    // Try Supabase via helper
    const { songs: existingSongs } = await getSongsByCategory(category, 1000);

    let pool = existingSongs || [];
    if (!pool || pool.length === 0) {
      // Seed from YouTube if empty
      const ytResult = await playlistService.getSongsByCategory(category, { maxResults: 50, useCache: true });
      if (ytResult.songs && ytResult.songs.length > 0) {
        // Upsert a few to supabase for future
        await Promise.all(ytResult.songs.map(ytSong => upsertSongFromPlaylistItem({
          source_id: ytSong.videoId,
          source_provider: 'youtube',
          source_title: ytSong.originalTitle || ytSong.title,
          source_artist: ytSong.artist,
          override_title: ytSong.title,
          override_artist: ytSong.artist,
          category,
          thumbnail_url: ytSong.thumbnail,
          duration_seconds: undefined,
          metadata: {}
        })));
        const seeded = await getSongsByCategory(category, 1000);
        pool = seeded.songs || [];
      }
    }

    if (!pool || pool.length === 0) {
      return NextResponse.json({ success: false, error: 'No songs available' }, { status: 404 });
    }

    const selected = pickRandom(pool, Math.min(numQuestions, pool.length));
    const questions = selected.map((song: any) => {
      const otherTitles = pool.filter((s: any) => s.id !== song.id).map((s:any) => s.title).filter(Boolean);
      const unique = Array.from(new Set(otherTitles)).sort(() => Math.random() - 0.5);
      const wrongChoices: string[] = [];
      for (let i = 0; i < 3; i++) wrongChoices.push(unique[i] || `Option ${i+1}`);
      const choices = [song.title, ...wrongChoices].sort(() => Math.random() - 0.5);
      const correctAnswer = choices.indexOf(song.title);
      return {
        videoId: song.source_id,
        title: song.title,
        artist: song.artist,
        choices,
        correctAnswer,
        startTime: 30,
        endTime: 60
      };
    });

    const roomId = crypto.randomBytes(4).toString('hex');

    // Try to persist room to Supabase (rooms table). If table is missing, continue gracefully.
    try {
      const supabaseAdmin: any = getSupabaseClient(true);
      await supabaseAdmin.from('rooms').insert([{ id: roomId, category, questions, created_at: new Date().toISOString() }]);
    } catch (err) {
      // Log but don't fail room creation — DB migration may be required by deploy environment
      console.warn('Failed to persist room to DB (rooms table may be missing):', err);
    }

    return NextResponse.json({ success: true, roomId, questions });
  } catch (err) {
    console.error('Create room error', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
