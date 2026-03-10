import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Heart, Trash2 } from "lucide-react";
import { publicSite } from "../../api";
import { useWebsiteFavorites } from "../../context/WebsiteFavoritesContext";
import { carSlugFromCar } from "../../utils/urlUtils";
import WebsiteConsentBanner from "../../components/WebsiteConsentBanner";
import DealerNavbar from "../../components/website/DealerNavbar";

function dealerWhatsappNumber(phone) {
  if (!phone) return "";
  const d = String(phone).replace(/\D/g, "");
  if (d.startsWith("0")) return `254${d.slice(1)}`;
  if (d.startsWith("254")) return d;
  return `254${d}`;
}

export default function WebsiteFavoritesPage() {
  const { slug } = useParams();
  const { ids, remove, clear, has } = useWebsiteFavorites();
  const [dealer, setDealer] = useState(null);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvedSlug, setResolvedSlug] = useState(null);

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
        setResolvedSlug(d.websiteSlug || slug);
        if (ids.length > 0) {
          const list = await publicSite.getCars(d.websiteSlug || slug);
          if (cancelled) return;
          setCars(ids.map((id) => list.find((c) => c.id === id)).filter(Boolean));
        }
      } catch (e) {
        if (!cancelled) toast.error(e.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug, ids.length]);

  const waNumber = dealer?.phone ? dealerWhatsappNumber(dealer.phone) : "";
  const whatsapp = waNumber ? `https://wa.me/${waNumber}` : null;
  const primaryColor = dealer?.primaryColor || "#2563EB";

  if (loading && !dealer) {
    return <div className="min-h-screen flex items-center justify-center bg-navy text-gray-400">Loading…</div>;
  }
  if (!dealer) {
    return <div className="min-h-screen flex items-center justify-center bg-navy text-gray-400">Dealer website not found.</div>;
  }

  return (
    <div className="min-h-screen bg-navy text-white relative">
      <DealerNavbar dealer={dealer} slug={slug} resolvedSlug={resolvedSlug} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Heart className="w-7 h-7" style={{ color: primaryColor }} />
            Saved cars
          </h1>
          {cars.length > 0 && (
            <button
              type="button"
              onClick={() => { clear(); toast.success("Favorites cleared"); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 text-gray-400 hover:text-white text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>

        {cars.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium text-white/80">No saved cars yet</p>
            <p className="mt-1">Save cars from the inventory by clicking the heart icon.</p>
            <Link to={`/s/${resolvedSlug || slug}/inventory`} className="inline-block mt-6 px-5 py-2.5 rounded-lg text-white font-medium" style={{ backgroundColor: primaryColor }}>
              Browse inventory
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cars.map((car) => (
              <div key={car.id} className="bg-navy-card rounded-xl border border-white/5 overflow-hidden shadow-card">
                <Link to={`/s/${resolvedSlug || slug}/inventory/${carSlugFromCar(car)}`} className="block aspect-video bg-navy-light">
                  {car.photos?.[0] ? (
                    <img src={car.photos[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-3xl font-heading">{car.make?.[0]}</div>
                  )}
                </Link>
                <div className="p-4">
                  <h2 className="font-heading font-semibold text-white">{car.year} {car.make} {car.model}</h2>
                  <p className="text-sm font-medium mt-1" style={{ color: primaryColor }}>KES {(car.price || 0).toLocaleString()}</p>
                  <div className="mt-3 flex gap-2">
                    <Link to={`/s/${resolvedSlug || slug}/inventory/${carSlugFromCar(car)}`} className="flex-1 py-2 rounded-lg text-center text-sm font-medium text-white" style={{ backgroundColor: primaryColor }}>View</Link>
                    <button type="button" onClick={() => { remove(car.id); toast.success("Removed from favorites"); }} className="p-2 rounded-lg border border-white/20 text-gray-400 hover:text-red-400" aria-label="Remove from favorites"><Heart className="w-5 h-5 fill-current" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <WebsiteConsentBanner />
    </div>
  );
}
