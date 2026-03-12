import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { cars } from "../api";
import { leads as leadsApi } from "../api";
import { testDrives } from "../api";
import CarSpecsTable from "../components/CarSpecsTable";

const BUDGET_OPTS = ["Under 500K", "500K - 1M", "1M - 2M", "2M - 3M", "3M+"];
const TIMEFRAME_OPTS = ["This week", "This month", "In 2-3 months", "Just browsing"];
const TIME_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

export default function CarLanding() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const sourceFromUrl = searchParams.get("source") || searchParams.get("src") || "";
  const refFromUrl = searchParams.get("ref") || "";
  const buyerRefFromUrl = searchParams.get("buyerRef") || "";
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [slide, setSlide] = useState(0);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", budget: "", financing: "cash", timeframe: "", tradeIn: "no", source: sourceFromUrl,
  });
  const [submitted, setSubmitted] = useState(false);
  const [testDriveSubmitted, setTestDriveSubmitted] = useState(false);
  const [testDriveLoading, setTestDriveLoading] = useState(false);
  const [testDriveForm, setTestDriveForm] = useState({ date: "", timeSlot: "", notes: "", name: "", phone: "" });
  const [captchaReady, setCaptchaReady] = useState(false);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postLoading, setPostLoading] = useState(false);
  const [generatedPost, setGeneratedPost] = useState("");
  const [postImages, setPostImages] = useState([]);

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
    cars.getPublic(id).then(setCar).catch(() => toast.error("Car not found")).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    setForm((f) => ({ ...f, source: sourceFromUrl }));
  }, [sourceFromUrl]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const captchaToken = await getCaptchaToken("lead_form");
      await leadsApi.create({
        carId: id,
        ...form,
        source: form.source || undefined,
        captchaToken,
        refCode: refFromUrl || undefined,
        buyerRef: buyerRefFromUrl || undefined,
      });
      setSubmitted(true);
      toast.success("We'll be in touch soon!");
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleTestDriveSubmit(e) {
    e.preventDefault();
    if (!car?.dealer?.id) return;
    setTestDriveLoading(true);
    try {
      await testDrives.create({
        carId: id,
        dealerId: car.dealer.id,
        name: testDriveForm.name,
        phone: testDriveForm.phone,
        date: testDriveForm.date,
        timeSlot: testDriveForm.timeSlot,
        notes: testDriveForm.notes || undefined,
        refCode: refFromUrl || undefined,
      });
      setTestDriveSubmitted(true);
      toast.success("Test drive booked! The dealer will confirm shortly.");
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setTestDriveLoading(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-navy"><div className="text-gray-400">Loading…</div></div>;
  if (!car) return <div className="min-h-screen flex items-center justify-center bg-navy text-gray-400">Car not found.</div>;

  const photos = car.photos?.length ? car.photos : [];
  function dealerWhatsappNumber(phone) {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0")) return digits.slice(1).replace(/^/, "254");
    if (digits.startsWith("254")) return digits;
    return "254" + digits;
  }
  const dealerPhone = car.dealer?.phone ? dealerWhatsappNumber(car.dealer.phone) : "";
  const whatsappMessage = `Hello, I'm interested in the ${car.year} ${car.make} ${car.model} listed for KES ${(car.price || 0).toLocaleString()}. Is it still available?`;
  const whatsappUrl = dealerPhone ? `https://wa.me/${dealerPhone}?text=${encodeURIComponent(whatsappMessage)}` : null;
  const primaryColor = car.dealer?.primaryColor || "#2563EB";

  const shareBase = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, "");
  const shareCarLink = `${shareBase}/go/car/${car.id}`;
  const [buyerRefCode] = useState(() => {
    const key = `motoriq_buyer_ref_${car.id}`;
    try {
      let code = sessionStorage.getItem(key);
      if (!code) {
        code = Math.random().toString(36).slice(2, 10);
        sessionStorage.setItem(key, code);
      }
      return code;
    } catch { return Math.random().toString(36).slice(2, 10); }
  });
  const buyerReferralLink = `${shareBase}/go/buyer-ref/${car.id}/${buyerRefCode}`;

  function copyShareLink() {
    navigator.clipboard.writeText(shareCarLink).then(() => toast.success("Link copied!")).catch(() => toast.error("Could not copy"));
  }
  function copyBuyerRefLink() {
    navigator.clipboard.writeText(buyerReferralLink).then(() => toast.success("Referral link copied!")).catch(() => toast.error("Could not copy"));
  }

  async function handleWhatsAppClick(e) {
    e.preventDefault();
    if (!whatsappUrl) return;
    setSubmitLoading(true);
    try {
      await leadsApi.createWhatsApp({
        carId: car.id,
        dealerId: car.dealer?.id,
        message: whatsappMessage,
        refCode: refFromUrl || undefined,
        buyerRef: buyerRefFromUrl || undefined,
      });
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err.message || "Could not start chat");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleGeneratePost() {
    if (!car?.id) return;
    setPostModalOpen(true);
    setPostLoading(true);
    try {
      const data = await cars.getPost(car.id);
      setGeneratedPost(data.postText || "");
      setPostImages(Array.isArray(data.images) ? data.images : []);
    } catch (err) {
      toast.error(err.message || "Failed to generate post");
      setPostModalOpen(false);
    } finally {
      setPostLoading(false);
    }
  }

  function copyPostToClipboard() {
    if (!generatedPost) return;
    navigator.clipboard.writeText(generatedPost).then(
      () => toast.success("Post copied"),
      () => toast.error("Could not copy"),
    );
  }

  function sharePostToWhatsApp() {
    if (!generatedPost) return;
    const url = `https://wa.me/?text=${encodeURIComponent(generatedPost)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="min-h-screen bg-navy">
      <header className="border-b border-white/10 py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <span className="font-heading font-bold text-xl text-white"><span className="text-accent-blue">Motor</span>IQ</span>
          {whatsappUrl && (
            <button type="button" onClick={handleWhatsAppClick} disabled={submitLoading} className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-500 transition disabled:opacity-50">
              {submitLoading ? "Opening…" : "Chat on WhatsApp"}
            </button>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="aspect-video rounded-xl overflow-hidden bg-navy-light relative">
              {photos.length > 0 ? (
                <>
                  <img src={photos[slide]} alt="" className="w-full h-full object-cover" />
                  {photos.length > 1 && (
                    <>
                      <button type="button" onClick={() => setSlide((s) => (s - 1 + photos.length) % photos.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white">‹</button>
                      <button type="button" onClick={() => setSlide((s) => (s + 1) % photos.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white">›</button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {photos.map((_, i) => (
                          <button key={i} type="button" onClick={() => setSlide(i)} className={`w-2 h-2 rounded-full ${i === slide ? "bg-accent-blue" : "bg-white/50"}`} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 font-heading text-4xl">{car.make?.slice(0, 1)}</div>
              )}
            </div>
            <h1 className="font-heading font-bold text-2xl text-white mt-4">{car.make} {car.model}</h1>
            <p className="text-accent-blue font-medium">KES {(car.price || 0).toLocaleString()} · {car.year}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={copyShareLink} className="px-3 py-1.5 rounded-lg border border-white/20 text-gray-300 text-sm hover:bg-white/5 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                Share Car
              </button>
              <button type="button" onClick={copyBuyerRefLink} className="px-3 py-1.5 rounded-lg border border-green-500/40 text-green-400 text-sm hover:bg-green-500/10 flex items-center gap-1.5">
                Share & refer friends
              </button>
              <button
                type="button"
                onClick={handleGeneratePost}
                className="px-3 py-1.5 rounded-lg border border-accent-blue/60 text-accent-blue text-sm hover:bg-accent-blue/10 flex items-center gap-1.5"
              >
                Generate Sales Post
              </button>
            </div>
            <CarSpecsTable car={car} specsString={car.specs} />
          </div>

          <div className="bg-navy-card rounded-xl border border-white/5 p-6 shadow-card">
            {submitted ? (
              <div className="text-center py-8">
                <p className="text-white font-medium">Thanks! We'll contact you shortly.</p>
                <p className="text-gray-400 text-sm mt-1">{car.dealer?.dealershipName}</p>
                {whatsappUrl && (
                  <button type="button" onClick={handleWhatsAppClick} disabled={submitLoading} className="inline-block mt-4 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 disabled:opacity-50">Chat on WhatsApp</button>
                )}
              </div>
            ) : (
              <>
                <h2 className="font-heading font-semibold text-lg text-white mb-4">Get in touch</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {form.source && <input type="hidden" name="source" value={form.source} />}
                  <input type="text" placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white placeholder-gray-500" required />
                  <input type="tel" placeholder="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white placeholder-gray-500" required />
                  <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white placeholder-gray-500" required />
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Budget range</label>
                    <select value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white">
                      <option value="">Select</option>
                      {BUDGET_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Cash or financing?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="financing" value="cash" checked={form.financing === "cash"} onChange={(e) => setForm((f) => ({ ...f, financing: e.target.value }))} className="text-accent-blue" />
                        <span className="text-white">Cash</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="financing" value="financing" checked={form.financing === "financing"} onChange={(e) => setForm((f) => ({ ...f, financing: e.target.value }))} className="text-accent-blue" />
                        <span className="text-white">Financing</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">When are you ready to buy?</label>
                    <select value={form.timeframe} onChange={(e) => setForm((f) => ({ ...f, timeframe: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white">
                      <option value="">Select</option>
                      {TIMEFRAME_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Trade-in?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="tradeIn" value="yes" checked={form.tradeIn === "yes"} onChange={(e) => setForm((f) => ({ ...f, tradeIn: e.target.value }))} className="text-accent-blue" />
                        <span className="text-white">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="tradeIn" value="no" checked={form.tradeIn === "no"} onChange={(e) => setForm((f) => ({ ...f, tradeIn: e.target.value }))} className="text-accent-blue" />
                        <span className="text-white">No</span>
                      </label>
                    </div>
                  </div>
                  <button type="submit" disabled={submitLoading} className="w-full py-2.5 rounded-lg text-white font-medium disabled:opacity-50" style={{ backgroundColor: primaryColor }}>
                    {submitLoading ? "Sending…" : "Submit"}
                  </button>
                </form>

                {whatsappUrl && (
                  <div className="mt-6 p-4 rounded-xl bg-green-600/20 border border-green-500/30">
                    <p className="text-white font-medium mb-3">Prefer to chat now?</p>
                    <button type="button" onClick={handleWhatsAppClick} disabled={submitLoading} className="w-full py-3.5 rounded-lg bg-green-600 text-white font-semibold text-lg hover:bg-green-500 transition disabled:opacity-50 flex items-center justify-center gap-2">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Chat on WhatsApp
                    </button>
                  </div>
                )}

                <hr className="my-6 border-white/10" />
                <h3 className="font-heading font-semibold text-white mb-3">Book a Test Drive</h3>
                {testDriveSubmitted ? (
                  <p className="text-gray-400 text-sm">Test drive booked! The dealer will confirm shortly.</p>
                ) : (
                  <form onSubmit={handleTestDriveSubmit} className="space-y-3">
                    <input type="text" placeholder="Name" value={testDriveForm.name} onChange={(e) => setTestDriveForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white placeholder-gray-500" required />
                    <input type="tel" placeholder="Phone" value={testDriveForm.phone} onChange={(e) => setTestDriveForm((f) => ({ ...f, phone: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white placeholder-gray-500" required />
                    <input type="date" value={testDriveForm.date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setTestDriveForm((f) => ({ ...f, date: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white" required />
                    <select value={testDriveForm.timeSlot} onChange={(e) => setTestDriveForm((f) => ({ ...f, timeSlot: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white" required>
                      <option value="">Time</option>
                      {TIME_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <textarea placeholder="Notes (optional)" value={testDriveForm.notes} onChange={(e) => setTestDriveForm((f) => ({ ...f, notes: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white placeholder-gray-500 min-h-[60px]" />
                    <button type="submit" disabled={testDriveLoading} className="w-full py-2.5 rounded-lg text-white font-medium disabled:opacity-50" style={{ backgroundColor: primaryColor }}>
                      {testDriveLoading ? "Booking…" : "Book Test Drive"}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {postModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-950 border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-heading font-semibold text-lg text-white">Sales post for this car</h2>
                <p className="text-xs text-slate-400">
                  Copy, download images, or share directly to WhatsApp.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPostModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ×
              </button>
            </div>
            {postLoading ? (
              <div className="py-8 text-center text-slate-400 text-sm">Generating post…</div>
            ) : (
              <>
                <textarea
                  value={generatedPost}
                  readOnly
                  rows={8}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm resize-none"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={copyPostToClipboard}
                    className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-slate-800 text-white text-xs font-medium hover:bg-slate-700"
                  >
                    Copy post
                  </button>
                  <button
                    type="button"
                    onClick={sharePostToWhatsApp}
                    className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-500"
                  >
                    Share to WhatsApp
                  </button>
                </div>
                {postImages.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">Images</p>
                    <div className="flex flex-wrap gap-2">
                      {postImages.slice(0, 4).map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="block w-20 h-20 rounded-lg overflow-hidden border border-slate-700 bg-slate-900"
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
