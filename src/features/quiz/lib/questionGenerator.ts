import { QuizQuestion } from "../types";
import songs from "../data/songs.json";

// Utility: Fisher–Yates shuffle (pure)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface SongRecord {
  id: string;
  title: string;
  artist: string;
  drama: string;
  audio: string;
  year: number;
}

export type Difficulty = 'casual' | 'hardcore';

interface GenerateOptions {
  count?: number;              // number of questions
  difficulty?: Difficulty;     // playback difficulty
  clipSecondsCasual?: number;  // override casual clip length (default 15)
  clipSecondsHardcore?: number;// override hardcore clip length (default 2)
}

function resolveClipLength(difficulty: Difficulty, casual: number, hardcore: number) {
  return difficulty === 'hardcore' ? hardcore : casual;
}

export function generateQuestions(options: number | GenerateOptions = 10): QuizQuestion[] {
  const normalized: GenerateOptions = typeof options === 'number' ? { count: options } : options;
  const {
    count = 10,
    difficulty = 'casual',
    clipSecondsCasual = 15,
    clipSecondsHardcore = 2,
  } = normalized;

  const songList: SongRecord[] = (songs as any).songs || [];
  const selected = shuffle(songList).slice(0, count);
  const clipLen = resolveClipLength(difficulty, clipSecondsCasual, clipSecondsHardcore);

  return selected.map((song) => {
    const distractors = shuffle(
      songList.filter((s) => s.id !== song.id).map((s) => s.drama)
    ).slice(0, 3);
    const choices = shuffle([song.drama, ...distractors]);
  const start = Math.floor(Math.random() * 30);
  const end = start + clipLen; // variable length based on difficulty
    return {
      prompt: "Which K-drama is this OST from?",
      audio: song.audio,
      choices,
      answer: song.drama,
      start,
      end,
    };
  });
}
