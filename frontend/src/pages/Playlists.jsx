import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Playlists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", isPublic: true });

  function load() {
    client.get("/playlists", { params: { pageSize: 30 } }).then((res) => setPlaylists(res.data.playlists));
  }

  useEffect(() => {
    load();
  }, []);

  async function createPlaylist(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    await client.post("/playlists", form);
    setForm({ title: "", description: "", isPublic: true });
    load();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-32 pt-10">
      <h1 className="font-display text-3xl text-paper">Playlists</h1>
      <p className="mt-2 text-sm text-muted">Build personal and public playlists, then organize tracks in any order.</p>

      {user && (
        <form onSubmit={createPlaylist} className="mt-8 grid gap-3 rounded-xl border border-hairline bg-surface p-4 sm:grid-cols-2">
          <input
            placeholder="Playlist title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm"
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
            />
            Public playlist
          </label>
          <button className="rounded-full bg-amber px-4 py-2 font-display text-xs text-ink">Create playlist</button>
        </form>
      )}

      <div className="mt-8 grid gap-3">
        {playlists.map((playlist) => (
          <Link key={playlist.id} to={`/playlists/${playlist.id}`} className="rounded-xl border border-hairline bg-surface p-4 hover:border-amber">
            <p className="font-display text-lg text-paper">{playlist.title}</p>
            <p className="text-xs text-muted">By {playlist.owner?.name} · {playlist._count?.tracks || 0} tracks</p>
            {playlist.description && <p className="mt-2 text-sm text-muted">{playlist.description}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
