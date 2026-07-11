import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import client, { fileUrl } from "../api/client";
import TrackRow from "../components/TrackRow";
import Waveform from "../components/Waveform";

export default function AlbumDetail() {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    client
      .get(`/albums/${id}`)
      .then((res) => setAlbum(res.data.album))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Waveform active bars={5} />
      </div>
    );
  }
  if (!album) {
    return <p className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">Album not found.</p>;
  }

  const cover = fileUrl(album.coverArtUrl);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-32 pt-10">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="h-48 w-48 shrink-0 overflow-hidden rounded-lg border border-hairline bg-surface-2">
          {cover ? (
            <img src={cover} alt={album.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-4xl text-hairline">
              {album.title[0]}
            </div>
          )}
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Album</p>
          <h1 className="mt-1 font-display text-3xl text-paper sm:text-4xl">{album.title}</h1>
          <Link to={`/artists/${album.artist.id}`} className="mt-2 inline-block text-amber hover:underline">
            {album.artist.name}
          </Link>
          {album.description && <p className="mt-4 max-w-xl text-sm text-muted">{album.description}</p>}
          <p className="mt-2 font-mono text-xs text-muted">
            {new Date(album.releaseDate).toLocaleDateString()} · {album.tracks.length} tracks
          </p>
        </div>
      </div>

      <div className="mt-10 rounded-xl border border-hairline bg-surface p-2">
        {album.tracks.map((t, i) => (
          <TrackRow key={t.id} track={{ ...t, artist: album.artist }} index={i + 1} />
        ))}
      </div>
    </div>
  );
}
