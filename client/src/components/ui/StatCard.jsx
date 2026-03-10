import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

export function StatCard({
  label,
  value,
  prefix = "",
  suffix = "",
  trend,
  trendLabel,
  icon: Icon,
  color = "blue",
  delay = 0,
}) {
  const { ref, inView } = useInView({ triggerOnce: true });

  const colorMap = {
    blue: "var(--brand-primary)",
    orange: "var(--accent-orange)",
    green: "var(--accent-green)",
    red: "var(--accent-red)",
  };

  const numValue = typeof value === "number" ? value : parseInt(value, 10) || 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass rounded-2xl p-5 card-hover relative overflow-hidden"
    >
      <div
        style={{
          position: "absolute",
          top: "-20px",
          right: "-20px",
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: colorMap[color],
          filter: "blur(30px)",
          opacity: 0.15,
          pointerEvents: "none",
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "8px",
            }}
          >
            {label}
          </p>
          <div
            style={{
              fontSize: "32px",
              fontWeight: 800,
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
              lineHeight: 1,
            }}
          >
            {prefix}
            {inView ? (
              <CountUp end={numValue} duration={1.5} separator="," />
            ) : (
              "0"
            )}
            {suffix}
          </div>
          {trendLabel != null && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
              {trend >= 0 ? (
                <TrendingUp size={13} style={{ color: "var(--accent-green)" }} />
              ) : (
                <TrendingDown size={13} style={{ color: "var(--accent-red)" }} />
              )}
              <span
                style={{
                  fontSize: "12px",
                  color: trend >= 0 ? "var(--accent-green)" : "var(--accent-red)",
                  fontWeight: 500,
                }}
              >
                {trendLabel}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: `${colorMap[color]}18`,
              border: `1px solid ${colorMap[color]}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={20} style={{ color: colorMap[color] }} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
