import { NextResponse } from 'next/server';
import { YouTubePlaylistService } from '@/services/youtube-playlist';
import { upsertSongFromPlaylistItem, getSongsByCategory, deleteSong } from '@/lib/songs';
import { supabase, requireServiceRole } from '@/lib/supabase';
import { SongCategory } from '@/types/songs';

const YT_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const playlistService = new YouTubePlaylistService(YT_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('🧭 POST /api/sync-playlist/youtube received body:', JSON.stringify(body));
  const { category, maxResults = 100, preview = false } = body;
  if (!category) return NextResponse.json({ error: 'Missing category' }, { status: 400 });

  const ytResult = await playlistService.getSongsByCategory(category, { maxResults, useCache: false });
    if (!ytResult.songs || ytResult.songs.length === 0) {
      return NextResponse.json({ error: 'No songs found from YouTube' }, { status: 404 });
    }

    // If caller wants a report only, return the fetched YouTube songs (with diagnostics)
    const { reportOnly = false } = body;
    if (reportOnly) {
      // Return a compact list including diagnostic flags
      const report = ytResult.songs.map((s: any) => ({ videoId: s.videoId, title: s.title, artist: s.artist, isAgeRestricted: s.isAgeRestricted, embeddable: s.embeddable, regionBlocked: s.regionBlocked }));
      return NextResponse.json({ success: true, report, total: report.length });
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

    // Optionally remove songs from Supabase that are no longer present in the YouTube playlist
    const { removeMissing = false } = body;
    let removedCount = 0;
    if (removeMissing) {
      try {
  // Fetch current songs from Supabase category table using service-role client so RLS doesn't hide rows
  const { songs: existingSongs } = await getSongsByCategory(category, 10000, 0, undefined, true);
        const ytIds = new Set(ytResult.songs.map((s: any) => s.videoId));

        // Also fetch legacy rows from `songs` table that have this category (cover alias 'kdrama')
        const canonicalCategory = category === 'kdrama' ? 'kdramaost' : category;
        // Use service-role client for legacy table reads to avoid RLS blocking server-side admin operations
        let legacyRows = [] as any[];
        try {
          const supabaseAdmin = requireServiceRole();
          const { data, error } = await supabaseAdmin.from('songs').select('*').in('category', [category, canonicalCategory]);
          if (error) console.warn('Warning fetching legacy songs (admin):', error.message || error);
          legacyRows = data || [];
        } catch (e) {
          console.warn('Warning fetching legacy songs (exception):', e);
          // fallback: try public client (may return limited rows when RLS applies)
          try {
            const { data, error } = await supabase.from('songs').select('*').in('category', [category, canonicalCategory]);
            if (error) console.warn('Warning fetching legacy songs (public):', error.message || error);
            legacyRows = data || [];
          } catch (e2) {
            console.warn('Fallback fetching legacy songs failed too:', e2);
            legacyRows = [];
          }
        }

        const categorySourceSet = new Set((existingSongs || []).map((s: any) => s.source_id));

        // Remove songs from category table that are not on YouTube playlist
        const toRemoveCategory = (existingSongs || []).filter((s: any) => s.source_provider === 'youtube' && !ytIds.has(s.source_id));

        // For legacy rows: remove if not on YouTube OR duplicate exists in category table
        const toRemoveLegacy = (legacyRows || []).filter((s: any) => s.source_provider === 'youtube' && (!ytIds.has(s.source_id) || categorySourceSet.has(s.source_id)));

        const totalToRemove = [...toRemoveCategory, ...toRemoveLegacy];
        console.log(`🗑️ removeMissing is true: preview=${preview} would affect ${totalToRemove.length} songs for category=${category} (category:${toRemoveCategory.length}, legacy:${toRemoveLegacy.length})`);

        if (!preview) {
          await Promise.all(totalToRemove.map((s: any) => deleteSong(s.id).then(() => { removedCount++; }).catch(err => console.error('Failed to delete song', s.id, err))));
        }

        // If preview, return candidate lists so UI can confirm before deleting
        if (preview) {
          return NextResponse.json({ success: true, preview: true, totalCandidates: totalToRemove.length, categoryCandidates: toRemoveCategory.slice(0,10), legacyCandidates: toRemoveLegacy.slice(0,10) });
        }
      } catch (err) {
        console.error('Error while removing missing songs:', err);
      }
    }

    return NextResponse.json({ success: true, total: ytResult.songs.length, removed: removedCount });
  } catch (err) {
    console.error('Error in /api/sync-playlist/youtube POST:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
