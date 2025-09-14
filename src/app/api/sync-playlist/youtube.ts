import { NextResponse } from 'next/server';
import { YouTubePlaylistService } from '@/services/youtube-playlist';
import { upsertSongFromPlaylistItem } from '@/lib/songs';
import { SongCategory } from '@/types/songs';

const YT_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const playlistService = new YouTubePlaylistService(YT_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('🧭 POST /api/sync-playlist/youtube received body:', JSON.stringify(body));
    const { category } = body;
    if (!category) return NextResponse.json({ error: 'Missing category' }, { status: 400 });

  const ytResult = await playlistService.getSongsByCategory(category, { maxResults: 50, useCache: false });
  if (!ytResult.songs || ytResult.songs.length === 0) {
    return NextResponse.json({ error: 'No songs found from YouTube' }, { status: 404 });
  }

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

    console.log(`✅ Upserted ${ytResult.songs.length} songs for category=${category}`);
    return NextResponse.json({ success: true, total: ytResult.songs.length });
  } catch (err) {
    console.error('Error in /api/sync-playlist/youtube POST:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
