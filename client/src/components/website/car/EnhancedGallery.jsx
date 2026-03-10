import { useState, useMemo, useCallback, useEffect } from "react";

const ANGLE_SECTIONS = [
  {
    title: "EXTERIOR",
    angles: ["FRONT", "FRONT_LEFT", "FRONT_RIGHT", "LEFT_SIDE", "RIGHT_SIDE", "REAR", "REAR_LEFT", "REAR_RIGHT", "ROOF"],
  },
  {
    title: "INTERIOR",
    angles: ["INTERIOR_DASH", "INTERIOR_SEATS", "INTERIOR_BACKSEATS", "INTERIOR_CARGO", "INTERIOR_DETAILS"],
  },
  {
    title: "MECHANICAL",
    angles: ["ENGINE", "UNDERNEATH", "WHEELS", "TRUNK"],
  },
  {
    title: "DETAILS",
    angles: ["DETAIL_SHOT", "OTHER"],
  },
];

function angleLabel(a) {
  return a.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function EnhancedGallery({ car, primaryColor = "#2563EB" }) {
  const carPhotos = car?.carPhotos || [];
  const [selectedAngle, setSelectedAngle] = useState("ALL");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const photosByAngle = useMemo(() => {
    const map = {};
    carPhotos.forEach((p) => {
      const a = p.angle || "OTHER";
      if (!map[a]) map[a] = [];
      map[a].push(p);
    });
    return map;
  }, [carPhotos]);

  const visiblePhotos = useMemo(() => {
    if (selectedAngle === "ALL") return [...carPhotos];
    return photosByAngle[selectedAngle] || [];
  }, [selectedAngle, photosByAngle, carPhotos]);

  const currentPhoto = visiblePhotos[currentIndex] || visiblePhotos[0];
  const displayUrl = currentPhoto?.optimizedUrl || currentPhoto?.thumbnailUrl || currentPhoto?.url;

  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedAngle]);

  const go = useCallback(
    (delta) => {
      setCurrentIndex((i) => {
        const len = visiblePhotos.length;
        if (len === 0) return 0;
        return (i + delta + len) % len;
      });
    },
    [visiblePhotos.length]
  );

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, go]);

  if (carPhotos.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
      {/* Angle sidebar */}
      <div className="lg:col-span-1 order-2 lg:order-1">
        <div className="bg-navy-card rounded-xl border border-white/10 p-3 space-y-3">
          <button
            type="button"
            onClick={() => setSelectedAngle("ALL")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
              selectedAngle === "ALL" ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
            style={selectedAngle === "ALL" ? { backgroundColor: primaryColor } : {}}
          >
            All photos ({carPhotos.length})
          </button>
          {ANGLE_SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1">
                {section.title}
              </h4>
              <div className="space-y-0.5">
                {section.angles.map((angle) => {
                  const count = photosByAngle[angle]?.length || 0;
                  if (count === 0) return null;
                  return (
                    <button
                      key={angle}
                      type="button"
                      onClick={() => setSelectedAngle(angle)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition ${
                        selectedAngle === angle ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                      style={selectedAngle === angle ? { backgroundColor: primaryColor } : {}}
                    >
                      <span>{angleLabel(angle)}</span>
                      <span className="float-right text-xs opacity-75">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main gallery */}
      <div className="lg:col-span-3 order-1 lg:order-2 space-y-3">
        <div
          className="aspect-video rounded-xl overflow-hidden bg-navy-light relative group cursor-zoom-in"
          onClick={() => visiblePhotos.length > 0 && setLightboxOpen(true)}
        >
          {displayUrl ? (
            <>
              <img
                src={displayUrl}
                alt={currentPhoto?.title || angleLabel(currentPhoto?.angle || "OTHER")}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              {currentPhoto?.angle && (
                <span
                  className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-medium text-white bg-black/50"
                  style={{ borderLeftColor: primaryColor, borderLeftWidth: 3, borderLeftStyle: "solid" }}
                >
                  {angleLabel(currentPhoto.angle)}
                </span>
              )}
              {visiblePhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); go(-1); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                    aria-label="Previous"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); go(1); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                    aria-label="Next"
                  >
                    ›
                  </button>
                </>
              )}
              <span className="absolute bottom-2 right-2 text-xs text-white/80 bg-black/40 px-2 py-1 rounded">
                {currentIndex + 1} / {visiblePhotos.length}
              </span>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 font-heading text-4xl">
              {car?.make?.[0]}
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {visiblePhotos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {visiblePhotos.map((p, i) => {
              const thumb = p.thumbnailUrl || p.optimizedUrl || p.url;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setCurrentIndex(i)}
                  className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition ${
                    i === currentIndex ? "ring-2 ring-white opacity-100" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                  style={i === currentIndex ? { borderColor: primaryColor } : {}}
                >
                  <img src={thumb} alt="" className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && visiblePhotos.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="flex justify-end p-4">
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div
            className="flex-1 flex items-center justify-center p-4 min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={displayUrl}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
            {visiblePhotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                >
                  ›
                </button>
              </>
            )}
          </div>
          <div className="p-4 text-center text-sm text-gray-400">
            {currentPhoto?.title || angleLabel(currentPhoto?.angle || "OTHER")} — {currentIndex + 1} / {visiblePhotos.length}
          </div>
        </div>
      )}
    </div>
  );
}
