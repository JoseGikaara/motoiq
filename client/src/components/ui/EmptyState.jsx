import { motion } from "framer-motion";
import { Button } from "./Button";

export function EmptyState({ icon: Icon, title, description, action, actionLabel }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center", gap: "16px" }}>
      {Icon && <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "var(--glass-bg)", border: "1px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", marginBottom: "8px" }}><Icon size={28} /></div>}
      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "18px", color: "var(--text-primary)" }}>{title}</h3>
      <p style={{ fontSize: "14px", color: "var(--text-muted)", maxWidth: "300px", lineHeight: 1.6 }}>{description}</p>
      {action && actionLabel && <Button onClick={action} variant="primary" size="md">{actionLabel}</Button>}
    </motion.div>
  );
}
