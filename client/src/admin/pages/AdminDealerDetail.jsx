import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { admin } from "../../api/admin.js";

export default function AdminDealerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingWebsite, setSavingWebsite] = useState(false);
  const [savingCredits, setSavingCredits] = useState(false);

  useEffect(() => {
    if (!id) return;
    admin.dealer(id).then((r) => {
      setData(r);
      setNotes(r.dealer?.notes ?? "");
    }).catch(() => setData(null)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-slate-400">Loading...</div>;
  if (!data?.dealer) return <div className="text-red-400">Dealer not found</div>;

  const d = data.dealer;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white">Back</button>
        <h2 className="text-xl font-semibold text-white">{d.name} - {d.dealershipName}</h2>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-center"><p className="text-slate-400 text-sm">Leads</p><p className="text-2xl font-semibold text-white">{d.leadCount ?? 0}</p></div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-center"><p className="text-slate-400 text-sm">Cars</p><p className="text-2xl font-semibold text-white">{d.carCount ?? 0}</p></div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-center"><p className="text-slate-400 text-sm">Test Drives</p><p className="text-2xl font-semibold text-white">{d.testDriveCount ?? 0}</p></div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-center"><p className="text-slate-400 text-sm">Closed</p><p className="text-2xl font-semibold text-white">{d.closedDeals ?? 0}</p></div>
      </div>
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        {["overview", "website", "credits", "subscription", "cars", "activity"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={"px-4 py-2 rounded-t text-sm " + (tab === t ? "bg-slate-700 text-white" : "text-slate-400")}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>
      {tab === "overview" && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-slate-400">Email: {d.email}</p>
          <p className="text-slate-400">Phone: {d.phone || "-"}</p>
          <p className="text-slate-400">
            Website:{" "}
            {d.websiteActive ? (
              <Link
                to={d.websiteSlug ? `/s/${d.websiteSlug}` : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 underline"
              >
                Live site{d.websiteExpiresAt ? ` (expires ${new Date(d.websiteExpiresAt).toLocaleDateString()})` : ""}
              </Link>
            ) : (
              <span className="text-slate-500">Off</span>
            )}
          </p>
          <label className="block text-slate-400 mt-4">Admin notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => { setSavingNotes(true); admin.updateDealer(id, { notes }).finally(() => setSavingNotes(false)); }} className="w-full rounded border border-slate-600 bg-slate-700 p-2 text-white h-24" />
        </div>
      )}
      {tab === "website" && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-1">Hosted website</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-slate-400 mb-1">Website active</label>
              <label className="inline-flex items-center gap-2 text-slate-200">
                <input
                  type="checkbox"
                  checked={d.websiteActive}
                  onChange={async (e) => {
                    setSavingWebsite(true);
                    try {
                      const updated = await admin.updateDealer(id, { websiteActive: e.target.checked });
                      setData((prev) => prev ? { ...prev, dealer: { ...prev.dealer, ...updated } } : prev);
                    } finally {
                      setSavingWebsite(false);
                    }
                  }}
                />
                <span>{d.websiteActive ? "On" : "Off"}</span>
              </label>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Slug</label>
              <input
                type="text"
                defaultValue={d.websiteSlug || ""}
                onBlur={async (e) => {
                  const value = e.target.value.trim() || null;
                  setSavingWebsite(true);
                  try {
                    const updated = await admin.updateDealer(id, { websiteSlug: value });
                    setData((prev) => prev ? { ...prev, dealer: { ...prev.dealer, ...updated } } : prev);
                  } finally {
                    setSavingWebsite(false);
                  }
                }}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                Public URL: {d.websiteSlug ? `https://${d.websiteSlug}.motoriq.co.ke` : "—"}
              </p>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Custom domain</label>
              <input
                type="text"
                defaultValue={d.customDomain || ""}
                onBlur={async (e) => {
                  const value = e.target.value.trim() || null;
                  setSavingWebsite(true);
                  try {
                    const updated = await admin.updateDealer(id, { customDomain: value });
                    setData((prev) => prev ? { ...prev, dealer: { ...prev.dealer, ...updated } } : prev);
                  } finally {
                    setSavingWebsite(false);
                  }
                }}
                placeholder="cars.yourdealer.co.ke"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Website expiry</label>
              <input
                type="date"
                defaultValue={d.websiteExpiresAt ? new Date(d.websiteExpiresAt).toISOString().slice(0, 10) : ""}
                onBlur={async (e) => {
                  const value = e.target.value;
                  setSavingWebsite(true);
                  try {
                    const updated = await admin.updateDealer(id, { websiteExpiresAt: value || null });
                    setData((prev) => prev ? { ...prev, dealer: { ...prev.dealer, ...updated } } : prev);
                  } finally {
                    setSavingWebsite(false);
                  }
                }}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Primary color (hex)</label>
              <input
                type="text"
                defaultValue={d.primaryColor || ""}
                onBlur={async (e) => {
                  setSavingWebsite(true);
                  try {
                    const updated = await admin.updateDealer(id, { primaryColor: e.target.value || null });
                    setData((prev) => prev ? { ...prev, dealer: { ...prev.dealer, ...updated } } : prev);
                  } finally {
                    setSavingWebsite(false);
                  }
                }}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Tagline</label>
              <input
                type="text"
                defaultValue={d.tagline || ""}
                onBlur={async (e) => {
                  setSavingWebsite(true);
                  try {
                    const updated = await admin.updateDealer(id, { tagline: e.target.value || null });
                    setData((prev) => prev ? { ...prev, dealer: { ...prev.dealer, ...updated } } : prev);
                  } finally {
                    setSavingWebsite(false);
                  }
                }}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1">Hero image URL</label>
              <input
                type="text"
                defaultValue={d.heroImage || ""}
                onBlur={async (e) => {
                  setSavingWebsite(true);
                  try {
                    const updated = await admin.updateDealer(id, { heroImage: e.target.value || null });
                    setData((prev) => prev ? { ...prev, dealer: { ...prev.dealer, ...updated } } : prev);
                  } finally {
                    setSavingWebsite(false);
                  }
                }}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1">About text</label>
              <textarea
                defaultValue={d.aboutText || ""}
                onBlur={async (e) => {
                  setSavingWebsite(true);
                  try {
                    const updated = await admin.updateDealer(id, { aboutText: e.target.value || null });
                    setData((prev) => prev ? { ...prev, dealer: { ...prev.dealer, ...updated } } : prev);
                  } finally {
                    setSavingWebsite(false);
                  }
                }}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 text-sm h-24"
              />
            </div>
          </div>
          {savingWebsite && <p className="text-xs text-slate-500 mt-2">Saving website settings…</p>}
        </div>
      )}
      {tab === "credits" && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-4 text-sm">
          <h3 className="text-sm font-semibold text-slate-200 mb-1">Credits & targets</h3>
          <form
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const credits = Number(form.credits.value || 0);
              const totalCreditsUsed = Number(form.totalCreditsUsed.value || 0);
              const monthlyTargetDeals = form.monthlyTargetDeals.value || null;
              const commissionRate = form.commissionRate.value || null;
              const currency = form.currency.value || "KES";
              setSavingCredits(true);
              try {
                const updated = await admin.updateDealer(id, {
                  credits,
                  totalCreditsUsed,
                  monthlyTargetDeals,
                  commissionRate,
                  currency,
                });
                setData((prev) => prev ? { ...prev, dealer: { ...prev.dealer, ...updated } } : prev);
              } finally {
                setSavingCredits(false);
              }
            }}
          >
            <div>
              <label className="block text-slate-400 mb-1">Current credits</label>
              <input
                name="credits"
                type="number"
                defaultValue={d.credits ?? 0}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Total credits used</label>
              <input
                name="totalCreditsUsed"
                type="number"
                defaultValue={d.totalCreditsUsed ?? 0}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Monthly target (deals)</label>
              <input
                name="monthlyTargetDeals"
                type="number"
                defaultValue={d.monthlyTargetDeals ?? ""}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Commission rate (%)</label>
              <input
                name="commissionRate"
                type="number"
                step="0.1"
                defaultValue={d.commissionRate != null ? Number(d.commissionRate) : ""}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Currency</label>
              <input
                name="currency"
                type="text"
                defaultValue={d.currency || "KES"}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 text-sm"
              />
            </div>
            <div className="md:col-span-3 flex justify-end items-end">
              <button
                type="submit"
                disabled={savingCredits}
                className="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm hover:bg-slate-600 disabled:opacity-50"
              >
                {savingCredits ? "Saving…" : "Save credits & targets"}
              </button>
            </div>
          </form>
        </div>
      )}
      {tab === "subscription" && data.dealer?.subscription && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-slate-400">Plan: {data.dealer.subscription.plan} | Status: {data.dealer.subscription.status} | Amount: {data.dealer.subscription.amount} KES</p>
        </div>
      )}
      {tab === "cars" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(data.cars || []).map((c) => (
            <div key={c.id} className="rounded-lg border border-slate-700 p-2"><p className="text-white">{c.make} {c.model} {c.year}</p><p className="text-slate-400">KES {Number(c.price).toLocaleString()}</p></div>
          ))}
          {(!data.cars || data.cars.length === 0) && <p className="text-slate-500 col-span-full">No cars</p>}
        </div>
      )}
      {tab === "activity" && (
        <ul className="space-y-2">{(data.activityLogs || []).map((log) => (<li key={log.id} className="text-sm text-slate-400">{new Date(log.createdAt).toLocaleString()} - {log.action} - {log.detail || ""}</li>))}</ul>
      )}
    </div>
  );
}
