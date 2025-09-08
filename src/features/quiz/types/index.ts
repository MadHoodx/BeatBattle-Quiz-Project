// Domain types for the Quiz feature
export interface QuizQuestion {
  prompt: string;
  choices: string[];
  answer: string;
  audio: string;
  start: number;
  end: number;
}
