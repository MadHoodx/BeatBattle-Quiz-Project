/**
 * Songs API - GET /api/songs
 * Fetch songs with filtering, pagination, and search
 * Uses anonymous access (read-only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSongsByCategory } from '@/lib/songs';
import { isValidCategory } from '@/types/songs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const categoryParam = searchParams.get('category');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const searchParam = searchParams.get('search');

    // Validate and convert parameters
    const category = categoryParam && isValidCategory(categoryParam) ? categoryParam : undefined;
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10), 1), 100) : 50;
    const offset = offsetParam ? Math.max(parseInt(offsetParam, 10), 0) : 0;
    const search = searchParam?.trim() || undefined;

    // Fetch songs
    const response = await getSongsByCategory(category, limit, offset, search);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/songs:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch songs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.source_id?.trim()) {
      return NextResponse.json(
        { error: 'source_id is required' },
        { status: 400 }
      );
    }

    if (!body.override_title?.trim()) {
      return NextResponse.json(
        { error: 'override_title is required' },
        { status: 400 }
      );
    }

    if (!body.override_artist?.trim()) {
      return NextResponse.json(
        { error: 'override_artist is required' },
        { status: 400 }
      );
    }

    if (!body.category || !isValidCategory(body.category)) {
      return NextResponse.json(
        { error: 'Valid category is required (kpop, jpop, thaipop, pophits, kdramaost)' },
        { status: 400 }
      );
    }

    const { createSong } = await import('@/lib/songs');
    
    const song = await createSong({
      source_id: body.source_id,
      source_provider: body.source_provider || 'youtube',
      source_title: body.source_title,
      source_artist: body.source_artist,
      override_title: body.override_title,
      override_artist: body.override_artist,
      category: body.category,
      thumbnail_url: body.thumbnail_url,
      duration_seconds: body.duration_seconds,
      metadata: body.metadata
    });

    return NextResponse.json({
      success: true,
      song
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/songs:', error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Song with this source_id and provider already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to create song',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}