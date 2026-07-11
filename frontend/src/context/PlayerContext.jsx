import { createContext, useContext, useRef, useState, useCallback } from "react";
import { fileUrl } from "../api/client";

const PlayerContext = createContext(null);

function mediaKindFor(track) {
  const source = String(track?.fileUrl || "").toLowerCase();
  return source.endsWith(".mp4") ? "video" : "audio";
}

export function PlayerProvider({ children }) {
  const audioElementRef = useRef(null);
  const videoElementRef = useRef(null);
  const [current, setCurrent] = useState(null); // track object
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaKind, setMediaKind] = useState("audio");

  const bindMediaEvents = useCallback((element) => {
    if (!element) return;
    element.ontimeupdate = () => setProgress(element.currentTime);
    element.onloadedmetadata = () => setDuration(element.duration);
    element.onended = () => setIsPlaying(false);
  }, []);

  const attachAudioElement = useCallback((element) => {
    audioElementRef.current = element;
    bindMediaEvents(element);
  }, [bindMediaEvents]);

  const attachVideoElement = useCallback((element) => {
    videoElementRef.current = element;
    bindMediaEvents(element);
  }, [bindMediaEvents]);

  const activeElement = useCallback((kind) => {
    return kind === "video" ? videoElementRef.current : audioElementRef.current;
  }, []);

  const play = useCallback((track) => {
    const kind = mediaKindFor(track);
    const element = activeElement(kind);
    const otherElement = activeElement(kind === "video" ? "audio" : "video");
    const nextUrl = fileUrl(`/api/tracks/${track.id}/stream`);

    if (!element) return;

    if (current && current.id === track.id) {
      element.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      return;
    }

    otherElement?.pause();
    otherElement?.removeAttribute("src");
    otherElement?.load?.();

    element.pause();
    if (element.src !== nextUrl) {
      element.src = nextUrl;
      element.load();
    }

    bindMediaEvents(element);

    setCurrent(track);
    setMediaKind(kind);
    setMediaUrl(nextUrl);
    setProgress(0);
    setDuration(0);
    element.currentTime = 0;
    element.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [activeElement, bindMediaEvents, current]);

  const toggle = useCallback(() => {
    const element = activeElement(mediaKind);
    if (!current) return;
    if (isPlaying) {
      element?.pause();
      setIsPlaying(false);
    } else {
      element?.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [activeElement, current, isPlaying, mediaKind]);

  const seek = useCallback((time) => {
    const element = activeElement(mediaKind);
    if (!element) return;
    element.currentTime = time;
    setProgress(time);
  }, [activeElement, mediaKind]);

  return (
    <PlayerContext.Provider
      value={{
        current,
        isPlaying,
        progress,
        duration,
        mediaKind,
        mediaUrl,
        attachAudioElement,
        attachVideoElement,
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
