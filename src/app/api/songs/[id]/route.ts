/**
 * Song API - PUT /api/songs/[id]
 * Update or delete a specific song (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateSong, deleteSong, getSongById } from '@/lib/songs';
import { isValidCategory } from '@/types/songs';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const song = await getSongById(params.id);
    
    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ song });
  } catch (error) {
    console.error('Error in GET /api/songs/[id]:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch song',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();

    // Validate category if provided
    if (body.category && !isValidCategory(body.category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be one of: kpop, jpop, thaipop, pophits, kdramaost' },
        { status: 400 }
      );
    }

    // Validate override fields if provided
    if (body.override_title !== undefined && !body.override_title?.trim()) {
      return NextResponse.json(
        { error: 'override_title cannot be empty' },
        { status: 400 }
      );
    }

    if (body.override_artist !== undefined && !body.override_artist?.trim()) {
      return NextResponse.json(
        { error: 'override_artist cannot be empty' },
        { status: 400 }
      );
    }

    const song = await updateSong(params.id, {
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
    });
  } catch (error) {
    console.error('Error in PUT /api/songs/[id]:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to update song',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await deleteSong(params.id);

    return NextResponse.json({
      success: true,
      message: 'Song deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/songs/[id]:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to delete song',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}