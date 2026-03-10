const V = {
  hot: ["rgba(249,115,22,0.12)", "rgba(249,115,22,0.3)", "var(--accent-orange)", "\u{1F525} Hot"],
  warm: ["rgba(245,158,11,0.12)", "rgba(245,158,11,0.3)", "var(--accent-yellow)", "\u{1F321} Warm"],
  cold: ["rgba(148,163,184,0.10)", "rgba(148,163,184,0.2)", "var(--text-muted)", "\u{2744}\uFE0F Cold"],
  new: ["rgba(37,99,235,0.12)", "rgba(37,99,235,0.3)", "var(--brand-primary)", "New"],
  closed: ["rgba(16,185,129,0.12)", "rgba(16,185,129,0.3)", "var(--accent-green)", "Closed"],
  lost: ["rgba(239,68,68,0.10)", "rgba(239,68,68,0.25)", "var(--accent-red)", "Lost"],
};

export function Badge({ variant = "new", children, size = "sm" }) {
  const [bg, border, color, label] = V[variant] || V.new;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: size === "sm" ? "2px 8px" : "4px 12px",
        borderRadius: "var(--radius-full)",
        background: bg,
        border: "1px solid " + border,
        color,
        fontSize: size === "sm" ? "11px" : "13px",
        fontWeight: 600,
        letterSpacing: "0.02em",
        fontFamily: "var(--font-body)",
      }}
    >
      {children != null ? children : label}
    </span>
  );
}
