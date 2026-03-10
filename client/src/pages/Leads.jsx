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
        <p className="text-gray-400 mt-0.5">Drag and drop to update status</p>
      </div>

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

      <LeadDetailDrawer leadId={selectedId} onClose={() => setSelectedId(null)} onUpdate={fetchLeads} />
    </div>
  );
}
