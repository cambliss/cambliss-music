import { useEffect, useState } from "react";
import client from "../api/client";

const PROVIDERS = ["TWITTER", "DISCORD", "TWITCH"];

export default function Connections() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ provider: "TWITTER", username: "", profileUrl: "" });

  function load() {
    client.get("/auth/me/connections").then((res) => setAccounts(res.data.accounts));
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    await client.post("/auth/me/connections", form);
    setForm({ ...form, username: "", profileUrl: "" });
    load();
  }

  async function remove(provider) {
    await client.delete(`/auth/me/connections/${provider.toLowerCase()}`);
    load();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-32 pt-10">
      <h1 className="font-display text-3xl text-paper">Connected Accounts</h1>
      <p className="mt-2 text-sm text-muted">Connect your Twitter, Discord, and Twitch identities.</p>

      <form onSubmit={save} className="mt-8 grid gap-3 rounded-xl border border-hairline bg-surface p-4 sm:grid-cols-3">
        <select
          value={form.provider}
          onChange={(e) => setForm({ ...form, provider: e.target.value })}
          className="rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm"
        >
          {PROVIDERS.map((provider) => (
            <option key={provider} value={provider}>{provider}</option>
          ))}
        </select>
        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm"
        />
        <input
          placeholder="Profile URL"
          value={form.profileUrl}
          onChange={(e) => setForm({ ...form, profileUrl: e.target.value })}
          className="rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm"
        />
        <button className="sm:col-span-3 rounded-full bg-amber px-4 py-2 font-display text-xs text-ink">Save connection</button>
      </form>

      <div className="mt-8 space-y-3">
        {accounts.map((account) => (
          <div key={account.id} className="flex items-center justify-between rounded-xl border border-hairline bg-surface p-4">
            <div>
              <p className="font-display text-sm text-paper">{account.provider}</p>
              <p className="text-xs text-muted">{account.username || "No username"}</p>
            </div>
            <button onClick={() => remove(account.provider)} className="rounded-full border border-hairline px-3 py-1 text-xs text-muted hover:text-rust">
              Disconnect
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
