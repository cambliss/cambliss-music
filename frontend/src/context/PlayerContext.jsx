import { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";
import { fileUrl } from "../api/client";

const PlayerContext = createContext(null);

function mediaKindFor(track) {
  const source = String(track?.fileUrl || "").toLowerCase();
  return source.endsWith(".mp4") ? "video" : "audio";
}

export function PlayerProvider({ children }) {
  const mediaRef = useRef(null);
  const [current, setCurrent] = useState(null); // track object
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaKind, setMediaKind] = useState("audio");

  const syncMediaElement = useCallback((element, autoplay) => {
    if (!element || !mediaUrl) return;

    if (element.src !== mediaUrl) {
      element.src = mediaUrl;
      element.load();
    }

    element.ontimeupdate = () => setProgress(element.currentTime);
    element.onloadedmetadata = () => setDuration(element.duration);
    element.onended = () => setIsPlaying(false);

    if (autoplay) {
      element.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [mediaUrl]);

  const attachMediaElement = useCallback((element) => {
    if (mediaRef.current === element) return;

    if (mediaRef.current && mediaRef.current !== element) {
      mediaRef.current.pause();
    }

    mediaRef.current = element;

    if (element && mediaUrl) {
      syncMediaElement(element, isPlaying);
    }
  }, [isPlaying, mediaUrl, syncMediaElement]);

  useEffect(() => {
    if (mediaRef.current && mediaUrl) {
      syncMediaElement(mediaRef.current, isPlaying);
    }
  }, [mediaKind, mediaUrl, isPlaying, syncMediaElement]);

  const play = useCallback((track) => {
    const element = mediaRef.current;
    if (current && current.id === track.id) {
      if (element) {
        element.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
      return;
    }

    if (element) {
      element.pause();
    }

    setCurrent(track);
    setMediaKind(mediaKindFor(track));
    setMediaUrl(fileUrl(`/api/tracks/${track.id}/stream`));
    setProgress(0);
    setDuration(0);
    setIsPlaying(true);
  }, [current]);

  const toggle = useCallback(() => {
    const element = mediaRef.current;
    if (!current) return;
    if (isPlaying) {
      element?.pause();
      setIsPlaying(false);
    } else {
      element?.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [current, isPlaying]);

  const seek = useCallback((time) => {
    if (!mediaRef.current) return;
    mediaRef.current.currentTime = time;
    setProgress(time);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        current,
        isPlaying,
        progress,
        duration,
        mediaKind,
        mediaUrl,
        attachMediaElement,
        play,
        toggle,
        seek,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}
