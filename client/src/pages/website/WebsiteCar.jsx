import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { CalendarDays, Heart } from "lucide-react";
import { publicSite, leads as leadsApi, testDrives as testDrivesApi } from "../../api";
import CarSpecsTable from "../../components/CarSpecsTable";
import EnhancedGallery from "../../components/website/car/EnhancedGallery";
import WebsiteConsentBanner from "../../components/WebsiteConsentBanner";
import DealerMetaTags from "../../components/website/seo/DealerMetaTags";
import StructuredData from "../../components/website/seo/StructuredData";
import StickyCTABar from "../../components/website/conversion/StickyCTABar";
import FinanceCalculator from "../../components/website/conversion/FinanceCalculator";
import ShareButtons from "../../components/website/engagement/ShareButtons";
import { useStickyBar } from "../../hooks/useStickyBar";
import { useWebsiteFavorites } from "../../context/WebsiteFavoritesContext";
import { useWebsiteRecentlyViewed } from "../../context/WebsiteRecentlyViewedContext";
import { parseCarIdFromSlug, carSlugFromCar } from "../../utils/urlUtils";
import DealerNavbar from "../../components/website/DealerNavbar";

const BUDGET_OPTS = ["Under 500K", "500K - 1M", "1M - 2M", "2M - 3M", "3M+"];
const TIMEFRAME_OPTS = ["This week", "This month", "In 2-3 months", "Just browsing"];
const TIME_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

function dealerWhatsappNumber(phone) {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("254")) return digits;
  return `254${digits}`;
}

export default function WebsiteCar() {
  const { slug, carSlug } = useParams();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref") || undefined;
  const carId = parseCarIdFromSlug(carSlug);
  const [dealer, setDealer] = useState(null);
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolvedSlug, setResolvedSlug] = useState(null);
  const [slide, setSlide] = useState(0);
  const [testDriveOpen, setTestDriveOpen] = useState(false);
  const heroRef = useRef(null);
  const footerRef = useRef(null);
  const stickyVisible = useStickyBar({ showAfterRef: heroRef, hideBeforeRef: footerRef });
  const { has: hasFavorite, toggle: toggleFavorite } = useWebsiteFavorites();
  const { items: recentlyViewedItems, add: addRecentlyViewed } = useWebsiteRecentlyViewed();
  const [leadForm, setLeadForm] = useState({
    name: "",
    phone: "",
    email: "",
    budget: "",
    financing: "cash",
    timeframe: "",
    tradeIn: "no",
  });
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [testDriveForm, setTestDriveForm] = useState({
    name: "",
    phone: "",
    date: "",
    timeSlot: "",
    notes: "",
  });
  const [testSubmitting, setTestSubmitting] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);
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
    if (!carId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const dealerData =
          slug === "host"
            ? await publicSite.getByHost(window.location.hostname)
            : await publicSite.getBySlug(slug);
        const slugForApi = dealerData.websiteSlug || slug;
        const c = await publicSite.getCar(slugForApi, carId);
        if (cancelled) return;
        setDealer(dealerData);
        setCar(c);
        setResolvedSlug(slugForApi);
      } catch (e) {
        if (!cancelled) toast.error(e.message || "Car not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug, carId]);

  useEffect(() => {
    if (car?.id) addRecentlyViewed(car);
  }, [car?.id]);

  const primaryColor = dealer?.primaryColor || "#2563EB";
  const photoGallery = Array.isArray(car?.photoGallery) && car.photoGallery.length > 0
    ? car.photoGallery
    : (car?.photos || []).map((url) => ({ url, angle: null, order: 0 }));
  const photos = photoGallery.map((p) => (typeof p === "string" ? p : p?.url)).filter(Boolean);
  const angles = [...new Set(photoGallery.map((p) => (p && typeof p === "object" && p.angle ? p.angle : null)).filter(Boolean))];

  const waNumber = dealer?.phone ? dealerWhatsappNumber(dealer.phone) : "";
  const whatsappMessage =
    car && `Hi, I'm interested in the ${car.year} ${car.make} ${car.model} listed for KES ${(car.price || 0).toLocaleString()}`;
  const whatsapp = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(whatsappMessage || "")}` : null;

  async function submitLead(e) {
    e.preventDefault();
    if (!car?.id) return;
    setLeadSubmitting(true);
    try {
      const captchaToken = await getCaptchaToken("website_car_lead");
      await leadsApi.create({
        carId: car.id,
        name: leadForm.name,
        phone: leadForm.phone,
        email: leadForm.email,
        budget: leadForm.budget || null,
        financing: leadForm.financing,
        timeframe: leadForm.timeframe || null,
        tradeIn: leadForm.tradeIn,
        source: `website_car_${slug}`,
        captchaToken,
        refCode,
      });
      setLeadSubmitted(true);
      toast.success("Thank you — we'll be in touch soon.");
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLeadSubmitting(false);
    }
  }

  async function submitTestDrive(e) {
    e.preventDefault();
    if (!car?.id || !car?.dealerId) return;
    setTestSubmitting(true);
    try {
      await testDrivesApi.create({
        carId: car.id,
        dealerId: car.dealerId,
        name: testDriveForm.name,
        phone: testDriveForm.phone,
        date: testDriveForm.date,
        timeSlot: testDriveForm.timeSlot,
        notes: testDriveForm.notes || undefined,
        refCode,
      });
      setTestSubmitted(true);
      toast.success("Test drive booked! The dealer will confirm shortly.");
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setTestSubmitting(false);
    }
  }

  if (!carId) {
    return <div className="min-h-screen flex items-center justify-center bg-navy text-gray-400">Invalid car link.</div>;
  }
  if (loading || !car || !dealer) {
    return <div className="min-h-screen flex items-center justify-center bg-navy text-gray-400">Loading…</div>;
  }

  const carDetailPath = `/s/${resolvedSlug || slug}/inventory/${carSlugFromCar(car)}`;
  const hasFinancing = dealer?.financingOffers && Array.isArray(dealer.financingOffers) && dealer.financingOffers.length > 0;

  const theme = dealer?.websiteTheme || "default";

  return (
    <div className={`min-h-screen bg-navy text-white relative website-theme-${theme}`} data-website-theme={theme}>
      <DealerMetaTags
        dealer={dealer}
        title={`${car.year} ${car.make} ${car.model} | ${dealer.dealershipName}`}
        description={(car.description || "").slice(0, 160) || `${car.year} ${car.make} ${car.model} - KES ${(car.price || 0).toLocaleString()}`}
        image={car.photoGallery?.[0]?.url || car.photos?.[0]}
        path={carDetailPath}
      />
      <StructuredData variant="car" dealer={dealer} car={car} />
      <DealerNavbar dealer={dealer} slug={slug} resolvedSlug={resolvedSlug} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div ref={heroRef}>
            {car.carPhotos?.length > 0 ? (
              <EnhancedGallery car={car} primaryColor={primaryColor} />
            ) : (
              <>
                <div className="aspect-video rounded-xl overflow-hidden bg-navy-light relative">
                  {photos.length > 0 ? (
                    <>
                      <img src={photos[slide]} alt={photoGallery[slide]?.angle ? `${photoGallery[slide].angle} view` : ""} className="w-full h-full object-cover" />
                      {photos.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setSlide((s) => (s - 1 + photos.length) % photos.length)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white text-lg hover:bg-black/70"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            onClick={() => setSlide((s) => (s + 1) % photos.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white text-lg hover:bg-black/70"
                          >
                            ›
                          </button>
                          {angles.length > 0 ? (
                            <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 justify-center">
                              {angles.map((angle) => {
                                const idx = photoGallery.findIndex((p) => p?.angle === angle);
                                if (idx < 0) return null;
                                return (
                                  <button
                                    key={angle}
                                    type="button"
                                    onClick={() => setSlide(idx)}
                                    className={`px-2 py-1 rounded text-xs font-medium ${slide === idx ? "bg-white text-navy" : "bg-black/50 text-white hover:bg-black/70"}`}
                                  >
                                    {angle}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                              {photos.map((_, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setSlide(i)}
                                  className={`w-2 h-2 rounded-full ${i === slide ? "bg-accent-blue" : "bg-white/50"}`}
                                />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-heading text-4xl">
                      {car.make?.slice(0, 1)}
                    </div>
                  )}
                </div>
                {photos.length > 1 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                    {photoGallery.map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSlide(i)}
                        className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${slide === i ? "border-white ring-1 ring-white/30" : "border-transparent opacity-70 hover:opacity-100"}`}
                      >
                        <img src={typeof item === "string" ? item : item?.url} alt={item?.angle || `Photo ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="flex items-start justify-between gap-4 mt-4">
              <div>
                <h1 className="font-heading font-bold text-2xl">
                  {car.year} {car.make} {car.model}
                </h1>
                <p className="text-accent-blue font-semibold text-lg mt-1">
                  KES {(car.price || 0).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { toggleFavorite(car.id); toast.success(hasFavorite(car.id) ? "Removed from favorites" : "Saved to favorites"); }}
                className="p-2.5 rounded-full border border-white/20 hover:bg-white/10 shrink-0"
                aria-label={hasFavorite(car.id) ? "Remove from favorites" : "Save to favorites"}
              >
                <Heart className={`w-6 h-6 ${hasFavorite(car.id) ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
              </button>
            </div>
            <div className="mt-3">
              <ShareButtons
                url={typeof window !== "undefined" ? window.location.href : ""}
                title={`${car.year} ${car.make} ${car.model} | ${dealer.dealershipName}`}
                text={`Check out this ${car.year} ${car.make} ${car.model} at ${dealer.dealershipName}`}
              />
            </div>
            <CarSpecsTable car={car} specsString={car.specs} />
          </div>

          <div id="lead-form" className="bg-navy-card rounded-xl border border-white/5 p-6 shadow-card space-y-6">
            {leadSubmitted ? (
              <div className="text-center py-6">
                <p className="text-white font-medium">Thanks! We’ll contact you shortly.</p>
                <p className="text-gray-400 text-sm mt-1">{dealer.dealershipName}</p>
                {whatsapp && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-4 px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-500"
                  >
                    Chat on WhatsApp
                  </a>
                )}
              </div>
            ) : (
              <>
                <h2 className="font-heading font-semibold text-lg mb-2">Request details</h2>
                <form onSubmit={submitLead} className="space-y-3 text-sm">
                  <input
                    type="text"
                    placeholder="Full name"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2.5 rounded-lg bg-navy border border-white/10 text-white placeholder-gray-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (WhatsApp)"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm((f) => ({ ...f, phone: e.target.value }))}
                    required
                    className="w-full px-3 py-2.5 rounded-lg bg-navy border border-white/10 text-white placeholder-gray-500"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm((f) => ({ ...f, email: e.target.value }))}
                    required
                    className="w-full px-3 py-2.5 rounded-lg bg-navy border border-white/10 text-white placeholder-gray-500"
                  />
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Budget range</label>
                    <select
                      value={leadForm.budget}
                      onChange={(e) => setLeadForm((f) => ({ ...f, budget: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg bg-navy border border-white/10 text-white text-sm"
                    >
                      <option value="">Select</option>
                      {BUDGET_OPTS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Cash or financing?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="financing"
                          value="cash"
                          checked={leadForm.financing === "cash"}
                          onChange={(e) => setLeadForm((f) => ({ ...f, financing: e.target.value }))}
                          className="text-accent-blue"
                        />
                        <span>Cash</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="financing"
                          value="financing"
                          checked={leadForm.financing === "financing"}
                          onChange={(e) => setLeadForm((f) => ({ ...f, financing: e.target.value }))}
                          className="text-accent-blue"
                        />
                        <span>Financing</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">When are you ready to buy?</label>
                    <select
                      value={leadForm.timeframe}
                      onChange={(e) => setLeadForm((f) => ({ ...f, timeframe: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg bg-navy border border-white/10 text-white text-sm"
                    >
                      <option value="">Select</option>
                      {TIMEFRAME_OPTS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Trade-in?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tradeIn"
                          value="yes"
                          checked={leadForm.tradeIn === "yes"}
                          onChange={(e) => setLeadForm((f) => ({ ...f, tradeIn: e.target.value }))}
                          className="text-accent-blue"
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tradeIn"
                          value="no"
                          checked={leadForm.tradeIn === "no"}
                          onChange={(e) => setLeadForm((f) => ({ ...f, tradeIn: e.target.value }))}
                          className="text-accent-blue"
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={leadSubmitting}
                    className="w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {leadSubmitting ? "Sending…" : "Request info"}
                  </button>
                </form>
              </>
            )}

            <div className="border-t border-white/10 pt-4">
              <h3 className="font-heading font-semibold text-sm mb-2 flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Book a test drive
              </h3>
              {testSubmitted ? (
                <p className="text-xs text-gray-300">Test drive booked! The dealer will confirm shortly.</p>
              ) : (
                <form onSubmit={submitTestDrive} className="space-y-2 text-xs">
                  <input
                    type="text"
                    placeholder="Full name"
                    value={testDriveForm.name}
                    onChange={(e) => setTestDriveForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white placeholder-gray-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={testDriveForm.phone}
                    onChange={(e) => setTestDriveForm((f) => ({ ...f, phone: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white placeholder-gray-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={testDriveForm.date}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setTestDriveForm((f) => ({ ...f, date: e.target.value }))}
                      required
                      className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white"
                    />
                    <select
                      value={testDriveForm.timeSlot}
                      onChange={(e) => setTestDriveForm((f) => ({ ...f, timeSlot: e.target.value }))}
                      required
                      className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white"
                    >
                      <option value="">Time</option>
                      {TIME_SLOTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    placeholder="Notes (optional)"
                    value={testDriveForm.notes}
                    onChange={(e) => setTestDriveForm((f) => ({ ...f, notes: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white placeholder-gray-500 min-h-[60px]"
                  />
                  <button
                    type="submit"
                    disabled={testSubmitting}
                    className="w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {testSubmitting ? "Booking…" : "Book test drive"}
                  </button>
                </form>
              )}
            </div>
          </div>

          {recentlyViewedItems.filter((item) => item.id !== car?.id).length > 0 && (
            <div className="mt-8">
              <h3 className="font-heading font-semibold text-sm mb-3 text-gray-400">Recently viewed</h3>
              <ul className="space-y-2">
                {recentlyViewedItems
                  .filter((item) => item.id !== car?.id)
                  .slice(0, 5)
                  .map((item) => (
                    <li key={item.id}>
                      <Link
                        to={`/s/${resolvedSlug || slug}/inventory/${carSlugFromCar(item)}`}
                        className="text-sm text-accent-blue hover:underline"
                      >
                        {item.year} {item.make} {item.model}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        {hasFinancing && (
          <section className="mt-12">
            <FinanceCalculator
              carPrice={car.price}
              defaultRate={dealer.financingOffers?.[0]?.ratePct ?? 14}
              primaryColor={primaryColor}
              onGetPreApproved={() => document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" })}
            />
          </section>
        )}

        {car.description && (
          <section className="mt-12 lg:mt-16" aria-labelledby="vehicle-description-heading">
            <div
              className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-[linear-gradient(160deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_50%,transparent_100%)] shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_24px_48px_-12px_rgba(0,0,0,0.4)]"
              style={{ ["--accent"]: primaryColor }}
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/60 to-transparent opacity-80" />
              <div className="relative">
                <div className="flex items-start gap-4 lg:gap-6 p-6 lg:p-10">
                  {/* Left accent bar */}
                  <div className="hidden sm:block w-1 shrink-0 rounded-full bg-[var(--accent)] opacity-90 min-h-[80px]" style={{ backgroundColor: primaryColor }} />
                  <div className="flex-1 min-w-0">
                    <p id="vehicle-description-heading" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-1" style={{ color: primaryColor }}>
                      About this vehicle
                    </p>
                    <h2 className="font-heading font-bold text-xl lg:text-2xl text-white tracking-tight mb-6">
                      The full picture
                    </h2>
                    <div className="space-y-5 text-[15px] lg:text-base text-gray-300/95 leading-[1.75]">
                      {car.description.split(/\n\n+/).filter(Boolean).map((para, i) => (
                        <p key={i} className={i === 0 ? "text-white/90 text-lg lg:text-xl leading-[1.65] font-medium" : ""}>
                          {para.trim()}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Subtle bottom glow */}
              <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none bg-gradient-to-t from-[var(--accent)]/5 to-transparent rounded-b-2xl" />
            </div>
          </section>
        )}
        <div ref={footerRef} />
      </main>

      <StickyCTABar
        visible={stickyVisible}
        car={car}
        dealer={dealer}
        slug={resolvedSlug || slug}
        carDetailPath={carDetailPath}
        primaryColor={primaryColor}
        onBookTestDrive={() => setTestDriveOpen(true)}
        hasFinancing={!!hasFinancing}
      />

      {testDriveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setTestDriveOpen(false)}>
          <div className="bg-navy-card rounded-xl border border-white/10 p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading font-semibold text-lg mb-4">Book a test drive</h3>
            {testSubmitted ? (
              <p className="text-gray-300">Test drive booked! The dealer will confirm shortly.</p>
            ) : (
              <form onSubmit={submitTestDrive} className="space-y-3">
                <input type="text" placeholder="Full name" value={testDriveForm.name} onChange={(e) => setTestDriveForm((f) => ({ ...f, name: e.target.value }))} required className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white" />
                <input type="tel" placeholder="Phone" value={testDriveForm.phone} onChange={(e) => setTestDriveForm((f) => ({ ...f, phone: e.target.value }))} required className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={testDriveForm.date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setTestDriveForm((f) => ({ ...f, date: e.target.value }))} required className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white" />
                  <select value={testDriveForm.timeSlot} onChange={(e) => setTestDriveForm((f) => ({ ...f, timeSlot: e.target.value }))} required className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white">
                    <option value="">Time</option>
                    {TIME_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <textarea placeholder="Notes" value={testDriveForm.notes} onChange={(e) => setTestDriveForm((f) => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white min-h-[60px]" />
                <div className="flex gap-2">
                  <button type="submit" disabled={testSubmitting} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: primaryColor }}>{testSubmitting ? "Booking…" : "Book"}</button>
                  <button type="button" onClick={() => setTestDriveOpen(false)} className="px-4 py-2.5 rounded-lg border border-white/20 text-gray-300">Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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

