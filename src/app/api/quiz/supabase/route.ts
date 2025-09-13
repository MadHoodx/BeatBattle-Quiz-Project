import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
// Use the new multi-category system
import { getSongsByCategory, generateQuizQuestions, QuizQuestion } from '@/data'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

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
    console.log(`🎵 Getting songs from multi-category system for: ${category}`);
    
    const result = await getSongsByCategory(category);
    
    if (result && result.songs && result.songs.length > 0) {
      console.log(`📚 Found ${result.songs.length} songs for category: ${category}`);
      
      const questions = await generateQuizQuestions(category, numQuestions);
      
      console.log(`🎵 Generated ${questions.length} questions`);
      console.log(`🎵 Selected songs: ${questions.map(q => q.title).join(', ')}`);
      
      return NextResponse.json({ 
        success: true, 
        source: 'centralized-data', 
        category, 
        difficulty, 
        questions, 
        quota: '0-units' 
      });
    }
  } catch (fallbackError) {
    console.error('💥 Centralized data failed:', fallbackError);
  }

  // If all else fails, return an error
  return NextResponse.json({
    success: false,
    error: 'No quiz data available',
    message: 'Centralized data is unavailable'
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
