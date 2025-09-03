import { useState, useEffect } from 'react';

export type QuizState = {
  currentIndex: number;
  selected: string | null;
  waiting: boolean;
  countdown: number;
  isFinished: boolean;
};

export function useQuiz(totalQuestions: number) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [lastAnswer, setLastAnswer] = useState<'correct' | 'wrong' | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (waiting && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    if (waiting && countdown === 0) {
      setWaiting(false);
      
      if (!selected) {
        setSelected("timeout");
        
        setTimeout(() => {
          if (currentIndex < totalQuestions - 1) {
            setCurrentIndex(i => i + 1);
            setSelected(null);
            setWaiting(false);
            setCountdown(3);
          } else {
            setIsFinished(true);
          }
        }, 2000);
      }
    }
    return () => clearTimeout(timer);
  }, [waiting, countdown, selected]);

  const handleClipEnd = () => {
    setWaiting(true);
    setCountdown(3);
  };

  const handleSelect = (choice: string, correctAnswer: string) => {
    setSelected(choice);
    const isCorrect = choice === correctAnswer;
    setLastAnswer(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setScore(s => s + 1);
    
    // After 2 seconds, move to the next question if there is one
    setTimeout(() => {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex(i => i + 1);
        setSelected(null);
        setWaiting(false);
        setCountdown(3);
        setLastAnswer(null);
      } else {
        setIsFinished(true);
      }
    }, 2000);
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelected(null);
    setWaiting(false);
    setCountdown(3);
    setIsFinished(false);
  };

  return {
    currentIndex,
    selected,
    waiting,
    countdown,
    isFinished,
    score,
    lastAnswer,
    handleClipEnd,
    handleSelect,
    setSelected,
    resetQuiz,
  };
}
