import { Song } from '../types/song';
import { Question } from '../types/questions';

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function generateQuestions(songs: Song[], questionsCount: number = 10): Question[] {
  // Shuffle songs and take only what we need
  const selectedSongs = shuffleArray(songs).slice(0, questionsCount);
  
  return selectedSongs.map(song => {
    // Get wrong choices from other songs
    const otherDramas = songs
      .filter(s => s.id !== song.id)
      .map(s => s.drama);
    
    // Select 3 random wrong answers
    const wrongChoices = shuffleArray(otherDramas)
      .slice(0, 3);
    
    // Combine correct and wrong answers and shuffle
    const choices = shuffleArray([song.drama, ...wrongChoices]);
    
    // Generate random start time between 0 and 30 seconds from song duration
    const start = Math.floor(Math.random() * 30);
    // Play for 15 seconds
    const end = start + 15;

    return {
      prompt: "Which K-drama is this OST from?",
      audio: song.audio,
      choices,
      answer: song.drama,
      start,
      end
    };
  });
}
