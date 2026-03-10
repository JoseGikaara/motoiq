import { createContext, useContext, useCallback, useState, useEffect } from "react";

const STORAGE_KEY = "motoriq_website_recently_viewed";
const MAX_ITEMS = 5;

const WebsiteRecentlyViewedContext = createContext(null);

function loadFromStorage(slug) {
  if (!slug || typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    const list = all[slug] || [];
    return Array.isArray(list) ? list.slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

function saveToStorage(slug, list) {
  if (!slug || typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[slug] = list.slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.warn("Recently viewed save failed", e);
  }
}

export function WebsiteRecentlyViewedProvider({ children, slug }) {
  const [items, setItems] = useState(() => loadFromStorage(slug));

  useEffect(() => {
    if (!slug) return;
    setItems(loadFromStorage(slug));
  }, [slug]);

  useEffect(() => {
    saveToStorage(slug, items);
  }, [slug, items]);

  const add = useCallback((car) => {
    if (!car?.id) return;
    const entry = {
      id: car.id,
      year: car.year,
      make: car.make,
      model: car.model,
    };
    setItems((prev) => {
      const filtered = prev.filter((c) => c.id !== car.id);
      return [entry, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  const value = { items, add };

  return (
    <WebsiteRecentlyViewedContext.Provider value={value}>
      {children}
    </WebsiteRecentlyViewedContext.Provider>
  );
}

export function useWebsiteRecentlyViewed() {
  const ctx = useContext(WebsiteRecentlyViewedContext);
  return ctx || { items: [], add: () => {} };
}
