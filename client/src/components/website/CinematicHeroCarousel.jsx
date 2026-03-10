import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useVideoAllowed } from "../../hooks/useVideoAllowed";
import { has360Assets } from "./MarqueeItem";
import { carSlugFromCar } from "../../utils/urlUtils";

const AUTOPLAY_MS = 5500;

export default function CinematicHeroCarousel({ cars, slug, primaryColor = "#2563EB", videoBackgroundsEnabled = false }) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const videoRefs = useRef({});
  const useVideo = useVideoAllowed(videoBackgroundsEnabled);

  const items = useMemo(() => {
    const list = cars.filter((c) => c.isFeaturedInCinematicHero);
    return [...list].sort((a, b) => (a.heroDisplayOrder ?? 999) - (b.heroDisplayOrder ?? 999));
  }, [cars]);
  const count = items.length;
  const effectiveIndex = count ? ((index % count) + count) % count : 0;
  const current = count ? items[effectiveIndex] : null;

  const stopAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    if (count <= 1 || isPaused) return;
    intervalRef.current = setInterval(() => setIndex((i) => i + 1), AUTOPLAY_MS);
  }, [count, isPaused, stopAutoplay]);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay, stopAutoplay]);

  useEffect(() => {
    items.forEach((car, i) => {
      const el = videoRefs.current[car.id];
      if (!el) return;
      if (i === effectiveIndex) el.play?.().catch(() => {});
      else el.pause?.();
    });
  }, [effectiveIndex, items]);

  if (count === 0 || !current) return null;

  const discount = current.discountPercentage != null && current.discountPercentage > 0;

  return (
    <section
      className="relative h-[70vh] min-h-[420px] w-full overflow-hidden bg-slate-950"
      onMouseEnter={() => { setIsPaused(true); stopAutoplay(); }}
      onMouseLeave={() => { setIsPaused(false); startAutoplay(); }}
    >
      <div className="absolute inset-0 flex">
        {items.map((car, i) => {
          const isActive = i === effectiveIndex;
          const videoUrl = useVideo && car.isVideoBackground && car.videoUrl ? car.videoUrl : null;
          const posterUrl = car.videoThumbnailUrl || car.photoGallery?.[0]?.url || car.photos?.[0];
          const show360 = has360Assets(car);
          return (
            <motion.div
              key={car.id}
              className="absolute inset-0"
              initial={false}
              animate={{
                opacity: isActive ? 1 : 0,
                scale: isActive ? 1.02 : 1,
              }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {videoUrl ? (
                <video
                  ref={(el) => { if (el) videoRefs.current[car.id] = el; }}
                  src={videoUrl}
                  poster={posterUrl || undefined}
                  muted
                  loop
                  playsInline
                  preload={i === 0 ? "auto" : "metadata"}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : posterUrl ? (
                <img
                  src={posterUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                  sizes="100vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-900 text-6xl text-gray-600">
                  {car.make?.[0]}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_40%,rgba(0,0,0,0.4)_100%)]" />
              {show360 && (
                <span className="absolute top-4 right-4 rounded bg-black/60 px-2 py-1 text-xs font-medium text-white">
                  360° View
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-14">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <motion.div
            className="text-white"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {current.heroOverlayText ? (
              <h2 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl mb-2">
                {current.heroOverlayText}
              </h2>
            ) : (
              <>
                <p className="text-xs uppercase tracking-[0.2em] text-white/70 mb-1">
                  {current.year} · {current.make}
                </p>
                <h2 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl mb-2">
                  {current.model}
                </h2>
              </>
            )}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-xl md:text-2xl font-semibold" style={{ color: primaryColor }}>
                KES {(current.price || 0).toLocaleString()}
              </span>
              {discount && (
                <motion.span
                  className="rounded px-2 py-0.5 text-sm font-bold text-white"
                  style={{ backgroundColor: primaryColor }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {current.discountPercentage}% OFF
                </motion.span>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to={`/s/${slug}/inventory/${carSlugFromCar(current)}`}
                className="inline-flex px-5 py-2.5 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: primaryColor }}
              >
                View Car
              </Link>
              <Link
                to={`/s/${slug}/inventory/${carSlugFromCar(current)}#test-drive`}
                className="inline-flex px-5 py-2.5 rounded-full text-sm font-medium bg-white/15 text-white border border-white/30 hover:bg-white/25"
              >
                Book Test Drive
              </Link>
            </div>
          </motion.div>
          {count > 1 && (
            <div className="flex gap-2 items-center">
              {items.map((car, i) => {
                const thumb = car.videoThumbnailUrl || car.photoGallery?.[0]?.url || car.photos?.[0];
                return (
                  <button
                    key={car.id}
                    type="button"
                    onClick={() => { setIndex(i); stopAutoplay(); startAutoplay(); }}
                    className={`shrink-0 rounded overflow-hidden border-2 transition-all ${
                      i === effectiveIndex ? "ring-2 ring-white scale-105" : "opacity-70 hover:opacity-90"
                    }`}
                    style={{
                      width: 44,
                      height: 28,
                      borderColor: i === effectiveIndex ? primaryColor : "transparent",
                    }}
                    aria-label={`Slide ${i + 1}: ${car.year} ${car.make} ${car.model}`}
                  >
                    {thumb ? (
                      <img src={thumb} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-700 flex items-center justify-center text-white text-xs font-medium">
                        {car.make?.[0]}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => { setIndex((i) => i - 1); stopAutoplay(); startAutoplay(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => { setIndex((i) => i + 1); stopAutoplay(); startAutoplay(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
            aria-label="Next"
          >
            ›
          </button>
        </>
      )}
    </section>
  );
}
