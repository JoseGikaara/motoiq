import { useState } from "react";
import toast from "react-hot-toast";
import { publicSite } from "../../../api";

const CONDITION_OPTS = ["Excellent", "Good", "Fair", "Needs work"];

export default function TradeInWidget({ slug, primaryColor, getCaptchaToken }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    year: "",
    make: "",
    model: "",
    mileage: "",
    condition: "",
    name: "",
    phone: "",
    email: "",
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const captchaToken = getCaptchaToken ? await getCaptchaToken("website_tradein") : null;
      await publicSite.submitTradeIn(slug, {
        name: form.name,
        phone: form.phone,
        email: form.email,
        year: form.year || undefined,
        make: form.make || undefined,
        model: form.model || undefined,
        mileage: form.mileage || undefined,
        condition: form.condition || undefined,
        captchaToken,
      });
      setSubmitted(true);
      toast.success("Trade-in request sent. We'll be in touch.");
    } catch (err) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-white/10 bg-navy-card p-6 text-center">
        <p className="text-white font-medium">Thanks! We’ll contact you about your trade-in.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-navy-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-white/5 transition"
        style={{ color: primaryColor }}
      >
        <span className="font-heading font-semibold">Get a trade-in value</span>
        <span className="text-2xl text-gray-400">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-0 space-y-3 border-t border-white/10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Year</label>
              <input
                type="number"
                min="1990"
                max={new Date().getFullYear() + 1}
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Make</label>
              <input
                type="text"
                value={form.make}
                onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
                placeholder="e.g. Toyota"
                className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Model</label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                placeholder="e.g. Corolla"
                className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Mileage (km)</label>
              <input
                type="number"
                min="0"
                value={form.mileage}
                onChange={(e) => setForm((f) => ({ ...f, mileage: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Condition</label>
            <select
              value={form.condition}
              onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm"
            >
              <option value="">Select</option>
              {CONDITION_OPTS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Your name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                required
                className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            {submitting ? "Submitting…" : "Submit trade-in request"}
          </button>
        </form>
      )}
    </div>
  );
}
