import { useState, useEffect } from "react";

/**
 * Returns whether to use video backgrounds in marquees/hero.
 * Disables on mobile, slow connection (effectiveType), or when user has saveData.
 * @param {boolean} dealerEnabled - dealer's enableVideoBackgrounds
 * @returns {boolean}
 */
export function useVideoAllowed(dealerEnabled) {
  const [allowed, setAllowed] = useState(() => getInitialAllowed(dealerEnabled));

  useEffect(() => {
    if (!dealerEnabled) {
      setAllowed(false);
      return;
    }
    setAllowed(getInitialAllowed(dealerEnabled));

    const conn = typeof navigator !== "undefined" && navigator.connection;
    const onChange = () => setAllowed(getInitialAllowed(dealerEnabled));
    if (conn) conn.addEventListener("change", onChange);
    const media = window.matchMedia?.("(max-width: 768px)");
    if (media) media.addEventListener("change", onChange);
    return () => {
      if (conn) conn.removeEventListener("change", onChange);
      if (media) media.removeEventListener("change", onChange);
    };
  }, [dealerEnabled]);

  return allowed;
}

function getInitialAllowed(dealerEnabled) {
  if (!dealerEnabled) return false;
  if (typeof window === "undefined") return true;
  const conn = navigator.connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType && ["slow-2g", "2g"].includes(conn.effectiveType)) return false;
  if (window.matchMedia?.("(max-width: 768px)")?.matches) return false;
  return true;
}
