import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { publicSite } from "../../api";
import { motion } from "framer-motion";
import WebsiteConsentBanner from "../../components/WebsiteConsentBanner";
import TopDiscountMarquee from "../../components/website/TopDiscountMarquee";
import CinematicHeroCarousel from "../../components/website/CinematicHeroCarousel";
import TradeInWidget from "../../components/website/conversion/TradeInWidget";
import BannerCarousel from "../../components/website/banners/BannerCarousel";
import DealerMetaTags from "../../components/website/seo/DealerMetaTags";
import StructuredData from "../../components/website/seo/StructuredData";
import { carSlugFromCar } from "../../utils/urlUtils";
import DealerNavbar from "../../components/website/DealerNavbar";

const BUDGET_OPTS = ["Under 500K", "500K - 1M", "1M - 2M", "2M - 3M", "3M+"];

function dealerWhatsappNumber(phone) {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("254")) return digits;
  return `254${digits}`;
}

export default function WebsiteHome() {
  const { slug } = useParams();
  const [dealer, setDealer] = useState(null);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvedSlug, setResolvedSlug] = useState(null);
  const [banners, setBanners] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [captchaReady, setCaptchaReady] = useState(false);

  useEffect(() => {
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (!siteKey || typeof window === "undefined") return;
    if (document.querySelector("#recaptcha-v3-script")) {
      setCaptchaReady(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "recaptcha-v3-script";
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.onload = () => setCaptchaReady(true);
    document.head.appendChild(script);
  }, []);

  async function getCaptchaToken(action) {
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (!siteKey || typeof window === "undefined" || !window.grecaptcha || !captchaReady) return null;
    try {
      return await window.grecaptcha.execute(siteKey, { action });
    } catch {
      return null;
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    async function load() {
      try {
        const dealerData =
          slug === "host"
            ? await publicSite.getByHost(window.location.hostname)
            : await publicSite.getBySlug(slug);
        const slugForApi = dealerData.websiteSlug || slug;
        const [list, bannerList] = await Promise.all([
          publicSite.getCars(slugForApi),
          publicSite.getBanners(slugForApi).catch(() => []),
        ]);
        if (cancelled) return;
        setDealer(dealerData);
        setCars(list || []);
        setBanners(Array.isArray(bannerList) ? bannerList : []);
        setResolvedSlug(slugForApi);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e.message || "Website not found");
          toast.error(e.message || "Website not found");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const primaryColor = dealer?.primaryColor || "#2563EB";
  const featured = useMemo(() => cars.slice(0, 6), [cars]);
  const showTopMarquee = dealer?.enableDiscountMarquee !== false && cars.some((c) => c.isFeaturedInTopMarquee && c.discountPercentage > 0);
  const heroCars = useMemo(() => cars.filter((c) => c.isFeaturedInCinematicHero), [cars]);
  const waNumber = dealer?.phone ? dealerWhatsappNumber(dealer.phone) : "";
  const whatsapp = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent("Hi, I'm interested in your cars.")}` : null;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-navy text-gray-400">Loading…</div>;
  }
  if (!dealer) {
    const isServerError = loadError?.toLowerCase().includes("failed to fetch");
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-navy text-gray-400 px-4 text-center">
        <p className="font-medium text-white/90">{loadError || "Dealer website not found."}</p>
        <p className="mt-2 text-sm max-w-md">
          {isServerError
            ? "The server may be down or the database schema may be out of date. In the project root run: npx prisma db push && npx prisma generate, then restart the server. Check the server terminal for the exact error."
            : slug === "host"
              ? "This URL is for your custom domain or subdomain. On localhost or for testing, use /s/your-website-slug (e.g. /s/my-dealership) instead."
              : "Check the URL, or if this is your site: turn on your public website in Settings and use the slug shown there."}
        </p>
      </div>
    );
  }

  const theme = dealer?.websiteTheme || "default";

  return (
    <div className={`min-h-screen bg-navy text-white relative website-theme-${theme}`} data-website-theme={theme}>
      <DealerMetaTags
        dealer={dealer}
        title={`${dealer.dealershipName} | Premium Cars${dealer.city ? ` in ${dealer.city}` : ""}`}
        description={dealer.tagline || `Quality vehicles at ${dealer.dealershipName}.`}
      />
      <StructuredData variant="dealer" dealer={dealer} />
      {showTopMarquee && (
        <TopDiscountMarquee
          cars={cars}
          slug={resolvedSlug || slug}
          primaryColor={primaryColor}
          videoBackgroundsEnabled={dealer?.enableVideoBackgrounds === true}
        />
      )}
      <DealerNavbar dealer={dealer} slug={slug} resolvedSlug={resolvedSlug} offsetTop={showTopMarquee ? 80 : 0} />

      {banners.length > 0 && (
        <BannerCarousel banners={banners} slug={resolvedSlug || slug} primaryColor={primaryColor} />
      )}

      <main>
        {heroCars.length > 0 ? (
          <CinematicHeroCarousel cars={cars} slug={resolvedSlug || slug} primaryColor={primaryColor} videoBackgroundsEnabled={dealer?.enableVideoBackgrounds === true} />
        ) : (
          <section className="relative overflow-hidden">
            <motion.div
              className="absolute inset-0 opacity-60"
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.6 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background:
                  "radial-gradient(circle at 0% 0%, rgba(37,99,235,0.25), transparent 55%), radial-gradient(circle at 100% 100%, rgba(8,47,73,0.7), transparent 55%)",
              }}
            />
            <div className="relative max-w-6xl mx-auto px-4 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">Kenya · {dealer.city || "Showroom"}</p>
              <h1 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl leading-tight mb-4">
                {dealer.tagline || "Quality pre-owned cars you can trust."}
              </h1>
              <p className="text-gray-300 text-sm md:text-base mb-6">
                Browse curated vehicles, book a test drive, and get financing guidance — all in one place.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to={`/s/${resolvedSlug || slug}/inventory`}
                  className="px-5 py-2.5 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Browse Inventory
                </Link>
                {whatsapp && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-full text-sm font-medium bg-green-600/90 text-white hover:bg-green-500"
                  >
                    Chat on WhatsApp
                  </a>
                )}
              </div>
              <p className="mt-4 text-xs text-gray-500">
                Powered by <span className="font-semibold text-accent-blue">MotorIQ</span> – built for Kenyan car dealers.
              </p>
            </motion.div>
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl shadow-black/40"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.3 }}
              >
                {dealer.heroImage ? (
                  <img src={dealer.heroImage} alt={dealer.dealershipName} className="w-full h-full object-cover" />
                ) : featured[0]?.photos?.length ? (
                  <img src={featured[0].photos[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg">
                    Upload a hero image in Settings to customize this area.
                  </div>
                )}
              </motion.div>
              {featured.length > 0 && (
                <motion.div
                  className="absolute -bottom-5 left-4 right-4 bg-navy-card/95 border border-white/10 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.45 }}
                >
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Featured</p>
                    <p className="text-sm font-semibold">
                      {featured[0].year} {featured[0].make} {featured[0].model}
                    </p>
                  </div>
                  <Link
                    to={`/s/${resolvedSlug || slug}/inventory/${carSlugFromCar(featured[0])}`}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-white text-slate-900"
                  >
                    View details
                  </Link>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>
        )}

        <section className="border-t border-white/5 bg-navy-card/40">
          <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-heading font-semibold text-lg">Featured inventory</h2>
              <Link to={`/s/${resolvedSlug || slug}/inventory`} className="text-sm text-accent-blue hover:underline">
                View all cars →
              </Link>
            </div>
            {featured.length === 0 ? (
              <p className="text-gray-400 text-sm">No cars listed yet. Add cars in your MotorIQ dashboard to show them here.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {featured.map((car) => (
                  <Link
                    key={car.id}
                    to={`/s/${resolvedSlug || slug}/inventory/${carSlugFromCar(car)}`}
                    className="group bg-navy-card rounded-xl border border-white/5 overflow-hidden shadow-card hover:border-accent-blue/40 transition"
                  >
                    <div className="aspect-video bg-navy-light">
                      {car.photos?.length ? (
                        <img src={car.photos[0]} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-heading text-3xl">
                          {car.make?.slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-1.5">
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
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-white/5 bg-navy py-10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="mb-10">
              <TradeInWidget
                slug={resolvedSlug || slug}
                primaryColor={primaryColor}
                getCaptchaToken={getCaptchaToken}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <div className="bg-navy-card rounded-xl border border-white/10 p-5 shadow-card">
              <h3 className="font-heading font-semibold mb-2 text-lg">Ready to see a car in person?</h3>
              <p className="text-sm text-gray-300 mb-4">
                Share a few details and our team will call you back to confirm viewing and test drive.
              </p>
              <LeadForm whatsapp={whatsapp} />
            </div>
            <div className="space-y-4 text-sm text-gray-300">
              <h3 className="font-heading font-semibold text-base">Why customers choose us</h3>
              <ul className="space-y-1">
                <li>✓ Clean, accident-free imports</li>
                <li>✓ Flexible payment options and bank/SACCO guidance</li>
                <li>✓ Assistance with logbook transfer and registration</li>
              </ul>
              {dealer.city && (
                <p className="text-xs text-gray-400 mt-4">
                  Showroom location: <span className="text-white font-medium">{dealer.city}</span>
                </p>
              )}
            </div>
          </div>
          </div>
        </section>
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

      <WebsiteConsentBanner />
    </div>
  );
}

function LeadForm({ whatsapp }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    budget: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const message = `Hi, my name is ${form.name}. I'm looking for a car around ${form.budget || "my budget"}. My phone: ${form.phone}, email: ${form.email}.`;
      if (whatsapp) {
        const url = `${whatsapp}&text=${encodeURIComponent(message)}`;
        window.open(url, "_blank", "noopener,noreferrer");
      }
      toast.success("Opening WhatsApp…");
      setForm({ name: "", phone: "", email: "", budget: "" });
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        placeholder="Full name"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        required
        className="w-full px-3 py-2.5 rounded-lg bg-navy border border-white/10 text-white text-sm placeholder-gray-500"
      />
      <input
        type="tel"
        placeholder="Phone (WhatsApp)"
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        required
        className="w-full px-3 py-2.5 rounded-lg bg-navy border border-white/10 text-white text-sm placeholder-gray-500"
      />
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        required
        className="w-full px-3 py-2.5 rounded-lg bg-navy border border-white/10 text-white text-sm placeholder-gray-500"
      />
      <div>
        <label className="block text-xs text-gray-400 mb-1">Budget range</label>
        <select
          value={form.budget}
          onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
          className="w-full px-3 py-2.5 rounded-lg bg-navy border border-white/10 text-white text-sm"
        >
          <option value="">Select</option>
          {BUDGET_OPTS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: "#2563EB" }}
      >
        {submitting ? "Sending…" : "Request a call back"}
      </button>
    </form>
  );
}

