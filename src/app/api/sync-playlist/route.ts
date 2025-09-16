/**
 * Sync Playlist API - POST /api/sync-playlist
 * Batch import/update songs from playlist data (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { upsertSongFromPlaylistItem } from '@/lib/songs';
import { SyncPlaylistRequest, SyncPlaylistResponse, isValidCategory, isValidSourceProvider } from '@/types/songs';
import { verifyAdminFromRequest } from '@/lib/admin';

export async function POST(request: NextRequest) {
  try {
    await verifyAdminFromRequest(request);
  } catch (err: any) {
    console.warn('Unauthorized sync-playlist request (batch):', err?.message || err);
    const status = err?.status || 401;
    return NextResponse.json({ error: err?.message || 'Unauthorized' }, { status });
  }
  try {
    const body: SyncPlaylistRequest = await request.json();

    // Validate request body
    if (!body.category || !isValidCategory(body.category)) {
      return NextResponse.json(
        { error: 'Valid category is required (kpop, jpop, thaipop, pophits, kdramaost)' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required and cannot be empty' },
        { status: 400 }
      );
    }

    const stats = {
      total_items: body.items.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };

    const errors: Array<{ item: any; error: string }> = [];
    const forceUpdateOverrides = body.force_update_overrides || false;

    console.log(`🎵 Starting playlist sync for ${body.category} with ${body.items.length} items`);

    // Process each item
    for (const item of body.items) {
      try {
        // Validate item
        if (!item.source_id?.trim()) {
          errors.push({ item, error: 'source_id is required' });
          stats.errors++;
          continue;
        }

        if (!isValidSourceProvider(item.source_provider)) {
          errors.push({ item, error: 'Invalid source_provider' });
          stats.errors++;
          continue;
        }

        // Set category from request
        const itemWithCategory = {
          ...item,
          category: body.category
        };

        const result = await upsertSongFromPlaylistItem(itemWithCategory, forceUpdateOverrides);
        
        if (result.created) {
          stats.created++;
          console.log(`✅ Created: ${result.song.title} by ${result.song.artist}`);
        } else {
          stats.updated++;
          console.log(`📝 Updated: ${result.song.title} by ${result.song.artist}`);
        }
      } catch (error) {
        console.error(`❌ Error processing item ${item.source_id}:`, error);
        errors.push({ 
          item, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        stats.errors++;
      }
    }

    console.log(`🎵 Playlist sync completed:`, stats);

    const response: SyncPlaylistResponse = {
      success: stats.errors === 0,
      message: `Processed ${stats.total_items} items: ${stats.created} created, ${stats.updated} updated, ${stats.errors} errors`,
      stats,
      ...(errors.length > 0 && { errors })
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in POST /api/sync-playlist:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to sync playlist',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}