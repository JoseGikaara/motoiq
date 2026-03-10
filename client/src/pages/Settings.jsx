import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../api";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    dealershipName: "",
    logoUrl: "",
    primaryColor: "#2563EB",
    tagline: "",
    city: "",
    website: "",
    monthlyTargetDeals: "",
    commissionRate: "",
    currency: "KES",
    affiliateCommissionMode: "percent",
    affiliateCommissionPerLead: "",
    affiliateCommissionPerTestDrive: "",
    affiliateCommissionPerClose: "",
    affiliateMultiLevelDepth: "1",
    affiliateLevel2Rate: "",
    affiliateLevel3Rate: "",
    websiteActive: false,
    websiteSlug: "",
    websiteExpiresAt: null,
    enableDiscountMarquee: true,
    enableVideoBackgrounds: false,
    websiteTheme: "",
    customDomain: "",
    heroImage: "",
    aboutText: "",
    financingOffers: [],
  });

  useEffect(() => {
    api("/api/settings")
      .then((data) => {
        setForm({
          name: data.name ?? "",
          phone: data.phone ?? "",
          dealershipName: data.dealershipName ?? "",
          logoUrl: data.logoUrl ?? "",
          primaryColor: data.primaryColor ?? "#2563EB",
          tagline: data.tagline ?? "",
          city: data.city ?? "",
          website: data.website ?? "",
          monthlyTargetDeals: data.monthlyTargetDeals != null ? String(data.monthlyTargetDeals) : "",
          commissionRate: data.commissionRate != null ? String(Number(data.commissionRate) * 100) : "",
          currency: data.currency ?? "KES",
          affiliateCommissionMode: data.affiliateCommissionMode ?? "percent",
          affiliateCommissionPerLead: data.affiliateCommissionPerLead != null ? String(data.affiliateCommissionPerLead) : "",
          affiliateCommissionPerTestDrive: data.affiliateCommissionPerTestDrive != null ? String(data.affiliateCommissionPerTestDrive) : "",
          affiliateCommissionPerClose: data.affiliateCommissionPerClose != null ? String(data.affiliateCommissionPerClose) : "",
          affiliateMultiLevelDepth: data.affiliateMultiLevelDepth != null ? String(data.affiliateMultiLevelDepth) : "1",
          affiliateLevel2Rate: data.affiliateLevel2Rate != null ? String(Number(data.affiliateLevel2Rate) * 100) : "",
          affiliateLevel3Rate: data.affiliateLevel3Rate != null ? String(Number(data.affiliateLevel3Rate) * 100) : "",
          websiteActive: data.websiteActive ?? false,
          websiteSlug: data.websiteSlug ?? "",
          websiteExpiresAt: data.websiteExpiresAt ?? null,
          enableDiscountMarquee: data.enableDiscountMarquee !== false,
          enableVideoBackgrounds: data.enableVideoBackgrounds === true,
          websiteTheme: data.websiteTheme ?? "",
          customDomain: data.customDomain ?? "",
          heroImage: data.heroImage ?? "",
          aboutText: data.aboutText ?? "",
          financingOffers: Array.isArray(data.financingOffers) ? data.financingOffers : [],
        });
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.monthlyTargetDeals === "") payload.monthlyTargetDeals = null;
      else payload.monthlyTargetDeals = Number(payload.monthlyTargetDeals) || null;
      if (payload.commissionRate === "") payload.commissionRate = null;
      else payload.commissionRate = (Number(payload.commissionRate) || 0) / 100;
      payload.affiliateCommissionMode = payload.affiliateCommissionMode === "fixed" ? "fixed" : "percent";
      payload.affiliateCommissionPerLead = payload.affiliateCommissionPerLead === "" ? null : Math.max(0, Number(payload.affiliateCommissionPerLead) || 0);
      payload.affiliateCommissionPerTestDrive = payload.affiliateCommissionPerTestDrive === "" ? null : Math.max(0, Number(payload.affiliateCommissionPerTestDrive) || 0);
      payload.affiliateCommissionPerClose = payload.affiliateCommissionPerClose === "" ? null : Math.max(0, Number(payload.affiliateCommissionPerClose) || 0);
      payload.affiliateMultiLevelDepth = payload.affiliateMultiLevelDepth === "" ? null : Math.min(3, Math.max(1, Number(payload.affiliateMultiLevelDepth) || 1));
      payload.affiliateLevel2Rate = payload.affiliateLevel2Rate === "" ? null : (Number(payload.affiliateLevel2Rate) || 0) / 100;
      payload.affiliateLevel3Rate = payload.affiliateLevel3Rate === "" ? null : (Number(payload.affiliateLevel3Rate) || 0) / 100;
      payload.customDomain = payload.customDomain?.trim() || null;
      payload.heroImage = payload.heroImage?.trim() || null;
      payload.aboutText = payload.aboutText?.trim() || null;
      const updated = await api("/api/settings", { method: "PATCH", body: JSON.stringify(payload) });
      setForm((f) => ({
        ...f,
        websiteSlug: updated.websiteSlug ?? f.websiteSlug,
        websiteExpiresAt: updated.websiteExpiresAt ?? f.websiteExpiresAt,
        enableDiscountMarquee: updated.enableDiscountMarquee ?? f.enableDiscountMarquee,
        enableVideoBackgrounds: updated.enableVideoBackgrounds ?? f.enableVideoBackgrounds,
      }));
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="h-64 bg-navy-card rounded-xl animate-pulse" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-white">Settings</h1>
        <p className="text-gray-400 mt-0.5">Dealership profile and branding</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-navy-card rounded-xl border border-white/5 p-6 shadow-card max-w-xl space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Dealership name</label>
          <input value={form.dealershipName} onChange={(e) => setForm((f) => ({ ...f, dealershipName: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Your name</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Phone</label>
          <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white" placeholder="e.g. 0712345678" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">City</label>
          <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white" placeholder="e.g. Nairobi" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Website</label>
          <input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white" placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Tagline</label>
          <input value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white" placeholder="e.g. Your trusted car partner" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Logo URL</label>
          <input value={form.logoUrl} onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white" placeholder="https://..." />
          {form.logoUrl && (
            <div className="mt-2">
              <img src={form.logoUrl} alt="Logo preview" className="h-12 object-contain" onError={(e) => e.target.style.display = "none"} />
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Primary color</label>
          <div className="flex items-center gap-2">
            <input type="color" value={form.primaryColor} onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))} className="w-10 h-10 rounded cursor-pointer" />
            <input value={form.primaryColor} onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))} className="flex-1 px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white font-mono text-sm" />
          </div>
        </div>
        <div className="border-t border-white/10 pt-4 mt-4">
          <h3 className="font-heading font-medium text-white mb-3">My Website</h3>
          <p className="text-sm text-gray-400 mb-3">Launch a professional public site for your dealership. Included with your setup (1 year hosting + free subdomain).</p>
          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.websiteActive}
              onClick={() => setForm((f) => ({ ...f, websiteActive: !f.websiteActive }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-navy ${form.websiteActive ? "bg-accent-blue" : "bg-white/20"}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${form.websiteActive ? "translate-x-5" : "translate-x-1"}`} style={{ marginTop: 2 }} />
            </button>
            <span className="text-white font-medium">{form.websiteActive ? "Public website ON" : "Public website OFF"}</span>
          </div>
          {form.websiteActive && (
            <>
              <div className="mb-3 p-3 rounded-lg bg-navy border border-white/10">
                <label className="block text-xs text-gray-400 mb-1">Your site URL (subdomain)</label>
                <div className="flex items-center gap-2">
                  <code className="text-sm text-emerald-400 flex-1 truncate">
                    https://{(form.websiteSlug || "your-dealership").toLowerCase()}.motoriq.co.ke
                  </code>
                  <a
                    href={`${window.location.origin}/s/${(form.websiteSlug || "your-dealership").toLowerCase()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-blue text-sm whitespace-nowrap"
                  >
                    Open →
                  </a>
                </div>
                {form.websiteExpiresAt && (
                  <p className="text-xs text-gray-500 mt-1">Hosting until {new Date(form.websiteExpiresAt).toLocaleDateString()}</p>
                )}
              </div>
              <div className="mb-3">
                <label className="block text-sm text-gray-400 mb-1">Connect custom domain (optional)</label>
                <input value={form.customDomain} onChange={(e) => setForm((f) => ({ ...f, customDomain: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white text-sm" placeholder="e.g. cars.yourdealership.co.ke" />
                <p className="text-xs text-gray-500 mt-1">Add a CNAME record pointing to <code className="bg-white/10 px-1 rounded">dealers.motoriq.co.ke</code>. We’ll verify and enable it.</p>
              </div>
              <div className="mb-3">
                <label className="block text-sm text-gray-400 mb-1">Hero image URL (website banner)</label>
                <input value={form.heroImage} onChange={(e) => setForm((f) => ({ ...f, heroImage: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white text-sm" placeholder="https://..." />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.enableDiscountMarquee}
                  onClick={() => setForm((f) => ({ ...f, enableDiscountMarquee: !f.enableDiscountMarquee }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-navy ${form.enableDiscountMarquee ? "bg-accent-blue" : "bg-white/20"}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${form.enableDiscountMarquee ? "translate-x-5" : "translate-x-1"}`} style={{ marginTop: 2 }} />
                </button>
                <span className="text-white font-medium">Enable discount marquee on homepage</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">When ON, cars you mark as &quot;Featured in Top Marquee&quot; with a discount will scroll in a banner at the top of your site.</p>
              <div className="flex items-center gap-3 mb-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.enableVideoBackgrounds}
                  onClick={() => setForm((f) => ({ ...f, enableVideoBackgrounds: !f.enableVideoBackgrounds }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-navy ${form.enableVideoBackgrounds ? "bg-accent-blue" : "bg-white/20"}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${form.enableVideoBackgrounds ? "translate-x-5" : "translate-x-1"}`} style={{ marginTop: 2 }} />
                </button>
                <span className="text-white font-medium">Enable video backgrounds in marquees</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">When ON, cars with a video and &quot;Use video as marquee background&quot; will show looped video in the top marquee and hero. Disabled on mobile and slow connections.</p>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Website theme</label>
                <select value={form.websiteTheme} onChange={(e) => setForm((f) => ({ ...f, websiteTheme: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white">
                  <option value="">Default</option>
                  <option value="classic">Classic showroom</option>
                  <option value="minimal">Minimal inventory</option>
                  <option value="luxury">Luxury dealer</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Layout and style of your public site.</p>
              </div>
              <div className="mb-4">
                <Link to="/settings/banners" className="inline-flex items-center gap-2 text-sm text-accent-blue hover:underline">
                  Manage Banners →
                </Link>
                <p className="text-xs text-gray-500 mt-1">Add rotating, flash sale, or headline banners above the hero on your website.</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">About text (for your About page)</label>
                <textarea value={form.aboutText} onChange={(e) => setForm((f) => ({ ...f, aboutText: e.target.value }))} rows={3} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white text-sm placeholder-gray-500" placeholder="Tell customers your story..." />
              </div>
            </>
          )}
        </div>
        <div className="border-t border-white/10 pt-4 mt-4">
          <h3 className="font-heading font-medium text-white mb-2">Financing options (website calculator)</h3>
          <p className="text-sm text-gray-400 mb-3">Add the financing deals you offer. They appear on your website’s Financing page and pre-fill the calculator.</p>
          {(form.financingOffers || []).map((offer, idx) => (
            <div key={idx} className="mb-4 p-4 rounded-lg bg-navy border border-white/10 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Offer {idx + 1}</span>
                <button type="button" onClick={() => setForm((f) => ({ ...f, financingOffers: (f.financingOffers || []).filter((_, i) => i !== idx) }))} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Lender / plan name</label>
                  <input value={offer.name || ""} onChange={(e) => setForm((f) => ({ ...f, financingOffers: (f.financingOffers || []).map((o, i) => i === idx ? { ...o, name: e.target.value } : o) }))} className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm" placeholder="e.g. KCB 14%" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Interest rate p.a. (%)</label>
                  <input type="number" min={0} max={100} step={0.5} value={offer.ratePct ?? ""} onChange={(e) => setForm((f) => ({ ...f, financingOffers: (f.financingOffers || []).map((o, i) => i === idx ? { ...o, ratePct: e.target.value } : o) }))} className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm" placeholder="14" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Term (months)</label>
                  <input type="number" min={12} max={84} value={offer.termMonths ?? offer.termMax ?? ""} onChange={(e) => setForm((f) => ({ ...f, financingOffers: (f.financingOffers || []).map((o, i) => i === idx ? { ...o, termMonths: e.target.value ? Number(e.target.value) : null } : o) }))} className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm" placeholder="48" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min. deposit (%)</label>
                  <input type="number" min={0} max={100} value={offer.minDepositPct ?? ""} onChange={(e) => setForm((f) => ({ ...f, financingOffers: (f.financingOffers || []).map((o, i) => i === idx ? { ...o, minDepositPct: e.target.value ? Number(e.target.value) : null } : o) }))} className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm" placeholder="20" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Notes (optional)</label>
                <input value={offer.notes || ""} onChange={(e) => setForm((f) => ({ ...f, financingOffers: (f.financingOffers || []).map((o, i) => i === idx ? { ...o, notes: e.target.value } : o) }))} className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm" placeholder="e.g. Subject to approval" />
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setForm((f) => ({ ...f, financingOffers: [...(f.financingOffers || []), { name: "", ratePct: "", termMonths: 48, minDepositPct: 20, notes: "" }] }))} className="px-3 py-2 rounded-lg border border-dashed border-white/20 text-gray-400 hover:text-white text-sm">
            + Add financing option
          </button>
        </div>
        <div className="border-t border-white/10 pt-4 mt-4">
          <h3 className="font-heading font-medium text-white mb-2">Affiliate commission</h3>
          <p className="text-sm text-gray-400 mb-3">How to pay affiliates: percentage of deal value on close, or fixed KES per lead / test drive / closed deal.</p>
          <div className="flex items-center gap-4 mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="affiliateCommissionMode"
                checked={form.affiliateCommissionMode !== "fixed"}
                onChange={() => setForm((f) => ({ ...f, affiliateCommissionMode: "percent" }))}
                className="text-accent-blue focus:ring-accent-blue"
              />
              <span className="text-white">Percent of deal (use each affiliate&apos;s rate)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="affiliateCommissionMode"
                checked={form.affiliateCommissionMode === "fixed"}
                onChange={() => setForm((f) => ({ ...f, affiliateCommissionMode: "fixed" }))}
                className="text-accent-blue focus:ring-accent-blue"
              />
              <span className="text-white">Fixed KES per event</span>
            </label>
          </div>
          {form.affiliateCommissionMode === "fixed" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">KES per lead</label>
                <input type="number" min={0} value={form.affiliateCommissionPerLead} onChange={(e) => setForm((f) => ({ ...f, affiliateCommissionPerLead: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white" placeholder="e.g. 500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">KES per test drive</label>
                <input type="number" min={0} value={form.affiliateCommissionPerTestDrive} onChange={(e) => setForm((f) => ({ ...f, affiliateCommissionPerTestDrive: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white" placeholder="e.g. 1000" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">KES per closed deal</label>
                <input type="number" min={0} value={form.affiliateCommissionPerClose} onChange={(e) => setForm((f) => ({ ...f, affiliateCommissionPerClose: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white" placeholder="e.g. 5000" />
              </div>
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-sm text-gray-400 mb-2">Multi-level commissions (when an affiliate referred another affiliate)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Depth (1–3)</label>
                <input type="number" min={1} max={3} value={form.affiliateMultiLevelDepth} onChange={(e) => setForm((f) => ({ ...f, affiliateMultiLevelDepth: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Level 2 rate (%)</label>
                <input type="number" min={0} step={0.5} value={form.affiliateLevel2Rate} onChange={(e) => setForm((f) => ({ ...f, affiliateLevel2Rate: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white" placeholder="e.g. 1" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Level 3 rate (%)</label>
                <input type="number" min={0} step={0.5} value={form.affiliateLevel3Rate} onChange={(e) => setForm((f) => ({ ...f, affiliateLevel3Rate: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white" placeholder="e.g. 0.5" />
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-4 mt-4">
          <h3 className="font-heading font-medium text-white mb-2">Incentive / target (for dashboard)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Monthly target (deals)</label>
              <input type="number" min={0} value={form.monthlyTargetDeals} onChange={(e) => setForm((f) => ({ ...f, monthlyTargetDeals: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white" placeholder="e.g. 10" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Commission rate (%)</label>
              <input type="number" min={0} max={100} step={0.5} value={form.commissionRate} onChange={(e) => setForm((f) => ({ ...f, commissionRate: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white" placeholder="e.g. 2" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Currency</label>
              <input value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white" placeholder="KES" />
            </div>
          </div>
        </div>
        <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-lg bg-accent-blue text-white font-medium hover:bg-accent-blue/90 disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
