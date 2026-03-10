import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useVideoAllowed } from "../../hooks/useVideoAllowed";
import MarqueeItem from "./MarqueeItem";

const MARQUEE_HEIGHT = 80;
const ITEM_WIDTH = 280;
const DURATION = 45;

function Countdown({ saleEndDate }) {
  const [left, setLeft] = useState(null);
  useEffect(() => {
    if (!saleEndDate) return;
    const end = new Date(saleEndDate).getTime();
    const tick = () => {
      const now = Date.now();
      if (now >= end) {
        setLeft({ d: 0, h: 0, m: 0 });
        return;
      }
      const s = Math.floor((end - now) / 1000);
      setLeft({
        d: Math.floor(s / 86400),
        h: Math.floor((s % 86400) / 3600),
        m: Math.floor((s % 3600) / 60),
      });
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [saleEndDate]);

  if (left === null || (left.d === 0 && left.h === 0 && left.m === 0)) return null;
  return (
    <span className="text-[10px] font-semibold text-white/90 tabular-nums">
      {left.d}d {left.h}h {left.m}m
    </span>
  );
}

export default function TopDiscountMarquee({ cars, slug, primaryColor = "#2563EB", videoBackgroundsEnabled = false }) {
  const ref = useRef(null);
  const [paused, setPaused] = useState(false);
  const useVideo = useVideoAllowed(videoBackgroundsEnabled);
  const items = cars.filter((c) => c.isFeaturedInTopMarquee && c.discountPercentage != null && c.discountPercentage > 0);
  if (items.length === 0) return null;

  const duplicated = [...items, ...items];

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-950/98 backdrop-blur"
      style={{ height: MARQUEE_HEIGHT }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="h-full overflow-hidden">
        <motion.div
          ref={ref}
          className="flex h-full items-center gap-6"
          style={{ width: "max-content" }}
          animate={{ x: [0, -items.length * (ITEM_WIDTH + 24)] }}
          transition={{
            duration: DURATION,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
            ...(paused && { duration: 0 }),
          }}
        >
          {duplicated.map((car, i) => {
            const label = `${car.year} ${car.make} ${car.model}`;
            return (
              <MarqueeItem
                key={`${car.id}-${i}`}
                car={car}
                slug={slug}
                useVideo={useVideo}
                style={{ width: ITEM_WIDTH, minHeight: MARQUEE_HEIGHT - 16 }}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white">{label}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <motion.span
                      className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                      style={{ backgroundColor: primaryColor }}
                      animate={{ opacity: [1, 0.85, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      {car.discountPercentage}% OFF
                    </motion.span>
                    {car.saleEndDate && <Countdown saleEndDate={car.saleEndDate} />}
                  </div>
                </div>
              </MarqueeItem>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
