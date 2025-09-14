/**
 * 🎵 Simple YouTube Playlist API Service
 * Easy-to-use playlist management with caching
 * 
 * ⚠️ MIGRATION NOTE: This service uses legacy auto-parsing.
 * Consider updating to use the new Supabase-backed Songs Override System:
 * - API: GET /api/songs
 * - Library: @/lib/songs
 * - Hooks: useSongs() from @/hooks/useSongs
 */

import { PLAYLIST_IDS, CONFIG } from '@/config/playlists';

// Legacy interfaces for backward compatibility
interface TitleMapping {
  originalTitle: string;
  cleanedTitle: string;
  artist: string;
}

// Temporary fallback functions - consider migrating to Supabase system
const MUSIC_MAPPINGS: any = {};

function findArtistByTitle(category: string, title: string): string | null {
  console.warn('⚠️ Using deprecated findArtistByTitle. Consider migrating to Supabase system.');
  return null;
}

export interface Song {
  videoId: string;
  title: string;
  originalTitle?: string; // Add original title field for testing
  artist: string;
  thumbnail?: string;
  duration?: string;
  playlistSource?: string;
  position?: number;
  startTime?: number;
  endTime?: number;
  isLyricsVideo?: boolean;
}

export interface PlaylistResponse {
  songs: Song[];
  totalCount: number;
  source: 'playlist' | 'cache' | 'fallback';
  lastUpdated: string;
  playlistId?: string;
  error?: string;
}

export interface CacheEntry {
  data: Song[];
  timestamp: number;
  playlistId: string;
  expiresAt: number;
}

/**
 * 🧠 Simple Cache Manager
 */
class PlaylistCacheManager {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = CONFIG.cacheDuration;

  set(key: string, data: Song[], playlistId: string, ttl?: number): void {
    const now = Date.now();
    const actualTtl = ttl || this.DEFAULT_TTL;
    
    this.cache.set(key, {
      data,
      timestamp: now,
      playlistId,
      expiresAt: now + actualTtl
    });
  }

  get(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

/**
 * 🎵 Simple YouTube Playlist Service
 */
export class YouTubePlaylistService {
  private cache = new PlaylistCacheManager();

  constructor(
    private apiKey?: string,
    private environment: 'development' | 'production' = 'production'
  ) {}

  /**
   * 🎯 Get songs by category (main entry point)
   */
  async getSongsByCategory(category: string, options?: {
    maxResults?: number;
    useCache?: boolean;
    fallbackEnabled?: boolean;
  }): Promise<PlaylistResponse> {
    // Increase default to 100 so the service will paginate and fetch more than the
    // YouTube single-request max of 50 when needed. Callers can still override.
    const { maxResults = 100, useCache = true, fallbackEnabled = true } = options || {};
    
    try {
      // Get playlist ID for category
      const playlistId = PLAYLIST_IDS[category as keyof typeof PLAYLIST_IDS];
      
      if (!playlistId) {
        throw new Error(`Category '${category}' not found`);
      }

      if (playlistId.includes('PLxxxxxxxxxxxxxxxxxxxxxx')) {
        throw new Error(`Please set actual playlist ID for category '${category}'`);
      }

      // Try to get from cache first
      if (useCache) {
        const cached = this.getCachedSongs(category);
        if (cached) {
          return {
            songs: this.shuffleAndLimit(cached.data, maxResults, CONFIG.shuffleEnabled),
            totalCount: cached.data.length,
            source: 'cache',
            lastUpdated: new Date(cached.timestamp).toISOString(),
            playlistId: cached.playlistId
          };
        }
      }

      // Fetch from playlist
      const songs = await this.fetchSongsFromPlaylist(playlistId, maxResults, category);
      
      if (songs.length > 0) {
        // Cache the results
        this.cache.set(category, songs, playlistId, CONFIG.cacheDuration);
        
        return {
          songs: this.shuffleAndLimit(songs, maxResults, CONFIG.shuffleEnabled),
          totalCount: songs.length,
          source: 'playlist',
          lastUpdated: new Date().toISOString(),
          playlistId: playlistId
        };
      }

      // Fallback handling
      if (fallbackEnabled) {
        return {
          songs: this.getFallbackSongs(category, maxResults),
          totalCount: 0,
          source: 'fallback',
          lastUpdated: new Date().toISOString(),
          error: 'No songs found from playlist, using fallback'
        };
      }

      throw new Error(`No songs found for category '${category}'`);
      
    } catch (error) {
      console.error(`Error getting songs for category ${category}:`, error);
      throw error;
    }
  }

  /**
   * 🔄 Fetch songs from a single playlist with pagination support
   */
  private async fetchSongsFromPlaylist(playlistId: string, maxResults: number, category?: string): Promise<Song[]> {
    if (!this.apiKey) {
      console.warn('YouTube API key not provided, using fallback data');
      return [];
    }

    try {
      const allSongs: Song[] = [];
      let nextPageToken = '';
      let fetchedCount = 0;
      
      // Fetch all pages until we have enough songs or no more pages
      while (fetchedCount < maxResults) {
        // YouTube API max is 50 per request
        const remainingNeeded = Math.min(50, maxResults - fetchedCount);
        
        let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${remainingNeeded}&playlistId=${playlistId}&key=${this.apiKey}`;
        
        if (nextPageToken) {
          url += `&pageToken=${nextPageToken}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
          break;
        }
        
        const songs = data.items.map((item: any, index: number) => {
          const originalTitle = item.snippet.title;
          const channelTitle = item.snippet.channelTitle;
          
          // First clean the title to get a base version
          const baseCleanedTitle = this.cleanTitle(originalTitle);
          
          // Check if we have a mapping for this title (highest priority)
          const mappedArtist = findArtistByTitle(category || 'kpop', baseCleanedTitle);
          const mappedTitle = this.getMappedTitle(category || 'kpop', originalTitle) || baseCleanedTitle;
          
          // Extract artist: use mapped artist if available, otherwise extract from title
          const artist = mappedArtist || this.extractArtist(originalTitle, channelTitle, category || 'kpop');
          
          const isLyricsVideo = /lyrics?|lyric|가사|歌詞/i.test(originalTitle);
          
          // Smart timing based on video type
          const timing = this.getSmartTiming(originalTitle, isLyricsVideo);
          
          return {
            videoId: item.snippet.resourceId.videoId,
            title: mappedTitle, // Use mapped title if available, otherwise cleaned title
            originalTitle: originalTitle, // Keep the original title for testing purposes
            artist: artist,
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
            playlistSource: playlistId,
            position: fetchedCount + index + 1,
            startTime: timing.startTime,
            endTime: timing.endTime,
            isLyricsVideo
          };
        });
        
        allSongs.push(...songs);
        fetchedCount += songs.length;
        
        // Check if there are more pages
        nextPageToken = data.nextPageToken;
        if (!nextPageToken) {
          break;
        }
      }
      
      return allSongs;
      
    } catch (error) {
      console.error(`Error fetching playlist ${playlistId}:`, error);
      return [];
    }
  }

  /**
   * 🎯 Get mapped title from mapping file
   */
  private getMappedTitle(category: string, originalTitle: string): string | null {
    const categoryData = MUSIC_MAPPINGS[category];
    if (!categoryData) return null;
    
    const mapping = categoryData.titleMappings.find(
      (m: TitleMapping) => m.originalTitle.toLowerCase() === originalTitle.toLowerCase()
    );
    
    return mapping?.cleanedTitle || null;
  }

  /**
   * 🧹 Clean up video titles - Extract ONLY song name
   */
  private cleanTitle(title: string): string {
    // Debug logging for Butter case
    if (title.toLowerCase().includes('butter')) {
      console.log(`🧈 BUTTER DEBUG - cleanTitle input:`, title);
    }
    
    // First pass - remove common video markers and brackets
    let cleaned = title
      .replace(/\s*\[.*?\]\s*/g, '') // Remove [brackets]
      .replace(/\s*「.*?」\s*/g, '') // Remove Japanese brackets 「」
      .replace(/\s*『.*?』\s*/g, '') // Remove Japanese brackets 『』
      .replace(/\s*【.*?】\s*/g, '') // Remove Japanese brackets 【】
      .replace(/\s*\|.*$/g, '')      // Remove | and everything after
      .replace(/\s*@\w+/g, '')       // Remove @mentions like @ITZY
      .replace(/\s*-\s*Official.*$/i, '') // Remove "- Official Video" etc.
      .replace(/\s*-\s*Music.*Video.*$/i, '') // Remove "- Music Video"
      .replace(/\s*-\s*Lyrics?.*$/i, '') // Remove "- Lyrics" / "- Lyric"
      .replace(/\s*M\/V\s*/gi, '')   // Remove M/V anywhere
      .replace(/\s*MV\s*/gi, '')     // Remove MV anywhere
      .replace(/\s*\(.*?Official.*?\)\s*/gi, '') // Remove (Official Video) variants
      .replace(/\s*\(.*?Lyrics?.*?\)\s*/gi, '') // Remove (Lyrics) variants
      .replace(/\s*\(.*?Lyric.*?\)\s*/gi, '') // Remove (Lyric Video) variants
      .replace(/\s+Official\s*$/i, '') // Remove " Official" at end
      .replace(/\s*Official\s*$/i, '') // Remove "Official" at end
      .replace(/\s*Audio\s*$/i, '')  // Remove "Audio" at end
      .replace(/Audio\s*$/i, '')     // Remove "Audio" at end (no space)
      .replace(/\s*Lyrics?\s*$/i, '') // Remove Lyrics at end
      .replace(/\s*Lyric\s*$/i, '')  // Remove Lyric at end
      .replace(/\s*가사\s*$/i, '')    // Remove Korean 가사 (lyrics)
      .replace(/\s*歌詞\s*$/i, '')    // Remove Japanese 歌詞 (lyrics)
      .replace(/\s*เนื้อเพลง\s*$/i, '') // Remove Thai เนื้อเพลง (lyrics)
      .replace(/\s*["'`]\s*/g, ' ')   // Remove quotes and normalize spaces
      .replace(/"/g, '')              // Remove all double quotes
      .replace(/'/g, '')              // Remove all single quotes
      .replace(/`/g, '')              // Remove all backticks
      .replace(/\s+/g, ' ')           // Normalize spaces
      .trim();

    if (title.toLowerCase().includes('butter')) {
      console.log(`🧈 BUTTER DEBUG - after first cleaning:`, cleaned);
    }

    // Pattern matching for different title formats
    
    // "Artist - Song" → extract "Song"
    const dashMatch = cleaned.match(/^([^-]+)\s*-\s*(.+)$/);
    if (dashMatch && dashMatch[2].trim().length >= 2) {
      const songPart = dashMatch[2].trim().replace(/^["'`]+|["'`]+$/g, '').trim();
      if (songPart.length >= 2 && !/^(official|video|mv|music|lyrics?|lyric)$/i.test(songPart)) {
        return songPart;
      }
    }

    // "Song (Artist)" → extract "Song" - but be careful with Korean parentheses
    const parenthesesMatch = cleaned.match(/^(.+?)\s*\(\s*([^)]+)\s*\)$/);
    if (parenthesesMatch && parenthesesMatch[1].trim().length >= 2) {
      const songPart = parenthesesMatch[1].trim().replace(/^["'`]+|["'`]+$/g, '').trim();
      const parentPart = parenthesesMatch[2].trim();
      
      // If parentheses contain Korean/other language version, prefer the main part
      if (/^[가-힣\u0E00-\u0E7F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/.test(parentPart)) {
        return songPart;
      }
      
      // If parentheses contain English and main part is non-English, prefer parentheses
      if (/^[a-zA-Z\s&]+$/.test(parentPart) && !/^[a-zA-Z]/.test(songPart)) {
        return parentPart;
      }
      
      return songPart;
    }

    // Remove artist names from beginning (simplified list)
    const cleanedFromArtist = cleaned
      .replace(/^(BTS|BLACKPINK|IU|TWICE|Red Velvet|aespa|NewJeans|IVE|ITZY|SEVENTEEN|Stray Kids|ENHYPEN|TXT|NMIXX|LE SSERAFIM|GIDLE|ATEEZ|NCT|EXO|SNSD|Girls Generation|SHINee|BIGBANG|방탄소년단|블랙핑크|아이유|트와이스|레드벨벳|에스파|뉴진스|아이브|있지|세븐틴|스트레이키즈|엔하이픈|투모로우바이투게더|엔믹스|르세라핌|아이들|에이티즈|엔시티|엑소|소녀시대|샤이니|빅뱅)\s*[-:]?\s*/i, '')
      .replace(/^["'`]+|["'`]+$/g, '') // Remove quotes at start/end
      .trim();

    if (cleanedFromArtist.length >= 2 && cleanedFromArtist !== cleaned) {
      return cleanedFromArtist;
    }

    // Final cleanup
    let finalClean = cleaned
      .replace(/^["'`]+|["'`]+$/g, '')  // Remove quotes at start/end
      .replace(/["'"'""''`]/g, '')      // Remove all Unicode quotes
      .trim();

    // Prefer English over other languages if mixed
    const englishMatch = finalClean.match(/^([a-zA-Z][a-zA-Z\s&]*[a-zA-Z]|[a-zA-Z]{2,})/);
    if (englishMatch && englishMatch[1].trim().length >= 2) {
      const englishPart = englishMatch[1].trim();
      // Make sure it's not just common words
      if (!/^(the|and|or|of|in|on|at|to|for|with|by|official|video|audio|music|mv)$/i.test(englishPart)) {
        return englishPart;
      }
    }

    // Return cleaned result if valid, otherwise original
    const result = finalClean.length >= 2 ? finalClean : title.trim();
    
    if (title.toLowerCase().includes('butter')) {
      console.log(`🧈 BUTTER DEBUG - cleanTitle result:`, {
        input: title,
        output: result,
        steps: {
          afterFirstCleaning: cleaned,
          afterFinalClean: finalClean,
          englishMatch: englishMatch?.[1]
        }
      });
    }
    
    return result;
  }

  /**
   * 🎯 Get smart timing based on video type
   */
  private getSmartTiming(title: string, isLyricsVideo: boolean): { startTime: number; endTime: number } {
    if (isLyricsVideo) {
      // Lyrics videos usually start immediately
      return {
        startTime: 5,  // Skip 5 seconds for any intro
        endTime: 35    // 30 seconds duration
      };
    }
    
    // Official videos - skip intro, aim for chorus/hook
    const isKpop = /[\u3131-\u318F\uAC00-\uD7A3]|kpop|k-pop/i.test(title);
    const isBallad = /ballad|slow|acoustic|piano|love|heart|sad/i.test(title);
    
    if (isBallad) {
      // Ballads often have longer intros
      return {
        startTime: 45,  // Skip longer intro
        endTime: 75     // 30 seconds duration
      };
    } else if (isKpop) {
      // K-pop often has distinctive hooks around 60-70% mark
      return {
        startTime: 40,  // Skip intro, hit the hook
        endTime: 70     // 30 seconds duration  
      };
    } else {
      // General pop songs
      return {
        startTime: 30,  // Skip intro, start at verse/pre-chorus
        endTime: 60     // 30 seconds duration
      };
    }
  }

  /**
   * 🎤 Extract artist from title or channel
   */
  private extractArtist(title: string, channelTitle: string, category: string = 'kpop'): string {
    // Clean title first to use for mapping lookup
    const cleanedTitle = this.cleanTitle(title);
    
    // Debug logging for Butter case
    if (title.toLowerCase().includes('butter')) {
      console.log(`🧈 BUTTER DEBUG - extractArtist called:`, {
        originalTitle: title,
        cleanedTitle: cleanedTitle,
        category: category
      });
    }
    
    // 1. Check mapping file first (highest priority)
    const mappedArtist = findArtistByTitle(category, cleanedTitle);
    if (mappedArtist) {
      if (title.toLowerCase().includes('butter')) {
        console.log(`🧈 BUTTER DEBUG - Found in mapping file:`, mappedArtist);
      }
      return mappedArtist;
    }
    
    if (title.toLowerCase().includes('butter')) {
      console.log(`🧈 BUTTER DEBUG - NOT found in mapping file, trying hardcoded...`);
    }
    
    // 2. Fallback to hardcoded mappings (for backwards compatibility)
    // REMOVED: Hardcoded mappings are dangerous due to false positives
    // (e.g., "tt" in "butter" causing TWICE instead of BTS)
    // Use mapping file system instead for accuracy

    if (title.toLowerCase().includes('butter')) {
      console.log(`🧈 BUTTER DEBUG - Skipping hardcoded mappings, going to pattern extraction...`);
    }

    // ถ้าไม่เจอใน mapping ลองสกัดจาก pattern "Artist - Song" (ก่อน clean มากเกินไป)
    const directDashMatch = title.match(/^([^-]+)\s*-\s*(.+)$/);
    if (directDashMatch && directDashMatch[1].trim().length >= 2 && directDashMatch[2].trim().length >= 2) {
      const possibleArtist = directDashMatch[1].trim()
        .replace(/\s*(Official|VEVO|Records?|Music|Entertainment)\s*/gi, '')
        .trim();
      
      // เช็คว่าไม่ใช่คำที่ไม่เกี่ยวข้อง และต้องเป็นชื่อศิลปินที่สมเหตุสมผล
      if (!/^(official|video|audio|music|lyrics?|lyric|mv|live|performance|cover|the|and|or|but)$/i.test(possibleArtist) && 
          possibleArtist.length <= 50) { // ป้องกันชื่อยาวเกินไป
        
        // เพิ่มการตรวจสอบว่าเป็นชื่อศิลปินที่น่าจะถูกต้อง
        const hasValidChars = /^[a-zA-Z0-9\s\u3131-\u318F\uAC00-\uD7A3\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF&'-()]+$/.test(possibleArtist);
        if (hasValidChars) {
          console.log(`🎯 Found artist from title pattern: "${possibleArtist}" from "${title}"`);
          return possibleArtist;
        }
      }
    }

    // ถ้าไม่เจอใน pattern ง่ายๆ ลองสกัดจาก originalTitle ที่ clean แล้ว
    const originalTitle = title
      .replace(/\s*\[.*?\]\s*/g, '') 
      .replace(/\s*\(.*?\)\s*/g, '')
      .replace(/\s*\|.*$/g, '')
      .trim();
      
    const dashMatch = originalTitle.match(/^([^-]+)\s*-\s*(.+)$/);
    if (dashMatch && dashMatch[1].trim().length >= 2 && dashMatch[2].trim().length >= 2) {
      const possibleArtist = dashMatch[1].trim()
        .replace(/\s*(Official|VEVO|Records?|Music|Entertainment)\s*/gi, '')
        .trim();
      
      // เช็คว่าไม่ใช่คำที่ไม่เกี่ยวข้อง
      if (!/^(official|video|audio|music|lyrics?|lyric|mv|live|performance|cover)$/i.test(possibleArtist)) {
        return possibleArtist;
      }
    }

    // สุดท้าย ถ้าหาไม่เจอ ใช้คำแรกที่มีความหมาย
    const words = originalTitle
      .split(/[\s-_]+/)
      .filter(word => 
        word.length >= 2 && 
        !/^(official|video|mv|music|lyrics?|lyric|audio|the|and|or|but|in|on|at|to|for|of|with|by|ft|feat)$/i.test(word)
      );
    
    if (words.length >= 1) {
      return words[0];
    }
    
    return 'Unknown Artist';
  }

  /**
   * 🎲 Shuffle and limit songs
   */
  private shuffleAndLimit(songs: Song[], maxResults: number, shuffle: boolean): Song[] {
    let result = [...songs];
    
    if (shuffle) {
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
    }
    
    return result.slice(0, maxResults);
  }

  /**
   * 💾 Get cached songs
   */
  private getCachedSongs(category: string): CacheEntry | null {
    return this.cache.get(category);
  }

  /**
   * 🆘 Get fallback songs when all else fails
   */
  private getFallbackSongs(category: string, maxResults: number): Song[] {
    // Simple fallback - return empty for now
    // In production, you might want to return some static songs
    return [];
  }

  /**
   * 🧹 Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 📊 Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * ✅ Validate playlist ID
   */
  async validatePlaylist(playlistId: string): Promise<{ valid: boolean; error?: string }> {
    if (!this.apiKey) {
      return { valid: false, error: 'No API key provided' };
    }

    try {
      const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return { valid: false, error: `API error: ${response.status}` };
      }

      const data = await response.json();
      const valid = data.items && data.items.length > 0;
      
      return { 
        valid, 
        error: valid ? undefined : 'Playlist not found or not accessible' 
      };
    } catch (error) {
      return { valid: false, error: `Validation error: ${error}` };
    }
  }
}

// Create a default instance for easy import
export const playlistService = new YouTubePlaylistService(
  process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
  process.env.NODE_ENV as 'development' | 'production'
);

// Simple function for easy import
export const getSongsByCategory = (category: string, options?: {
  maxResults?: number;
  useCache?: boolean;
  fallbackEnabled?: boolean;
}) => playlistService.getSongsByCategory(category, options);