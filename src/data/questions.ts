import { Question } from '../types/questions';
import songsData from './songs.json';
import { generateQuestions } from '../utils/questionGenerator';

// Generate questions from songs
export const questions: Question[] = generateQuestions(songsData.songs);
