import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
import { leads as leadsApi } from "../api";
import LeadCard from "../components/LeadCard";
import LeadDetailDrawer from "../components/LeadDetailDrawer";
import DroppableColumn from "../components/DroppableColumn";

const COLUMNS = [
  { id: "NEW", label: "New" },
  { id: "CONTACTED", label: "Contacted" },
  { id: "TEST_DRIVE", label: "Test Drive" },
  { id: "NEGOTIATION", label: "Negotiation" },
  { id: "CLOSED", label: "Closed" },
  { id: "LOST", label: "Lost" },
];

function ScoreBadge({ score }) {
  if (!score) return null;
  const map = { hot: "🔥 Hot", warm: "🌡 Warm", cold: "❄️ Cold" };
  const cls = { hot: "text-accent-orange", warm: "text-yellow-400", cold: "text-blue-300" };
  return <span className={`text-xs font-medium ${cls[score] || ""}`}>{map[score] || score}</span>;
}

export default function Leads() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [viewMode, setViewMode] = useState("pipeline");

  const fetchLeads = () => leadsApi.list().then(setList).catch((e) => toast.error(e.message)).finally(() => setLoading(false));

  useEffect(() => {
    fetchLeads();
  }, []);

  const leadsByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = list.filter((l) => l.status === col.id);
    return acc;
  }, {});

  function handleDragStart(e) {
    setActiveId(e.active.id);
  }

  function handleDragEnd(e) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const leadId = active.id;
    const newStatus = over.id;
    if (!COLUMNS.some((c) => c.id === newStatus)) return;
    const lead = list.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;
    leadsApi.updateStatus(leadId, newStatus).then((updated) => {
      setList((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
      toast.success("Status updated");
    }).catch((err) => toast.error(err.message));
  }

  function handleDragOver(e) {
    // optional: visual feedback
  }

  const activeLead = activeId ? list.find((l) => l.id === activeId) : null;

  if (loading) {
    return <div className="h-96 flex items-center justify-center text-gray-400">Loading leads…</div>;
  }

  const hasLeads = list.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-white">Leads Pipeline</h1>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <p className="text-gray-400 text-sm">Drag and drop to update status, or switch to table view.</p>
          <div className="inline-flex items-center gap-1 rounded-full bg-navy-card border border-white/10 p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("pipeline")}
              className={`px-3 py-1 rounded-full ${viewMode === "pipeline" ? "bg-accent-blue text-white" : "text-gray-300"}`}
            >
              Pipeline
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 rounded-full ${viewMode === "table" ? "bg-accent-blue text-white" : "text-gray-300"}`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {viewMode === "pipeline" ? (
        <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
          {!hasLeads ? (
            <div className="empty-state bg-navy-card rounded-xl border border-white/5">
              <p className="mb-4">No leads yet. Share your car landing page links to capture leads.</p>
              <Link to="/cars" className="text-accent-blue hover:underline">Go to Cars →</Link>
            </div>
          ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((col) => (
              <DroppableColumn key={col.id} id={col.id} className="flex-shrink-0 w-72 bg-navy-card rounded-xl border border-white/5 p-3 min-h-[400px]">
                <h3 className="font-heading font-semibold text-white text-sm mb-3">{col.label}</h3>
                <div className="space-y-2">
                  {leadsByStatus[col.id]?.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onClick={() => setSelectedId(lead.id)}
                      scoreBadge={<ScoreBadge score={lead.score} />}
                    />
                  ))}
                </div>
              </DroppableColumn>
            ))}
          </div>
          )}

          <DragOverlay>
            {activeLead ? (
              <div className="w-72 bg-navy-card rounded-lg border border-accent-blue/50 p-3 shadow-lg opacity-95">
                <p className="font-medium text-white truncate">{activeLead.name}</p>
                <p className="text-sm text-gray-400 truncate">{activeLead.car?.make} {activeLead.car?.model}</p>
                <ScoreBadge score={activeLead.score} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="bg-navy-card rounded-xl border border-white/5 overflow-hidden">
          {!hasLeads ? (
            <div className="p-6 text-gray-400 text-sm">
              No leads yet. Share your car landing page links to capture leads.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-navy-light border-b border-white/10 text-left text-xs text-gray-400">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Phone</th>
                    <th className="px-4 py-2">Car</th>
                    <th className="px-4 py-2">Source</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                      onClick={() => setSelectedId(lead.id)}
                    >
                      <td className="px-4 py-2 text-white">
                        <div className="font-medium truncate">{lead.name}</div>
                        <div className="text-xs text-gray-400 truncate">
                          {lead.car ? `${lead.car.year ?? ""} ${lead.car.make ?? ""} ${lead.car.model ?? ""}`.trim() : ""}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-200">{lead.phone}</td>
                      <td className="px-4 py-2 text-gray-200">
                        {lead.car ? `${lead.car.year ?? ""} ${lead.car.make ?? ""} ${lead.car.model ?? ""}`.trim() : "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-300">{lead.source || "—"}</td>
                      <td className="px-4 py-2 text-gray-300 text-xs">
                        {lead.status}
                      </td>
                      <td className="px-4 py-2 text-gray-400 text-xs">
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <LeadDetailDrawer leadId={selectedId} onClose={() => setSelectedId(null)} onUpdate={fetchLeads} />
    </div>
  );
}
