export interface Song {
  id: string;
  title: string;
  artist: string;
  drama: string;
  audio: string;
  year: number;
}

export interface Question {
  prompt: string;
  audio: string;
  choices: string[];
  answer: string;
}
