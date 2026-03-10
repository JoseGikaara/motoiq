import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onboarding } from "../api";

const STORAGE_KEY = "motoriq_apply_draft";
const CITIES = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Other"];
const PLAN_OPTIONS = [
  { id: "BASIC", name: "Starter", setup: 70000, monthly: 0, desc: "Up to 20 cars, lead capture, AI scoring" },
  { id: "PRO", name: "Professional", setup: 70000, monthly: 15000, desc: "Unlimited cars, ad copy, PDF reports, test drives" },
  { id: "ENTERPRISE", name: "Enterprise", setup: 70000, monthly: 20000, desc: "Multi-location, custom branding, dedicated manager" },
];

export default function Apply() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s ? { ...JSON.parse(s) } : {};
    } catch {
      return {};
    }
  });
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch (_) {}
  }, [form]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmitApplication = async () => {
    setError("");
    setLoading(true);
    try {
      const captchaToken = await getCaptchaToken("apply_form");
      const res = await onboarding.apply({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        dealershipName: form.dealershipName,
        city: form.city,
        stockSize: form.stockSize,
        monthlyLeads: form.monthlyLeads,
        currentProcess: form.currentProcess,
        socialMedia: form.socialMedia || undefined,
        website: form.website || undefined,
        selectedPlan: form.selectedPlan || "PRO",
        captchaToken,
      });
      setSubmitted(true);
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      setError(e.message || "Submit failed");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 text-green-400 text-4xl">✓</div>
          <h1 className="text-2xl font-bold mb-2">Application Received!</h1>
          <p className="text-slate-400 mb-6">We've sent a confirmation to {form.email}</p>
          <div className="text-left bg-slate-800/50 rounded-xl p-4 mb-6 space-y-2 text-sm">
            <p><span className="text-green-400">✓</span> Application submitted</p>
            <p><span className="text-slate-500">⏳</span> We review your application (30 min)</p>
            <p><span className="text-slate-500">💳</span> Payment instructions sent to your email & phone</p>
            <p><span className="text-slate-500">✅</span> Account activated within 2 hours of payment</p>
          </div>
          <button onClick={() => navigate(`/apply/status?email=${encodeURIComponent(form.email)}`)} className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium">
            Check Application Status →
          </button>
          <a href="https://wa.me/254700000000" target="_blank" rel="noreferrer" className="block mt-4 text-slate-400 text-sm hover:text-white">Questions? Chat with us on WhatsApp →</a>
        </div>
      </div>
    );
  }

  const progress = [
    { n: 1, label: "Your Info" },
    { n: 2, label: "Your Business" },
    { n: 3, label: "Choose Plan" },
    { n: 4, label: "Done" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-700 py-4 px-6">
        <a href="/" className="font-semibold text-xl">MotorIQ</a>
      </header>
      <div className="max-w-xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          {progress.map((p, i) => (
            <div key={p.n} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step > p.n ? "bg-green-600" : step === p.n ? "bg-blue-600" : "bg-slate-700"}`}>
                {step > p.n ? "✓" : p.n}
              </div>
              {i < progress.length - 1 && <div className="w-8 h-0.5 bg-slate-700 mx-0.5" />}
            </div>
          ))}
        </div>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{error}</div>}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Details</h2>
            <input type="text" placeholder="Full Name *" value={form.fullName || ""} onChange={(e) => update("fullName", e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white" required />
            <input type="email" placeholder="Email *" value={form.email || ""} onChange={(e) => update("email", e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white" required />
            <input type="tel" placeholder="Phone * (+254...)" value={form.phone || ""} onChange={(e) => update("phone", e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white" required />
            <input type="text" placeholder="Dealership / Business Name *" value={form.dealershipName || ""} onChange={(e) => update("dealershipName", e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white" required />
            <select value={form.city || ""} onChange={(e) => update("city", e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white" required>
              <option value="">City *</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => setStep(2)} disabled={!form.fullName || !form.email || !form.phone || !form.dealershipName || !form.city} className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50">Next</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Business</h2>
            <p className="text-slate-400 text-sm">How many cars do you currently have in stock?</p>
            <div className="flex flex-wrap gap-2">
              {["1-10", "11-30", "31-50", "50+"].map((s) => (
                <button key={s} onClick={() => update("stockSize", s)} className={`px-4 py-2 rounded-lg border ${form.stockSize === s ? "border-blue-500 bg-blue-500/20" : "border-slate-600"}`}>{s} cars</button>
              ))}
            </div>
            <p className="text-slate-400 text-sm">Leads per month (estimate)?</p>
            <div className="flex flex-wrap gap-2">
              {["Under 20", "20-50", "50-100", "100+"].map((s) => (
                <button key={s} onClick={() => update("monthlyLeads", s)} className={`px-4 py-2 rounded-lg border ${form.monthlyLeads === s ? "border-blue-500 bg-blue-500/20" : "border-slate-600"}`}>{s}</button>
              ))}
            </div>
            <p className="text-slate-400 text-sm">How do you manage leads now?</p>
            <div className="flex flex-wrap gap-2">
              {["WhatsApp only", "Spreadsheet", "Physical notebook", "Nothing formal"].map((s) => (
                <button key={s} onClick={() => update("currentProcess", s)} className={`px-4 py-2 rounded-lg border ${form.currentProcess === s ? "border-blue-500 bg-blue-500/20" : "border-slate-600"}`}>{s}</button>
              ))}
            </div>
            <input type="url" placeholder="Facebook/Instagram link (optional)" value={form.socialMedia || ""} onChange={(e) => update("socialMedia", e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white" />
            <input type="url" placeholder="Website (optional)" value={form.website || ""} onChange={(e) => update("website", e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="px-4 py-3 rounded-lg border border-slate-600">Back</button>
              <button onClick={() => setStep(3)} disabled={!form.stockSize || !form.monthlyLeads || !form.currentProcess} className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50">Next</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Choose Your Plan</h2>
            {PLAN_OPTIONS.map((p) => (
              <button key={p.id} onClick={() => update("selectedPlan", p.id)} className={`w-full text-left p-4 rounded-xl border-2 ${form.selectedPlan === p.id ? "border-blue-500 bg-blue-500/10" : "border-slate-600"} transition-colors`}>
                <div className="flex justify-between items-start">
                  <span className="font-medium">{p.name}</span>
                  {form.selectedPlan === p.id && <span className="text-blue-400">✓</span>}
                </div>
                <p className="text-slate-400 text-sm mt-1">{p.desc}</p>
                <p className="text-sm mt-2">KES {p.setup.toLocaleString()} setup {p.monthly > 0 ? `+ KES ${p.monthly.toLocaleString()}/mo` : ""}</p>
              </button>
            ))}
            <p className="text-slate-400 text-sm">Selected: {PLAN_OPTIONS.find((p) => p.id === (form.selectedPlan || "PRO"))?.name} — KES 70,000 setup + {form.selectedPlan === "ENTERPRISE" ? "KES 20,000" : form.selectedPlan === "PRO" ? "KES 15,000" : "KES 0"} /mo</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(2)} className="px-4 py-3 rounded-lg border border-slate-600">Back</button>
              <button onClick={handleSubmitApplication} disabled={loading} className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50">{loading ? "Submitting…" : "Submit Application →"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
