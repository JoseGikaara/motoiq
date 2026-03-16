export function getApiBase() {
  const raw = import.meta.env.VITE_API_URL || "";
  return raw.trim().replace(/\/$/, "");
}

