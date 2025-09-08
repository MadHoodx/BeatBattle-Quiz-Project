import { useState, useCallback } from "react";
import { QuizQuestion } from "../types";

export function useQuiz(questionList: QuizQuestion[], total: number) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isFinished, setFinished] = useState(false);

  const answer = useCallback(
    (choiceIndex: number) => {
      const current = questionList[currentIndex];
      const newAnswers = [...answers, choiceIndex];
      setAnswers(newAnswers);
      if (current && current.choices[choiceIndex] === current.answer) {
        setScore((s) => s + 1);
      }
      if (currentIndex + 1 >= total) {
        setFinished(true);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    },
    [answers, currentIndex, questionList, total]
  );

  const reset = useCallback(() => {
    setCurrentIndex(0);
    setScore(0);
    setAnswers([]);
    setFinished(false);
  }, []);

  return {
    currentIndex,
    score,
    answers,
    isFinished,
    answer,
    reset,
    progress: total ? ((currentIndex + 1) / total) * 100 : 0,
  };
}
