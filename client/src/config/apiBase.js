// Normalize API base URL from Vite env.
// Handles cases where the env is accidentally set like "VITE_API_URL = https://motoiq.onrender.com".
export function getApiBase() {
  const raw = import.meta.env.VITE_API_URL || "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "";
  if (trimmed.includes("=")) {
    const part = trimmed.split("=").map((s) => s.trim()).pop();
    const base = part && part.startsWith("http") ? part : trimmed;
    return base.replace(/\/$/, "");
  }
  return trimmed.replace(/\/$/, "");
}

