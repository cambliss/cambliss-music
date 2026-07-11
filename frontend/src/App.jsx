import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { PlayerProvider } from "./context/PlayerContext";
import Navbar from "./components/Navbar";
import PlayerBar from "./components/PlayerBar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Browse from "./pages/Browse";
import Search from "./pages/Search";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ArtistProfile from "./pages/ArtistProfile";
import AlbumDetail from "./pages/AlbumDetail";
import Upload from "./pages/Upload";
import Admin from "./pages/Admin";
import Playlists from "./pages/Playlists";
import PlaylistDetail from "./pages/PlaylistDetail";
import Discovery from "./pages/Discovery";
import Connections from "./pages/Connections";

export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-ink">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/search" element={<Search />} />
                <Route path="/playlists" element={<Playlists />} />
                <Route path="/playlists/:id" element={<PlaylistDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/artists/:id" element={<ArtistProfile />} />
                <Route path="/albums/:id" element={<AlbumDetail />} />
                <Route
                  path="/discover"
                  element={
                    <ProtectedRoute>
                      <Discovery />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/connections"
                  element={
                    <ProtectedRoute>
                      <Connections />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/upload"
                  element={
                    <ProtectedRoute role="ARTIST">
                      <Upload />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute role="ADMIN">
                      <Admin />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Home />} />
              </Routes>
            </main>
            <PlayerBar />
          </div>
        </BrowserRouter>
      </PlayerProvider>
    </AuthProvider>
  );
}
