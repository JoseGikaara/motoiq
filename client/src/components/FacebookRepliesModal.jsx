import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { ai } from "../api";

export default function FacebookRepliesModal({ open, onClose, car }) {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creditsUsed, setCreditsUsed] = useState(0);

  useEffect(() => {
    if (!open || !car?.id) return;
    setLoading(true);
    setReplies([]);
    setCreditsUsed(0);
    ai.facebookReplies(car.id)
      .then((data) => {
        setReplies(data.replies || []);
        setCreditsUsed(data.creditsUsed ?? 0);
      })
      .catch((e) => toast.error(e.message || "Failed to load replies"))
      .finally(() => setLoading(false));
  }, [open, car?.id]);

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard")).catch(() => toast.error("Could not copy"));
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-navy-card border border-white/10 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="font-heading font-semibold text-white">Facebook Comment Reply Templates</h2>
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg">
            ✕
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {car && (
            <p className="text-gray-400 text-sm mb-4">
              Copy a reply to paste under Facebook comments. Links include <code className="bg-white/10 px-1 rounded">?source=facebook_comment</code> so leads are tracked.
              {creditsUsed > 0 && (
                <span className="block mt-1 text-accent-blue">AI generated ({creditsUsed} credit{creditsUsed !== 1 ? "s" : ""} used)</span>
              )}
            </p>
          )}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-10 h-10 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400">Loading replies…</p>
            </div>
          ) : replies.length > 0 ? (
            <div className="space-y-4">
              {replies.map((reply, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-navy p-4">
                  <div className="flex justify-end mb-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(reply.text)}
                      className="text-sm text-accent-blue hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans break-words">{reply.text}</pre>
                </div>
              ))}
            </div>
          ) : (
            !loading && <p className="text-gray-500 text-sm">No replies available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
