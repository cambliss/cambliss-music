import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import client from "../api/client";
import TrackRow from "../components/TrackRow";
import AlbumCard from "../components/AlbumCard";
import ArtistCard from "../components/ArtistCard";
import Waveform from "../components/Waveform";

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [results, setResults] = useState({ artists: [], tracks: [], albums: [], releases: [], playlists: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    client
      .get("/search", { params: { q } })
      .then((res) => setResults(res.data))
      .finally(() => setLoading(false));
  }, [q]);

  const empty =
    !loading &&
    results.artists.length === 0 &&
    results.tracks.length === 0 &&
    results.albums.length === 0 &&
    results.releases.length === 0 &&
    results.playlists.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-32 pt-10">
      <h1 className="mb-6 font-display text-2xl text-paper">
        Results for <span className="text-amber">&ldquo;{q}&rdquo;</span>
      </h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <Waveform active bars={5} />
        </div>
      ) : empty ? (
        <p className="text-sm text-muted">Nothing matched that search. Try a different term.</p>
      ) : (
        <div className="space-y-10">
          {results.artists.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-sm text-muted">Artists</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
                {results.artists.map((a) => (
                  <ArtistCard key={a.id} artist={a} />
                ))}
              </div>
            </section>
          )}

          {results.tracks.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-sm text-muted">Tracks</h2>
              <div className="rounded-xl border border-hairline bg-surface p-2">
                {results.tracks.map((t, i) => (
                  <TrackRow key={t.id} track={t} index={i + 1} />
                ))}
              </div>
            </section>
          )}

          {results.albums.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-sm text-muted">Albums</h2>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5">
                {results.albums.map((a) => (
                  <AlbumCard key={a.id} album={a} />
                ))}
              </div>
            </section>
          )}

          {results.releases.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-sm text-muted">Releases</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {results.releases.map((r) => (
                  <div key={r.id} className="rounded-xl border border-hairline bg-surface p-4">
                    <p className="font-display text-lg text-paper">{r.title}</p>
                    <p className="text-xs text-muted">{r.artist?.name} · {r.type}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {results.playlists.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-sm text-muted">Playlists</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {results.playlists.map((p) => (
                  <div key={p.id} className="rounded-xl border border-hairline bg-surface p-4">
                    <p className="font-display text-lg text-paper">{p.title}</p>
                    <p className="text-xs text-muted">{p.owner?.name} · {p._count?.tracks || 0} tracks</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
