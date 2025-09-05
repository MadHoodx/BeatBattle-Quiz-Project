import { Question } from '../shared/types/questions';
import songsData from '../backend/data/songs/songs.json';
import { generateQuestions } from '../backend/services/quiz/questionGenerator';

// Generate questions from songs
export const questions: Question[] = generateQuestions(songsData.songs);
