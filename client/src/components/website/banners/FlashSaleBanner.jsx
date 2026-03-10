import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function formatCountdown(endDate) {
  const now = new Date().getTime();
  const end = new Date(endDate).getTime();
  const diff = Math.max(0, end - now);
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((diff % (60 * 1000)) / 1000);
  return { days, hours, minutes, seconds, total: diff };
}

export default function FlashSaleBanner({ banner, slug, primaryColor }) {
  const [countdown, setCountdown] = useState(() => (banner.endDate ? formatCountdown(banner.endDate) : null));
  const bgColor = banner.backgroundColor || "#DC2626";
  const textColor = banner.textColor || "#FFFFFF";

  useEffect(() => {
    if (!banner.endDate) return;
    const t = setInterval(() => {
      const next = formatCountdown(banner.endDate);
      setCountdown(next);
      if (next.total <= 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [banner.endDate]);

  function buildCtaUrl() {
    if (banner.ctaTarget === "NONE" || !banner.ctaText) return null;
    if (banner.ctaTarget === "CUSTOM_URL" && banner.ctaUrl) return banner.ctaUrl;
    if (banner.ctaTarget === "INVENTORY") return `/s/${slug}/inventory`;
    if (banner.ctaTarget === "FINANCING") return `/s/${slug}/financing`;
    if (banner.ctaTarget === "CONTACT") return `/s/${slug}#contact`;
    return null;
  }

  const ctaUrl = buildCtaUrl();
  const content = (
    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 py-3 px-4 text-center">
      <span className="inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-white/20" style={{ color: textColor }}>
        Flash Sale
      </span>
      <span className="font-heading font-semibold text-sm md:text-base" style={{ color: textColor }}>
        {banner.title}
      </span>
      {banner.description && (
        <span className="text-sm opacity-90" style={{ color: textColor }}>
          {banner.description}
        </span>
      )}
      {countdown && countdown.total > 0 && (
        <span className="inline-flex items-center gap-1.5 text-sm font-mono font-medium" style={{ color: textColor }}>
          <span>Ends in</span>
          <span className="bg-black/20 px-2 py-0.5 rounded">{String(countdown.days).padStart(2, "0")}d</span>
          <span className="bg-black/20 px-2 py-0.5 rounded">{String(countdown.hours).padStart(2, "0")}h</span>
          <span className="bg-black/20 px-2 py-0.5 rounded">{String(countdown.minutes).padStart(2, "0")}m</span>
          <span className="bg-black/20 px-2 py-0.5 rounded">{String(countdown.seconds).padStart(2, "0")}s</span>
        </span>
      )}
      {ctaUrl && banner.ctaText && (
        <Link
          to={ctaUrl}
          className="inline-flex px-3 py-1.5 rounded-lg text-sm font-medium bg-white/20 hover:bg-white/30 transition"
          style={{ color: textColor }}
        >
          {banner.ctaText}
        </Link>
      )}
    </div>
  );

  const wrapperClass = "relative overflow-hidden border-b-2 border-red-500/80";
  const style = { backgroundColor: bgColor, color: textColor };

  if (ctaUrl && banner.ctaText) {
    return (
      <Link to={ctaUrl} className={`block w-full ${wrapperClass}`} style={style}>
        {content}
      </Link>
    );
  }
  return (
    <div className={`w-full ${wrapperClass}`} style={style}>
      {content}
    </div>
  );
}
