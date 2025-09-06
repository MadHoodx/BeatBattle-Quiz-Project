import { useState, useCallback } from 'react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
}

export function useQuiz(questions: Question[], totalQuestions: number) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const answerQuestion = useCallback((answerIndex: number) => {
    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);

    if (questions[currentQuestion]?.correct === answerIndex) {
      setScore(score + 1);
    }

    if (currentQuestion + 1 >= totalQuestions) {
      setIsComplete(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  }, [currentQuestion, totalQuestions, questions, answers, score]);

  const resetQuiz = useCallback(() => {
    setCurrentQuestion(0);
    setScore(0);
    setAnswers([]);
    setIsComplete(false);
  }, []);

  return {
    currentQuestion,
    score,
    answers,
    isComplete,
    answerQuestion,
    resetQuiz,
    progress: ((currentQuestion + 1) / totalQuestions) * 100
  };
}
