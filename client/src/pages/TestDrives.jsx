import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { testDrives as testDrivesApi } from "../api";
import LeadDetailDrawer from "../components/LeadDetailDrawer";

const STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

export default function TestDrives() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  const fetchList = () => testDrivesApi.list().then(setList).catch((e) => toast.error(e.message)).finally(() => setLoading(false));

  useEffect(() => { fetchList(); }, []);

  async function updateStatus(id, status) {
    try {
      await testDrivesApi.update(id, { status });
      toast.success("Updated");
      fetchList();
    } catch (e) { toast.error(e.message); }
  }

  const filtered = list.filter((td) => td.status === filter);

  if (loading) return <div className="h-64 flex items-center justify-center text-gray-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-white">Test Drives</h1>
        <p className="text-gray-400 mt-0.5">Upcoming and past test drive bookings</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm ${filter === s ? "bg-accent-blue text-white" : "bg-navy-card text-gray-400 border border-white/10"}`}>{s.replace("_", " ")}</button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-2 text-gray-400 font-medium">Lead</th>
              <th className="text-left py-3 px-2 text-gray-400 font-medium">Phone</th>
              <th className="text-left py-3 px-2 text-gray-400 font-medium">Car</th>
              <th className="text-left py-3 px-2 text-gray-400 font-medium">Date</th>
              <th className="text-left py-3 px-2 text-gray-400 font-medium">Time</th>
              <th className="text-left py-3 px-2 text-gray-400 font-medium">Status</th>
              <th className="text-left py-3 px-2 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan={7} className="py-8 text-center text-gray-500">None in this category.</td></tr> : filtered.map((td) => (
              <tr key={td.id} className="border-b border-white/5">
                <td className="py-3 px-2 text-white">{td.lead?.name || "—"}</td>
                <td className="py-3 px-2 text-gray-400">{td.lead?.phone || "—"}</td>
                <td className="py-3 px-2 text-gray-300">{td.car?.make} {td.car?.model}</td>
                <td className="py-3 px-2 text-gray-400">{new Date(td.date).toLocaleDateString()}</td>
                <td className="py-3 px-2 text-gray-400">{td.timeSlot}</td>
                <td className="py-3 px-2"><span className="px-2 py-0.5 rounded text-xs bg-white/10">{td.status}</span></td>
                <td className="py-3 px-2 flex flex-wrap gap-1">
                  {td.leadId && <button onClick={() => setSelectedLeadId(td.leadId)} className="text-xs text-accent-blue hover:underline">View Lead</button>}
                  {td.status === "PENDING" && <button onClick={() => updateStatus(td.id, "CONFIRMED")} className="text-xs text-green-400 hover:underline">Confirm</button>}
                  {td.status === "CONFIRMED" && <button onClick={() => updateStatus(td.id, "COMPLETED")} className="text-xs text-accent-blue hover:underline">Complete</button>}
                  {["PENDING", "CONFIRMED"].includes(td.status) && <button onClick={() => updateStatus(td.id, "CANCELLED")} className="text-xs text-red-400 hover:underline">Cancel</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <LeadDetailDrawer leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} onUpdate={fetchList} />
    </div>
  );
}
