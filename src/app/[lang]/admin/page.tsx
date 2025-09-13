/**
 * 🎛️ Admin Panel for Playlist Management
 * Dashboard for managing YouTube playlists
 */

'use client';

import React, { useState, useEffect, use } from 'react';
import { 
  getSongsByCategory, 
  getAllCategories, 
  getCategoryStats,
  DataUtils,
  type DataSourceInfo,
  CATEGORIES 
} from '@/data';
import { YouTubePlaylistService } from '../../../services/youtube-playlist';
import { PLAYLIST_IDS } from '@/config/playlists';

interface CategoryStatus {
  category: string;
  name: string;
  available: boolean;
  songCount: number;
  source: string;
  lastUpdated: string;
  playlistId?: string;
  error?: string;
}

interface SystemHealth {
  totalCategories: number;
  workingCategories: number;
  cacheHitRate: number;
  totalCachedSongs: number;
  apiQuotaUsed: number;
}

interface AdminPanelProps {
  params: Promise<{
    lang: string;
  }>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ params }) => {
  const { lang } = use(params);
  const [categoryStatuses, setCategoryStatuses] = useState<CategoryStatus[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Initialize playlist service
  const playlistService = new YouTubePlaylistService(
    process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
    process.env.NODE_ENV as 'development' | 'production'
  );

  // 📊 Load initial data
  useEffect(() => {
    loadAdminData();
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]);
  };

  const loadAdminData = async () => {
    setLoading(true);
    addLog('🔄 Loading admin dashboard data...');

    try {
      // Get all categories
      const categories = getAllCategories();
      const statuses: CategoryStatus[] = [];

      // Load each category status
      for (const category of categories) {
        try {
          const stats = await getCategoryStats(category.key);
          const sourceInfo = await DataUtils.getDataSourceInfo(category.key);
          
          statuses.push({
            category: category.key,
            name: category.name,
            available: category.available,
            songCount: stats.count,
            source: stats.source,
            lastUpdated: stats.lastUpdated,
            playlistId: sourceInfo?.playlistId,
            error: sourceInfo?.error
          });
          
          addLog(`✅ Loaded ${category.name}: ${stats.count} songs from ${stats.source}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          statuses.push({
            category: category.key,
            name: category.name,
            available: false,
            songCount: 0,
            source: 'error',
            lastUpdated: new Date().toISOString(),
            error: errorMessage
          });
          
          addLog(`⚠️ ${category.name}: ${errorMessage}`);
        }
      }

      setCategoryStatuses(statuses);

      // Calculate system health
      const cacheStats = DataUtils.getCacheStats();
      const workingCategories = statuses.filter(s => s.songCount > 0).length;
      
      setSystemHealth({
        totalCategories: categories.length,
        workingCategories,
        cacheHitRate: cacheStats.hitRate || 0, 
        totalCachedSongs: statuses.reduce((sum, s) => sum + (s.songCount || 0), 0),
        apiQuotaUsed: 0 
      });

      addLog(`🎯 System health: ${workingCategories}/${categories.length} categories working`);
      
    } catch (error) {
      addLog(`💥 Critical error loading admin data: ${error}`);
    }

    setLoading(false);
  };

  const refreshCategory = async (category: string) => {
    setRefreshing(category);
    addLog(`🔄 Refreshing category: ${category}`);

    try {
      const result = await DataUtils.refreshCategory(category);
      addLog(`✅ Refreshed ${category}: ${result.songs.length} songs from ${result.info.source}`);
      
      // Update status
      setCategoryStatuses(prev => 
        prev.map(status => 
          status.category === category 
            ? {
                ...status,
                songCount: result.songs.length,
                source: result.info.source,
                lastUpdated: result.info.lastUpdated,
                error: result.info.error
              }
            : status
        )
      );
    } catch (error) {
      addLog(`❌ Failed to refresh ${category}: ${error}`);
    }

    setRefreshing(null);
  };

  const clearAllCache = async () => {
    addLog('🗑️ Clearing all cache data...');
    await DataUtils.clearCache();
    addLog('✅ Cache cleared successfully');
    loadAdminData();
  };

  const validatePlaylist = async (playlistId: string) => {
    addLog(`🔍 Validating playlist: ${playlistId}`);
    
    try {
      const result = await playlistService.validatePlaylist(playlistId);
      if (result.valid) {
        addLog(`✅ Playlist ${playlistId} is valid and accessible`);
      } else {
        addLog(`❌ Playlist ${playlistId} validation failed: ${result.error}`);
      }
    } catch (error) {
      addLog(`💥 Error validating playlist: ${error}`);
    }
  };

  const getStatusColor = (status: CategoryStatus) => {
    if (status.error) return 'bg-red-50 border-red-300 border-2';
    if (status.source === 'playlist') return 'bg-green-50 border-green-300 border-2';
    if (status.source === 'cache') return 'bg-blue-50 border-blue-300 border-2';
    if (status.source === 'fallback') return 'bg-orange-50 border-orange-300 border-2';
    return 'bg-slate-50 border-slate-300 border-2';
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'playlist': return '🎵';
      case 'cache': return '💾';
      case 'fallback': return '🔄';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-300">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">
            🎛️ BeatBattle Admin Dashboard
          </h1>
          <p className="text-gray-300">
            Professional playlist management system ({lang})
          </p>
        </div>

        {/* System Health */}
        {systemHealth && (
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-white">📊 System Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <div className="text-2xl font-bold text-blue-400">
                  {systemHealth.workingCategories}/{systemHealth.totalCategories}
                </div>
                <div className="text-sm text-gray-300">Categories Working</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <div className="text-2xl font-bold text-green-400">
                  {systemHealth.cacheHitRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-300">Cache Hit Rate</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <div className="text-2xl font-bold text-purple-400">
                  {systemHealth.totalCachedSongs.toLocaleString()}
                </div>
                <div className="text-sm text-gray-300">Total Songs</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <div className="text-2xl font-bold text-orange-400">
                  {systemHealth.apiQuotaUsed}
                </div>
                <div className="text-sm text-gray-300">API Quota Used</div>
              </div>
            </div>
          </div>
        )}

        {/* Playlist Configuration Status */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-white">🎯 Playlist Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Object.entries(PLAYLIST_IDS).map(([category, playlistId]) => {
              const isConfigured = !playlistId.includes('PLxxxxxxxxxxxxxxxxxxxxxx');
              const categoryName = CATEGORIES[category as keyof typeof CATEGORIES] || category;
              
              return (
                <div 
                  key={category}
                  className={`p-4 rounded-lg border-2 ${
                    isConfigured 
                      ? 'bg-green-900 border-green-500' 
                      : 'bg-red-900 border-red-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">{categoryName}</h3>
                    <span className="text-2xl">{isConfigured ? '✅' : '❌'}</span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Status:</span>
                      <span className={`font-mono ${isConfigured ? 'text-green-400' : 'text-red-400'}`}>
                        {isConfigured ? 'Configured' : 'Needs Setup'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 break-all">
                      ID: {playlistId.substring(0, 20)}...
                    </div>
                    {!isConfigured && (
                      <div className="mt-2 p-2 bg-yellow-900 rounded text-yellow-300 text-xs">
                        ⚠️ Please set actual YouTube playlist ID in playlists.ts
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-white">🔧 Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadAdminData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              🔄 Refresh All Data
            </button>
            <button
              onClick={clearAllCache}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              🗑️ Clear Cache
            </button>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-600 bg-gray-700 text-white rounded-lg px-3 py-2"
            >
              <option value="">Select Category</option>
              {categoryStatuses.map(status => (
                <option key={status.category} value={status.category}>
                  {status.name}
                </option>
              ))}
            </select>
            {selectedCategory && (
              <button
                onClick={() => refreshCategory(selectedCategory)}
                disabled={refreshing === selectedCategory}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
              >
                {refreshing === selectedCategory ? '⏳' : '🔄'} Refresh Category
              </button>
            )}
          </div>
        </div>

        {/* Playlist Configuration Status */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-white">⚙️ Playlist Configuration</h2>
          <div className="space-y-3">
            {Object.entries(PLAYLIST_IDS).map(([category, playlistId]) => (
              <div key={category} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {playlistId.includes('PLxxxxxxxxxxxxxxxxxxxxxx') ? '❌' : '✅'}
                  </span>
                  <div>
                    <span className="text-white font-medium">{CATEGORIES[category as keyof typeof CATEGORIES] || category}</span>
                    <div className="text-xs text-gray-400 font-mono">{playlistId}</div>
                  </div>
                </div>
                <div className="text-right">
                  {playlistId.includes('PLxxxxxxxxxxxxxxxxxxxxxx') ? (
                    <span className="bg-orange-600 text-white px-2 py-1 rounded text-xs">Not Configured</span>
                  ) : (
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">Configured</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-900 rounded-lg">
            <p className="text-blue-200 text-sm">
              💡 <strong>How to configure:</strong> Edit <code className="bg-blue-800 px-1 rounded">src/config/playlists.ts</code> and replace 
              <code className="bg-blue-800 px-1 rounded">PLxxxxxxxxxxxxxxxxxxxxxx</code> with your actual YouTube playlist IDs.
            </p>
          </div>
        </div>

        {/* Category Status */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-white">🎵 Category Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {categoryStatuses.map(status => (
              <div 
                key={status.category}
                className="p-4 rounded-lg bg-gray-700 border-2 border-gray-600"
                style={{
                  backgroundColor: status.error ? '#450a0a' : 
                                 status.source === 'playlist' ? '#0a1f0a' :
                                 status.source === 'cache' ? '#0a0f1f' :
                                 status.source === 'fallback' ? '#1f150a' : '#1f1f1f',
                  borderColor: status.error ? '#ef4444' :
                              status.source === 'playlist' ? '#22c55e' :
                              status.source === 'cache' ? '#3b82f6' :
                              status.source === 'fallback' ? '#f97316' : '#64748b',
                  borderWidth: '2px',
                  borderStyle: 'solid'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white">{status.name}</h3>
                  <span className="text-2xl">{getSourceIcon(status.source)}</span>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Songs:</span>
                    <span className="font-mono text-white">{status.songCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Source:</span>
                    <span className="font-mono text-white">{status.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Updated:</span>
                    <span className="font-mono text-white">
                      {new Date(status.lastUpdated).toLocaleTimeString()}
                    </span>
                  </div>
                  {status.playlistId && (
                    <div className="mt-2">
                      <button
                        onClick={() => validatePlaylist(status.playlistId!)}
                        className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded"
                      >
                        🔍 Validate Playlist
                      </button>
                    </div>
                  )}
                  {status.error && (
                    <div className="mt-2 p-2 bg-red-900 rounded text-red-300 text-xs">
                      ⚠️ {status.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Logs */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-white">📝 System Logs</h2>
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto border border-gray-700">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-500">No logs yet...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;