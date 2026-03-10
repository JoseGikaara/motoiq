import { useDroppable } from "@dnd-kit/core";

export default function DroppableColumn({ id, children, className }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`${className} ${isOver ? "ring-2 ring-accent-blue rounded-xl" : ""}`}>
      {children}
    </div>
  );
}
