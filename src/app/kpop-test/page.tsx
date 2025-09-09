import { Suspense } from 'react'

interface VideoData {
  videoId: string
  title: string
  channelTitle: string
  thumbnail: string
  publishedAt: string
}

interface TestResult {
  success: boolean
  message: string
  searchQuery: string
  totalResults: number
  sampleVideos: VideoData[]
  testEmbed?: {
    videoId: string
    embedUrl: string
    title: string
  }
  error?: string
  details?: any
}

async function getKPopTestData(): Promise<TestResult> {
  try {
    const response = await fetch('http://localhost:3000/api/youtube/kpop-test')
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      message: 'Failed to fetch test data',
      searchQuery: '',
      totalResults: 0,
      sampleVideos: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

function YouTubeEmbed({ videoId, title }: { videoId: string, title: string }) {
  return (
    <div className="bg-gray-900 p-4 rounded-lg">
      <h4 className="text-white mb-2">Test Embed:</h4>
      <p className="text-gray-300 text-sm mb-3">{title}</p>
      <iframe
        width="100%"
        height="200"
        src={`https://www.youtube.com/embed/${videoId}?start=30&end=60&autoplay=0`}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="rounded"
      />
      <p className="text-yellow-400 text-xs mt-2">
        🎵 Playing 30-60 seconds (quiz preview simulation)
      </p>
    </div>
  )
}

async function TestResults() {
  const data = await getKPopTestData()

  if (!data.success) {
    return (
      <div className="bg-red-900 p-6 rounded-lg">
        <h3 className="text-red-300 text-lg font-semibold mb-2">❌ Test Failed</h3>
        <p className="text-red-200 mb-2">{data.error || data.message}</p>
        {data.details && (
          <pre className="text-red-100 text-xs bg-red-950 p-3 rounded overflow-auto">
            {JSON.stringify(data.details, null, 2)}
          </pre>
        )}
        
        {data.error?.includes('API key') && (
          <div className="mt-4 p-4 bg-yellow-900 rounded border border-yellow-600">
            <h4 className="text-yellow-300 font-semibold mb-2">🔑 Setup Required:</h4>
            <ol className="text-yellow-200 text-sm space-y-1">
              <li>1. Go to <a href="https://console.cloud.google.com/" className="text-blue-300 underline">Google Cloud Console</a></li>
              <li>2. Create new project or select existing one</li>
              <li>3. Enable "YouTube Data API v3"</li>
              <li>4. Create API Key in Credentials</li>
              <li>5. Add to .env.local: YOUTUBE_API_KEY=your_key_here</li>
              <li>6. Restart development server</li>
            </ol>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="bg-green-900 p-6 rounded-lg">
        <h3 className="text-green-300 text-lg font-semibold mb-2">✅ K-Pop API Test Success!</h3>
        <p className="text-green-200">{data.message}</p>
        <div className="mt-3 text-green-100 text-sm">
          <p>Search Query: <span className="font-mono bg-green-950 px-2 py-1 rounded">{data.searchQuery}</span></p>
          <p>Results Found: <span className="font-semibold">{data.totalResults}</span></p>
        </div>
      </div>

      {/* YouTube Embed Test */}
      {data.testEmbed && (
        <YouTubeEmbed 
          videoId={data.testEmbed.videoId} 
          title={data.testEmbed.title}
        />
      )}

      {/* Sample Videos */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h4 className="text-white text-lg font-semibold mb-4">Sample K-Pop Videos Found:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.sampleVideos.map((video, index) => (
            <div key={video.videoId} className="bg-gray-900 p-4 rounded-lg">
              <div className="flex space-x-3">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-20 h-15 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <h5 className="text-white text-sm font-medium truncate">{video.title}</h5>
                  <p className="text-gray-400 text-xs">{video.channelTitle}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(video.publishedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Response */}
      <div className="bg-gray-900 p-6 rounded-lg">
        <h4 className="text-white text-lg font-semibold mb-4">Raw API Response:</h4>
        <pre className="text-gray-300 text-xs bg-black p-4 rounded overflow-auto max-h-64">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export default function KPopTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2 text-center">
            🎵 K-Pop YouTube API Test
          </h1>
          <p className="text-gray-300 text-center mb-8">
            Testing YouTube integration for BeatBattle Quiz
          </p>
          
          <Suspense fallback={
            <div className="bg-gray-800 p-6 rounded-lg text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-gray-300">Testing YouTube API...</p>
            </div>
          }>
            <TestResults />
          </Suspense>

          <div className="mt-8 text-center">
            <a 
              href="/"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
