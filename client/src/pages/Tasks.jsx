import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { tasks as tasksApi } from "../api";
import LeadDetailDrawer from "../components/LeadDetailDrawer";

export default function Tasks() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  const fetchList = () => tasksApi.list().then(setList).catch((e) => toast.error(e.message)).finally(() => setLoading(false));

  useEffect(() => {
    fetchList();
  }, []);

  async function markDone(id) {
    try {
      await tasksApi.markDone(id);
      toast.success("Marked done");
      setList((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading) return <div className="h-64 flex items-center justify-center text-gray-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-white">Tasks</h1>
        <p className="text-gray-400 mt-0.5">Follow-up reminders for stale leads</p>
      </div>

      {list.length === 0 ? (
        <div className="bg-navy-card rounded-xl border border-white/5 p-12 text-center">
          <p className="text-gray-400">No pending follow-ups. We'll add tasks when leads go 2+ days without contact.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((task) => (
            <div key={task.id} className="bg-navy-card rounded-xl border border-white/5 p-4 shadow-card">
              <p className="text-white font-medium">{task.lead?.name}</p>
              <p className="text-sm text-gray-400">{task.lead?.car?.make} {task.lead?.car?.model}</p>
              <p className="text-sm text-accent-orange mt-1">{task.message}</p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-xs bg-white/10">{task.lead?.status?.replace("_", " ")}</span>
                <button onClick={() => setSelectedLeadId(task.leadId)} className="text-sm text-accent-blue hover:underline">View Lead</button>
                <button onClick={() => markDone(task.id)} className="text-sm text-green-400 hover:underline ml-auto">Mark Done</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <LeadDetailDrawer leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} onUpdate={fetchList} />
    </div>
  );
}
