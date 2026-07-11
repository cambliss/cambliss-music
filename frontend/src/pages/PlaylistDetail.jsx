import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client";
import TrackRow from "../components/TrackRow";
import { useAuth } from "../context/AuthContext";

export default function PlaylistDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [playlist, setPlaylist] = useState(null);
  const [trackId, setTrackId] = useState("");

  function load() {
    client.get(`/playlists/${id}`).then((res) => setPlaylist(res.data.playlist));
  }

  useEffect(() => {
    load();
  }, [id]);

  async function addTrack(e) {
    e.preventDefault();
    if (!trackId.trim()) return;
    await client.post(`/playlists/${id}/tracks`, { trackId: trackId.trim() });
    setTrackId("");
    load();
  }

  if (!playlist) return <p className="mx-auto max-w-5xl px-4 py-16 text-muted">Loading playlist…</p>;

  const canEdit = user?.id === playlist.ownerId;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-32 pt-10">
      <h1 className="font-display text-3xl text-paper">{playlist.title}</h1>
      <p className="mt-2 text-xs text-muted">By {playlist.owner?.name} · {playlist.isPublic ? "Public" : "Private"}</p>
      {playlist.description && <p className="mt-4 text-sm text-muted">{playlist.description}</p>}

      {canEdit && (
        <form onSubmit={addTrack} className="mt-6 flex gap-2 rounded-xl border border-hairline bg-surface p-3">
          <input
            placeholder="Track ID to add"
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            className="flex-1 rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm"
          />
          <button className="rounded-full bg-amber px-4 py-2 font-display text-xs text-ink">Add</button>
        </form>
      )}

      <div className="mt-8 rounded-xl border border-hairline bg-surface p-2">
        {playlist.tracks.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">No tracks in this playlist yet.</p>
        ) : (
          playlist.tracks.map((item, index) => <TrackRow key={item.id} track={item.track} index={index + 1} />)
        )}
      </div>
    </div>
  );
}
