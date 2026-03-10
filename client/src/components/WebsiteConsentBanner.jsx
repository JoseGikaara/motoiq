import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_KEY = "motoriq_consent_v1";

export default function WebsiteConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  const accept = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "accepted");
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50 max-w-xl"
        >
          <div className="rounded-2xl bg-slate-900/95 border border-white/10 px-4 py-3 shadow-xl shadow-black/40 backdrop-blur">
            <p className="text-xs text-slate-200">
              This website uses basic cookies and analytics to understand interest in vehicles and improve the experience.
              By continuing, you agree to our{" "}
              <Link to="/privacy" className="underline text-blue-400">
                Privacy Notice
              </Link>
              .
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white"
                onClick={() => setVisible(false)}
              >
                Maybe later
              </button>
              <button
                type="button"
                onClick={accept}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-500"
              >
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

