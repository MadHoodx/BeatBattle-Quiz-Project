/**
 * 🎵 Simple Music Data Management System
 * Using simple YouTube Playlist integration
 */

import { 
  YouTubePlaylistService, 
  Song as PlaylistSong, 
  PlaylistResponse,
  getSongsByCategory as getPlaylistSongs 
} from '@/services/youtube-playlist';
import { AVAILABLE_CATEGORIES, CONFIG } from '@/config/playlists';

export interface Song {
  videoId: string;
  title: string;
  artist: string;
  startTime?: number;
  endTime?: number;
  thumbnail?: string;
  playlistSource?: string;
  position?: number;
}

export interface QuizQuestion {
  videoId: string;
  title: string;
  artist: string;
  choices: string[];
  correctAnswer: number;
  startTime: number;
  endTime: number;
}

export interface DataSourceInfo {
  source: 'playlist' | 'cache' | 'fallback';
  lastUpdated: string;
  totalSongs: number;
  category: string;
  playlistId?: string;
  error?: string;
}

// 🎯 Category definitions - now supports dynamic playlists
export const CATEGORIES = {
  kpop: 'K-Pop',
  jpop: 'Anime', 
  thai: 'Thai Pop',
  western: 'Western',
  kdrama: 'K-Drama OST',
  // Removed 'rock' category due to errors; add it back only when playlists and mappings are ready
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

// 🚀 Initialize simple playlist service
const playlistService = new YouTubePlaylistService(
  process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
  process.env.NODE_ENV as 'development' | 'production'
);

/**
 * 🎵 Get songs by category - SIMPLE VERSION
 */
export async function getSongsByCategory(
  category: string = 'kpop', 
  options?: {
    maxResults?: number;
    useCache?: boolean;
    fallbackEnabled?: boolean;
  }
): Promise<{ songs: Song[]; info: DataSourceInfo }> {
  const { 
    maxResults = CONFIG.maxSongsPerCategory, 
    useCache = true, 
    fallbackEnabled = true
  } = options || {};

  try {
    // Use simple playlist service
    const response = await playlistService.getSongsByCategory(category, {
      maxResults,
      useCache,
      fallbackEnabled
    });

    return {
      songs: response.songs,
      info: {
        source: response.source,
        lastUpdated: response.lastUpdated,
        totalSongs: response.totalCount,
        category,
        playlistId: response.playlistId,
        error: response.error
      }
    };
  } catch (error) {
    console.error(`Error getting songs for ${category}:`, error);
    
    // Fallback to static data
    return {
      songs: await getFallbackSongs(category),
      info: {
        source: 'fallback',
        lastUpdated: new Date().toISOString(),
        totalSongs: 0,
        category,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * 🎵 Get fallback songs from mock data
 */
async function getFallbackSongs(category: string): Promise<Song[]> {
  try {
    // Use mockVideos.json as fallback data for all categories
    const { default: mockSongs } = await import('./mockVideos.json');
    
    return mockSongs.map((song: any) => ({
      videoId: song.videoId,
      title: song.title,
      artist: song.artist,
      startTime: song.startTime || 30,
      endTime: song.endTime || 60,
      thumbnail: song.thumbnail || `https://i.ytimg.com/vi/${song.videoId}/mqdefault.jpg`
    }));
  } catch (error) {
    console.error(`Error loading fallback songs:`, error);
    
    // Ultimate fallback: return some hardcoded songs
    return [
      {
        videoId: 'dQw4w9WgXcQ',
        title: 'Sample Song 1',
        artist: 'Sample Artist',
        startTime: 30,
        endTime: 60,
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg'
      },
      {
        videoId: 'oHg5SJYRHA0',
        title: 'Sample Song 2', 
        artist: 'Sample Artist',
        startTime: 30,
        endTime: 60,
        thumbnail: 'https://i.ytimg.com/vi/oHg5SJYRHA0/mqdefault.jpg'
      },
      {
        videoId: 'L_jWHffIx5E',
        title: 'Sample Song 3',
        artist: 'Sample Artist', 
        startTime: 30,
        endTime: 60,
        thumbnail: 'https://i.ytimg.com/vi/L_jWHffIx5E/mqdefault.jpg'
      }
    ];
  }
}

/**
 * 📊 Get category statistics
 */
export async function getCategoryStats(category: string): Promise<{
  count: number;
  source: string;
  lastUpdated: string;
}> {
  try {
    const result = await getSongsByCategory(category, { 
      maxResults: 1,
      useCache: false,
      fallbackEnabled: true // ให้ fallback เมื่อ playlist ไม่ถูกต้อง
    });
    return {
      count: result.info.totalSongs || 0,
      source: result.info.source,
      lastUpdated: result.info.lastUpdated
    };
  } catch (error) {
    return {
      count: 0,
      source: 'error',
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * 📝 Get all available categories
 */
export function getAllCategories() {
  return Object.entries(CATEGORIES).map(([key, name]) => ({
    key,
    name,
    available: true
  }));
}

/**
 * 🎯 Generate random timing for quiz question
 */
function getRandomTiming(title: string, questionIndex: number = 0): { startTime: number; endTime: number } {
  // Check if it's a lyrics video
  const isLyricsVideo = /lyrics?|lyric|가사|歌詞/i.test(title);
  
  // Check if it's a ballad
  const isBallad = /ballad|slow|acoustic|piano|love|heart|sad|감성|느린/i.test(title);
  
  // Check if it's K-pop
  const isKpop = /[\u3131-\u318F\uAC00-\uD7A3]|kpop|k-pop|korean/i.test(title);
  
  let minStart, maxStart;
  const duration = 30; // Always 30 seconds duration
  
  if (isLyricsVideo) {
    // Lyrics videos usually start immediately
    minStart = 5;
    maxStart = 40;
  } else if (isBallad) {
    // Ballads often have longer intros
    minStart = 30;
    maxStart = 90;
  } else if (isKpop) {
    // K-pop often has distinctive hooks
    minStart = 25;
    maxStart = 80;
  } else {
    // General pop songs
    minStart = 20;
    maxStart = 70;
  }
  
  // Add some randomness based on question index and current time
  const timeVariation = (Date.now() + questionIndex * 1000) % 10; // 0-9 seconds variation
  
  // Random start time within the range
  const baseStart = Math.floor(Math.random() * (maxStart - minStart + 1)) + minStart;
  const startTime = Math.max(5, baseStart + timeVariation); // Ensure minimum 5 seconds
  const endTime = startTime + duration;
  
  return { startTime, endTime };
}

/**
 * 🔄 Generate quiz questions from songs
 */
export async function generateQuizQuestions(
  category: string = 'kpop',
  count: number = 10
): Promise<QuizQuestion[]> {
  console.log(`🎵 Getting songs from multi-category system for: ${category}`);
  
  const { songs } = await getSongsByCategory(category, { 
    maxResults: Math.max(50, count * 8) // Get more songs for better choices (minimum 50, or 8x the question count)
  });

  console.log(`📍 Found ${songs.length} songs for category: ${category}`);
  console.log(`🎵 Generated ${count} questions`);

  if (songs.length < count) {
    throw new Error(`Not enough songs found for category: ${category}`);
  }

  const questions: QuizQuestion[] = [];
  const selectedSongTitles: string[] = [];

  // Helper: Fisher-Yates shuffle
  const shuffle = <T,>(arr: T[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Shuffle songs once
  const pool = shuffle(songs);

  // Stride-based sampling: choose evenly spaced indices across the pool so small samples cover the full list
  const poolSize = pool.length;
  const sampleCount = Math.min(count, poolSize);
  const step = Math.max(1, Math.floor(poolSize / sampleCount));
  const start = Math.floor(Math.random() * Math.max(1, step));

  // Build a title pool for wrong choices grouped by artist for smarter selection
  const titlesByArtist: Record<string, string[]> = {};
  for (const s of pool) {
    const artist = (s.artist || 'unknown').toString();
    if (!titlesByArtist[artist]) titlesByArtist[artist] = [];
    if (s.title && s.title.trim().length > 0) titlesByArtist[artist].push(s.title);
  }

  const allTitles = Array.from(new Set(pool.map(s => s.title).filter(Boolean)));

  for (let k = 0; questions.length < sampleCount && k < sampleCount; k++) {
    const idx = (start + k * step) % poolSize;
    const correctSong = pool[idx];
    if (!correctSong || !correctSong.videoId) continue;

    selectedSongTitles.push(correctSong.title);

    // Try to pick wrong choices from different artists first
    const wrongChoices: string[] = [];
    const artists = Object.keys(titlesByArtist).filter(a => a !== (correctSong.artist || 'unknown'));
    const shuffledArtists = shuffle(artists);

    for (let i = 0; i < shuffledArtists.length && wrongChoices.length < 3; i++) {
      const poolTitles = titlesByArtist[shuffledArtists[i]] || [];
      for (const t of shuffle(poolTitles)) {
        if (t !== correctSong.title && !wrongChoices.includes(t)) {
          wrongChoices.push(t);
          break;
        }
      }
    }

    // Fill remaining slots from global title pool
    const shuffledAll = shuffle(allTitles.filter(t => t !== correctSong.title && !wrongChoices.includes(t)));
    for (let i = 0; i < shuffledAll.length && wrongChoices.length < 3; i++) {
      wrongChoices.push(shuffledAll[i]);
    }

    while (wrongChoices.length < 3) wrongChoices.push(`Option ${wrongChoices.length + 1}`);

    const choices = shuffle([correctSong.title, ...wrongChoices.slice(0, 3)]);
    const correctAnswer = choices.indexOf(correctSong.title);

    const timing = getRandomTiming(correctSong.title, questions.length);

    questions.push({
      videoId: correctSong.videoId,
      title: correctSong.title,
      artist: correctSong.artist,
      choices,
      correctAnswer,
      startTime: timing.startTime,
      endTime: timing.endTime
    });
  }

  // Log selected songs
  console.log(`🎵 Selected songs: ${selectedSongTitles.join(', ')}`);

  return questions;
}

/**
 * 🔧 Simple utilities for managing data
 */
export const DataUtils = {
  // Clear cache (simple version)
  clearCache: () => {
    if (typeof window !== 'undefined') {
      playlistService.clearCache();
    }
  },
  
  // Get cache stats
  getCacheStats: () => {
    if (typeof window !== 'undefined') {
      const stats = playlistService.getCacheStats();
      return {
        size: stats.size || 0,
        entries: stats.entries || [],
        hitRate: 0 // Default hit rate เพื่อป้องกัน undefined
      };
    }
    return { 
      size: 0, 
      entries: [],
      hitRate: 0
    };
  },
  
  // Refresh category
  refreshCategory: async (category: string) => {
    const result = await getSongsByCategory(category, { useCache: false });
    return {
      songs: result.songs,
      info: result.info
    };
  },
  
  // Get data source info
  getDataSourceInfo: async (category: string): Promise<DataSourceInfo> => {
    // Bypass cache to ensure up-to-date info (useCache: false)
    const { info } = await getSongsByCategory(category, { maxResults: 1, useCache: false });
    return info;
  }
};