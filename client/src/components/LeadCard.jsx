import { useDraggable } from "@dnd-kit/core";

function ScoreBadge({ score }) {
  if (!score) return null;
  const map = { hot: "🔥 Hot", warm: "🌡 Warm", cold: "❄️ Cold" };
  const cls = { hot: "text-accent-orange", warm: "text-yellow-400", cold: "text-blue-300" };
  return <span className={`text-xs font-medium ${cls[score] || ""}`}>{map[score] || score}</span>;
}

export default function LeadCard({ lead, onClick, scoreBadge }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className={`p-3 rounded-lg border border-white/10 bg-navy cursor-grab active:cursor-grabbing hover:border-accent-blue/30 transition ${isDragging ? "opacity-50" : ""}`}
    >
      <p className="font-medium text-white truncate">{lead.name}</p>
      <p className="text-sm text-gray-400 truncate">{lead.car?.make} {lead.car?.model}</p>
      <div className="mt-1 flex items-center justify-between">
        {scoreBadge ?? <ScoreBadge score={lead.score} />}
        <span className="text-xs text-gray-500">{new Date(lead.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
