import { createContext, useContext, useEffect, useState, useCallback } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem("cambliss_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await client.get("/auth/me");
      setUser(data.user);
    } catch {
      localStorage.removeItem("cambliss_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  async function login(email, password) {
    const { data } = await client.post("/auth/login", { email, password });
    localStorage.setItem("cambliss_token", data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const { data } = await client.post("/auth/register", payload);
    localStorage.setItem("cambliss_token", data.token);
    setUser(data.user);
    return data.user;
  }

  async function oauthLogin(provider) {
    const normalized = String(provider || "").toUpperCase();
    const fakeAccountId = `${normalized.toLowerCase()}_${Date.now()}`;
    const { data } = await client.post(`/auth/oauth/${normalized.toLowerCase()}`, {
      providerAccountId: fakeAccountId,
      email: `${fakeAccountId}@cambliss.oauth`,
      name: `${normalized[0]}${normalized.slice(1).toLowerCase()} User`,
    });
    localStorage.setItem("cambliss_token", data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("cambliss_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, oauthLogin, logout, refresh: loadMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
