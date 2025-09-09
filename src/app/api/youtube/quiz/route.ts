import { NextResponse } from 'next/server'
import { PLAYLIST_SOURCES, pickRandom } from '@/data/youtubePlaylists'
import mockData from '@/data/mockVideos.json'

// NOTE: This route was refactored for better reliability:
// - Parallel fetching of multiple search terms
// - Deduplication & validation of results
// - Graceful fallback if some queries return no items
// - Early exit once enough questions gathered

interface YouTubeVideoSnippet {
  title: string;
  channelTitle: string;
  thumbnails: {
    medium?: { url: string };
  };
}

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: YouTubeVideoSnippet;
}

interface QuizQuestion {
  videoId: string;
  title: string;
  artist: string;
  choices: string[];
  correctAnswer: number;
  startTime: number;
  endTime: number;
}

interface PlaylistVideo {
  videoId: string;
  title: string;
  artist: string;
}

// ---------------- In‑memory cache & rate limit (per process) -----------------
interface CacheEntry { data: any; expires: number }
const SEARCH_CACHE = new Map<string, CacheEntry>()
const RATE_BUCKET: Record<string, { count: number; reset: number }> = {}
const RATE_LIMIT_PER_MIN = 20 // can adjust

function getCache(key: string) {
  const now = Date.now()
  const entry = SEARCH_CACHE.get(key)
  if (entry && entry.expires > now) return entry.data
  if (entry) SEARCH_CACHE.delete(key)
  return undefined
}
function setCache(key: string, data: any, ttlMs = 1000 * 60 * 30) { // 30 min default
  SEARCH_CACHE.set(key, { data, expires: Date.now() + ttlMs })
}
function rateLimit(key: string) {
  const now = Date.now()
  const bucket = RATE_BUCKET[key] || { count: 0, reset: now + 60_000 }
  if (now > bucket.reset) { bucket.count = 0; bucket.reset = now + 60_000 }
  bucket.count++
  RATE_BUCKET[key] = bucket
  return { allowed: bucket.count <= RATE_LIMIT_PER_MIN, remaining: Math.max(0, RATE_LIMIT_PER_MIN - bucket.count), reset: bucket.reset }
}

const musicCategories = {
  kpop: [
    'BTS official audio', 'BLACKPINK official audio', 'TWICE lyrics', 'Stray Kids official audio', 'NewJeans audio',
    'K-Pop 2024 hits', 'IVE official audio'
  ],
  jpop: [
    'YOASOBI official audio', 'Japanese pop 2024', 'anime song opening full', 'Official髭男dism audio', 'J-pop hits'
  ],
  thai: [
    'เพลงไทยฮิต audio', 'เพลง T-POP 2024', 'Thai pop official audio', 'Thai music lyrics'
  ],
  western: [
    'official audio Taylor Swift', 'Dua Lipa official audio', 'Top 40 2024 audio', 'Billboard hits audio', 'Ariana Grande lyrics'
  ],
  indie: [
    'indie rock official audio', 'indie pop 2024', 'alternative music audio', 'indie playlist 2024'
  ],
  rock: [
    'rock music official audio', 'metal official audio', 'classic rock audio', 'modern rock 2024'
  ]
} as const;

function getRandomStartTime(): number {
  // Random start time between 30-90 seconds to avoid intros
  return Math.floor(Math.random() * 60) + 30;
}

function generateChoices(correctSong: string, allSongs: string[]): string[] {
  const choices = [correctSong];
  const otherSongs = allSongs.filter(song => song !== correctSong);
  
  // Add 3 random wrong choices
  while (choices.length < 4 && otherSongs.length > 0) {
    const randomIndex = Math.floor(Math.random() * otherSongs.length);
    const wrongChoice = otherSongs[randomIndex];
    
    if (!choices.includes(wrongChoice)) {
      choices.push(wrongChoice);
    }
    otherSongs.splice(randomIndex, 1);
  }
  
  // If we don't have enough songs, add generic choices
  const genericChoices = [
    'Unknown Song A', 
    'Unknown Song B', 
    'Unknown Song C', 
    'Unknown Song D'
  ];
  
  while (choices.length < 4) {
    choices.push(genericChoices[choices.length - 1]);
  }
  
  // Shuffle choices
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  
  return choices;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = (searchParams.get('category') || 'kpop').toLowerCase();
    const difficulty = searchParams.get('difficulty') || 'casual';
  const debug = searchParams.get('debug') === '1';
  const forcePlaylist = searchParams.get('source') === 'playlist';
    const forceMock = searchParams.get('mock') === '1' || process.env.USE_LOCAL_YT === '1';

    // Basic IP-ish key (no real IP in serverless easily) -> use category + UA hash fallback
    const clientKey = category; // simplify
    const rl = rateLimit(clientKey)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded', reset: rl.reset, remaining: rl.remaining }, { status: 429 })
    }

  const API_KEY: string | undefined = process.env.YOUTUBE_API_KEY;
  if (!API_KEY || API_KEY === 'your_youtube_api_key_here') {
      return NextResponse.json({
        error: 'YouTube API key not configured',
        message: 'Add YOUTUBE_API_KEY to your .env.local'
      }, { status: 500 });
    }

    const searchTerms = musicCategories[category as keyof typeof musicCategories] || musicCategories.kpop;
    const numQuestions = difficulty === 'hardcore' ? 10 : 5;

    // ---------------- Mock Mode (no quota) ----------------
    if (forceMock) {
      const pool = (mockData as PlaylistVideo[]).slice(0, 30)
      const shuffled = [...pool].sort(() => Math.random() - 0.5)
      const sel = shuffled.slice(0, numQuestions)
      const allTitles = sel.map(v => v.title)
      const questions: QuizQuestion[] = sel.map(v => {
        const startTime = getRandomStartTime()
        const choices = generateChoices(v.title, allTitles)
        return { videoId: v.videoId, title: v.title, artist: v.artist, choices, correctAnswer: choices.indexOf(v.title), startTime, endTime: startTime + 30 }
      })
      questions.forEach(q => { if (q.correctAnswer < 0) q.correctAnswer = 0 })
      return NextResponse.json({ success: true, source: 'mock', category, difficulty, questions, quota: '0-units' })
    }

    // Helper: attempt playlist mode (1 unit per call instead of search.list 100 units)
  async function fetchFromPlaylist(reason: string): Promise<{ videos: PlaylistVideo[]; diagnostics: any }> {
      const ids = PLAYLIST_SOURCES[category];
      if (!ids || !ids.length) return { videos: [] as any[], diagnostics: { playlist: 'none-available', reason } };
      const chosen = pickRandom(ids)!;
      const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
      url.searchParams.set('part', 'snippet,contentDetails');
      url.searchParams.set('playlistId', chosen);
      url.searchParams.set('maxResults', '50');
  url.searchParams.set('key', API_KEY as string);
      const res = await fetch(url.toString());
  const data: any = await res.json();
      if (!res.ok) {
        return { videos: [], diagnostics: { playlistId: chosen, status: res.status, error: data?.error, reason } };
      }
  const videos: PlaylistVideo[] = (data.items || []).map((it: any) => ({
        videoId: it.contentDetails?.videoId,
        title: it.snippet?.title || '',
        artist: it.snippet?.videoOwnerChannelTitle || it.snippet?.channelTitle || 'Unknown'
      })).filter((v: any) => v.videoId);
      return { videos, diagnostics: { playlistId: chosen, status: res.status, count: videos.length, reason } };
    }

    // If forced playlist mode, skip searches entirely to save quota
    if (forcePlaylist) {
      const { videos, diagnostics: plDiag } = await fetchFromPlaylist('forced');
      if (!videos.length) {
        return NextResponse.json({ error: 'Playlist empty or unavailable', diagnostics: plDiag }, { status: 404 });
      }
    const selected: PlaylistVideo[] = videos.slice(0, numQuestions);
    const allTitles = selected.map((v: PlaylistVideo) => v.title);
    const questions: QuizQuestion[] = selected.map((v: PlaylistVideo) => {
        const startTime = getRandomStartTime();
        return {
          videoId: v.videoId,
          title: v.title,
      artist: v.artist,
          choices: generateChoices(v.title, allTitles),
          correctAnswer: 0,
          startTime,
          endTime: startTime + 30
        };
      });
    questions.forEach((q: QuizQuestion) => { q.correctAnswer = q.choices.indexOf(q.title); if (q.correctAnswer === -1) q.correctAnswer = 0; });
      return NextResponse.json({ success: true, source: 'playlist', category, difficulty, questions, diagnostics: debug ? [plDiag] : undefined });
    }

    // Build fetch promises (limit queries to speed up)
  // Reduce search terms (professional optimization) & prefer playlist first if enabled
  const MAX_TERMS = Number(process.env.YT_MAX_TERMS || '2') // default 2 to cut quota
  const limitedTerms = searchTerms.slice(0, MAX_TERMS);
    const buildUrl = (q: string, max = 25) =>
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${max}` +
      `&type=video&videoEmbeddable=true&videoCategoryId=10&safeSearch=none&order=relevance&q=${encodeURIComponent(q)}` +
      `&key=${API_KEY}`;

    const fetches = limitedTerms.map(term => {
      const cacheKey = `search:${term}`
      const cached = getCache(cacheKey)
      if (cached) return Promise.resolve({ term, status: 200, data: cached, cached: true })
      const url = buildUrl(term)
      return fetch(url)
        .then(async r => { const data = await r.json(); if (r.ok) setCache(cacheKey, data); return { term, status: r.status, data } })
        .catch(err => ({ term, error: String(err) }))
    })

    const results = await Promise.all(fetches);

    const collected: QuizQuestion[] = [];
    const allTitles: string[] = [];
    const seenVideoIds = new Set<string>();
    const termDiagnostics: any[] = [];

    for (const r of results) {
      if ((r as any).error) {
        const warn = { term: (r as any).term, error: (r as any).error };
        termDiagnostics.push(warn);
        if (debug) console.warn('YouTube term failed:', warn);
        continue;
      }
      const data = (r as any).data;
      termDiagnostics.push({ term: (r as any).term, status: (r as any).status, itemCount: data?.items?.length || 0 });
      if (!data?.items) continue;
      for (const item of data.items as YouTubeSearchItem[]) {
        if (!item.id?.videoId) continue;
        if (seenVideoIds.has(item.id.videoId)) continue; // dedupe
        seenVideoIds.add(item.id.videoId);
        const title = item.snippet.title;
        const artist = item.snippet.channelTitle;
        allTitles.push(title);
        if (collected.length < numQuestions) {
          const startTime = getRandomStartTime();
          collected.push({
            videoId: item.id.videoId,
            title,
            artist,
            choices: [],
            correctAnswer: 0,
            startTime,
            endTime: startTime + 30
          });
        } else {
          // already enough questions gathered
          break;
        }
      }
      if (collected.length >= numQuestions) break;
    }

    // If still not enough, fallback with generic popular search
    if (collected.length < numQuestions) {
  const fallbackQuery = `${category} music official audio`;
  const fallbackUrl = buildUrl(fallbackQuery, 15);
      try {
        const fallbackRes = await fetch(fallbackUrl);
        const fbData = await fallbackRes.json();
        termDiagnostics.push({ term: fallbackQuery, fallback: true, status: fallbackRes.status, itemCount: fbData?.items?.length || 0 });
        if (fbData?.items) {
          for (const item of fbData.items as YouTubeSearchItem[]) {
            if (collected.length >= numQuestions) break;
            if (!item.id?.videoId || seenVideoIds.has(item.id.videoId)) continue;
            seenVideoIds.add(item.id.videoId);
            const title = item.snippet.title;
            const artist = item.snippet.channelTitle;
            allTitles.push(title);
            const startTime = getRandomStartTime();
            collected.push({
              videoId: item.id.videoId,
              title,
              artist,
              choices: [],
              correctAnswer: 0,
              startTime,
              endTime: startTime + 30
            });
          }
        }
      } catch (e) {
        const fail = { fallbackError: String(e) };
        termDiagnostics.push(fail);
        if (debug) console.warn('Fallback fetch failed', fail);
      }
    }

    // Generate choices
    collected.forEach(q => {
      const choices = generateChoices(q.title, allTitles);
      q.choices = choices;
      const idx = choices.indexOf(q.title);
      q.correctAnswer = idx === -1 ? 0 : idx;
      if (idx === -1) q.choices[0] = q.title;
    });

  if (collected.length === 0) {
      // Try playlist fallback before giving up
      const { videos, diagnostics: plDiag } = await fetchFromPlaylist('fallback-after-empty');
      if (videos.length) {
        const allTitles = videos.map((v: PlaylistVideo) => v.title);
        const questions: QuizQuestion[] = videos.slice(0, numQuestions).map((v: PlaylistVideo) => {
          const startTime = getRandomStartTime();
          return {
            videoId: v.videoId,
            title: v.title,
            artist: v.artist,
            choices: [] as string[],
            correctAnswer: 0,
            startTime,
            endTime: startTime + 30
          };
        });
        questions.forEach((q: QuizQuestion) => { const c = generateChoices(q.title, allTitles); q.choices = c; q.correctAnswer = c.indexOf(q.title); if (q.correctAnswer === -1) q.correctAnswer = 0; });
        return NextResponse.json({ success: true, source: 'playlist-fallback', category, difficulty, questions, diagnostics: debug ? [...termDiagnostics, plDiag] : undefined });
      }
      return NextResponse.json({
        error: 'No songs found',
        details: { category, tried: limitedTerms, diagnostics: termDiagnostics, playlist: plDiag }
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      category,
      difficulty,
      questions: collected.slice(0, numQuestions),
      totalSongs: allTitles.length,
      fetchedQueries: limitedTerms,
      partial: collected.length < numQuestions,
  diagnostics: debug ? termDiagnostics : undefined,
  cacheStats: debug ? { cacheSize: SEARCH_CACHE.size } : undefined
    });
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    const message = error?.message || '';
    // Quota exceeded fallback -> attempt playlist
    if (/quota|exceeded/i.test(message)) {
      try {
        const { searchParams } = new URL(request.url);
        const category = (searchParams.get('category') || 'kpop').toLowerCase();
        const difficulty = searchParams.get('difficulty') || 'casual';
        const numQuestions = difficulty === 'hardcore' ? 10 : 5;
        const { videos, diagnostics: plDiag } = await (async () => {
          const ids = PLAYLIST_SOURCES[category];
          if (!ids || !ids.length) return { videos: [], diagnostics: { playlist: 'none-for-quota' } };
          const chosen = pickRandom(ids)!;
          const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
          url.searchParams.set('part', 'snippet,contentDetails');
          url.searchParams.set('playlistId', chosen);
          url.searchParams.set('maxResults', '30');
          url.searchParams.set('key', process.env.YOUTUBE_API_KEY || '');
          const r = await fetch(url.toString());
          const d = await r.json();
          if (!r.ok) return { videos: [], diagnostics: { playlistId: chosen, status: r.status, error: d?.error } };
          const vids = (d.items || []).map((it: any) => ({
            videoId: it.contentDetails?.videoId,
            title: it.snippet?.title || '',
            artist: it.snippet?.videoOwnerChannelTitle || it.snippet?.channelTitle || 'Unknown'
          })).filter((v: any) => v.videoId);
          return { videos: vids, diagnostics: { playlistId: chosen, status: r.status, count: vids.length } };
        })();
        if (videos.length) {
          const allTitles = videos.map((v: PlaylistVideo) => v.title);
          const questions: QuizQuestion[] = videos.slice(0, numQuestions).map((v: PlaylistVideo) => {
            const startTime = getRandomStartTime();
            const choices = generateChoices(v.title, allTitles);
            return {
              videoId: v.videoId,
              title: v.title,
              artist: v.artist,
              choices,
              correctAnswer: choices.indexOf(v.title),
              startTime,
              endTime: startTime + 30
            };
          });
          questions.forEach((q: QuizQuestion) => { if (q.correctAnswer === -1) q.correctAnswer = 0; });
          return NextResponse.json({ success: true, source: 'playlist-quota-fallback', questions, diagnostics: [plDiag] });
        }
      } catch (e2) {
        console.warn('Quota playlist fallback failed', e2);
      }
    }
    return NextResponse.json({
      error: 'Failed to generate quiz',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
