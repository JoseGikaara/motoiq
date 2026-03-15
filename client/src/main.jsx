import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import * as Sentry from "@sentry/react";
import { ThemeProvider } from "./context/ThemeContext";
import ApiHealthGate from "./components/ApiHealthGate";
import App from "./App";
import "./styles/tokens.css";
import "./styles/globals.css";
import "./index.css";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.2,
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200 px-6 text-center text-sm">
          <div>
            <p className="font-semibold mb-2">Something went wrong.</p>
            <p className="text-slate-400">Our team has been notified. Please refresh the page and try again.</p>
          </div>
        </div>
      }
    >
      <ApiHealthGate>
        <ThemeProvider>
          <BrowserRouter>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: { background: "var(--bg-elevated)", color: "var(--text-primary)" },
              }}
            />
          </BrowserRouter>
        </ThemeProvider>
      </ApiHealthGate>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => {
        // ignore failures silently
      });
  });
}
