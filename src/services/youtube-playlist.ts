/**
 * 🎵 Simple YouTube Playlist API Service
 * Easy-to-use playlist management with caching
 */

import { PLAYLIST_IDS, CONFIG } from '@/config/playlists';

export interface Song {
  videoId: string;
  title: string;
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
    const { maxResults = 50, useCache = true, fallbackEnabled = true } = options || {};
    
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
      const songs = await this.fetchSongsFromPlaylist(playlistId, maxResults);
      
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
   * 🔄 Fetch songs from a single playlist
   */
  private async fetchSongsFromPlaylist(playlistId: string, maxResults: number): Promise<Song[]> {
    if (!this.apiKey) {
      console.warn('YouTube API key not provided, using fallback data');
      return [];
    }

    try {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${maxResults}&playlistId=${playlistId}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.items?.map((item: any, index: number) => {
        const title = item.snippet.title;
        const cleanedTitle = this.cleanTitle(title);
        const isLyricsVideo = /lyrics?|lyric|가사|歌詞/i.test(title);
        
        // Smart timing based on video type
        const timing = this.getSmartTiming(title, isLyricsVideo);
        
        return {
          videoId: item.snippet.resourceId.videoId,
          title: cleanedTitle,
          artist: this.extractArtist(title, item.snippet.channelTitle),
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
          playlistSource: playlistId,
          position: index + 1,
          startTime: timing.startTime,
          endTime: timing.endTime,
          isLyricsVideo
        };
      }) || [];
      
    } catch (error) {
      console.error(`Error fetching playlist ${playlistId}:`, error);
      return [];
    }
  }

  /**
   * 🧹 Clean up video titles - Extract ONLY song name
   */
  private cleanTitle(title: string): string {
    let cleaned = title
      .replace(/\s*\[.*?\]\s*/g, '') // Remove [brackets]
      .replace(/\s*\(.*?\)\s*/g, '') // Remove (parentheses)
      .replace(/\s*\|.*$/g, '')      // Remove | and everything after
      .replace(/\s*-\s*Official.*$/i, '') // Remove "- Official Video" etc.
      .replace(/\s*-\s*Music.*Video.*$/i, '') // Remove "- Music Video"
      .replace(/\s*-\s*Lyrics?.*$/i, '') // Remove "- Lyrics" / "- Lyric"
      .replace(/\s*MV\s*$/i, '')     // Remove MV at end
      .replace(/\s*M\/V\s*$/i, '')   // Remove M/V at end
      .replace(/\s*\(.*?Official.*?\)\s*/gi, '') // Remove (Official Video) variants
      .replace(/\s*\(.*?Lyrics?.*?\)\s*/gi, '') // Remove (Lyrics) variants
      .replace(/\s*\(.*?Lyric.*?\)\s*/gi, '') // Remove (Lyric Video) variants
      .replace(/\s*Lyrics?\s*$/i, '') // Remove Lyrics at end
      .replace(/\s*Lyric\s*$/i, '')  // Remove Lyric at end
      .replace(/\s*가사\s*$/i, '')    // Remove Korean 가사 (lyrics)
      .replace(/\s*歌詞\s*$/i, '')    // Remove Japanese 歌詞 (lyrics)
      .replace(/^["'`]+|["'`]+$/g, '') // Remove quotes at start/end
      .replace(/\s*["'`]\s*/g, ' ')   // Remove quotes and normalize spaces
      .trim();
    
    // Try different patterns to extract JUST the song name
    
    // Pattern 1: "Artist - Song" → extract "Song"
    const dashMatch = cleaned.match(/^([^-]+)\s*-\s*(.+)$/);
    if (dashMatch && dashMatch[2].trim().length > 0) {
      let songPart = dashMatch[2].trim()
        .replace(/\s*Lyrics?.*$/i, '') // Remove Lyrics from song part
        .replace(/\s*Lyric.*$/i, '')   // Remove Lyric from song part
        .replace(/\s*by\s+.+$/i, '')   // Remove "by Artist"
        .replace(/^["'`]+|["'`]+$/g, '') // Remove quotes at start/end
        .trim();
      
      if (songPart.length >= 2 && !/^(official|video|mv|music|lyrics?|lyric)$/i.test(songPart)) {
        return songPart;
      }
    }
    
    // Pattern 2: "Song by Artist" → extract "Song"
    const byMatch = cleaned.match(/^(.+?)\s+by\s+([^-]+)$/i);
    if (byMatch && byMatch[1].trim().length > 0) {
      const songPart = byMatch[1].trim()
        .replace(/^["'`]+|["'`]+$/g, '') // Remove quotes
        .trim();
      if (songPart.length >= 2) {
        return songPart;
      }
    }
    
    // Pattern 3: "Song (Artist)" → extract "Song"
    const parenthesesMatch = cleaned.match(/^(.+?)\s*\(\s*([^)]+)\s*\)$/);
    if (parenthesesMatch && parenthesesMatch[1].trim().length > 0) {
      const songPart = parenthesesMatch[1].trim()
        .replace(/^["'`]+|["'`]+$/g, '') // Remove quotes
        .trim();
      // Check if what's in parentheses looks like an artist name
      const artistPart = parenthesesMatch[2].trim();
      if (songPart.length >= 2 && artistPart.length >= 2) {
        return songPart;
      }
    }
    
    // Pattern 4: Remove common artist patterns from the beginning (including variants)
    const cleanedFromArtist = cleaned
      .replace(/^(BTS|BLACKPINK|IU|TWICE|Red Velvet|aespa|NewJeans|IVE|ITZY|SEVENTEEN|Stray Kids|ENHYPEN|TXT|NMIXX|LE SSERAFIM|GIDLE|ATEEZ|NCT|SuperM|EXO|SNSD|Girls Generation|f\(x\)|SHINee|BIGBANG|2NE1|Wonder Girls|Kara|T-ara|SISTAR|miss A|AOA|MAMAMOO|GFRIEND|Oh My Girl|LOONA|WJSN|fromis_9|IZONE|Wanna One|IOI|X1|Produce|KARA|4Minute|Secret|Rainbow|After School|Brown Eyed Girls|Davichi|Jewelry|S\.E\.S|Fin\.K\.L|Baby V\.O\.X)\s*[-:]?\s*/i, '')
      .replace(/^(.*?Kpop.*?Demon.*?Hunters?|.*?K-?pop.*?Demon.*?Hunters?|TakedownKPop.*?Demon.*?Hunters?|Your.*?IdolKPop.*?Demon.*?Hunters?)\s*[-:]?\s*/i, '') // Remove various Demon Hunters variants
      .replace(/^["'`]+|["'`]+$/g, '') // Remove quotes at start/end
      .trim();
    
    if (cleanedFromArtist.length >= 2 && cleanedFromArtist !== cleaned) {
      return cleanedFromArtist;
    }
    
    // Final quote cleanup
    const finalClean = cleaned.replace(/^["'`]+|["'`]+$/g, '').trim();
    
    return finalClean;
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
  private extractArtist(title: string, channelTitle: string): string {
    // Clean the title first
    const cleanedTitle = title
      .replace(/\s*\[.*?\]\s*/g, '') // Remove [brackets]
      .replace(/\s*\(.*?\)\s*/g, '') // Remove (parentheses)  
      .replace(/\s*\|.*$/g, '')      // Remove | and everything after
      .replace(/\s*-\s*Official.*$/i, '') // Remove "- Official Video" etc.
      .replace(/\s*MV\s*/i, '')      // Remove MV
      .trim();
    
    // Try to extract artist from title pattern "Artist - Song"
    const dashMatch = cleanedTitle.match(/^([^-]+)\s*-\s*(.+)$/);
    if (dashMatch && dashMatch[1].trim().length > 0 && dashMatch[2].trim().length > 0) {
      const artist = dashMatch[1].trim();
      // Make sure it's not just numbers or weird characters
      if (artist.length >= 2 && /[a-zA-Z]/.test(artist)) {
        return artist;
      }
    }
    
    // Try pattern "Song by Artist"
    const byMatch = cleanedTitle.match(/(.+)\s+by\s+([^-]+)$/i);
    if (byMatch && byMatch[2].trim().length > 0) {
      return byMatch[2].trim();
    }
    
    // Clean up channel title as fallback
    const cleanedChannel = channelTitle
      .replace(/\s*(Official|OFFICIAL|Channel|VEVO|Records?|Music|Entertainment|Production)\s*/gi, '')
      .replace(/\s*-.*$/g, '') // Remove everything after dash
      .trim();
    
    // If channel is too generic or empty, try to guess from title
    if (cleanedChannel.length < 2 || 
        /^(various|music|songs|hits|playlist|compilation)$/i.test(cleanedChannel)) {
      
      // Try to extract any capitalized words from title as artist
      const words = cleanedTitle.split(/[\s-]+/).filter(word => 
        word.length >= 2 && 
        word[0] === word[0].toUpperCase() &&
        !/^(the|and|or|but|in|on|at|to|for|of|with|by)$/i.test(word)
      );
      
      if (words.length > 0) {
        return words.slice(0, 2).join(' '); // Take first 1-2 words
      }
    }
    
    return cleanedChannel || 'Unknown Artist';
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