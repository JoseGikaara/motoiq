import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { admin } from "../../api/admin.js";

const actionColors = { LEAD_CAPTURED: "text-green-400", CAR_ADDED: "text-blue-400", TEST_DRIVE_BOOKED: "text-orange-400" };

function timeAgo(date) {
  if (!date) return "";
  const sec = Math.floor((Date.now() - new Date(date)) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return Math.floor(sec / 60) + "m ago";
  if (sec < 86400) return Math.floor(sec / 3600) + "h ago";
  if (sec < 604800) return Math.floor(sec / 86400) + "d ago";
  return new Date(date).toLocaleDateString();
}

export default function AdminActivity() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dealerId, setDealerId] = useState("");

  function load() {
    const params = { limit: 50 };
    if (dealerId) params.dealerId = dealerId;
    admin.activity(params).then(setLogs).catch(() => setLogs([])).finally(() => setLoading(false));
  }

  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, [dealerId]);

  function exportCsv() {
    const headers = ["Timestamp", "Dealer", "Action", "Detail", "IP"];
    const rows = (logs || []).map((l) => [l.createdAt ? new Date(l.createdAt).toISOString() : "", l.dealer?.dealershipName || l.dealer?.name || "", l.action || "", (l.detail || "").replace(/"/g, '""'), l.ip || ""]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => '"' + c + '"').join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "motoriq-activity-" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Activity Log</h2>
        <button onClick={exportCsv} className="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm hover:bg-slate-600">Export CSV</button>
      </div>
      <input type="text" placeholder="Filter by dealer ID" value={dealerId} onChange={(e) => setDealerId(e.target.value)} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white w-64 text-sm" />
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
        {loading ? <div className="p-8 text-slate-400 text-center">Loading...</div> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-700">
                <th className="p-3">Time</th><th className="p-3">Dealer</th><th className="p-3">Action</th><th className="p-3">Detail</th><th className="p-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {(logs || []).map((log) => (
                <tr key={log.id} className="border-b border-slate-700/50">
                  <td className="p-3 text-slate-500" title={log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}>{timeAgo(log.createdAt)}</td>
                  <td className="p-3">{log.dealerId ? <Link to={"/admin/dealers/" + log.dealerId} className="text-red-400 hover:underline">{log.dealer?.dealershipName || log.dealer?.name || log.dealerId}</Link> : <span className="text-slate-500">-</span>}</td>
                  <td className={"p-3 " + (actionColors[log.action] || "text-slate-400")}>{log.action}</td>
                  <td className="p-3 text-slate-500 truncate max-w-xs">{log.detail || "-"}</td>
                  <td className="p-3 text-slate-600 text-xs">{log.ip || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && (!logs || logs.length === 0) && <div className="p-8 text-slate-500 text-center">No activity yet</div>}
      </div>
    </div>
  );
}
