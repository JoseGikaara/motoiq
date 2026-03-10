import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { publicAffiliate } from "../api";
import toast from "react-hot-toast";
import { Copy, MessageCircle, Share2, Wallet, Trophy, Target, Link2, Download } from "lucide-react";

export default function AffiliatePanel() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [linkForm, setLinkForm] = useState({ carId: "", utmSource: "", utmMedium: "", utmCampaign: "" });
  const [creatingLink, setCreatingLink] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await publicAffiliate.get(code);
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) toast.error(e.message || "Affiliate not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-sm text-slate-400">Loading your affiliate stats…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-sm text-red-400">Affiliate not found or inactive.</div>
      </div>
    );
  }

  const { affiliate, dealer, stats, cars, payouts = [], badges = [], challenges = [], links = [], materials = [] } = data;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const baseUrl = dealer?.websiteSlug
    ? `${origin}/s/${dealer.websiteSlug}?ref=${encodeURIComponent(affiliate.referralCode)}`
    : `${origin}/?ref=${encodeURIComponent(affiliate.referralCode)}`;
  const balance = affiliate.balance ?? Math.max(0, (affiliate.totalEarned ?? 0) - (affiliate.totalPaid ?? 0));
  const minPayout = affiliate.minimumPayout ?? 1000;
  const canRequestPayout = balance >= minPayout;

  const shareText = `Check out cars from ${dealer?.dealershipName ?? "us"}: ${baseUrl}`;

  async function handleCreateLink() {
    setCreatingLink(true);
    try {
      const body = {};
      if (linkForm.carId) body.carId = linkForm.carId;
      if (linkForm.utmSource) body.utmSource = linkForm.utmSource;
      if (linkForm.utmMedium) body.utmMedium = linkForm.utmMedium;
      if (linkForm.utmCampaign) body.utmCampaign = linkForm.utmCampaign;
      const created = await publicAffiliate.createLink(code, body);
      toast.success("Link created! Short URL: " + created.shortUrl);
      navigator.clipboard.writeText(created.shortUrl);
      setLinkForm({ carId: "", utmSource: "", utmMedium: "", utmCampaign: "" });
      const res = await publicAffiliate.get(code);
      setData(res);
    } catch (e) {
      toast.error(e.message || "Failed to create link");
    } finally {
      setCreatingLink(false);
    }
  }

  async function handleRequestPayout() {
    const amount = Number(payoutAmount) || balance;
    if (amount < minPayout || amount > balance) {
      toast.error(`Amount must be between KES ${minPayout.toLocaleString()} and KES ${balance.toLocaleString()}`);
      return;
    }
    setRequestingPayout(true);
    try {
      await publicAffiliate.requestPayout(code, amount);
      toast.success("Payout request submitted. The dealer will process it shortly.");
      setPayoutAmount("");
      const res = await publicAffiliate.get(code);
      setData(res);
    } catch (e) {
      toast.error(e.message || "Request failed");
    } finally {
      setRequestingPayout(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 py-3 px-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-[0.2em]">MotorIQ Affiliate</p>
          <h1 className="text-lg font-semibold">
            {affiliate.name} – {dealer?.dealershipName ?? "Dealer"}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {affiliate.tier && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-300 capitalize">
              {affiliate.tier}
            </span>
          )}
          <div className="text-xs text-slate-500 text-right">
            Referral code
            <div className="font-mono text-sm text-slate-100">{affiliate.referralCode}</div>
          </div>
          {affiliate.uniqueQrCode && (
            <div className="bg-white p-1.5 rounded-lg">
              <img src={affiliate.uniqueQrCode} alt="QR Code" className="w-12 h-12" />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
          <p className="text-xs text-slate-400 mb-1">Your tracking link</p>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <div className="flex-1 px-3 py-2 rounded-lg bg-black/60 border border-slate-700 text-xs font-mono truncate">
              {baseUrl}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(baseUrl);
                  toast.success("Link copied");
                }}
                className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs"
              >
                <Copy className="w-3 h-3" />
                Copy
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs text-white"
              >
                <MessageCircle className="w-3 h-3" />
                WhatsApp
              </a>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Share this link on WhatsApp, SMS, Facebook, or Instagram. Any leads and sales from this link are credited to
            you.
          </p>
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Metric label="Leads" value={stats.leads} />
          <Metric label="Test drives" value={stats.testDrives} />
          <Metric label="Closed deals" value={stats.closedDeals} />
          <Metric
            label="Estimated earnings"
            value={`KES ${Number(stats.estimatedCommission || 0).toLocaleString()}`}
          />
        </section>

        {/* Balance & Payout request */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Payouts
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div>
              <p className="text-[11px] text-slate-500 mb-1">Available balance</p>
              <p className="text-2xl font-bold text-emerald-400">
                KES {Number(balance).toLocaleString()}
              </p>
            </div>
            {canRequestPayout && (
              <div className="flex gap-2 items-end">
                <input
                  type="number"
                  min={minPayout}
                  max={balance}
                  step={100}
                  placeholder={`Min ${minPayout.toLocaleString()}`}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white w-32"
                />
                <button
                  type="button"
                  onClick={handleRequestPayout}
                  disabled={requestingPayout}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium disabled:opacity-50"
                >
                  {requestingPayout ? "Submitting…" : "Request payout"}
                </button>
              </div>
            )}
          </div>
          {payouts.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-700">
              <p className="text-[11px] text-slate-500 mb-2">Recent payouts</p>
              <ul className="space-y-1 text-xs">
                {payouts.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex justify-between">
                    <span>KES {Number(p.amount).toLocaleString()} · {p.status}</span>
                    <span className="text-slate-500">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "Pending"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {badges.length > 0 && (
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Achievements
            </h2>
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-900/30 text-amber-200 text-xs"
                  title={b.description}
                >
                  {b.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {challenges.length > 0 && (
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Active challenges
            </h2>
            <ul className="space-y-2 text-sm">
              {challenges.map((c) => (
                <li key={c.id} className="flex justify-between items-center">
                  <span className="text-slate-200">{c.name}</span>
                  <span className="text-slate-400">
                    {c.progress.currentValue} / {c.targetValue}
                    {c.progress.completedAt ? " ✓" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Smart link builder
          </h2>
          <div className="flex flex-wrap gap-2 mb-2">
            <input
              type="text"
              placeholder="Car ID (optional)"
              value={linkForm.carId}
              onChange={(e) => setLinkForm((f) => ({ ...f, carId: e.target.value }))}
              className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-white w-32"
            />
            <input
              type="text"
              placeholder="UTM source"
              value={linkForm.utmSource}
              onChange={(e) => setLinkForm((f) => ({ ...f, utmSource: e.target.value }))}
              className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-white w-24"
            />
            <input
              type="text"
              placeholder="UTM medium"
              value={linkForm.utmMedium}
              onChange={(e) => setLinkForm((f) => ({ ...f, utmMedium: e.target.value }))}
              className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-white w-24"
            />
            <input
              type="text"
              placeholder="UTM campaign"
              value={linkForm.utmCampaign}
              onChange={(e) => setLinkForm((f) => ({ ...f, utmCampaign: e.target.value }))}
              className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-white w-24"
            />
            <button
              type="button"
              onClick={handleCreateLink}
              disabled={creatingLink}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-medium disabled:opacity-50"
            >
              {creatingLink ? "Creating…" : "Create short link"}
            </button>
          </div>
          {links.length > 0 && (
            <div className="mt-2 space-y-1 text-xs">
              {links.map((l) => (
                <div key={l.id} className="flex justify-between items-center gap-2">
                  <a href={l.shortUrl} target="_blank" rel="noreferrer" className="text-slate-400 truncate hover:text-slate-200">
                    {l.shortUrl}
                  </a>
                  <span className="text-slate-500 shrink-0">Clicks: {l.clicks}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {materials.length > 0 && (
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Marketing materials
            </h2>
            <ul className="space-y-2 text-sm">
              {materials.map((m) => (
                <li key={m.id}>
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent-blue hover:underline"
                  >
                    {m.name}
                  </a>
                  {m.type && <span className="text-slate-500 text-xs ml-2">({m.type})</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-100">Cars you can promote</h2>
            <span className="text-[11px] text-slate-500">
              {cars.length} car{cars.length === 1 ? "" : "s"}
            </span>
          </div>
          {cars.length === 0 ? (
            <p className="text-xs text-slate-500">
              The dealer has not added any cars yet. Check back soon for inventory you can promote.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cars.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden flex flex-col"
                >
                  <div className="aspect-[16/9] bg-black/60">
                    {c.photos?.length ? (
                      <img
                        src={c.photos[0]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-2xl">
                        {c.make?.[0] ?? "C"}
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-1 text-xs">
                    <p className="text-slate-100 font-medium">
                      {c.year} {c.make} {c.model}
                    </p>
                    <p className="text-emerald-300 font-semibold">
                      KES {Number(c.price || 0).toLocaleString()}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const url =
                          typeof window !== "undefined" && dealer.websiteSlug
                            ? `${window.location.origin}/s/${dealer.websiteSlug}/car/${c.id}?ref=${encodeURIComponent(
                                affiliate.referralCode
                              )}`
                            : baseUrl;
                        navigator.clipboard.writeText(url);
                        toast.success("Car link copied");
                      }}
                      className="mt-1 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px]"
                    >
                      <Share2 className="w-3 h-3" />
                      Copy car link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
      <p className="text-[11px] text-slate-400 mb-1">{label}</p>
      <p className="text-lg font-semibold text-slate-50">{value}</p>
    </div>
  );
}

