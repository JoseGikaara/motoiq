import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Copy, MessageCircle } from "lucide-react";
import { publicAffiliate } from "../api";

export default function AffiliateDashboard() {
  const { code } = useParams();
  const [affiliateData, setAffiliateData] = useState(null);
  const [cars, setCars] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingPayout, setRequestingPayout] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [base, carsRes, refRes] = await Promise.all([
          publicAffiliate.get(code),
          publicAffiliate.cars(code).catch(() => ({ cars: [] })),
          publicAffiliate.referrals(code).catch(() => ({ referrals: [] })),
        ]);
        if (cancelled) return;
        setAffiliateData(base);
        setCars(Array.isArray(carsRes?.cars) ? carsRes.cars : base?.cars || []);
        setReferrals(Array.isArray(refRes?.referrals) ? refRes.referrals : []);
      } catch (e) {
        if (!cancelled) {
          toast.error(e.message || "Affiliate not found");
        }
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
        <div className="text-sm text-slate-400">Loading affiliate dashboard…</div>
      </div>
    );
  }

  if (!affiliateData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-sm text-red-400">Affiliate not found or inactive.</div>
      </div>
    );
  }

  const { affiliate, dealer, stats } = affiliateData;
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const baseReferralLink = `${origin.replace(/\/$/, "")}/?ref=${encodeURIComponent(
    affiliate.referralCode
  )}`;

  const shareText = `Check out these cars from ${dealer?.dealershipName ?? "this dealer"}:\n\n${baseReferralLink}`;

  const clicks = stats?.clicks ?? stats?.eventsCount ?? 0;
  const leads = stats?.leads ?? 0;
  const testDrives = stats?.testDrives ?? 0;
  const closedDeals = stats?.closedDeals ?? 0;
  const commission = Number(stats?.estimatedCommission || 0);

  const balance =
    affiliate.balance ??
    Math.max(
      0,
      Number(affiliate.totalEarned ?? 0) - Number(affiliate.totalPaid ?? 0)
    );
  const minPayout = affiliate.minimumPayout != null ? Number(affiliate.minimumPayout) : 1000;
  const canRequestPayout = balance >= minPayout;

  async function handleRequestPayout() {
    if (!canRequestPayout) {
      toast.error(
        `Minimum payout is KES ${minPayout.toLocaleString()}. Current balance: KES ${balance.toLocaleString()}`
      );
      return;
    }
    setRequestingPayout(true);
    try {
      await publicAffiliate.requestPayout(code, balance);
      toast.success("Payout request submitted. The dealer will process it shortly.");
    } catch (e) {
      toast.error(e.message || "Failed to request payout");
    } finally {
      setRequestingPayout(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-slate-800 px-4 py-4">
        <div className="max-w-4xl mx-auto space-y-1">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
            MotorIQ Affiliate
          </div>
          <h1 className="text-xl font-semibold leading-tight">
            {affiliate.name}
            {dealer?.dealershipName ? (
              <>
                <br />
                <span className="text-sm text-slate-400">
                  {dealer.dealershipName} Affiliate
                </span>
              </>
            ) : null}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Referral code:{" "}
            <span className="font-mono text-slate-100">{affiliate.referralCode}</span>
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5 space-y-6">
        {/* Stats overview */}
        <section className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Clicks" value={clicks} />
          <StatCard label="Leads" value={leads} />
          <StatCard label="Test drives" value={testDrives} />
          <StatCard label="Cars sold" value={closedDeals} />
          <StatCard
            label="Commission"
            value={`KES ${commission.toLocaleString()}`}
          />
        </section>

        {/* Referral link */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-100">Your main referral link</h2>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <div className="flex-1 px-3 py-2 rounded-lg bg-black/60 border border-slate-700 text-xs font-mono truncate">
              {baseReferralLink}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(baseReferralLink);
                  toast.success("Referral link copied");
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
            Share this link on WhatsApp, SMS, Facebook, or Instagram. Any leads and sales
            from this link are credited to you.
          </p>
        </section>

        {/* Cars to promote */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">Cars to promote</h2>
            <span className="text-[11px] text-slate-500">
              {cars.length} car{cars.length === 1 ? "" : "s"}
            </span>
          </div>
          {cars.length === 0 ? (
            <p className="text-xs text-slate-500">
              The dealer has not added any cars yet. Check back soon.
            </p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {cars.map((c) => {
                const carUrl = `${origin.replace(
                  /\/$/,
                  ""
                )}/car/${c.id}?ref=${encodeURIComponent(affiliate.referralCode)}`;
                const msg = `${c.year} ${c.make} ${c.model} – KES ${Number(
                  c.price || 0
                ).toLocaleString()}\n\nClean unit available.\n\nView details:\n${carUrl}`;
                return (
                  <div
                    key={c.id}
                    className="min-w-[220px] max-w-[260px] bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden flex flex-col"
                  >
                    <div className="aspect-[4/3] bg-black/40">
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
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(carUrl);
                            toast.success("Car link copied");
                          }}
                          className="flex-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px]"
                        >
                          Copy link
                        </button>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(msg)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 px-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[11px] text-white text-center"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Performance table */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">
            Latest referrals
          </h2>
          {referrals.length === 0 ? (
            <p className="text-xs text-slate-500">
              When buyers click your links and submit leads, they will appear here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700">
                    <th className="px-2 py-2 font-medium">Buyer</th>
                    <th className="px-2 py-2 font-medium">Car</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium text-right">Commission</th>
                    <th className="px-2 py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r) => (
                    <tr key={r.id} className="border-b border-slate-800 last:border-0">
                      <td className="px-2 py-1.5 text-slate-100">{r.buyerName}</td>
                      <td className="px-2 py-1.5 text-slate-300">{r.carLabel}</td>
                      <td className="px-2 py-1.5 text-slate-300">{r.status}</td>
                      <td className="px-2 py-1.5 text-right text-emerald-300">
                        KES {Number(r.commission || 0).toLocaleString()}
                      </td>
                      <td className="px-2 py-1.5 text-slate-500">
                        {r.date ? new Date(r.date).toLocaleDateString() : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Payout request */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Payouts</h2>
              <p className="text-[11px] text-slate-500">
                Balance: KES {Number(balance).toLocaleString()} · Minimum payout KES{" "}
                {minPayout.toLocaleString()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRequestPayout}
            disabled={!canRequestPayout || requestingPayout}
            className="w-full mt-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium disabled:opacity-50"
          >
            {requestingPayout ? "Submitting…" : "Request payout"}
          </button>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3">
      <p className="text-[11px] text-slate-400 mb-1">{label}</p>
      <p className="text-lg font-semibold text-slate-50">{value}</p>
    </div>
  );
}

