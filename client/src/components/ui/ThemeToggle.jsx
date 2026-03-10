import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <motion.button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className="w-[38px] h-[38px] rounded-[var(--radius-md)] flex items-center justify-center cursor-pointer transition-[all] duration-150"
      style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
