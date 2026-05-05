import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const setAuth = useCallback((userData, token) => {
    if (userData && token) {
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", token);
      setUser(userData);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .getMe()
      .then((res) => {
        const u = res.data.data.user;
        localStorage.setItem("user", JSON.stringify(u));
        setUser(u);
      })
      .catch(() => {
        setAuth(null, null);
      })
      .finally(() => setLoading(false));
  }, [setAuth]);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    const { user: u, token } = res.data.data;
    setAuth(u, token);
    return u;
  };

  const signup = async (data) => {
    const res = await authApi.signup(data);
    const { user: u, token } = res.data.data;
    setAuth(u, token);
    return u;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setAuth(null, null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
