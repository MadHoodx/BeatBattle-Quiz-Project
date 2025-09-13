/**
 * 🎵 Simple YouTube Playlist Configuration

 */

/**
 * 🎯 YouTube Playlist IDs
 */
export const PLAYLIST_IDS = {
  kpop: 'PLxQODuHe4E5MPk6anBwqCgyfIa00KhK0c',    // K-Pop playlist
  kdrama: 'PLxxxxxxxxxxxxxxxxxxxxxx',            // K-Drama OST playlist
  thai: 'PLxxxxxxxxxxxxxxxxxxxxxx',              // Thai Pop playlist
  jpop: 'PLxxxxxxxxxxxxxxxxxxxxxx',              // J-Pop playlist
  western: 'PLxxxxxxxxxxxxxxxxxxxxxx',           // Western Pop playlist
  rock: 'PLxxxxxxxxxxxxxxxxxxxxxx'               // Rock playlist
};


export const AVAILABLE_CATEGORIES = Object.keys(PLAYLIST_IDS);

/**
 * ⚙️ Simple Configuration
 */
export const CONFIG = {
  cacheDuration: 60 * 60 * 1000, // 1 hour
  maxSongsPerCategory: 100,
  shuffleEnabled: true
};