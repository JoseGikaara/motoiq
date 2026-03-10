import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import FlashSaleBanner from "./FlashSaleBanner";

const ROTATE_MS = 6000;

function buildCtaUrl(banner, slug) {
  if (banner.ctaTarget === "NONE" || !banner.ctaText) return null;
  if (banner.ctaTarget === "CUSTOM_URL" && banner.ctaUrl) return banner.ctaUrl;
  if (banner.ctaTarget === "INVENTORY") return `/s/${slug}/inventory`;
  if (banner.ctaTarget === "FINANCING") return `/s/${slug}/financing`;
  if (banner.ctaTarget === "CONTACT") return `/s/${slug}#contact`;
  return null;
}

function BannerSlide({ banner, slug, primaryColor, isActive }) {
  const bgColor = banner.backgroundColor || (banner.type === "FLASH_SALE" ? "#DC2626" : primaryColor);
  const textColor = banner.textColor || "#FFFFFF";
  const ctaUrl = buildCtaUrl(banner, slug);

  if (banner.type === "FLASH_SALE") {
    return (
      <div className={`w-full shrink-0 ${isActive ? "block" : "hidden"}`}>
        <FlashSaleBanner banner={banner} slug={slug} primaryColor={primaryColor} />
      </div>
    );
  }

  const content = (
    <div
      className={`flex flex-wrap items-center justify-center gap-3 md:gap-6 py-3 px-4 min-h-[52px] text-center ${banner.imageUrl ? "relative" : ""}`}
      style={{
        backgroundColor: banner.imageUrl ? "transparent" : bgColor,
        color: textColor,
        backgroundImage: banner.imageUrl ? `url(${banner.imageUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {banner.imageUrl && <div className="absolute inset-0 bg-black/50 z-0" aria-hidden />}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 md:gap-6">
        <span className="font-heading font-semibold text-sm md:text-base">{banner.title}</span>
        {banner.description && <span className="text-sm opacity-90">{banner.description}</span>}
        {ctaUrl && banner.ctaText && (
          <span className="inline-flex px-3 py-1.5 rounded-lg text-sm font-medium bg-white/20 hover:bg-white/30 transition">
            {banner.ctaText}
          </span>
        )}
      </div>
    </div>
  );

  if (ctaUrl && banner.ctaText) {
  return (
    <Link
      to={ctaUrl}
      className={`w-full shrink-0 block relative overflow-hidden ${isActive ? "" : "hidden"} ${banner.type === "HEADLINE" ? "border-l-4 pl-2" : ""}`}
      style={banner.type === "HEADLINE" ? { borderColor: primaryColor } : {}}
    >
      {content}
    </Link>
  );
}
return (
  <div
    className={`w-full shrink-0 relative overflow-hidden ${isActive ? "" : "hidden"} ${banner.type === "HEADLINE" ? "border-l-4 pl-2" : ""}`}
    style={banner.type === "HEADLINE" ? { borderColor: primaryColor } : {}}
  >
    {content}
  </div>
);
}

export default function BannerCarousel({ banners, slug, primaryColor = "#2563EB" }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef(0);
  const touchEnd = useRef(0);
  const intervalRef = useRef(null);

  const list = Array.isArray(banners) ? banners.filter((b) => b.isActive !== false) : [];
  const count = list.length;
  const effectiveIndex = count ? ((index % count) + count) % count : 0;

  const go = useCallback(
    (delta) => {
      if (count <= 1) return;
      setIndex((i) => (i + delta + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (!count || count <= 1 || paused) return;
    intervalRef.current = setInterval(() => go(1), ROTATE_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [count, paused, go]);

  if (count === 0) return null;

  const handleTouchStart = (e) => {
    touchStart.current = e.targetTouches?.[0]?.clientX ?? 0;
  };
  const handleTouchEnd = (e) => {
    touchEnd.current = e.changedTouches?.[0]?.clientX ?? 0;
    const diff = touchStart.current - touchEnd.current;
    if (Math.abs(diff) > 50) go(diff > 0 ? 1 : -1);
  };

  return (
    <section
      className="relative w-full bg-slate-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="overflow-hidden">
        {list.map((banner, i) => (
          <BannerSlide
            key={banner.id}
            banner={banner}
            slug={slug}
            primaryColor={primaryColor}
            isActive={i === effectiveIndex}
          />
        ))}
      </div>
      {count > 1 && (
        <>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {list.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === effectiveIndex ? "w-6" : "w-1.5"}`}
                style={{
                  backgroundColor: i === effectiveIndex ? primaryColor : "rgba(255,255,255,0.4)",
                }}
                aria-label={`Banner ${i + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
            aria-label="Next"
          >
            ›
          </button>
        </>
      )}
    </section>
  );
}
