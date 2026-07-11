import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import Waveform from "./Waveform";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  function submitSearch(e) {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-lg text-paper">
          <Waveform />
          Cambliss
        </Link>

        <form onSubmit={submitSearch} className="hidden flex-1 max-w-md sm:block">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search artists, tracks, albums…"
            className="w-full rounded-full border border-hairline bg-surface px-4 py-1.5 text-sm text-paper placeholder:text-muted focus:border-amber"
          />
        </form>

        <nav className="ml-auto flex items-center gap-4 text-sm">
          <Link to="/browse" className="text-muted hover:text-paper">
            Browse
          </Link>
          <Link to="/playlists" className="text-muted hover:text-paper">
            Playlists
          </Link>
          {user && (
            <Link to="/discover" className="text-muted hover:text-paper">
              Discover
            </Link>
          )}
          {user?.role === "ARTIST" && (
            <Link to="/upload" className="text-muted hover:text-paper">
              Upload
            </Link>
          )}
          {user?.role === "ADMIN" && (
            <Link to="/admin" className="text-muted hover:text-paper">
              Admin
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <Link to={`/artists/${user.id}`} className="font-mono text-xs text-amber">
                {user.name}
              </Link>
              <Link to="/connections" className="text-xs text-muted hover:text-paper">
                Connections
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="rounded-full border border-hairline px-3 py-1 text-xs text-muted hover:border-rust hover:text-rust"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-muted hover:text-paper">
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-amber px-3 py-1.5 font-display text-xs text-ink hover:bg-amber-dim"
              >
                Join
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
