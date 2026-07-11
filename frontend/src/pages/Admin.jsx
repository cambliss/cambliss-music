import { useEffect, useState } from "react";
import client from "../api/client";
import Waveform from "../components/Waveform";

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    Promise.all([client.get("/admin/stats"), client.get("/admin/users")])
      .then(([s, u]) => {
        setStats(s.data);
        setUsers(u.data.users);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function setRole(id, role) {
    await client.patch(`/admin/users/${id}/role`, { role });
    load();
  }

  async function setStatus(id, isActive) {
    await client.patch(`/admin/users/${id}/status`, { isActive });
    load();
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Waveform active bars={5} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-32 pt-10">
      <h1 className="mb-8 font-display text-3xl text-paper">Control room</h1>

      {stats && (
        <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Users", stats.users],
            ["Artists", stats.artists],
            ["Tracks", stats.tracks],
            ["Albums", stats.albums],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-hairline bg-surface p-4">
              <p className="font-mono text-2xl text-amber">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-4 font-display text-lg text-paper">Users</h2>
      <div className="overflow-x-auto rounded-xl border border-hairline bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-xs text-muted">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-hairline last:border-0">
                <td className="px-4 py-3 text-paper">{u.name}</td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => setRole(u.id, e.target.value)}
                    className="rounded border border-hairline bg-surface-2 px-2 py-1 text-xs text-paper"
                  >
                    <option value="LISTENER">Listener</option>
                    <option value="ARTIST">Artist</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={u.isActive ? "text-sage" : "text-rust"}>
                    {u.isActive ? "Active" : "Suspended"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setStatus(u.id, !u.isActive)}
                    className="rounded-full border border-hairline px-3 py-1 text-xs text-muted hover:border-amber hover:text-amber"
                  >
                    {u.isActive ? "Suspend" : "Reactivate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
