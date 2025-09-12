// YouTube Playlist Sources for different categories
// Each category can have multiple playlist IDs as fallback options

export const PLAYLIST_SOURCES: Record<string, string[]> = {
  kpop: [
    'PLxQODuHe4E5MPk6anBwqCgyfIa00KhK0c', // User provided K-Pop playlist
    
  ],
  jpop: [
    //  J-Pop playlist 
  ],
  thai: [
    //  Thai pop playlist
  ],
  western: [
    //  Western pop playlist
  ],
  indie: [
    //  Indie playlist
  ],
  rock: [
    //  Rock playlist
  ]
};

// Helper function to pick a random playlist from a category
export function pickRandom<T>(arr: T[]): T | undefined {
  if (!arr || arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}