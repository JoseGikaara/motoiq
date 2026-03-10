import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { carSlugFromCar } from "../../utils/urlUtils";

/** Parse specs JSON for virtualTour (360° assets) */
function has360Assets(car) {
  if (!car?.specs) return false;
  try {
    const s = typeof car.specs === "string" ? JSON.parse(car.specs) : car.specs;
    const tour = s?.virtualTour;
    return !!(tour?.has360Exterior || tour?.has360Interior || tour?.exteriorImagesBase || tour?.interiorPano);
  } catch {
    return false;
  }
}

/**
 * Shared marquee item: left = video (when useVideo + url) or image + 360° badge; right = children.
 * Used in top discount marquee (horizontal strip).
 */
export default function MarqueeItem({
  car,
  slug,
  useVideo,
  children,
  className = "",
  style = {},
  mediaClassName = "h-12 w-16 shrink-0 overflow-hidden rounded bg-slate-800",
}) {
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const [inView, setInView] = useState(true);

  const videoUrl = useVideo && car?.isVideoBackground && car?.videoUrl ? car.videoUrl : null;
  const posterUrl = car?.videoThumbnailUrl || car?.photoGallery?.[0]?.url || car?.photos?.[0];
  const imgUrl = !videoUrl ? posterUrl : null;
  const show360 = has360Assets(car);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoUrl) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
        if (!e.isIntersecting) el.pause?.();
        else el.play?.().catch(() => {});
      },
      { threshold: 0.1, rootMargin: "50px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [videoUrl]);

  useEffect(() => {
    if (!inView && videoRef.current) videoRef.current.pause?.();
  }, [inView]);

  return (
    <Link
      to={`/s/${slug}/inventory/${carSlugFromCar(car)}`}
      className={`flex shrink-0 items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10 ${className}`}
      style={style}
    >
      <div className={`relative ${mediaClassName}`}>
        {videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              poster={posterUrl || undefined}
              muted
              loop
              playsInline
              preload="none"
              className="absolute inset-0 h-full w-full object-cover opacity-90"
              onLoadedData={() => setVideoReady(true)}
              onCanPlay={() => inView && videoRef.current?.play?.().catch(() => {})}
            />
            {!videoReady && posterUrl && (
              <img src={posterUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
            )}
          </>
        ) : imgUrl ? (
          <img src={imgUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
            {car?.make?.[0]}
          </div>
        )}
        {show360 && (
          <span
            className="absolute right-0 bottom-0 rounded-tl bg-black/70 px-1 py-0.5 text-[9px] font-medium text-white"
            title="360° view available"
          >
            360°
          </span>
        )}
      </div>
      {children}
    </Link>
  );
}

export { has360Assets };
