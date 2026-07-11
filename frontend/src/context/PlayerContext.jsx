import { createContext, useContext, useRef, useState, useCallback } from "react";
import { fileUrl } from "../api/client";

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const audioRef = useRef(new Audio());
  const [current, setCurrent] = useState(null); // track object
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const play = useCallback((track) => {
    const audio = audioRef.current;
    if (current && current.id === track.id) {
      audio.play();
      setIsPlaying(true);
      return;
    }
    audio.pause();
    audio.src = fileUrl(`/api/tracks/${track.id}/stream`);
    audio.play();
    setCurrent(track);
    setIsPlaying(true);

    audio.ontimeupdate = () => setProgress(audio.currentTime);
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.onended = () => setIsPlaying(false);
  }, [current]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!current) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  }, [current, isPlaying]);

  const seek = useCallback((time) => {
    audioRef.current.currentTime = time;
    setProgress(time);
  }, []);

  return (
    <PlayerContext.Provider value={{ current, isPlaying, progress, duration, play, toggle, seek }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}
