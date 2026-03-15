import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "";

/** Full-screen "Starting up, please wait..." with spinner. No error message during wait. */
function StartingUpScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-300 gap-4">
      <div
        className="w-10 h-10 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin"
        aria-hidden
      />
      <p className="text-sm">Starting up, please wait...</p>
    </div>
  );
}

/** Shown when VITE_API_URL is not set (e.g. missing in Vercel build). */
function EnvNotSetScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-200 px-6 text-center max-w-md gap-4">
      <p className="font-semibold text-white">API URL not configured</p>
      <p className="text-sm text-slate-400">
        Set <code className="bg-slate-800 px-1 rounded">VITE_API_URL</code> in Vercel: Settings → Environment Variables → add{" "}
        <code className="bg-slate-800 px-1 rounded text-emerald-400">https://motoiq.onrender.com</code> (no trailing slash), then redeploy.
      </p>
      <p className="text-xs text-slate-500">Without this, the app cannot reach your backend and will show “HTML error page” or “server starting up” errors.</p>
    </div>
  );
}

/**
 * On app load, pings VITE_API_URL + '/api/health' every 5 seconds.
 * If VITE_API_URL is not set, shows EnvNotSetScreen and never renders the app.
 * Otherwise shows "Starting up..." until the API responds with valid JSON, then renders children.
 */
export default function ApiHealthGate({ children }) {
  const [apiReady, setApiReady] = useState(false);

  useEffect(() => {
    if (!API) {
      return;
    }

    let cancelled = false;

    async function check() {
      if (cancelled) return;
      try {
        const res = await fetch(`${API}/api/health`);
        const text = await res.text();
        if (cancelled) return;
        if (!res.ok) return;
        try {
          const data = JSON.parse(text);
          if (data && typeof data.status !== "undefined") {
            setApiReady(true);
          }
        } catch {
          // Not valid JSON (e.g. HTML), keep waiting
        }
      } catch {
        // Network error or CORS, keep waiting
      }
    }

    check();
    const id = setInterval(check, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!API) {
    return <EnvNotSetScreen />;
  }
  if (!apiReady) {
    return <StartingUpScreen />;
  }
  return children;
}
