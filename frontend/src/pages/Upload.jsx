import { useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Upload() {
  const { user } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [albumForm, setAlbumForm] = useState({ title: "", description: "" });
  const [albumCover, setAlbumCover] = useState(null);
  const [trackForm, setTrackForm] = useState({
    title: "",
    genre: "",
    albumId: "",
    tags: "",
    license: "ALL_RIGHTS_RESERVED",
    isPublic: true,
    isDownloadable: false,
  });
  const [trackFile, setTrackFile] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  function loadAlbums() {
    client.get(`/artists/${user.id}`).then((res) => setAlbums(res.data.artist.albums || []));
  }

  useEffect(() => {
    loadAlbums();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateAlbum(e) {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    if (!albumForm.title) return;
    const formData = new FormData();
    formData.append("title", albumForm.title);
    formData.append("description", albumForm.description);
    if (albumCover) formData.append("cover", albumCover);

    setSubmitting(true);
    try {
      await client.post("/albums", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setAlbumForm({ title: "", description: "" });
      setAlbumCover(null);
      setStatus({ type: "success", message: "Album created." });
      loadAlbums();
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.error || "Could not create album." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUploadTrack(e) {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    if (!trackForm.title || !trackFile) {
      setStatus({ type: "error", message: "A title and an audio file are required." });
      return;
    }
    const formData = new FormData();
    formData.append("title", trackForm.title);
    formData.append("genre", trackForm.genre);
    if (trackForm.albumId) formData.append("albumId", trackForm.albumId);
    formData.append("tags", trackForm.tags);
    formData.append("license", trackForm.license);
    formData.append("isPublic", String(trackForm.isPublic));
    formData.append("isDownloadable", String(trackForm.isDownloadable));
    formData.append("audio", trackFile);

    setSubmitting(true);
    try {
      await client.post("/tracks", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setTrackForm({
        title: "",
        genre: "",
        albumId: "",
        tags: "",
        license: "ALL_RIGHTS_RESERVED",
        isPublic: true,
        isDownloadable: false,
      });
      setTrackFile(null);
      setStatus({ type: "success", message: "Track uploaded." });
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.error || "Could not upload track." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-32 pt-10">
      <h1 className="mb-2 font-display text-3xl text-paper">Studio</h1>
      <p className="mb-8 text-sm text-muted">Create an album, then upload tracks into it — or upload a single.</p>

      {status.message && (
        <p className={`mb-6 text-sm ${status.type === "error" ? "text-rust" : "text-sage"}`}>
          {status.message}
        </p>
      )}

      <section className="mb-10 rounded-xl border border-hairline bg-surface p-5">
        <h2 className="mb-4 font-display text-sm text-amber">New album</h2>
        <form onSubmit={handleCreateAlbum} className="space-y-3">
          <input
            placeholder="Album title"
            value={albumForm.title}
            onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })}
            className="w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm text-paper focus:border-amber"
          />
          <textarea
            placeholder="Description (optional)"
            value={albumForm.description}
            onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm text-paper focus:border-amber"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAlbumCover(e.target.files[0])}
            className="w-full text-xs text-muted"
          />
          <button
            disabled={submitting}
            className="rounded-full bg-amber px-4 py-2 font-display text-xs text-ink hover:bg-amber-dim disabled:opacity-60"
          >
            Create album
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-hairline bg-surface p-5">
        <h2 className="mb-4 font-display text-sm text-amber">Upload a track</h2>
        <form onSubmit={handleUploadTrack} className="space-y-3">
          <input
            placeholder="Track title"
            value={trackForm.title}
            onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
            className="w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm text-paper focus:border-amber"
          />
          <input
            placeholder="Genre (optional)"
            value={trackForm.genre}
            onChange={(e) => setTrackForm({ ...trackForm, genre: e.target.value })}
            className="w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm text-paper focus:border-amber"
          />
          <select
            value={trackForm.albumId}
            onChange={(e) => setTrackForm({ ...trackForm, albumId: e.target.value })}
            className="w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm text-paper focus:border-amber"
          >
            <option value="">No album — release as a single</option>
            {albums.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
          <input
            placeholder="Tags (comma separated)"
            value={trackForm.tags}
            onChange={(e) => setTrackForm({ ...trackForm, tags: e.target.value })}
            className="w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm text-paper focus:border-amber"
          />
          <select
            value={trackForm.license}
            onChange={(e) => setTrackForm({ ...trackForm, license: e.target.value })}
            className="w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm text-paper focus:border-amber"
          >
            <option value="ALL_RIGHTS_RESERVED">All Rights Reserved</option>
            <option value="CC_BY">Creative Commons BY</option>
            <option value="CC_BY_SA">Creative Commons BY-SA</option>
            <option value="CC_BY_NC">Creative Commons BY-NC</option>
            <option value="CC_BY_NC_SA">Creative Commons BY-NC-SA</option>
          </select>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={trackForm.isPublic}
              onChange={(e) => setTrackForm({ ...trackForm, isPublic: e.target.checked })}
            />
            Public track
          </label>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={trackForm.isDownloadable}
              onChange={(e) => setTrackForm({ ...trackForm, isDownloadable: e.target.checked })}
            />
            Allow downloads
          </label>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setTrackFile(e.target.files[0])}
            className="w-full text-xs text-muted"
          />
          <button
            disabled={submitting}
            className="rounded-full bg-amber px-4 py-2 font-display text-xs text-ink hover:bg-amber-dim disabled:opacity-60"
          >
            Upload track
          </button>
        </form>
      </section>
    </div>
  );
}
