import { useEffect, useState } from "react";
import client from "../api/client";
import TrackRow from "../components/TrackRow";
import AlbumCard from "../components/AlbumCard";
import ArtistCard from "../components/ArtistCard";
import Waveform from "../components/Waveform";

const TABS = [
  { key: "tracks", label: "Tracks" },
  { key: "albums", label: "Albums" },
  { key: "releases", label: "Releases" },
  { key: "playlists", label: "Playlists" },
  { key: "artists", label: "Artists" },
];

export default function Browse() {
  const [tab, setTab] = useState("tracks");
  const [data, setData] = useState({ tracks: [], albums: [], releases: [], playlists: [], artists: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const endpoint = {
      tracks: "/tracks",
      albums: "/albums",
      releases: "/releases",
      playlists: "/playlists",
      artists: "/artists",
    }[tab];
    client
      .get(endpoint, { params: { pageSize: 24 } })
      .then((res) => {
        const payload =
          res.data[tab] ||
          (tab === "releases" ? res.data.releases : tab === "playlists" ? res.data.playlists : []);
        const nextPayload =
          tab === "releases"
            ? [...payload].sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
            : payload;
        setData((prev) => ({ ...prev, [tab]: nextPayload }));
      })
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-32 pt-10">
      <h1 className="mb-6 font-display text-3xl text-paper">Browse the catalog</h1>

      <div className="mb-8 flex gap-2 border-b border-hairline">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`font-display text-sm px-4 py-2 -mb-px border-b-2 ${
              tab === t.key ? "border-amber text-amber" : "border-transparent text-muted hover:text-paper"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Waveform active bars={5} />
        </div>
      ) : tab === "tracks" ? (
        <div className="rounded-xl border border-hairline bg-surface p-2">
          {data.tracks.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">No tracks yet.</p>
          ) : (
            data.tracks.map((t, i) => <TrackRow key={t.id} track={t} index={i + 1} />)
          )}
        </div>
      ) : tab === "albums" ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5">
          {data.albums.length === 0 ? (
            <p className="col-span-full p-6 text-center text-sm text-muted">No albums yet.</p>
          ) : (
            data.albums.map((a) => <AlbumCard key={a.id} album={a} />)
          )}
        </div>
      ) : tab === "releases" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {data.releases.length === 0 ? (
            <p className="col-span-full p-6 text-center text-sm text-muted">No releases yet.</p>
          ) : (
            data.releases.map((r) => (
              <div key={r.id} className="rounded-xl border border-hairline bg-surface p-4">
                <p className="font-display text-lg text-paper">{r.title}</p>
                <p className="text-xs text-muted">{r.artist?.name} · {r.type}</p>
                <p className="mt-2 font-mono text-xs text-muted">
                  {new Date(r.releaseDate).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      ) : tab === "playlists" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {data.playlists.length === 0 ? (
            <p className="col-span-full p-6 text-center text-sm text-muted">No playlists yet.</p>
          ) : (
            data.playlists.map((p) => (
              <div key={p.id} className="rounded-xl border border-hairline bg-surface p-4">
                <p className="font-display text-lg text-paper">{p.title}</p>
                <p className="text-xs text-muted">{p.owner?.name} · {p._count?.tracks || 0} tracks</p>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {data.artists.length === 0 ? (
            <p className="col-span-full p-6 text-center text-sm text-muted">No artists yet.</p>
          ) : (
            data.artists.map((a) => <ArtistCard key={a.id} artist={a} />)
          )}
        </div>
      )}
    </div>
  );
}
