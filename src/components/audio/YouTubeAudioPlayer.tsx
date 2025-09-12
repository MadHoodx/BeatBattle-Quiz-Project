"use client";
import { useEffect, useRef } from 'react';

interface YouTubeAudioPlayerProps {
  videoId: string;
  startTime: number;
  endTime: number;
  isPlaying: boolean;
  onEnded?: () => void;
}

export default function YouTubeAudioPlayer({ 
  videoId, 
  startTime, 
  endTime, 
  isPlaying,
  onEnded 
}: YouTubeAudioPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!isPlaying) return;

    // Auto-stop after duration
    const duration = (endTime - startTime) * 1000;
    const timer = setTimeout(() => {
      if (onEnded) onEnded();
    }, duration);

    return () => clearTimeout(timer);
  }, [isPlaying, startTime, endTime, onEnded]);

  return (
    <iframe
      ref={iframeRef}
      width="1"
      height="1"
      src={`https://www.youtube.com/embed/${videoId}?start=${startTime}&end=${endTime}&autoplay=${isPlaying ? 1 : 0}&controls=0&showinfo=0&rel=0&modestbranding=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
      title="Quiz Audio"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      style={{ 
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        opacity: 0,
        pointerEvents: 'none'
      }}
    />
  );
}
