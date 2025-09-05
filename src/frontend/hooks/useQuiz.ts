import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveScore } from '../../backend/services/database/db';

export type QuizState = {
  currentIndex: number;
  selected: string | null;
  isPlaying: boolean;
  isRevealing: boolean;
  isFinished: boolean;
};

export function useQuiz(questions: any[], totalQuestions: number) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [lastAnswer, setLastAnswer] = useState<'correct' | 'wrong' | null>(null);

  const { user } = useAuth();

  const handleClipEnd = () => {
    setIsPlaying(false);
  };

  const moveToNextQuestion = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(i => i + 1);
      setSelected(null);
      setIsRevealing(false);
      setLastAnswer(null);
      // Reset isPlaying to trigger the useEffect that starts playing
      setIsPlaying(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleSelect = (choice: string, correctAnswer: string) => {
    if (isRevealing || selected) return; // Allow selection even if not playing
    
    setSelected(choice);
    const isCorrect = choice === correctAnswer;
    setLastAnswer(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setScore(s => s + 1);
    
    setIsRevealing(true);
    // Move to next question after showing result
    setTimeout(moveToNextQuestion, 2000);
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelected(null);
    setIsPlaying(false);
    setIsRevealing(false);
    setIsFinished(false);
    setScore(0);
    setLastAnswer(null);
  };

  useEffect(() => {
    if (isFinished && user) {
      saveScore(user.id, score, questions.length);
    }
  }, [isFinished, score, user]);

  // When audio starts playing
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPlaying(true);
    }, 500); // Small delay to ensure audio is ready
    return () => clearTimeout(timer);
  }, [currentIndex]);

  return {
    currentIndex,
    selected,
    isPlaying,
    isRevealing,
    isFinished,
    score,
    lastAnswer,
    handleClipEnd,
    handleSelect,
    setSelected,
    resetQuiz,
  };
}
