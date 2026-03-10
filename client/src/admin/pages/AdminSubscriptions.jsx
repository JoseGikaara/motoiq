import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { admin } from "../../api/admin.js";

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    admin.subscriptions().then((list) => setSubs(Array.isArray(list) ? list : [])).catch(() => setSubs([])).finally(() => setLoading(false));
  }, []);

  function daysLeft(endDate) {
    if (!endDate) return null;
    const end = new Date(endDate);
    if (end < new Date()) return "EXPIRED";
    return Math.ceil((end - new Date()) / 86400000);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Subscriptions</h2>
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
        {loading ? <div className="p-8 text-slate-400 text-center">Loading...</div> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-700">
                <th className="p-3">Dealer</th><th className="p-3">Plan</th><th className="p-3">Status</th><th className="p-3">Amount (KES)</th><th className="p-3">End</th><th className="p-3">Days left</th><th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => {
                const d = daysLeft(s.endDate);
                return (
                  <tr key={s.id} className="border-b border-slate-700/50">
                    <td className="p-3"><Link to={"/admin/dealers/" + s.dealerId} className="text-white hover:underline">{s.dealer?.dealershipName || s.dealer?.name || s.dealerId}</Link></td>
                    <td className="p-3 text-slate-300">{s.plan}</td>
                    <td className="p-3 text-slate-300">{s.status}</td>
                    <td className="p-3 text-slate-300">{s.amount?.toLocaleString() ?? 0}</td>
                    <td className="p-3 text-slate-500">{s.endDate ? new Date(s.endDate).toLocaleDateString() : "-"}</td>
                    <td className="p-3">{d === null ? "-" : d === "EXPIRED" ? <span className="text-red-400">EXPIRED</span> : d + " days"}</td>
                    <td className="p-3"><Link to={"/admin/dealers/" + s.dealerId} className="text-red-400 text-xs">Edit</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && subs.length === 0 && <div className="p-8 text-slate-500 text-center">No subscriptions yet</div>}
      </div>
    </div>
  );
}
