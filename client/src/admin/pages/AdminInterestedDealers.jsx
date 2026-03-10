import { useEffect, useState } from "react";
import { admin } from "../../api/admin.js";

const STATUS_BADGE = {
  NEW: "bg-blue-600",
  CONTACTED: "bg-amber-600",
  CONVERTED: "bg-emerald-600",
};

export default function AdminInterestedDealers() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const params = {};
    if (statusFilter !== "all") params.status = statusFilter;
    admin
      .interestedDealers(params)
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  async function updateStatus(id, status) {
    try {
      const updated = await admin.updateInterestedDealer(id, { status });
      setList((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e.message || "Failed to update status");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-white">Interested dealers</h2>
        <div className="flex gap-2">
          {["all", "NEW", "CONTACTED", "CONVERTED"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={
                "px-3 py-1.5 rounded-lg text-xs " +
                (statusFilter === s ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-300")
              }
            >
              {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
        {loading ? (
          <div className="p-8 text-slate-400 text-center">Loading…</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-slate-500 text-center text-sm">
            No interested dealers yet. Leads from the public landing page will appear here.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-700">
                <th className="p-3">Dealer</th>
                <th className="p-3">Dealership</th>
                <th className="p-3">City</th>
                <th className="p-3">Inventory</th>
                <th className="p-3">Status</th>
                <th className="p-3">Submitted</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id} className="border-b border-slate-700/50">
                  <td className="p-3 text-slate-200">
                    {d.name}
                    <div className="text-xs text-slate-400">{d.email} · {d.phone}</div>
                  </td>
                  <td className="p-3 text-slate-200">{d.dealershipName}</td>
                  <td className="p-3 text-slate-300">{d.city}</td>
                  <td className="p-3 text-slate-300">{d.inventorySize ?? "—"}</td>
                  <td className="p-3">
                    <span
                      className={
                        "inline-flex px-2 py-0.5 rounded-full text-xs text-white " +
                        (STATUS_BADGE[d.status] || "bg-slate-600")
                      }
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">
                    {d.createdAt ? new Date(d.createdAt).toLocaleString() : ""}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      {d.status !== "CONTACTED" && (
                        <button
                          type="button"
                          onClick={() => updateStatus(d.id, "CONTACTED")}
                          className="px-2 py-1 rounded bg-slate-700 text-slate-100"
                        >
                          Mark contacted
                        </button>
                      )}
                      {d.status !== "CONVERTED" && (
                        <button
                          type="button"
                          onClick={() => updateStatus(d.id, "CONVERTED")}
                          className="px-2 py-1 rounded bg-emerald-600 text-white"
                        >
                          Mark converted
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

