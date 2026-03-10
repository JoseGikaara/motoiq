import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const sizes = { sm: { padding: "6px 14px", fontSize: "13px" }, md: { padding: "10px 20px", fontSize: "14px" }, lg: { padding: "13px 28px", fontSize: "15px" } };
const variants = {
  primary: { background: "linear-gradient(135deg, var(--brand-primary), #1D4ED8)", color: "white", boxShadow: "0 2px 12px rgba(37,99,235,0.3)" },
  secondary: { background: "var(--glass-bg)", backdropFilter: "blur(8px)", border: "1px solid var(--border-default)", color: "var(--text-primary)" },
  ghost: { background: "transparent", color: "var(--text-secondary)" },
  danger: { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--accent-red)" },
  success: { background: "linear-gradient(135deg, #059669, #10B981)", color: "white", boxShadow: "0 2px 12px rgba(16,185,129,0.3)" },
  whatsapp: { background: "linear-gradient(135deg, #25D366, #128C7E)", color: "white", boxShadow: "0 2px 12px rgba(37,211,102,0.3)" },
};

export function Button({ children, variant = "primary", size = "md", loading = false, icon: Icon, onClick, disabled, className, type = "button", ...props }) {
  const base = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-body)", fontWeight: 600, cursor: disabled || loading ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, border: "none", transition: "all var(--transition-fast)", borderRadius: "var(--radius-md)", whiteSpace: "nowrap", textDecoration: "none", outline: "none" };
  return (
    <motion.button type={type} whileHover={{ scale: disabled || loading ? 1 : 1.02 }} whileTap={{ scale: disabled || loading ? 1 : 0.97 }} style={{ ...base, ...sizes[size], ...variants[variant] }} onClick={onClick} disabled={disabled || loading} className={className} {...props}>
      {loading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : Icon && <Icon size={15} />}
      {children}
    </motion.button>
  );
}
