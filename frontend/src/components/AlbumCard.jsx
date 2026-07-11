import { Link } from "react-router-dom";
import { fileUrl } from "../api/client";

export default function AlbumCard({ album }) {
  const cover = fileUrl(album.coverArtUrl);
  return (
    <Link to={`/albums/${album.id}`} className="group block">
      <div className="aspect-square overflow-hidden rounded-lg border border-hairline bg-surface-2">
        {cover ? (
          <img
            src={cover}
            alt={album.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-3xl text-hairline">
            {album.title?.[0]}
          </div>
        )}
      </div>
      <p className="mt-2 truncate text-sm text-paper group-hover:text-amber">{album.title}</p>
      {album.artist && <p className="truncate text-xs text-muted">{album.artist.name}</p>}
    </Link>
  );
}
