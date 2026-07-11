import { Link } from "react-router-dom";
import { fileUrl } from "../api/client";

export default function ArtistCard({ artist }) {
  const image = fileUrl(artist.artistProfile?.profileImageUrl);
  return (
    <Link
      to={`/artists/${artist.id}`}
      className="group flex flex-col items-center gap-3 rounded-xl border border-hairline bg-surface p-4 text-center hover:border-amber"
    >
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-surface-2 font-display text-xl text-amber">
        {image ? (
          <img src={image} alt={artist.name} className="h-full w-full object-cover" />
        ) : (
          artist.name?.[0]
        )}
      </div>
      <div>
        <p className="text-sm text-paper group-hover:text-amber">{artist.name}</p>
        {artist._count && (
          <p className="font-mono text-[10px] text-muted">
            {artist._count.followers} followers · {artist._count.tracks} tracks
          </p>
        )}
      </div>
    </Link>
  );
}
