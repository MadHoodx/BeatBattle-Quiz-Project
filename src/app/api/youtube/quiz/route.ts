/**
 * 🎵 YouTube Quiz API Route
 * Generate quiz questions from playlist songs
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateQuizQuestions } from '@/data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'kpop';
    const difficulty = searchParams.get('difficulty') || 'casual';
    const refresh = searchParams.get('refresh') === 'true';
    
    // Determine question count based on difficulty
    const questionCount = difficulty === 'hard' ? 15 : difficulty === 'medium' ? 10 : 5;
    
    console.log(`🎵 Generating ${questionCount} quiz questions for category: ${category}${refresh ? ' (refresh cache)' : ''}`);
    
    // Generate quiz questions (with optional cache refresh)
    const questions = await generateQuizQuestions(category, questionCount);
    
    if (questions.length === 0) {
      return NextResponse.json(
        { 
          error: 'No songs found for quiz generation',
          category,
          difficulty 
        }, 
        { status: 404 }
      );
    }
    
    console.log(`✅ Generated ${questions.length} questions successfully`);
    
    return NextResponse.json({
      questions,
      category,
      difficulty,
      total: questions.length,
      success: true
    });
    
  } catch (error) {
    console.error('❌ Error generating quiz questions:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate quiz',
        success: false 
      }, 
      { status: 500 }
    );
  }
}