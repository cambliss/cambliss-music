import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import TrackRow from "../components/TrackRow";
import ArtistCard from "../components/ArtistCard";
import Waveform from "../components/Waveform";

export default function Home() {
  const [tracks, setTracks] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get("/tracks", { params: { pageSize: 6 } }),
      client.get("/artists", { params: { pageSize: 6 } }),
    ])
      .then(([t, a]) => {
        setTracks(t.data.tracks);
        setArtists(a.data.artists);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-32 pt-10">
      <section className="mb-16 border-b border-hairline pb-12">
        <div className="flex items-center gap-3 text-amber">
          <Waveform active bars={7} />
          <span className="font-mono text-xs uppercase tracking-widest">Now recording</span>
        </div>
        <h1 className="mt-4 font-display text-5xl leading-tight text-paper sm:text-6xl">
          Independent artists.
          <br />
          One studio floor.
        </h1>
        <p className="mt-4 max-w-xl text-muted">
          Upload tracks, build albums, and grow a following — Cambliss is the release page,
          storefront, and stage for artists who run their own label.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            to="/register"
            className="rounded-full bg-amber px-5 py-2.5 font-display text-sm text-ink hover:bg-amber-dim"
          >
            Start uploading
          </Link>
          <Link
            to="/browse"
            className="rounded-full border border-hairline px-5 py-2.5 font-display text-sm text-paper hover:border-amber"
          >
            Browse the catalog
          </Link>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-12">
          <Waveform active bars={5} />
        </div>
      ) : (
        <>
          <section className="mb-14">
            <h2 className="mb-4 font-display text-lg text-paper">Fresh off the tape</h2>
            <div className="rounded-xl border border-hairline bg-surface p-2">
              {tracks.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted">
                  No tracks yet. Be the first artist to upload.
                </p>
              ) : (
                tracks.map((t, i) => <TrackRow key={t.id} track={t} index={i + 1} />)
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-display text-lg text-paper">Artists on the roster</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {artists.map((a) => (
                <ArtistCard key={a.id} artist={a} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
