import { Question } from '../src/types/questions';
import songsData from './songs/songs.json';
import { generateQuestions } from '../src/server/services/quiz/questionGenerator';

// Generate questions from songs
export const questions: Question[] = generateQuestions(songsData.songs);
