import { NextResponse } from 'next/server'
import { getYouTubeTracksFromCategory, generateYouTubeQuiz } from '@/lib/youtube'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'western'

  try {
    if (!process.env.YOUTUBE_API_KEY) {
      return NextResponse.json({ 
        error: 'YouTube API key not configured' 
      }, { status: 500 })
    }

    // Test getting tracks from category
    const tracks = await getYouTubeTracksFromCategory(category as any, 10)
    
    if (tracks.length === 0) {
      return NextResponse.json({ 
        error: 'No tracks found for category',
        category 
      }, { status: 404 })
    }

    // Generate sample quiz
    const quiz = generateYouTubeQuiz(tracks, 3)

    return NextResponse.json({
      success: true,
      message: 'YouTube API is working!',
      category,
      tracksFound: tracks.length,
      sampleTracks: tracks.slice(0, 3).map(track => ({
        title: track.title,
        channel: track.channelTitle,
        videoId: track.videoId
      })),
      sampleQuiz: quiz
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'YouTube API test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
