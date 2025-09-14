
import { NextResponse } from 'next/server';
import { getSongsByCategory, upsertSongFromPlaylistItem } from '@/lib/songs';
import { supabase } from '@/lib/supabase';
import { YouTubePlaylistService } from '@/services/youtube-playlist';
import { SongCategory } from '@/types/songs';

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = (searchParams.get('category') || 'kpop') as SongCategory;
  const numQuestions = Number(searchParams.get('num') || 5);

  // Helper: build quiz questions from song rows
  const buildQuestions = (allSongs: any[], count: number) => {
    const selected = pickRandom(allSongs, Math.min(count, allSongs.length));
    return selected.map((song, idx) => {
      const otherTitles = allSongs
        .filter(s => s.id !== song.id)
        .map(s => s.title)
        .filter(t => t && t.trim().length > 0);
      const unique = Array.from(new Set(otherTitles)).sort(() => Math.random() - 0.5);
      const wrongChoices: string[] = [];
      for (let i = 0; i < 3; i++) {
        if (unique.length > i) wrongChoices.push(unique[i]);
        else wrongChoices.push(`Option ${i + 1}`);
      }
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
  };

  // 1. Check Supabase first
  const { songs: existingSongs } = await getSongsByCategory(category, 1000);
  if (existingSongs && existingSongs.length > 0) {
    // Serve fully-formed quiz questions from Supabase
    const questions = buildQuestions(existingSongs, numQuestions);
    return NextResponse.json({ success: true, category, total: existingSongs.length, questions });
  }

  // 2. If no songs in Supabase, fetch from YouTube, clean, upsert, then return
  console.log(`📡 No songs in Supabase for category=${category}. Fetching from YouTube and seeding...`);
  const ytResult = await playlistService.getSongsByCategory(category, { maxResults: 50, useCache: true });
  if (ytResult.songs && ytResult.songs.length > 0) {
    // Upsert each item into Supabase (will create when missing)
    await Promise.all(ytResult.songs.map(ytSong =>
      upsertSongFromPlaylistItem({
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
      })
    ));
  }

  // 3. Fetch from Supabase after seeding
  const { songs } = await getSongsByCategory(category, 1000);
  if (!songs || songs.length === 0) {
    return NextResponse.json({ success: false, error: 'No songs found for this category after seeding.' }, { status: 404 });
  }

  const questions = buildQuestions(songs, numQuestions);

  return NextResponse.json({
    success: true,
    category,
    total: songs.length,
    questions
  });
}

// Analytics endpoint to track quiz completions
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      category,
      difficulty,
      score,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      timeoutAnswers,
      totalTime
    } = body;

    const { error } = await supabase
      .from('quiz_sessions')
      .insert({
        category,
        difficulty,
        score,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        timeout_answers: timeoutAnswers,
        total_time: totalTime,
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

    if (error) {
      console.error('📊 Analytics error:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('📊 Analytics POST error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
