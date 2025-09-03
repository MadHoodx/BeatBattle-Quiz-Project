"use client";
import { useEffect, useRef, useState } from "react";

type VolumeControlProps = {
  volume: number;
  muted: boolean;
  ready: boolean;
  onMute: () => void;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function VolumeControl({ volume, muted, ready, onMute, onVolumeChange }: VolumeControlProps) {
  return (
    <div className="flex items-center">
      <button
        onClick={onMute}
        disabled={!ready}
        className="px-2 py-2 rounded-full border shadow disabled:opacity-50"
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 8v4h4l5 5V3l-5 5H4z" fill="#888"/><line x1="2" y1="2" x2="18" y2="18" stroke="#f00" strokeWidth="2"/></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 8v4h4l5 5V3l-5 5H4z" fill="#888"/></svg>
        )}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={onVolumeChange}
        disabled={!ready || muted}
        className="w-24 mx-2 accent-blue-500"
        aria-label="ปรับระดับเสียง"
      />
      <span className="px-2 w-10 text-right">{Math.round(volume * 100)}%</span>
    </div>
  );
}


type Props = { src: string; start: number; end: number; autoPlay?: boolean; onClipEnd?: () => void };

export default function AudioComponent({ src, start, end, autoPlay = false, onClipEnd }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ready, setReady] = useState(false);
  const [played, setPlayed] = useState(false);
  const [volume, setVolume] = useState(1); // 1 = 100%
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = new Audio(src);
    audio.preload = "metadata";
    audioRef.current = audio;

    const onLoaded = () => {
      setReady(true);
      audio.currentTime = start;
      audio.volume = volume;
      audio.muted = muted;
      if (autoPlay) {
        audio.play().then(() => setPlayed(true)).catch(() => {});
      }
    };
    audio.addEventListener("loadedmetadata", onLoaded);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoaded);
      audioRef.current = null;
      setReady(false);
      setPlayed(false);
    };
  }, [src, start, autoPlay]); 


  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = muted;
    }
  }, [volume, muted]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;
    a.muted = muted;
    const onTick = () => {
      if (a.currentTime >= end) {
        a.pause();
        a.currentTime = start;
        if (onClipEnd) onClipEnd();
      }
    };
    a.addEventListener("timeupdate", onTick);
    return () => a.removeEventListener("timeupdate", onTick);
  }, [start, end, ready, onClipEnd, volume, muted]);

  const handlePlay = async () => {
    const a = audioRef.current;
    if (!a || played) return;
    a.currentTime = start;
    a.volume = volume;
    await a.play().catch(() => {});
    setPlayed(true);
  };

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

  return (
    <div>
      <div className="flex flex-col items-center gap-2 mb-2">
        <button
          onClick={handlePlay}
          disabled={!ready || played}
          className="px-4 py-2 rounded-xl border shadow disabled:opacity-50"
        >
          Play
        </button>
        {!ready && (
          <span className="text-sm opacity-70 mt-2 block">Loading clip…</span>
        )}
      </div>
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