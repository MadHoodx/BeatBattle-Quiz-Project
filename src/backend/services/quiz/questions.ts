import { Question } from '../../../shared/types/questions';
import songsData from '../../data/songs/songs.json';
import { generateQuestions } from './questionGenerator';

// Generate questions from songs
export const questions: Question[] = generateQuestions(songsData.songs);
