import { createContext, useContext, useState, useEffect } from "react";
import { auth as authApi } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("motoriq_token");
    const dealer = localStorage.getItem("motoriq_dealer");
    if (token && dealer) setUser(JSON.parse(dealer));
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { dealer, token } = await authApi.login({ email, password });
    localStorage.setItem("motoriq_token", token);
    localStorage.setItem("motoriq_dealer", JSON.stringify(dealer));
    setUser(dealer);
    return dealer;
  };

  const logout = () => {
    localStorage.removeItem("motoriq_token");
    localStorage.removeItem("motoriq_dealer");
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      localStorage.setItem("motoriq_dealer", JSON.stringify(next));
      return next;
    });
  };

  const demoLogin = async () => {
    const { dealer, token } = await authApi.demoSetup();
    localStorage.setItem("motoriq_token", token);
    localStorage.setItem("motoriq_dealer", JSON.stringify(dealer));
    setUser(dealer);
    return dealer;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, demoLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
