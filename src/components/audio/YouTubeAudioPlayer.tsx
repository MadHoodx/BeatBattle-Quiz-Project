"use client";
import { useEffect, useRef } from 'react';

interface YouTubeAudioPlayerProps {
  videoId: string;
  startTime: number;
  endTime: number;
  isPlaying: boolean;
  onEnded?: () => void;
  // Called when the iframe/player actually begins playing (useful to sync timers)
  onPlaying?: () => void;
  // If true, load the IFrame API and cue the video ahead of actual play to reduce startup latency
  preload?: boolean;
}

export default function YouTubeAudioPlayer({ 
  videoId, 
  startTime, 
  endTime, 
  isPlaying,
  onEnded,
  onPlaying
  ,
  preload = false
}: YouTubeAudioPlayerProps) {
  const playerRef = useRef<any>(null);
  const containerId = `yt-player-${videoId}`;

  useEffect(() => {
    // Load YouTube IFrame API if not present
    if (typeof window === 'undefined') return;

    const ensureApi = () => {
      return new Promise<void>((resolve) => {
        if ((window as any).YT && (window as any).YT.Player) return resolve();
        // If script already added, wait for global ready callback
        const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
        if (!existing) {
          // add preconnect hints when preloading to speed up connection setup
          if (preload) {
            try {
              const p1 = document.createElement('link');
              p1.rel = 'preconnect';
              p1.href = 'https://www.youtube.com';
              document.head.appendChild(p1);
              const p2 = document.createElement('link');
              p2.rel = 'preconnect';
              p2.href = 'https://s.ytimg.com';
              document.head.appendChild(p2);
            } catch (e) {}
          }
          const s = document.createElement('script');
          s.src = 'https://www.youtube.com/iframe_api';
          document.body.appendChild(s);
        }
        const prev = (window as any).onYouTubeIframeAPIReady;
        (window as any).onYouTubeIframeAPIReady = () => {
          if (typeof prev === 'function') prev();
          resolve();
        };
      });
    };

    let mounted = true;

    const createPlayer = async () => {
      await ensureApi();
      if (!mounted) return;

      // Destroy previous player if exists
      if (playerRef.current && playerRef.current.destroy) {
        try { playerRef.current.destroy(); } catch (e) {}
        playerRef.current = null;
      }

      playerRef.current = new (window as any).YT.Player(containerId, {
        height: '0',
        width: '0',
        videoId,
        playerVars: {
          start: Math.max(0, Math.floor(startTime)),
          end: Math.max(0, Math.floor(endTime)),
          autoplay: 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1
        },
        events: {
          onReady: (e: any) => {
            // Seek to start (precaution) and optionally autoplay
            try {
              e.target.seekTo(startTime, true);
            } catch (err) {}
            // If preload is requested, cue video (loads metadata and begins buffering
            // without autoplay). This often reduces the delay when the user later
            // requests playback.
            if (preload) {
              try {
                // cueVideoById(videoId, startSeconds)
                if (typeof e.target.cueVideoById === 'function') {
                  try { e.target.cueVideoById(videoId, Math.max(0, Math.floor(startTime))); } catch (err) {}
                }
              } catch (err) {}
            }

            if (isPlaying) {
              try { e.target.playVideo(); } catch (err) {}
            }
          },
          onStateChange: (e: any) => {
            const YT = (window as any).YT;
            if (!YT) return;
            if (e.data === YT.PlayerState.PLAYING) {
              // Notify parent that playback actually started
              if (onPlaying) onPlaying();
            }
            if (e.data === YT.PlayerState.ENDED) {
              if (onEnded) onEnded();
            }
          }
        }
      });
    };

    createPlayer();

    return () => {
      mounted = false;
      if (playerRef.current && playerRef.current.destroy) {
        try { playerRef.current.destroy(); } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [videoId]);

  // React to isPlaying to control the player
  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      if (isPlaying) {
        // Seek then play
        p.seekTo(startTime, true);
        p.playVideo();
      } else {
        p.pauseVideo();
      }
    } catch (err) {
      // ignore
    }
  }, [isPlaying, startTime]);

  return (
    <div id={containerId} style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: 1, height: 1, opacity: 0 }} />
  );
}
