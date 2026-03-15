import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { publicSite } from "../../api";
import { LayoutGrid, List, Heart, SlidersHorizontal } from "lucide-react";
import WebsiteConsentBanner from "../../components/WebsiteConsentBanner";
import DealerMetaTags from "../../components/website/seo/DealerMetaTags";
import StructuredData from "../../components/website/seo/StructuredData";
import { carSlugFromCar } from "../../utils/urlUtils";
import { useWebsiteFavorites } from "../../context/WebsiteFavoritesContext";
import QuickViewModal from "../../components/website/inventory/QuickViewModal";
import DealerNavbar from "../../components/website/DealerNavbar";

function dealerWhatsappNumber(phone) {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("254")) return digits;
  return `254${digits}`;
}

export default function WebsiteInventory() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dealer, setDealer] = useState(null);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvedSlug, setResolvedSlug] = useState(null);
  const [filters, setFilters] = useState(() => ({
    minPrice: searchParams.get("price_min") || "",
    maxPrice: searchParams.get("price_max") || "",
    make: searchParams.get("make") || "",
    year: searchParams.get("year") || "",
    maxMileage: searchParams.get("maxMileage") || "",
    bodyType: searchParams.get("bodyType") || undefined,
    fuelType: searchParams.get("fuelType") || undefined,
    transmission: searchParams.get("transmission") || undefined,
  }));
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState(() => searchParams.get("sort") || "newest");
  const { has: hasFavorite, toggle: toggleFavorite } = useWebsiteFavorites();
  const [compareIds, setCompareIds] = useState([]);
  const [quickViewCar, setQuickViewCar] = useState(null);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (sortBy && sortBy !== "newest") next.set("sort", sortBy);
    else next.delete("sort");
    if (filters.make) next.set("make", filters.make);
    else next.delete("make");
    if (filters.minPrice) next.set("price_min", filters.minPrice);
    else next.delete("price_min");
    if (filters.maxPrice) next.set("price_max", filters.maxPrice);
    else next.delete("price_max");
    if (filters.year) next.set("year", filters.year);
    else next.delete("year");
    if (filters.maxMileage) next.set("maxMileage", filters.maxMileage);
    else next.delete("maxMileage");
    if (filters.bodyType) next.set("bodyType", filters.bodyType);
    else next.delete("bodyType");
    if (filters.fuelType) next.set("fuelType", filters.fuelType);
    else next.delete("fuelType");
    if (filters.transmission) next.set("transmission", filters.transmission);
    else next.delete("transmission");
    setSearchParams(next, { replace: true });
  }, [sortBy, filters.make, filters.minPrice, filters.maxPrice, filters.year, filters.maxMileage, filters.bodyType, filters.fuelType, filters.transmission]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const d =
          slug === "host"
            ? await publicSite.getByHost(window.location.hostname)
            : await publicSite.getBySlug(slug);
        if (cancelled) return;
        setDealer(d);
        await fetchCars(d, filters, cancelled);
        setResolvedSlug(d.websiteSlug || slug);
      } catch (e) {
        if (!cancelled) toast.error(e.message || "Failed to load inventory");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function fetchCars(dealerData, currentFilters, cancelledFlag) {
    try {
      const params = {};
      if (currentFilters.minPrice) params.minPrice = currentFilters.minPrice;
      if (currentFilters.maxPrice) params.maxPrice = currentFilters.maxPrice;
      if (currentFilters.make) params.make = currentFilters.make;
      if (currentFilters.year) params.year = currentFilters.year;
      if (currentFilters.maxMileage) params.maxMileage = currentFilters.maxMileage;
      const list = await publicSite.getCars(dealerData.websiteSlug || slug, params);
      if (!cancelledFlag) setCars(list || []);
    } catch (e) {
      if (!cancelledFlag) toast.error(e.message || "Failed to fetch cars");
    }
  }

  const makes = useMemo(
    () => Array.from(new Set((cars || []).map((c) => c.make).filter(Boolean))).sort(),
    [cars]
  );
  const bodyTypes = useMemo(
    () => Array.from(
      new Set(
        (cars || [])
          .map((c) => {
            try {
              const spec = c.specs ? JSON.parse(c.specs) : null;
              return spec?.bodyType || null;
            } catch {
              return null;
            }
          })
          .filter(Boolean)
      )
    ),
    [cars]
  );
  const fuelTypes = useMemo(
    () => Array.from(
      new Set(
        (cars || [])
          .map((c) => {
            try {
              const spec = c.specs ? JSON.parse(c.specs) : null;
              return spec?.fuelType || null;
            } catch {
              return null;
            }
          })
          .filter(Boolean)
      )
    ),
    [cars]
  );
  const transmissions = useMemo(
    () => Array.from(
      new Set(
        (cars || [])
          .map((c) => {
            try {
              const spec = c.specs ? JSON.parse(c.specs) : null;
              return spec?.transmission || null;
            } catch {
              return null;
            }
          })
          .filter(Boolean)
      )
    ),
    [cars]
  );

  const filteredAndSorted = useMemo(() => {
    let list = [...cars];

    // Client-side facet filters
    if (filters.make) list = list.filter((c) => c.make === filters.make);

    if (filters.bodyType) {
      list = list.filter((c) => {
        try {
          const spec = c.specs ? JSON.parse(c.specs) : null;
          return spec?.bodyType === filters.bodyType;
        } catch {
          return false;
        }
      });
    }
    if (filters.fuelType) {
      list = list.filter((c) => {
        try {
          const spec = c.specs ? JSON.parse(c.specs) : null;
          return spec?.fuelType === filters.fuelType;
        } catch {
          return false;
        }
      });
    }
    if (filters.transmission) {
      list = list.filter((c) => {
        try {
          const spec = c.specs ? JSON.parse(c.specs) : null;
          return spec?.transmission === filters.transmission;
        } catch {
          return false;
        }
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "price_asc") return (a.price || 0) - (b.price || 0);
      if (sortBy === "price_desc") return (b.price || 0) - (a.price || 0);
      // newest: by createdAt desc if present, else keep current order
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

    return list;
  }, [cars, filters.make, filters.bodyType, filters.fuelType, filters.transmission, sortBy]);

  const primaryColor = dealer?.primaryColor || "#2563EB";
  const waNumber = dealer?.phone ? dealerWhatsappNumber(dealer.phone) : "";
  const whatsapp = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent("Hi, I'm interested in one of your cars.")}` : null;

  if (loading && !dealer) {
    return <div className="min-h-screen flex items-center justify-center bg-navy text-gray-400">Loading…</div>;
  }
  if (!dealer) {
    return <div className="min-h-screen flex items-center justify-center bg-navy text-gray-400">Dealer website not found.</div>;
  }

  const theme = dealer?.websiteTheme || "default";

  return (
    <div className={`min-h-screen bg-navy text-white relative website-theme-${theme}`} data-website-theme={theme}>
      <DealerMetaTags
        dealer={dealer}
        title={`${dealer.dealershipName} | Cars for Sale${dealer.city ? ` in ${dealer.city}` : ""}`}
        description={`Browse our inventory of ${filteredAndSorted.length} quality vehicles.`}
      />
      <StructuredData variant="dealer" dealer={dealer} />
      <DealerNavbar dealer={dealer} slug={slug} resolvedSlug={resolvedSlug} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="font-heading font-bold text-2xl">Available cars</h1>
            <p className="text-sm text-gray-400">{filteredAndSorted.length} car{filteredAndSorted.length === 1 ? "" : "s"} found</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1 rounded-lg bg-navy border border-white/10 text-xs text-white"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg border ${viewMode === "grid" ? "border-accent-blue text-accent-blue" : "border-white/10 text-gray-400"}`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg border ${viewMode === "list" ? "border-accent-blue text-accent-blue" : "border-white/10 text-gray-400"}`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 bg-navy-card rounded-xl border border-white/10 p-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Min price (KES)</label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-navy border border-white/10 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Max price (KES)</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-navy border border-white/10 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Make</label>
              <select
                value={filters.make}
                onChange={(e) => setFilters((f) => ({ ...f, make: e.target.value }))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-navy border border-white/10 text-xs text-white"
              >
                <option value="">Any</option>
                {makes.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Min year</label>
              <input
                type="number"
                value={filters.year}
                onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-navy border border-white/10 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Max mileage (km)</label>
              <input
                type="number"
                value={filters.maxMileage}
                onChange={(e) => setFilters((f) => ({ ...f, maxMileage: e.target.value }))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-navy border border-white/10 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Body type</label>
              <select
                value={filters.bodyType || ""}
                onChange={(e) => setFilters((f) => ({ ...f, bodyType: e.target.value || undefined }))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-navy border border-white/10 text-xs text-white"
              >
                <option value="">Any</option>
                {bodyTypes.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Fuel</label>
              <select
                value={filters.fuelType || ""}
                onChange={(e) => setFilters((f) => ({ ...f, fuelType: e.target.value || undefined }))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-navy border border-white/10 text-xs text-white"
              >
                <option value="">Any</option>
                {fuelTypes.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Transmission</label>
              <select
                value={filters.transmission || ""}
                onChange={(e) => setFilters((f) => ({ ...f, transmission: e.target.value || undefined }))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-navy border border-white/10 text-xs text-white"
              >
                <option value="">Any</option>
                {transmissions.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                const cleared = { minPrice: "", maxPrice: "", make: "", year: "", maxMileage: "", bodyType: undefined, fuelType: undefined, transmission: undefined };
                setFilters(cleared);
                fetchCars(dealer, cleared, false);
              }}
              className="px-3 py-1.5 rounded-lg border border-white/15 text-xs text-gray-300 hover:text-white"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => fetchCars(dealer, filters, false)}
              className="px-3 py-1.5 rounded-lg text-xs text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Apply filters
            </button>
          </div>
        </div>

        {filteredAndSorted.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No cars match your filters. Try widening your search.</p>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-3"}>
            {filteredAndSorted.map((car) => {
              const inWishlist = hasFavorite(car.id);
              return (
                <div
                  key={car.id}
                  className={`group bg-navy-card rounded-xl border border-white/5 overflow-hidden shadow-card hover:border-accent-blue/40 transition ${
                    viewMode === "list" ? "flex" : ""
                  }`}
                >
                  <Link
                    to={`/s/${resolvedSlug || slug}/inventory/${carSlugFromCar(car)}`}
                    className={viewMode === "list" ? "flex-1 flex" : "block"}
                  >
                    <div className={viewMode === "list" ? "w-40 h-full bg-navy-light" : "aspect-video bg-navy-light"}>
                      {car.photos?.length ? (
                        <img
                          src={car.photos[0]}
                          alt=""
                          className={`w-full h-full object-cover ${viewMode === "grid" ? "group-hover:scale-[1.02] transition-transform" : ""}`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-heading text-3xl">
                          {car.make?.slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-1.5 flex-1">
                      <p className="font-heading font-semibold text-sm">
                        {car.year} {car.make} {car.model}
                      </p>
                      <p className="text-accent-blue text-sm font-medium">
                        KES {(car.price || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {car.mileage != null ? `${car.mileage.toLocaleString()} km • ` : ""}
                        {car.color || "Colour TBD"}
                      </p>
                    </div>
                  </Link>
                  <div className="p-3 flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewCar(car); }}
                      className="px-2.5 py-1.5 rounded-lg border border-white/20 text-xs text-gray-300 hover:text-white hover:bg-white/5"
                    >
                      Quick view
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); toggleFavorite(car.id); toast.success(inWishlist ? "Removed from favorites" : "Saved to favorites"); }}
                      className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-xs text-white"
                      aria-label={inWishlist ? "Remove from favorites" : "Save to favorites"}
                    >
                      <Heart className={`w-4 h-4 ${inWishlist ? "fill-red-500 text-red-500" : ""}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-600 text-white text-sm font-medium shadow-lg shadow-black/50"
        >
          WhatsApp us
        </a>
      )}

      {quickViewCar && (
        <QuickViewModal
          car={quickViewCar}
          dealer={dealer}
          slug={resolvedSlug || slug}
          primaryColor={primaryColor}
          onClose={() => setQuickViewCar(null)}
        />
      )}

      <WebsiteConsentBanner />
    </div>
  );
}

