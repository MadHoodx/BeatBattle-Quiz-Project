"use client";
import { useEffect, useState, useRef } from 'react';
import YouTubeAudioPlayer from './YouTubeAudioPlayer';

interface AudioVisualizerProps {
  isPlaying: boolean;
  onTimeUp?: () => void;
  duration?: number;
  videoId?: string;
  startTime?: number;
}

export default function AudioVisualizer({ 
  isPlaying, 
  onTimeUp, 
  duration = 30, 
  videoId,
  startTime = 0 
}: AudioVisualizerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [audioData, setAudioData] = useState<number[]>(new Array(60).fill(0));
  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate realistic audio spectrum
  useEffect(() => {
    if (!isPlaying) {
      setAudioData(new Array(60).fill(5));
      return;
    }

    const animate = () => {
      const time = currentTime;
      const newData = Array.from({ length: 60 }, (_, i) => {
        // Create different frequency bands
        const bassWeight = i < 15 ? 1 : 0.3;
        const midWeight = i >= 15 && i < 35 ? 1 : 0.4;
        const trebleWeight = i >= 35 ? 1 : 0.2;
        
        // Generate dynamic heights based on time and frequency
        const bass = Math.sin(time * 1.5 + i * 0.1) * 40 * bassWeight;
        const mid = Math.cos(time * 2.2 + i * 0.05) * 30 * midWeight;
        const treble = Math.sin(time * 3.8 + i * 0.03) * 25 * trebleWeight;
        
        const combined = bass + mid + treble + 25 + Math.random() * 10;
        return Math.max(5, Math.min(95, combined));
      });
      
      setAudioData(newData);
    };

    intervalRef.current = setInterval(animate, 80);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, currentTime]);

  // Timer management
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + 1;
        if (newTime >= duration && onTimeUp) {
          onTimeUp();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, duration, onTimeUp]);

  useEffect(() => {
    if (!isPlaying) {
      setCurrentTime(0);
    }
  }, [isPlaying]);

  const progress = (currentTime / duration) * 100;

  return (
    <div className="relative bg-gradient-to-br from-gray-900 via-black to-purple-900 rounded-2xl p-8 min-h-[400px] flex items-center justify-center overflow-hidden shadow-2xl">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Moving gradient overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at ${50 + Math.sin(currentTime * 0.5) * 20}% ${50 + Math.cos(currentTime * 0.3) * 20}%, 
              rgba(147, 51, 234, 0.4) 0%, 
              rgba(219, 39, 119, 0.3) 35%, 
              transparent 70%)`
          }}
        />
        
        {/* Floating particles */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10 animate-pulse"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
      
      {/* Main Audio Spectrum */}
      <div className="relative flex items-end justify-center space-x-1 h-64 z-10 w-full max-w-4xl">
        {audioData.map((height, i) => {
          const hue = 280 + i * 2; // Purple to pink gradient
          const intensity = isPlaying ? height / 100 : 0.1;
          
          return (
            <div
              key={i}
              className="relative transition-all duration-100 ease-out rounded-t-lg"
              style={{
                width: '6px',
                height: `${height}%`,
                background: isPlaying 
                  ? `linear-gradient(to top, 
                      hsla(${hue}, 85%, 45%, 0.8), 
                      hsla(${hue + 20}, 90%, 55%, 0.9), 
                      hsla(${hue + 40}, 95%, 65%, 1))`
                  : 'rgba(100, 100, 100, 0.2)',
                boxShadow: isPlaying 
                  ? `0 0 ${intensity * 20}px hsla(${hue}, 85%, 55%, ${intensity * 0.8}),
                     0 0 ${intensity * 40}px hsla(${hue}, 85%, 55%, ${intensity * 0.4})`
                  : 'none',
                filter: isPlaying ? `brightness(${1 + intensity * 0.5})` : 'brightness(0.3)'
              }}
            >
              {/* Individual bar glow effect */}
              {isPlaying && height > 70 && (
                <div 
                  className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full animate-pulse"
                  style={{
                    background: `hsla(${hue + 40}, 95%, 65%, 0.8)`,
                    boxShadow: `0 0 10px hsla(${hue + 40}, 95%, 65%, 0.6)`
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Center Control */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        {/* Ripple effects */}
        {isPlaying && (
          <>
            <div className="absolute w-40 h-40 border-2 border-white/20 rounded-full animate-ping" 
                 style={{ animationDuration: '2s' }} />
            <div className="absolute w-56 h-56 border border-white/10 rounded-full animate-ping" 
                 style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
          </>
        )}
        
        {/* Main control button */}
        <div className="relative">
          <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-400 p-1 rounded-full shadow-2xl">
            <div className="bg-black/20 backdrop-blur-sm rounded-full p-6">
              {isPlaying ? (
                <div className="flex space-x-2 items-center justify-center">
                  <div className="w-3 h-10 bg-white rounded-full animate-pulse" 
                       style={{ animationDuration: '0.8s' }} />
                  <div className="w-3 h-10 bg-white rounded-full animate-pulse" 
                       style={{ animationDuration: '0.8s', animationDelay: '0.2s' }} />
                </div>
              ) : (
                <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </div>
          </div>
          
          {/* Rotating ring */}
          {isPlaying && (
            <div 
              className="absolute inset-0 border-4 border-transparent border-t-purple-400 rounded-full animate-spin"
              style={{ animationDuration: '4s' }}
            />
          )}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="absolute bottom-6 left-6 right-6 z-10">
        <div className="mb-4">
          <div className="bg-white/10 h-3 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 rounded-full relative transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            >
              {/* Moving highlight */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              {/* Progress indicator */}
              <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg" />
            </div>
          </div>
          
          <div className="flex justify-between mt-3 text-sm">
            <span className="text-cyan-300 font-medium">{currentTime}s</span>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-1 h-1 bg-pink-400 rounded-full animate-bounce"
                    style={{ 
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: '1.4s'
                    }}
                  />
                ))}
              </div>
              <span className="text-pink-300 font-medium">Audio Spectrum</span>
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce"
                    style={{ 
                      animationDelay: `${i * 0.2 + 0.6}s`,
                      animationDuration: '1.4s'
                    }}
                  />
                ))}
              </div>
            </div>
            <span className="text-purple-300 font-medium">{duration}s</span>
          </div>
        </div>
      </div>
      
      {/* Status Indicator */}
      <div className="absolute top-6 left-6 right-6 text-center z-10">
        <div className="inline-flex items-center space-x-3 bg-black/30 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
          <div className={`w-3 h-3 rounded-full ${
            isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
          }`} />
          <span className="text-white font-medium text-lg">
            {isPlaying ? 'Now Playing...' : 'Ready to Play'}
          </span>
          <div className="flex space-x-1">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i}
                className={`w-1 h-4 rounded-full transition-all duration-300 ${
                  isPlaying ? 'bg-gradient-to-t from-purple-500 to-pink-400' : 'bg-gray-600'
                }`}
                style={{
                  transform: isPlaying ? `scaleY(${0.3 + Math.sin(currentTime + i) * 0.7})` : 'scaleY(0.3)',
                  transformOrigin: 'bottom'
                }}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* YouTube Audio Player */}
      {videoId && (
        <YouTubeAudioPlayer
          videoId={videoId}
          startTime={startTime}
          endTime={startTime + duration}
          isPlaying={isPlaying}
          onEnded={onTimeUp}
        />
      )}
    </div>
  );
}
