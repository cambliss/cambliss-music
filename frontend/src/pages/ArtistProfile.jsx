import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import client, { fileUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import TrackRow from "../components/TrackRow";
import AlbumCard from "../components/AlbumCard";
import Waveform from "../components/Waveform";

export default function ArtistProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [artist, setArtist] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    client
      .get(`/artists/${id}`)
      .then((res) => {
        setArtist(res.data.artist);
        setIsFollowing(res.data.isFollowing);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleFollow() {
    if (!user) return;
    if (isFollowing) {
      await client.delete(`/artists/${id}/follow`);
      setIsFollowing(false);
    } else {
      await client.post(`/artists/${id}/follow`);
      setIsFollowing(true);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Waveform active bars={5} />
      </div>
    );
  }
  if (!artist) {
    return <p className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">Artist not found.</p>;
  }

  const cover = fileUrl(artist.artistProfile?.coverImageUrl);
  const avatar = fileUrl(artist.artistProfile?.profileImageUrl);
  const links = artist.artistProfile?.links || {};
  const userLinks = artist.userLinks || [];
  const pressKit = artist.pressKits?.[0];

  return (
    <div className="pb-32">
      <div className="h-56 w-full bg-surface-2">
        {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="-mt-14 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-ink bg-surface-2 font-display text-3xl text-amber">
              {avatar ? (
                <img src={avatar} alt={artist.name} className="h-full w-full object-cover" />
              ) : (
                artist.name?.[0]
              )}
            </div>
            <div>
              <h1 className="font-display text-2xl text-paper sm:text-3xl">{artist.name}</h1>
              <p className="font-mono text-xs text-muted">
                {artist._count?.followers ?? 0} followers
              </p>
            </div>
          </div>

          {user && user.id !== artist.id && (
            <button
              onClick={toggleFollow}
              className={`rounded-full px-4 py-2 font-display text-xs ${
                isFollowing
                  ? "border border-hairline text-muted hover:border-rust hover:text-rust"
                  : "bg-amber text-ink hover:bg-amber-dim"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>

        {artist.artistProfile?.bio && (
          <p className="mt-6 max-w-2xl text-sm text-muted">{artist.artistProfile.bio}</p>
        )}

        {Object.keys(links).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(links).map(([key, url]) =>
              url ? (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-hairline px-3 py-1 font-mono text-xs text-muted hover:border-amber hover:text-amber"
                >
                  {key}
                </a>
              ) : null
            )}
          </div>
        )}

        {userLinks.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3">
            {userLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-hairline px-3 py-1 font-mono text-xs text-muted hover:border-amber hover:text-amber"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        {(artist.artistProfile?.events || artist.artistProfile?.articles || artist.artistProfile?.merchandise) && (
          <section className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-hairline bg-surface p-4">
              <h3 className="font-display text-sm text-amber">Events</h3>
              <p className="mt-2 text-xs text-muted">{JSON.stringify(artist.artistProfile?.events || [], null, 0)}</p>
            </div>
            <div className="rounded-xl border border-hairline bg-surface p-4">
              <h3 className="font-display text-sm text-amber">Articles</h3>
              <p className="mt-2 text-xs text-muted">{JSON.stringify(artist.artistProfile?.articles || [], null, 0)}</p>
            </div>
            <div className="rounded-xl border border-hairline bg-surface p-4">
              <h3 className="font-display text-sm text-amber">Merchandise</h3>
              <p className="mt-2 text-xs text-muted">{JSON.stringify(artist.artistProfile?.merchandise || [], null, 0)}</p>
            </div>
          </section>
        )}

        {pressKit && (
          <section className="mt-10 rounded-xl border border-hairline bg-surface p-5">
            <h2 className="font-display text-lg text-paper">Press Kit</h2>
            {pressKit.headline && <p className="mt-2 text-sm text-amber">{pressKit.headline}</p>}
            {pressKit.shortBio && <p className="mt-2 text-sm text-muted">{pressKit.shortBio}</p>}
            {pressKit.bookingEmail && <p className="mt-2 font-mono text-xs text-muted">{pressKit.bookingEmail}</p>}
          </section>
        )}

        {artist.photos?.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 font-display text-lg text-paper">Photos</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {artist.photos.map((photo) => (
                <img
                  key={photo.id}
                  src={fileUrl(photo.imageUrl)}
                  alt={photo.caption || artist.name}
                  className="h-28 w-full rounded-lg object-cover"
                />
              ))}
            </div>
          </section>
        )}

        {artist.albums?.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 font-display text-lg text-paper">Discography</h2>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5">
              {artist.albums.map((a) => (
                <AlbumCard key={a.id} album={{ ...a, artist: { id: artist.id, name: artist.name } }} />
              ))}
            </div>
          </section>
        )}

        {artist.tracks?.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 font-display text-lg text-paper">Singles</h2>
            <div className="rounded-xl border border-hairline bg-surface p-2">
              {artist.tracks.map((t, i) => (
                <TrackRow
                  key={t.id}
                  track={{ ...t, artist: { id: artist.id, name: artist.name } }}
                  index={i + 1}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
