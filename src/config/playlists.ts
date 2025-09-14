/**
 * 🎵 Simple YouTube Playlist Configuration

 */

/**
 * 🎯 YouTube Playlist IDs
 */
export const PLAYLIST_IDS = {
  kpop: 'PLxQODuHe4E5MPk6anBwqCgyfIa00KhK0c',    // K-Pop playlist
  kdrama: 'PLxQODuHe4E5P729r8-TFG61BvI64eMF6G',   // K-Drama OST playlist
  thai: 'PLpPEyOdwLH3cpKWxfSDcHP5WKK534GIfb',     // Thai Pop playlist
  jpop: 'PLj3yHoINc17ve9DMQpyU_clEGETrKSrbD',     // J-Pop playlist
  western: 'PLplXQ2cg9B_qrCVd1J_iId5SvP8Kf_BfS',  // Western Pop playlist
};


export const AVAILABLE_CATEGORIES = Object.keys(PLAYLIST_IDS);

/**
 * 🎨 Category Display Information
 */
export const CATEGORY_INFO = {
  kpop: {
    name: "K-Pop",
    emoji: "🇰🇷",
    description: "Korean Pop Music"
  },
  kdrama: {
    name: "K-Drama OST",
    emoji: "🎭",
    description: "Korean Drama Soundtracks"
  },
  thai: {
    name: "Thai Pop",
    emoji: "🇹🇭",
    description: "Thai Pop Music"
  },
  jpop: {
    name: "J-Pop",
    emoji: "🇯🇵",
    description: "Japanese Pop Music"
  },
  western: {
    name: "Western Pop",
    emoji: "🎤",
    description: "Western Pop Music"
  }
};

export type MusicCategory = keyof typeof PLAYLIST_IDS;

/**
 * ⚙️ Simple Configuration
 */
export const CONFIG = {
  cacheDuration: 60 * 60 * 1000, // 1 hour
  maxSongsPerCategory: 100,
  shuffleEnabled: true
};