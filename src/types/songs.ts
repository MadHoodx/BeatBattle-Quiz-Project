/**
 * Database Types for Songs System
 * Replaces the legacy file-based mapping system
 */

export type SongCategory = 'kpop' | 'jpop' | 'thaipop' | 'pophits' | 'kdramaost';

export type SourceProvider = 'youtube' | 'spotify' | 'soundcloud';

/**
 * Raw database row from Supabase songs table
 */
export interface SongRow {
  id: string;
  source_id: string;
  source_provider: SourceProvider;
  source_title: string | null;
  source_artist: string | null;
  override_title: string;
  override_artist: string;
  category: SongCategory;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Normalized song object for frontend consumption
 * Always uses override values as the source of truth
 */
export interface Song {
  id: string;
  source_id: string;
  source_provider: SourceProvider;
  title: string; // Always from override_title (or fallback to source_title)
  artist: string; // Always from override_artist (or fallback to source_artist)
  category: SongCategory;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Input type for creating new songs
 */
export interface CreateSongInput {
  source_id: string;
  source_provider: SourceProvider;
  source_title?: string;
  source_artist?: string;
  override_title: string;
  override_artist: string;
  category: SongCategory;
  thumbnail_url?: string;
  duration_seconds?: number;
  metadata?: Record<string, any>;
}

/**
 * Input type for updating existing songs
 */
export interface UpdateSongInput {
  source_title?: string;
  source_artist?: string;
  override_title?: string;
  override_artist?: string;
  category?: SongCategory;
  thumbnail_url?: string;
  duration_seconds?: number;
  metadata?: Record<string, any>;
}

/**
 * Input type for syncing playlist items
 */
export interface PlaylistSyncItem {
  source_id: string;
  source_provider: SourceProvider;
  source_title?: string;
  source_artist?: string;
  category: SongCategory;
  thumbnail_url?: string;
  duration_seconds?: number;
  metadata?: Record<string, any>;
  // Optional override values - if not provided, will preserve existing or use defaults
  override_title?: string;
  override_artist?: string;
}

/**
 * Query parameters for songs API
 */
export interface SongsQueryParams {
  category?: SongCategory;
  limit?: number;
  offset?: number;
  search?: string;
}

/**
 * API response wrapper
 */
export interface SongsResponse {
  songs: Song[];
  total: number;
  category?: SongCategory;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Sync playlist API request
 */
export interface SyncPlaylistRequest {
  category: SongCategory;
  items: PlaylistSyncItem[];
  force_update_overrides?: boolean;
}

/**
 * Sync playlist API response
 */
export interface SyncPlaylistResponse {
  success: boolean;
  message: string;
  stats: {
    total_items: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  errors?: Array<{
    item: PlaylistSyncItem;
    error: string;
  }>;
}

/**
 * Category configuration for the UI
 */
export const CATEGORY_CONFIG = {
  kpop: {
    label: 'K-Pop', 
    emoji: '🇰🇷',
    description: 'Korean Pop Music'
  },
  jpop: {
    label: 'Anime', 
    emoji: '🇯🇵',
    description: 'Anime songs & theme music from popular series'
  },
  thaipop: {
    label: 'Thai Pop',
    emoji: '🇹🇭', 
    description: 'Thai Pop Music'
  },
  pophits: {
    label: 'Western',
    emoji: '🎵',
    description: 'Western pop and chart hits'
  },
  kdramaost: {
    label: 'K-Drama OST',
    emoji: '🎭',
    description: 'Korean Drama Soundtracks'
  }
} as const;

/**
 * Helper to check if a string is a valid category
 */
export function isValidCategory(category: string): category is SongCategory {
  return ['kpop', 'jpop', 'thaipop', 'pophits', 'kdramaost'].includes(category);
}

/**
 * Helper to check if a string is a valid source provider
 */
export function isValidSourceProvider(provider: string): provider is SourceProvider {
  return ['youtube', 'spotify', 'soundcloud'].includes(provider);
}