import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const API_KEY = process.env.YOUTUBE_API_KEY

    if (!API_KEY || API_KEY === 'your_youtube_api_key_here') {
      return NextResponse.json({ 
        error: 'YouTube API key not configured',
        message: 'Please add YOUTUBE_API_KEY to your .env.local file'
      }, { status: 500 })
    }

    // Test K-Pop search
    const searchQuery = 'BTS songs'
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&` +
      `q=${encodeURIComponent(searchQuery)}&` +
      `type=video&` +
      `videoCategoryId=10&` + // Music category
      `maxResults=10&` +
      `key=${API_KEY}`

    console.log('Searching YouTube:', searchQuery)

    const response = await fetch(searchUrl)
    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ 
        error: 'YouTube API error',
        details: data
      }, { status: response.status })
    }

    // Process results
    const videos = data.items?.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url,
      publishedAt: item.snippet.publishedAt
    })) || []

    return NextResponse.json({
      success: true,
      message: 'YouTube API working for K-Pop!',
      searchQuery,
      totalResults: videos.length,
      sampleVideos: videos.slice(0, 5),
      testEmbed: videos[0] ? {
        videoId: videos[0].videoId,
        embedUrl: `https://www.youtube.com/embed/${videos[0].videoId}?start=30&end=60&autoplay=0`,
        title: videos[0].title
      } : null
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'YouTube API test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
