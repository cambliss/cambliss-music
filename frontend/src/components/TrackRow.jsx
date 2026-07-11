import { Link } from "react-router-dom";
import { usePlayer } from "../context/PlayerContext";
import Waveform from "./Waveform";

function formatDuration(ms) {
  if (!ms) return "--:--";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function TrackRow({ track, index }) {
  const { play, current, isPlaying, toggle } = usePlayer();
  const isCurrent = current?.id === track.id;

  function handlePlayClick() {
    if (isCurrent) toggle();
    else play(track);
  }

  return (
    <div
      onClick={handlePlayClick}
      className={`group flex items-center gap-4 rounded-lg px-3 py-2 hover:bg-surface-2 ${
        isCurrent ? "bg-surface-2" : ""
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handlePlayClick();
        }
      }}
    >
      <button
        onClick={handlePlayClick}
        aria-label={isCurrent && isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
        className="flex w-8 shrink-0 items-center justify-center font-mono text-xs text-muted group-hover:text-amber"
      >
        {isCurrent && isPlaying ? <Waveform active bars={3} /> : index}
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-paper">{track.title}</p>
        {track.artist && (
          <Link
            to={`/artists/${track.artist.id}`}
            onClick={(e) => e.stopPropagation()}
            className="truncate text-xs text-muted hover:text-amber"
          >
            {track.artist.name}
          </Link>
        )}
      </div>

      {track.genre && (
        <span className="hidden rounded-full border border-hairline px-2 py-0.5 font-mono text-[10px] text-muted sm:block">
          {track.genre}
        </span>
      )}

      <span className="font-mono text-xs text-muted">{formatDuration(track.durationMs)}</span>
    </div>
  );
}
