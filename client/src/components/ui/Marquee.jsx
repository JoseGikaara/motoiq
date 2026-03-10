export function Marquee({ items, speed = 30 }) {
  const doubled = [...items, ...items];
  const dur = speed + "s";
  return (
    <div className="overflow-hidden w-full py-3 border-t border-b border-[var(--border-subtle)]">
      <div className="marquee-track" style={{ animationDuration: dur, display: "flex", width: "max-content" }}>
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-8 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] inline-block" />
            <span className="text-[13px] font-medium text-[var(--text-secondary)] font-[var(--font-mono)]">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
