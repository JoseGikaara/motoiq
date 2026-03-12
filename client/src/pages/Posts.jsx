import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { posts as postsApi } from "../api";

export default function Posts() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postsApi
      .list()
      .then(setList)
      .catch((e) => toast.error(e.message || "Failed to load posts"))
      .finally(() => setLoading(false));
  }, []);

  function copy(text) {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Post copied"),
      () => toast.error("Could not copy"),
    );
  }

  if (loading) {
    return <div className="h-96 flex items-center justify-center text-gray-400">Loading posts…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-white">Generated Posts</h1>
        <p className="text-gray-400 mt-0.5 text-sm">
          Quick view of sales posts generated for your cars. Click any row to copy.
        </p>
      </div>
      {list.length === 0 ? (
        <div className="bg-navy-card rounded-xl border border-white/5 p-6 text-sm text-gray-400">
          No posts generated yet. Open a car and use the <span className="text-white font-medium">Generate Sales Post</span> button.
        </div>
      ) : (
        <div className="bg-navy-card rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-navy-light border-b border-white/10 text-left text-xs text-gray-400">
                <tr>
                  <th className="px-4 py-2">Car</th>
                  <th className="px-4 py-2">Post preview</th>
                  <th className="px-4 py-2">Created</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {list.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                    onClick={() => copy(post.text)}
                  >
                    <td className="px-4 py-2 text-white whitespace-nowrap">
                      {post.car
                        ? `${post.car.year ?? ""} ${post.car.make ?? ""} ${post.car.model ?? ""}`.trim()
                        : "Car"}
                    </td>
                    <td className="px-4 py-2 text-gray-200 max-w-xl">
                      <div className="line-clamp-3 whitespace-pre-line text-xs md:text-sm">
                        {post.text}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs whitespace-nowrap">
                      {post.createdAt ? new Date(post.createdAt).toLocaleString() : ""}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copy(post.text);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-white/15 text-xs text-white hover:bg-white/5"
                      >
                        Copy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

