import { motion } from "framer-motion";
import { clsx } from "clsx";

export function GlassCard({ children, className, hover = true, glow = false, onClick, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={hover ? { y: -2, boxShadow: "var(--shadow-lg)" } : undefined}
      onClick={onClick}
      className={clsx(
        "glass rounded-2xl p-5",
        glow && "glow-blue",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
