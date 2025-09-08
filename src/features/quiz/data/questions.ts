import { QuizQuestion } from "../types";
import { generateQuestions } from "../lib/questionGenerator";

export const questions: QuizQuestion[] = generateQuestions(10);
