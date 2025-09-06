"use client";
import { useRef, useEffect, useState } from 'react';
import '../../styles/globals.css';

type VolumeControlProps = {
  volume: number;
  muted: boolean;
  ready: boolean;
  onMute: () => void;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function VolumeControl({ volume, muted, ready, onMute, onVolumeChange }: VolumeControlProps) {
  return (
    <div className="relative group">
      <div className="flex items-center gap-4">

        <div className="flex items-center gap-3">
          {/* Mute Button */}
          <button
            onClick={onMute}
            disabled={!ready}
            className={`
              p-2 rounded-full transition-colors duration-200
              ${!ready ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'}
            `}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>

          {/* Volume Slider */}
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={onVolumeChange}
              disabled={!ready || muted}
              className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:cursor-pointer
                hover:[&::-webkit-slider-thumb]:bg-purple-300"
              style={{
                background: `linear-gradient(to right, rgb(168, 85, 247) ${volume * 100}%, rgb(55, 65, 81) ${volume * 100}%)`
              }}
            />
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 
              opacity-0 group-hover:opacity-100 transition-opacity duration-200
              bg-slate-800 text-xs text-gray-300 py-1 px-2 rounded">
              {Math.round(volume * 100)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


interface Props {
  src: string;
  start?: number;
  end?: number;
  duration?: number; 
  autoPlay?: boolean;
  onClipEnd?: () => void;
  minimal?: boolean;
}

export default function AudioComponent({ 
  src, 
  start, 
  end, 
  duration = 15, // default 15 seconds
  autoPlay = false, 
  onClipEnd, 
  minimal = false 
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  
  const [ready, setReady] = useState(false);
  const [played, setPlayed] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [clipStart, setClipStart] = useState<number | null>(null);

  useEffect(() => {
    // Create AudioContext
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;

    // Load audio file
    fetch(src)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        setReady(true);

        // Randomly select start point if not specified
        const randomStart = start ?? Math.random() * (audioBuffer.duration - duration);
        const clipEnd = end ?? (randomStart + duration);
        setClipStart(randomStart);

        // Create source node
        const sourceNode = audioContext.createBufferSource();
        sourceNode.buffer = audioBuffer;

        // Create gain node for volume control
        const gainNode = audioContext.createGain();
        gainNode.gain.value = muted ? 0 : volume;

        // Connect nodes
        sourceNode.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Set up playback
        sourceNodeRef.current = sourceNode;
        sourceNode.start(0, randomStart, duration);
        setPlayed(true);

        // set up onClipEnd
        setTimeout(() => {
          if (onClipEnd) onClipEnd();
        }, duration * 1000);

        // Stop playback when component unmount
        return () => {
          sourceNode.stop();
          audioContext.close();
        };
      })
      .catch(error => {
        console.error('Error loading audio:', error);
      });

    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [src, start, end, duration]); 


  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = muted;
    }
  }, [volume, muted]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !clipStart) return;
    a.volume = volume;
    a.muted = muted;
  }, [volume, muted, clipStart]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleMute = () => {
    setMuted((m) => !m);
    if (audioRef.current) {
      audioRef.current.muted = !muted;
    }
  };

  if (minimal) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleMute}
          className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={handleVolumeChange}
          disabled={!ready || muted}
          className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 
            [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full 
            [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:cursor-pointer
            hover:[&::-webkit-slider-thumb]:bg-purple-300"
          style={{
            background: `linear-gradient(to right, rgb(168, 85, 247) ${volume * 100}%, rgb(55, 65, 81) ${volume * 100}%)`
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center space-x-4">
      {!ready && (
        <span className="text-sm opacity-70 block">Loading clip…</span>
      )}
      <VolumeControl
        volume={volume}
        muted={muted}
        ready={ready}
        onMute={handleMute}
        onVolumeChange={handleVolumeChange}
      />
    </div>
  );
}