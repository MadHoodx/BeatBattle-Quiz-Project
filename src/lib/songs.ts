/**
 * Songs Library for BeatBattle Quiz Project
 * Provides core functionality for managing songs in Supabase
 * NO AUTO-PARSING - Always use override_title and override_artist as source of truth
 */

import { requireServiceRole, supabase } from '@/lib/supabase';
import {
  Song,
  SongRow,
  SongCategory,
  CreateSongInput,
  UpdateSongInput,
  PlaylistSyncItem,
  SongsResponse,
  isValidCategory
} from '@/types/songs';

export function normalizeSongRow(row: SongRow): Song {
  return {
    id: row.id,
    source_id: row.source_id,
    source_provider: row.source_provider,
    title: row.override_title || row.source_title || 'Unknown Title',
    artist: row.override_artist || row.source_artist || 'Unknown Artist',
    category: row.category,
    thumbnail_url: row.thumbnail_url,
    duration_seconds: row.duration_seconds,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

// Map category to physical table name
function tableForCategory(category?: string) {
  // accept a few common aliases and map them to canonical category table names
  if (!category) return 'songs';
  const c = category.toString();
  switch (c) {
    case 'kpop': return 'songs_kpop';
    case 'jpop': return 'songs_jpop';
    case 'thaipop': return 'songs_thaipop';
    // common alias sent from some playlist sources
    case 'thai': return 'songs_thaipop';
    case 'pophits': return 'songs_pophits';
  // common aliases for pop/western playlists
  case 'western': return 'songs_pophits';
  case 'pop': return 'songs_pophits';
    case 'kdramaost': return 'songs_kdramaost';
    // common alias sent from some playlist sources
    case 'kdrama': return 'songs_kdramaost';
    default: return 'songs'; // fallback to legacy table
  }
}

// Normalize category values to canonical forms used by the app
function normalizeCategory(category?: string): SongCategory | undefined {
  if (!category) return undefined;
  const c = category.toString();
  if (c === 'kdrama') return 'kdramaost';
  // Accept 'thai' as an alias for 'thaipop'
  if (c === 'thai') return 'thaipop';
  // Accept common aliases for pop/western
  if (c === 'western' || c === 'pop') return 'pophits';
  if (c === 'western') return 'pophits';

  // Only return valid categories
  if (isValidCategory(c as SongCategory)) return c as SongCategory;
  return undefined;
}

// List of category tables to search when id/source might be in any of them
const CATEGORY_TABLES = ['songs_kpop','songs_jpop','songs_thaipop','songs_pophits','songs_kdramaost'];

async function findTableForId(id: string) {
  // Use service-role client so we can bypass RLS when checking table membership
  const supabaseAdmin = requireServiceRole();
  for (const t of CATEGORY_TABLES) {
    const { data, error } = await supabaseAdmin.from(t).select('id').eq('id', id).single();
    if (!error && data) return t;
  }
  // fallback to legacy table
  const { data, error } = await supabaseAdmin.from('songs').select('id').eq('id', id).single();
  if (!error && data) return 'songs';
  return null;
}

async function findExistingSongBySource(source_id: string, source_provider: string) {
  // Use service-role client to search across tables (bypass RLS). This is a server-side helper.
  const supabaseAdmin = requireServiceRole();
  for (const t of CATEGORY_TABLES.concat(['songs'])) {
    const { data, error } = await supabaseAdmin.from(t).select('*').eq('source_id', source_id).eq('source_provider', source_provider).single();
    if (!error && data) return { table: t, row: data };
  }
  return null;
}

export async function getSongsByCategory(
  category?: string,
  limit = 50,
  offset = 0,
  search?: string,
  useServiceRole: boolean = false
): Promise<SongsResponse> {
  // Map possible aliases (e.g. 'kdrama') to canonical category and table
  const canonicalCategory = normalizeCategory(category) as SongCategory | undefined || (isValidCategory(category || '') ? (category as SongCategory) : undefined);
  const table = tableForCategory(category);

  const client = useServiceRole ? requireServiceRole() : supabase;

  let query = client.from(table).select('*', { count: 'exact' });

  if (canonicalCategory) {
    query = query.eq('category', canonicalCategory);
  }

  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    query = query.or(`override_title.ilike.${searchTerm},override_artist.ilike.${searchTerm}`);
  }

  query = query.order('updated_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) {
    console.error('Error fetching songs:', error);
    throw new Error(`Failed to fetch songs: ${error.message}`);
  }

  return {
    songs: (data || []).map(normalizeSongRow),
    total: count || 0,
    category: canonicalCategory as SongCategory | undefined,
    pagination: { limit, offset, hasMore: offset + (data || []).length < (count || 0) }
  };
}

export async function getSongById(id: string): Promise<Song | null> {
  const table = await findTableForId(id) || 'songs';
  const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch song: ${error.message}`);
  }
  return normalizeSongRow(data);
}

export async function createSong(input: CreateSongInput): Promise<Song> {
  const supabaseAdmin = requireServiceRole();
  if (!input.override_title?.trim()) throw new Error('override_title is required');
  if (!input.override_artist?.trim()) throw new Error('override_artist is required');
  if (!input.source_id?.trim()) throw new Error('source_id is required');
  if (!isValidCategory(input.category)) throw new Error(`Invalid category: ${input.category}`);

  const table = tableForCategory(input.category);
  const { data, error } = await supabaseAdmin
    .from(table)
    .insert([
      {
        source_id: input.source_id.trim(),
        source_provider: input.source_provider,
        source_title: input.source_title?.trim() || null,
        source_artist: input.source_artist?.trim() || null,
        override_title: input.override_title.trim(),
        override_artist: input.override_artist.trim(),
        category: input.category,
        thumbnail_url: input.thumbnail_url?.trim() || null,
        duration_seconds: input.duration_seconds || null,
        metadata: input.metadata || {}
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating song:', error);
    throw new Error(`Failed to create song: ${error.message}`);
  }
  return normalizeSongRow(data);
}

export async function updateSong(id: string, input: UpdateSongInput): Promise<Song> {
  const supabaseAdmin = requireServiceRole();
  if (input.override_title !== undefined && !input.override_title?.trim()) throw new Error('override_title cannot be empty');
  if (input.override_artist !== undefined && !input.override_artist?.trim()) throw new Error('override_artist cannot be empty');
  if (input.category && !isValidCategory(input.category)) throw new Error(`Invalid category: ${input.category}`);

  const updateData: Partial<SongRow> = {};
  if (input.source_title !== undefined) updateData.source_title = input.source_title?.trim() || null;
  if (input.source_artist !== undefined) updateData.source_artist = input.source_artist?.trim() || null;
  if (input.override_title !== undefined) updateData.override_title = input.override_title.trim();
  if (input.override_artist !== undefined) updateData.override_artist = input.override_artist.trim();
  if (input.category !== undefined) updateData.category = input.category;
  if (input.thumbnail_url !== undefined) updateData.thumbnail_url = input.thumbnail_url?.trim() || null;
  if (input.duration_seconds !== undefined) updateData.duration_seconds = input.duration_seconds;
  if (input.metadata !== undefined) updateData.metadata = input.metadata;

  const table = (await findTableForId(id)) || 'songs';
  const { data, error } = await supabaseAdmin.from(table).update(updateData).eq('id', id).select().single();
  if (error) {
    console.error('Error updating song:', error);
    throw new Error(`Failed to update song: ${error.message}`);
  }
  return normalizeSongRow(data);
}

export async function deleteSong(id: string): Promise<void> {
  const supabaseAdmin = requireServiceRole();
  const table = (await findTableForId(id)) || 'songs';
  const { error } = await supabaseAdmin.from(table).delete().eq('id', id);
  if (error) {
    console.error('Error deleting song:', error);
    throw new Error(`Failed to delete song: ${error.message}`);
  }
}

export async function upsertSongFromPlaylistItem(item: PlaylistSyncItem, forceUpdateOverrides = false): Promise<{ song: Song; created: boolean }> {
  const supabaseAdmin = requireServiceRole();

  try {
    console.log(`🧭 upsertSongFromPlaylistItem: source_provider=${item.source_provider} source_id=${item.source_id} category=${item.category}`);

  const existingSearch = await findExistingSongBySource(item.source_id, item.source_provider);
    const existing = existingSearch ? existingSearch.row : null;
    const existingTable = existingSearch ? existingSearch.table : null;

    // existingSearch contains search result across category tables

    if (existing) {
      const updateData: Partial<SongRow> = {
        source_title: item.source_title?.trim() || null,
        source_artist: item.source_artist?.trim() || null,
        thumbnail_url: item.thumbnail_url?.trim() || null,
        duration_seconds: item.duration_seconds || null,
        metadata: item.metadata || {},
        category: (normalizeCategory(item.category) || item.category) as SongCategory | undefined
      };

      if (forceUpdateOverrides || (!existing.override_title && item.override_title)) {
        updateData.override_title = item.override_title?.trim() || item.source_title?.trim() || 'Unknown Title';
      }
      if (forceUpdateOverrides || (!existing.override_artist && item.override_artist)) {
        updateData.override_artist = item.override_artist?.trim() || item.source_artist?.trim() || 'Unknown Artist';
      }

  const targetTable = existingTable || tableForCategory((normalizeCategory(item.category) || item.category) as string);
  const { data, error } = await supabaseAdmin.from(targetTable).update(updateData).eq('id', existing.id).select().single();
      if (error) {
        console.error('❌ Failed to update song:', error);
        throw new Error(`Failed to update song: ${error.message}`);
      }
      console.log(`✅ Updated song id=${existing.id} source_id=${item.source_id}`);
      return { song: normalizeSongRow(data), created: false };
    }

  const canonicalCategory = (normalizeCategory(item.category) || item.category) as SongCategory | undefined;
    const targetTable = tableForCategory(canonicalCategory);
    const { data, error } = await supabaseAdmin.from(targetTable).insert([{
      source_id: item.source_id.trim(),
      source_provider: item.source_provider,
      source_title: item.source_title?.trim() || null,
      source_artist: item.source_artist?.trim() || null,
      override_title: item.override_title?.trim() || item.source_title?.trim() || 'Unknown Title',
      override_artist: item.override_artist?.trim() || item.source_artist?.trim() || 'Unknown Artist',
      category: canonicalCategory,
      thumbnail_url: item.thumbnail_url?.trim() || null,
      duration_seconds: item.duration_seconds || null,
      metadata: item.metadata || {}
    }]).select().single();

    if (error) {
      console.error('❌ Failed to create song:', error);
      throw new Error(`Failed to create song: ${error.message}`);
    }

    console.log(`✅ Created song id=${(data && (data as any).id) || 'unknown'} source_id=${item.source_id}`);
    return { song: normalizeSongRow(data), created: true };
  } catch (err) {
    console.error('🛑 upsertSongFromPlaylistItem error:', err instanceof Error ? err.stack || err.message : err);
    throw err;
  }
}

export async function getSongsCountByCategory(): Promise<Record<SongCategory, number>> {
  const counts: Record<SongCategory, number> = { kpop: 0, jpop: 0, thaipop: 0, pophits: 0, kdramaost: 0 };
  // Aggregate counts by querying each category table
  for (const cat of Object.keys(counts) as SongCategory[]) {
    const table = tableForCategory(cat);
    const { data, error, count } = await supabase.from(table).select('*', { count: 'exact' }).eq('category', cat).limit(1);
    if (!error) counts[cat] = count || 0;
  }
  return counts;
}