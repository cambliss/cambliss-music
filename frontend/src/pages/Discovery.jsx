import { useEffect, useState } from "react";
import client from "../api/client";
import TrackRow from "../components/TrackRow";

export default function Discovery() {
  const [feed, setFeed] = useState({ recentTracks: [], likes: [], reposts: [], history: [] });

  useEffect(() => {
    client.get("/discovery/feed").then((res) => setFeed(res.data.feed)).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-32 pt-10">
      <h1 className="font-display text-3xl text-paper">Discovery</h1>
      <p className="mt-2 text-sm text-muted">Your followed artists, likes, reposts, and listening history in one place.</p>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-sm text-muted">From artists you follow</h2>
        <div className="rounded-xl border border-hairline bg-surface p-2">
          {feed.recentTracks.map((track, index) => (
            <TrackRow key={track.id} track={track} index={index + 1} />
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-hairline bg-surface p-4">
          <h3 className="font-display text-sm text-amber">Liked tracks</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {feed.likes.slice(0, 8).map((track) => (
              <li key={track.id}>{track.title} · {track.artist?.name}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-hairline bg-surface p-4">
          <h3 className="font-display text-sm text-amber">Reposted tracks</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {feed.reposts.slice(0, 8).map((track) => (
              <li key={track.id}>{track.title} · {track.artist?.name}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
