import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { ai } from "../api";

const TYPE_LABELS = {
  marketplace: "Marketplace",
  group: "Groups",
  short: "Short",
};

export default function FacebookPostsModal({ open, onClose, car }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !car?.id) return;
    setPosts([]);
    setLoading(true);
    ai.facebookPosts(car.id)
      .then((data) => setPosts(data.posts || []))
      .catch((e) => toast.error(e.message || "Failed to generate posts"))
      .finally(() => setLoading(false));
  }, [open, car?.id]);

  async function handleRegenerate() {
    if (!car?.id) return;
    setLoading(true);
    setPosts([]);
    try {
      const data = await ai.facebookPosts(car.id);
      setPosts(data.posts || []);
    } catch (e) {
      toast.error(e.message || "Failed to generate posts");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard")).catch(() => toast.error("Could not copy"));
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-navy-card border border-white/10 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="font-heading font-semibold text-white">
            Facebook Posts {car ? `– ${car.year} ${car.make} ${car.model}` : ""}
          </h2>
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg">
            ✕
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {posts.length === 0 && !loading && (
            <p className="text-gray-400 text-sm mb-4">
              Generate ready-to-use Facebook Marketplace and Group listing descriptions. Each post includes your car details, price, and links back to MotorIQ.
            </p>
          )}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-10 h-10 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400">Generating posts…</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-navy p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-white/10 text-gray-300">
                      {TYPE_LABELS[post.type] || post.type}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(post.text)}
                      className="text-sm text-accent-blue hover:underline"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans break-words">{post.text}</pre>
                </div>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleRegenerate}
              className="w-full py-3 rounded-lg bg-[#1877F2] text-white font-medium hover:bg-[#166FE5] transition"
            >
              Generate Facebook Posts
            </button>
          )}
        </div>
        {posts.length > 0 && (
          <div className="px-4 py-3 border-t border-white/10 flex justify-end gap-2">
            <button type="button" onClick={handleRegenerate} disabled={loading} className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 text-sm disabled:opacity-50">
              Regenerate
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-accent-blue text-white font-medium hover:bg-accent-blue/90">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
