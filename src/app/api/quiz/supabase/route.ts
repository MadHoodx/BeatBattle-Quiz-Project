import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface QuizQuestion {
  videoId: string;
  title: string;
  artist: string;
  choices: string[];
  correctAnswer: number;
  startTime: number;
  endTime: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'kpop';
    const difficulty = searchParams.get('difficulty') || 'casual';
    const numQuestions = difficulty === 'hardcore' ? 10 : 5;

    console.log(`🎵 Using mock videos for category: ${category}, difficulty: ${difficulty}`);

    
    return await fallbackToManualData(category, difficulty, numQuestions);

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    const category = new URL(request.url).searchParams.get('category') || 'kpop';
    const difficulty = new URL(request.url).searchParams.get('difficulty') || 'casual';
    const numQuestions = difficulty === 'hardcore' ? 10 : 5;
    
    return fallbackToManualData(category, difficulty, numQuestions);
  }
}

async function fallbackToManualData(category: string, difficulty: string, numQuestions: number) {
  try {
    const mockVideos = await import('@/data/mockVideos.json');
    const allVideos = mockVideos.default;
    
    if (allVideos && allVideos.length > 0) {
      const timestamp = Date.now();
      const seed = timestamp % 1000000; 
      
  
      let shuffled = [...allVideos];
      for (let i = 0; i < 3; i++) {
        shuffled = shuffled.sort(() => Math.random() - 0.5);
      }
      
      const selected = shuffled.slice(0, numQuestions);
      
      const questions: QuizQuestion[] = selected.map(video => {
        const wrongChoices = shuffled
          .filter(v => v.videoId !== video.videoId)
          .slice(0, 3)
          .map(v => v.title);
        
        const choices = [video.title, ...wrongChoices].sort(() => Math.random() - 0.5);
        const correctAnswer = choices.indexOf(video.title);
        
        return {
          videoId: video.videoId,
          title: video.title,
          artist: video.artist,
          choices,
          correctAnswer,
          startTime: 30 + Math.floor(Math.random() * 60), 
          endTime: 60
        };
      });
      
      console.log(`🔄 Fallback to mock videos: ${questions.length} questions from ${allVideos.length} total songs`);
      console.log(`🎵 Selected songs: ${questions.map(q => q.title).join(', ')}`);
      console.log(`🎲 Seed: ${seed}, Timestamp: ${timestamp}`);
      
      return NextResponse.json({ 
        success: true, 
        source: 'mock-videos-fallback', 
        category, 
        difficulty, 
        questions, 
        quota: '0-units' 
      });
    }
  } catch (fallbackError) {
    console.error('💥 Fallback failed:', fallbackError);
  }

  // If all else fails, return an error
  return NextResponse.json({
    success: false,
    error: 'No quiz data available',
    message: 'Both Supabase and manual data are unavailable'
  }, { status: 503 });
}

// Analytics endpoint to track quiz completions
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      category,
      difficulty,
      score,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      timeoutAnswers,
      totalTime
    } = body;

    // Optional: Store analytics in Supabase
    const { error } = await supabase
      .from('quiz_sessions')
      .insert({
        category,
        difficulty,
        score,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        timeout_answers: timeoutAnswers,
        total_time: totalTime,
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

    if (error) {
      console.error('📊 Analytics error:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('📊 Analytics POST error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
