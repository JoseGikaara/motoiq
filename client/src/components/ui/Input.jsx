import { useState } from "react";

export function Input({ label, error, icon: Icon, suffix, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", letterSpacing: "0.02em" }}>{label}</label>}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {Icon && <div style={{ position: "absolute", left: "12px", color: focused ? "var(--brand-primary)" : "var(--text-muted)", transition: "color var(--transition-fast)", pointerEvents: "none" }}><Icon size={16} /></div>}
        <input
          {...props}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          style={{
            width: "100%",
            padding: Icon ? "10px 14px 10px 40px" : "10px 14px",
            paddingRight: suffix ? "48px" : "14px",
            background: "var(--glass-bg)",
            backdropFilter: "blur(8px)",
            border: `1px solid ${error ? "var(--accent-red)" : focused ? "var(--brand-primary)" : "var(--border-default)"}`,
            borderRadius: "var(--radius-md)",
            color: "var(--text-primary)",
            fontSize: "14px",
            fontFamily: "var(--font-body)",
            outline: "none",
            transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)",
            boxShadow: focused ? "0 0 0 3px var(--brand-glow)" : "none",
          }}
        />
        {suffix && <div style={{ position: "absolute", right: "12px", color: "var(--text-muted)", fontSize: "13px", fontWeight: 500 }}>{suffix}</div>}
      </div>
      {error && <span style={{ fontSize: "12px", color: "var(--accent-red)" }}>{error}</span>}
    </div>
  );
}
