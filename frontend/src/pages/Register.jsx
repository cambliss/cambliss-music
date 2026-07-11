import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register, oauthLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "LISTENER" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Could not create your account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 pb-32 pt-16">
      <h1 className="mb-6 font-display text-3xl text-paper">Join Cambliss</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-muted">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-paper focus:border-amber"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-paper focus:border-amber"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-paper focus:border-amber"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs text-muted">I'm joining as a…</label>
          <div className="flex gap-2">
            {["LISTENER", "ARTIST"].map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setForm({ ...form, role: r })}
                className={`flex-1 rounded-lg border px-3 py-2 font-display text-xs ${
                  form.role === r
                    ? "border-amber bg-amber/10 text-amber"
                    : "border-hairline text-muted hover:text-paper"
                }`}
              >
                {r === "LISTENER" ? "Listener" : "Artist"}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-rust">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-amber py-2.5 font-display text-sm text-ink hover:bg-amber-dim disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
      <div className="mt-6 rounded-xl border border-hairline bg-surface p-3">
        <p className="mb-2 text-xs text-muted">Or sign up with OAuth</p>
        <div className="flex gap-2">
          {[
            ["Twitter", "twitter"],
            ["Discord", "discord"],
            ["Twitch", "twitch"],
          ].map(([label, provider]) => (
            <button
              key={provider}
              type="button"
              onClick={async () => {
                await oauthLogin(provider);
                navigate("/");
              }}
              className="flex-1 rounded-lg border border-hairline px-3 py-2 text-xs text-muted hover:border-amber hover:text-amber"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-4 text-sm text-muted">
        Already have an account?{" "}
        <Link to="/login" className="text-amber hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
