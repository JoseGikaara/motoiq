import { createContext, useContext, useCallback, useState, useEffect } from "react";

const STORAGE_PREFIX = "motoriq_website_favorites_";

const WebsiteFavoritesContext = createContext(null);

export function WebsiteFavoritesProvider({ children, slug }) {
  const storageKey = slug ? `${STORAGE_PREFIX}${slug}` : null;
  const [ids, setIds] = useState(() => {
    if (!storageKey || typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!storageKey || !ids.length) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(ids));
    } catch (e) {
      console.warn("Favorites save failed", e);
    }
  }, [storageKey, ids]);

  const add = useCallback((carId) => {
    setIds((prev) => (prev.includes(carId) ? prev : [...prev, carId]));
  }, []);

  const remove = useCallback((carId) => {
    setIds((prev) => prev.filter((id) => id !== carId));
  }, []);

  const toggle = useCallback((carId) => {
    setIds((prev) =>
      prev.includes(carId) ? prev.filter((id) => id !== carId) : [...prev, carId]
    );
  }, []);

  const clear = useCallback(() => setIds([]), []);

  const has = useCallback((carId) => ids.includes(carId), [ids]);

  const value = { ids, add, remove, toggle, clear, has };

  return (
    <WebsiteFavoritesContext.Provider value={value}>
      {children}
    </WebsiteFavoritesContext.Provider>
  );
}

export function useWebsiteFavorites() {
  const ctx = useContext(WebsiteFavoritesContext);
  return ctx || { ids: [], add: () => {}, remove: () => {}, toggle: () => {}, clear: () => {}, has: () => false };
}
