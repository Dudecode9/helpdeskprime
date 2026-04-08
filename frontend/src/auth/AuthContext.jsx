import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshAuth() {
    try {
      const data = await apiFetch("/api/auth/me", { skipRefresh: false });
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST", skipRefresh: true });
    } finally {
      setUser(null);
    }
  }

  useEffect(() => {
    refreshAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      apiFetch("/api/auth/heartbeat", {
        method: "POST",
        body: {},
      }).catch(() => {});
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refreshAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
