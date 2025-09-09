import { google } from 'googleapis'

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
})

// Music categories with YouTube search terms
export const musicCategories = {
  kpop: {
    name: "K-Pop",
    emoji: "🇰🇷",
    searchTerms: [
      "BTS songs",
      "BLACKPINK hits", 
      "NewJeans music",
      "TWICE songs",
      "Stray Kids hits",
      "ITZY songs"
    ]
  },
  jpop: {
    name: "J-Pop",
    emoji: "🇯🇵", 
    searchTerms: [
      "YOASOBI songs",
      "Official髭男dism hits",
      "LiSA anime songs",
      "Japanese pop music",
      "J-pop hits"
    ]
  },
  thai: {
    name: "Thai Pop",
    emoji: "🇹🇭",
    searchTerms: [
      "เพลงไทยฮิต",
      "Thai pop songs",
      "เพลงไทยเพราะๆ",
      "ลูกทุ่งฮิต"
    ]
  },
  western: {
    name: "Western Pop",
    emoji: "🎤",
    searchTerms: [
      "Taylor Swift songs",
      "Ed Sheeran hits",
      "Dua Lipa music",
      "The Weeknd songs",
      "Ariana Grande hits",
      "pop music 2024"
    ]
  },
  indie: {
    name: "Indie/Alternative",
    emoji: "🎸",
    searchTerms: [
      "indie rock songs",
      "alternative music",
      "indie pop hits",
      "Arctic Monkeys songs",
      "indie music 2024"
    ]
  },
  rock: {
    name: "Rock/Metal",
    emoji: "🤘",
    searchTerms: [
      "rock music hits",
      "metal songs",
      "classic rock",
      "modern rock songs",
      "rock ballads"
    ]
  }
}

export type MusicCategory = keyof typeof musicCategories

// Get random videos from YouTube for a category
export async function getYouTubeTracksFromCategory(
  category: MusicCategory,
  limit: number = 50
) {
  const categoryData = musicCategories[category]
  
  try {
    let allVideos: any[] = []
    
    // Search with random terms from the category
    const searchTerm = categoryData.searchTerms[
      Math.floor(Math.random() * categoryData.searchTerms.length)
    ]
    
    const response = await youtube.search.list({
      part: ['snippet'],
      q: searchTerm,
      type: ['video'],
      videoCategoryId: '10', // Music category
      maxResults: limit,
      safeSearch: 'moderate',
      relevanceLanguage: 'en',
      order: 'relevance'
    })
    
    if (response.data.items) {
      allVideos = response.data.items.map(item => ({
        id: item.id?.videoId,
        title: item.snippet?.title,
        channelTitle: item.snippet?.channelTitle,
        thumbnail: item.snippet?.thumbnails?.medium?.url,
        videoId: item.id?.videoId
      })).filter(video => video.id && video.title)
    }
    
    return allVideos
    
  } catch (error) {
    console.error('Error fetching YouTube tracks:', error)
    return []
  }
}

// Generate quiz questions from YouTube videos
export function generateYouTubeQuiz(videos: any[], questionCount: number = 10) {
  const shuffled = videos.sort(() => 0.5 - Math.random())
  const selectedVideos = shuffled.slice(0, questionCount)
  
  return selectedVideos.map((video, index) => {
    // Extract artist name from title or channel (simple heuristic)
    const title = video.title || ''
    const channel = video.channelTitle || ''
    
    // Create wrong answers from other videos' channels
    const otherChannels = videos
      .filter(v => v.id !== video.id)
      .map(v => v.channelTitle)
      .filter(c => c && c !== channel)
    
    const wrongAnswers = [...new Set(otherChannels)]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
    
    // Mix correct answer with wrong ones
    const choices = [channel, ...wrongAnswers]
      .sort(() => 0.5 - Math.random())
    
    return {
      id: index + 1,
      prompt: "Who is the artist/channel of this song?",
      videoTitle: title,
      videoId: video.id,
      thumbnail: video.thumbnail,
      choices: choices.slice(0, 4), // Ensure max 4 choices
      correctAnswer: channel,
      difficulty: 'casual' as const,
      // YouTube embed URLs for different start times
      embedUrl: `https://www.youtube.com/embed/${video.id}?start=30&end=60&autoplay=1`
    }
  })
}
