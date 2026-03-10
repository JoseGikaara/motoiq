import { motion } from "framer-motion";

export function PageHeader({ title, subtitle, actions }) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", gap: "16px", flexWrap: "wrap" }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "26px", color: "var(--text-primary)", lineHeight: 1.2, marginBottom: "4px" }}>{title}</h1>
        {subtitle && <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>{actions}</div>}
    </motion.div>
  );
}
