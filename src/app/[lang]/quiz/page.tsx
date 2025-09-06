"use client";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuiz } from "@/hooks/useQuiz";
import { questions } from "../../../../data/questions";
import ChoiceButton from "@/components/quiz/ChoiceButton";

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const lang = params?.lang || "en";
  const {
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
    currentIndex
  } = useQuiz(questions, questions.length);

  useEffect(() => {
    const elements = document.querySelectorAll('.fade-in');
    elements.forEach(el => el.classList.add('opacity-100'));
  }, []);

  const currentQuestion = questions[currentIndex];
  const hasSelected = selected !== null;
}

