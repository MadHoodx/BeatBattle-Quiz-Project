/**
 * React Hook for fetching songs from Supabase
 * Provides clean interface for the quiz game frontend
 */

import { useState, useEffect, useCallback } from 'react';
import { Song, SongCategory, SongsResponse } from '@/types/songs';

interface UseSongsOptions {
  category?: SongCategory;
  limit?: number;
  offset?: number;
  search?: string;
  autoFetch?: boolean;
}

interface UseSongsReturn {
  songs: Song[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  refetch: () => Promise<void>;
  fetchMore: () => Promise<void>;
  reset: () => void;
}

/**
 * Hook for fetching songs with built-in loading, error, and pagination state
 */
export function useSongs(options: UseSongsOptions = {}): UseSongsReturn {
  const {
    category,
    limit = 20,
    offset = 0,
    search,
    autoFetch = true
  } = options;

  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(offset);

  const fetchSongs = useCallback(async (newOffset = 0, append = false) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      params.append('limit', limit.toString());
      params.append('offset', newOffset.toString());
      if (search) params.append('search', search);

      const response = await fetch(`/api/songs?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data: SongsResponse = await response.json();

      if (append) {
        setSongs(prev => [...prev, ...data.songs]);
      } else {
        setSongs(data.songs);
      }
      
      setTotal(data.total);
      setCurrentOffset(newOffset);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch songs';
      setError(errorMessage);
      console.error('Error fetching songs:', err);
    } finally {
      setLoading(false);
    }
  }, [category, limit, search, loading]);

  const refetch = useCallback(async () => {
    await fetchSongs(0, false);
  }, [fetchSongs]);

  const fetchMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const nextOffset = currentOffset + limit;
    await fetchSongs(nextOffset, true);
  }, [fetchSongs, currentOffset, limit, loading]);

  const reset = useCallback(() => {
    setSongs([]);
    setTotal(0);
    setCurrentOffset(0);
    setError(null);
  }, []);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      reset();
      fetchSongs(0, false);
    }
  }, [category, search, autoFetch, limit]); // Note: deliberately not including fetchSongs to avoid infinite loop

  const hasMore = currentOffset + songs.length < total;

  return {
    songs,
    loading,
    error,
    total,
    hasMore,
    refetch,
    fetchMore,
    reset
  };
}

/**
 * Hook for fetching songs by specific category
 */
export function useSongsByCategory(category: SongCategory, limit = 20) {
  return useSongs({ category, limit });
}

/**
 * Hook for searching songs
 */
export function useSearchSongs(search: string, limit = 20) {
  return useSongs({ search, limit, autoFetch: !!search.trim() });
}

/**
 * Hook for fetching random songs for quiz
 */
export function useQuizSongs(category?: SongCategory, count = 10) {
  const [quizSongs, setQuizSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuizSongs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch more songs than needed and randomly select from them
      const fetchCount = Math.max(count * 3, 50); // Fetch 3x the needed amount for randomization
      const { songs } = useSongs({ category, limit: fetchCount, autoFetch: false });
      
      if (songs.length === 0) {
        throw new Error('No songs available for quiz');
      }

      // Randomly select songs
      const shuffled = [...songs].sort(() => Math.random() - 0.5);
      setQuizSongs(shuffled.slice(0, count));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch quiz songs';
      setError(errorMessage);
      console.error('Error fetching quiz songs:', err);
    } finally {
      setLoading(false);
    }
  }, [category, count]);

  useEffect(() => {
    fetchQuizSongs();
  }, [fetchQuizSongs]);

  return {
    songs: quizSongs,
    loading,
    error,
    refetch: fetchQuizSongs
  };
}

/**
 * Hook for getting songs count by category
 */
export function useSongsStats() {
  const [stats, setStats] = useState<Record<SongCategory, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // We'll fetch a summary from each category
      const categories: SongCategory[] = ['kpop', 'jpop', 'thaipop', 'pophits', 'kdramaost'];
      const promises = categories.map(async (cat) => {
        const response = await fetch(`/api/songs?category=${cat}&limit=1`);
        if (!response.ok) throw new Error(`Failed to fetch ${cat} stats`);
        const data: SongsResponse = await response.json();
        return { category: cat, total: data.total };
      });

      const results = await Promise.all(promises);
      const newStats = results.reduce((acc, result) => {
        acc[result.category] = result.total;
        return acc;
      }, {} as Record<SongCategory, number>);

      setStats(newStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stats';
      setError(errorMessage);
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
}