/**
 * ⚠️ DEPRECATED: Legacy Music Mappings File
 * 
 * This file-based mapping system has been replaced by the new Supabase-backed 
 * Songs Override System. Please use the new API endpoints instead:
 * 
 * - GET /api/songs - Fetch songs with manual overrides
 * - POST /api/songs - Create new songs with overrides
 * - PUT /api/songs/:id - Update song overrides
 * - POST /api/sync-playlist - Batch import with overrides
 * 
 * Migration Guide:
 * 1. Set up Supabase environment variables
 * 2. Run database migration: database/migrations/001_create_songs_table.sql
 * 3. Seed database: node scripts/seed.js
 * 4. Update components to use useSongs() hook instead of this file
 * 
 * Benefits of new system:
 * ✅ Real-time updates
 * ✅ Better data validation
 * ✅ Scalable database storage  
 * ✅ Admin-only write access
 * ✅ No more file conflicts
 * ✅ Proper TypeScript types
 * 
 * This file will be removed in a future update.
 */

// Legacy interfaces kept for backward compatibility during migration
export interface TitleMapping {
  originalTitle: string;
  cleanedTitle: string;
  artist: string;
}

export interface CategoryMappings {
  [category: string]: {
    titleMappings: TitleMapping[];
    lastUpdated: string;
    totalMappings: number;
  };
}

// Empty mappings - use new Supabase system instead
export const MUSIC_MAPPINGS: CategoryMappings = {};

/**
 * @deprecated Use getSongsByCategory() from @/lib/songs instead
 */
export function getMappingStats() {
  console.warn('⚠️ getMappingStats() is deprecated. Use useSongsStats() hook instead.');
  return {
    totalMappings: 0,
    categories: 0,
    byCategory: {}
  };
}

/**
 * @deprecated Use the new Supabase-backed system
 */
export function getTitleMapping(originalTitle: string): TitleMapping | null {
  console.warn('⚠️ getTitleMapping() is deprecated. Use getSongById() from @/lib/songs instead.');
  return null;
}