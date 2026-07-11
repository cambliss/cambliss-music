import { usePlayer } from "../context/PlayerContext";
import Waveform from "./Waveform";

function formatTime(sec) {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlayerBar() {
  const { current, isPlaying, toggle, progress, duration, seek, mediaKind, attachAudioElement, attachVideoElement } = usePlayer();

  return (
    <>
      <audio
        ref={attachAudioElement}
        preload="metadata"
        controls
        className={
          current && mediaKind === "audio"
            ? "fixed inset-x-0 bottom-18 z-40 mx-auto h-12 w-full max-w-6xl rounded-xl border border-hairline bg-surface px-2"
            : "hidden"
        }
      />
      <video
        ref={attachVideoElement}
        playsInline
        preload="metadata"
        className={
          current && mediaKind === "video"
            ? "fixed inset-x-0 bottom-18 z-40 mx-auto h-40 w-full max-w-6xl rounded-xl border border-hairline bg-black object-contain sm:h-56"
            : "hidden"
        }
      />
      {current ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-surface">
          {mediaKind === "video" ? <div className="h-46 border-b border-hairline bg-ink/60 sm:h-62" /> : null}
          {mediaKind === "audio" ? <div className="h-14 border-b border-hairline bg-ink/30" /> : null}
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={progress}
            onChange={(e) => seek(Number(e.target.value))}
            className="h-1 w-full cursor-pointer appearance-none bg-surface-3 accent-amber"
          />
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
            <button
              onClick={toggle}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber text-ink"
            >
              {isPlaying ? (
                <Waveform active bars={3} className="text-ink" />
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-ink">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-paper">{current.title}</p>
              <p className="truncate text-xs text-muted">
                {current.artist?.name}
                {mediaKind === "video" ? " · MP4 video" : ""}
              </p>
            </div>

            <span className="hidden font-mono text-xs text-muted sm:block">
              {formatTime(progress)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      ) : null}
    </>
  );
}
