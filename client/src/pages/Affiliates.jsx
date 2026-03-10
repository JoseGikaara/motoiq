import { useEffect, useMemo, useState } from "react";
import { affiliates } from "../api";
import toast from "react-hot-toast";
import { Copy, Link as LinkIcon, UserPlus, Wallet, Trophy, BookOpen, CreditCard, Target, FileText, Users } from "lucide-react";

export default function Affiliates() {
  const [summary, setSummary] = useState(null);
  const [list, setList] = useState([]);
  const [leaderboard, setLeaderboard] = useState({ leaderboard: [] });
  const [commissionRules, setCommissionRules] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [invite, setInvite] = useState({ name: "", phone: "", email: "", payoutRate: "" });
  const [challengeForm, setChallengeForm] = useState({ name: "", targetType: "LEADS", targetValue: "5", rewardDescription: "", endDate: "" });
  const [creatingChallenge, setCreatingChallenge] = useState(false);
  const [materialForm, setMaterialForm] = useState({ name: "", type: "other", url: "" });
  const [creatingMaterial, setCreatingMaterial] = useState(false);
  const [bulkRows, setBulkRows] = useState([{ name: "", phone: "", email: "", payoutRate: "" }]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const emptySummary = {
    totalAffiliates: 0,
    referredLeads: 0,
    referredClosed: 0,
    totalEstimatedCommission: 0,
    topPerformers: [],
  };

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const [s, l, lb, cr, ch, mat, pay] = await Promise.all([
        affiliates.summary().catch((e) => {
          console.warn("Affiliates summary failed:", e?.message);
          return emptySummary;
        }),
        affiliates.list().catch((e) => {
          console.warn("Affiliates list failed:", e?.message);
          return { affiliates: [] };
        }),
        affiliates.leaderboard("month").catch(() => ({ leaderboard: [] })),
        affiliates.commissionRules().then((r) => r.rules || []).catch(() => []),
        affiliates.challenges().then((r) => r.challenges || []).catch(() => []),
        affiliates.materials().then((r) => r.materials || []).catch(() => []),
        affiliates.payouts("PENDING").then((r) => r.payouts || []).catch(() => []),
      ]);
      setSummary(s && typeof s === "object" ? s : emptySummary);
      setList(Array.isArray(l?.affiliates) ? l.affiliates : []);
      setLeaderboard(lb && typeof lb === "object" ? lb : { leaderboard: [] });
      setCommissionRules(Array.isArray(cr) ? cr : []);
      setChallenges(Array.isArray(ch) ? ch : []);
      setMaterials(Array.isArray(mat) ? mat : []);
      setPayouts(Array.isArray(pay) ? pay : []);
    } catch (e) {
      const msg = e?.message || "Failed to load affiliates";
      setLoadError(msg);
      toast.error(msg);
      setSummary(emptySummary);
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const totalEarned = useMemo(
    () => (summary?.totalEstimatedCommission ?? 0),
    [summary]
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!invite.name || !invite.phone) return;
    setCreating(true);
    try {
      await affiliates.create({
        name: invite.name,
        phone: invite.phone,
        email: invite.email || undefined,
        payoutRate: invite.payoutRate ? Number(invite.payoutRate) / 100 : undefined,
      });
      toast.success("Affiliate created and ready to share");
      setInvite({ name: "", phone: "", email: "", payoutRate: "" });
      await load();
    } catch (e) {
      toast.error(e.message || "Failed to create affiliate");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    if (!challengeForm.name || !challengeForm.targetValue) return;
    setCreatingChallenge(true);
    try {
      await affiliates.createChallenge({
        name: challengeForm.name,
        targetType: challengeForm.targetType,
        targetValue: Number(challengeForm.targetValue),
        rewardDescription: challengeForm.rewardDescription || undefined,
        endDate: challengeForm.endDate || undefined,
      });
      toast.success("Challenge created");
      setChallengeForm({
        name: "",
        targetType: "LEADS",
        targetValue: "5",
        rewardDescription: "",
        endDate: "",
      });
      await load();
    } catch (e) {
      toast.error(e.message || "Failed to create challenge");
    } finally {
      setCreatingChallenge(false);
    }
  };

  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    if (!materialForm.name || !materialForm.type || !materialForm.url) return;
    setCreatingMaterial(true);
    try {
      await affiliates.createMaterial({
        name: materialForm.name,
        type: materialForm.type,
        url: materialForm.url,
      });
      toast.success("Material added");
      setMaterialForm({ name: "", type: "other", url: "" });
      await load();
    } catch (e) {
      toast.error(e.message || "Failed to add material");
    } finally {
      setCreatingMaterial(false);
    }
  };

  const handleBulkInvite = async (e) => {
    e.preventDefault();
    const rows = bulkRows.filter((r) => r.name?.trim() && r.phone?.trim());
    if (rows.length === 0) {
      toast.error("Add at least one affiliate with name and phone");
      return;
    }
    setBulkSubmitting(true);
    try {
      const res = await affiliates.bulkInvite(rows);
      const createdCount = res?.created?.length ?? 0;
      const errorCount = res?.errors?.length ?? 0;
      if (createdCount) {
        toast.success(`Invited ${createdCount} affiliate${createdCount > 1 ? "s" : ""}`);
      }
      if (errorCount) {
        console.warn("Bulk invite errors:", res.errors);
        toast.error(`${errorCount} row(s) failed. Check console for details.`);
      }
      setBulkRows([{ name: "", phone: "", email: "", payoutRate: "" }]);
      await load();
    } catch (e) {
      toast.error(e.message || "Failed to send invites");
    } finally {
      setBulkSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-white">Affiliates & Referrers</h1>
          <p className="text-gray-400 mt-0.5 text-sm">
            Recruit marketers and track the leads, test drives, and deals they generate.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-navy-card rounded-xl animate-pulse" />
          ))}
        </div>
      ) : loadError ? (
        <div className="bg-navy-card rounded-xl border border-white/10 p-6 text-center">
          <p className="text-slate-300 mb-3">{loadError}</p>
          <button type="button" onClick={() => load()} className="px-4 py-2 rounded-lg bg-accent-blue text-white font-medium hover:opacity-90">
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="Affiliates" value={summary?.totalAffiliates ?? 0} />
            <StatCard label="Referred leads" value={summary?.referredLeads ?? 0} />
            <StatCard label="Referred closed deals" value={summary?.referredClosed ?? 0} />
            <StatCard
              label="Estimated commission"
              value={`KES ${Number(totalEarned || 0).toLocaleString()}`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)] gap-6">
            <div className="bg-navy-card rounded-xl border border-white/10 p-5 shadow-card">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="font-heading font-semibold text-white text-base">Affiliates</h2>
              </div>
              {(Array.isArray(list) ? list : []).length === 0 ? (
                <p className="text-sm text-gray-400">
                  No affiliates yet. Invite your first marketer to start tracking referred leads.
                </p>
              ) : (
                <div className="overflow-x-auto -mx-3">
                  <table className="min-w-full text-xs text-left">
                    <thead>
                      <tr className="text-slate-400 border-b border-white/10">
                        <th className="px-3 py-2 font-medium">Affiliate</th>
                        <th className="px-3 py-2 font-medium">Code</th>
                        <th className="px-3 py-2 font-medium">Leads</th>
                        <th className="px-3 py-2 font-medium">Est. commission</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Array.isArray(list) ? list : []).map((a) => {
                        const link =
                          typeof window !== "undefined"
                            ? `${window.location.origin}/?ref=${encodeURIComponent(a.referralCode)}`
                            : `?ref=${a.referralCode}`;
                        return (
                          <tr key={a.id} className="border-b border-white/5 last:border-0">
                            <td className="px-3 py-2">
                              <div className="flex flex-col">
                                <span className="text-slate-100 font-medium">{a.name}</span>
                                <span className="text-slate-500">
                                  {a.phone} {a.email ? `· ${a.email}` : ""}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-slate-300 font-mono">
                              {a.referralCode}
                            </td>
                            <td className="px-3 py-2 text-slate-200">{a.leads ?? 0}</td>
                            <td className="px-3 py-2 text-emerald-300">
                              KES {Number(a.estimatedCommission || 0).toLocaleString()}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={
                                  "inline-flex px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide " +
                                  (a.status === "ACTIVE"
                                    ? "bg-emerald-900/40 text-emerald-300"
                                    : "bg-slate-700 text-slate-300")
                                }
                              >
                                {a.status === "ACTIVE" ? "Active" : a.status === "PAUSED" ? "Paused" : a.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(link);
                                    toast.success("Link copied");
                                  }}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-100"
                                  title="Copy tracking link"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const balance = a.balance ?? Math.max(0, (a.estimatedCommission ?? 0) - (a.totalPaid ?? 0));
                                    const amount = prompt(
                                      "Amount to mark as paid (KES):",
                                      String(balance)
                                    );
                                    if (!amount) return;
                                    try {
                                      await affiliates.markPaid(a.id, Number(amount));
                                      toast.success("Payout recorded");
                                      await load();
                                    } catch (e) {
                                      toast.error(e.message || "Failed to mark paid");
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-emerald-800/40 hover:bg-emerald-700/60 text-emerald-200"
                                  title="Mark payout"
                                >
                                  <Wallet className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const nextStatus = a.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
                                    try {
                                      await affiliates.update(a.id, { status: nextStatus });
                                      await load();
                                    } catch (e) {
                                      toast.error(e.message || "Failed to update status");
                                    }
                                  }}
                                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-slate-100"
                                >
                                  {a.status === "active" ? "Pause" : "Activate"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-navy-card rounded-xl border border-white/10 p-5 shadow-card">
              <h2 className="font-heading font-semibold text-white text-base mb-2 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Invite affiliate
              </h2>
              <p className="text-xs text-gray-400 mb-3">
                Add a trusted marketer or broker and share their unique tracking link.
              </p>
              <form onSubmit={handleCreate} className="space-y-3 text-sm">
                <input
                  type="text"
                  placeholder="Full name *"
                  value={invite.name}
                  onChange={(e) => setInvite((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-white placeholder-gray-500"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone (WhatsApp) *"
                  value={invite.phone}
                  onChange={(e) => setInvite((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-white placeholder-gray-500"
                  required
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={invite.email}
                  onChange={(e) => setInvite((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-white placeholder-gray-500"
                />
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Payout rate (% of closed deal)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 3"
                    value={invite.payoutRate}
                    onChange={(e) => setInvite((f) => ({ ...f, payoutRate: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-white placeholder-gray-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-accent-blue text-white font-medium py-2 disabled:opacity-50"
                >
                  {creating ? "Creating…" : "Create & share link"}
                  <LinkIcon className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Leaderboard */}
          {(Array.isArray(leaderboard?.leaderboard) ? leaderboard.leaderboard : []).length > 0 && (
            <div className="bg-navy-card rounded-xl border border-white/10 p-5 shadow-card">
              <h2 className="font-heading font-semibold text-white text-base mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Top performers (this month)
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 border-b border-white/10">
                      <th className="px-3 py-2 font-medium">#</th>
                      <th className="px-3 py-2 font-medium">Affiliate</th>
                      <th className="px-3 py-2 font-medium">Tier</th>
                      <th className="px-3 py-2 font-medium text-right">Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(leaderboard?.leaderboard) ? leaderboard.leaderboard : []).slice(0, 10).map((a, i) => (
                      <tr key={a.id} className="border-b border-white/5">
                        <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                        <td className="px-3 py-2 text-slate-100">{a.name}</td>
                        <td className="px-3 py-2 text-slate-400 capitalize">{a.tier ?? "—"}</td>
                        <td className="px-3 py-2 text-emerald-300 text-right font-medium">
                          KES {Number(a.earned || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Commission rules */}
          <div className="bg-navy-card rounded-xl border border-white/10 p-5 shadow-card">
            <h2 className="font-heading font-semibold text-white text-base mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Commission rules
            </h2>
            {(Array.isArray(commissionRules) ? commissionRules : []).length === 0 ? (
              <p className="text-sm text-gray-400">
                No custom rules yet. Affiliates use their individual rate or your dealer default (Settings).
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {(Array.isArray(commissionRules) ? commissionRules : []).map((r) => (
                  <li key={r.id} className="flex justify-between items-center text-slate-200">
                    <span>{r.name}</span>
                    <span className="text-slate-500">
                      {r.commissionType} {r.rate != null ? `${Number(r.rate) * 100}%` : ""}
                      {r.fixedAmount != null ? ` KES ${Number(r.fixedAmount).toLocaleString()}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pending payouts */}
          {(Array.isArray(payouts) ? payouts : []).length > 0 && (
            <div className="bg-navy-card rounded-xl border border-white/10 p-5 shadow-card">
              <h2 className="font-heading font-semibold text-white text-base mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Pending payout requests
              </h2>
              <ul className="space-y-2 text-sm">
                {(Array.isArray(payouts) ? payouts : []).map((p) => (
                  <li key={p.id} className="flex justify-between items-center text-slate-200">
                    <span>{p.affiliate?.name} ({p.affiliate?.referralCode})</span>
                    <span className="text-emerald-300 font-medium">
                      KES {Number(p.amount).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500 mt-2">
                Process these in your bank/M-Pesa and use &quot;Mark payout&quot; on each affiliate.
              </p>
            </div>
          )}

          {/* Challenges */}
          <div className="bg-navy-card rounded-xl border border-white/10 p-5 shadow-card">
            <h2 className="font-heading font-semibold text-white text-base mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Challenges
            </h2>
            <form onSubmit={handleCreateChallenge} className="flex flex-wrap gap-2 mb-3">
              <input type="text" placeholder="Name" value={challengeForm.name} onChange={(e) => setChallengeForm((f) => ({ ...f, name: e.target.value }))} className="rounded-lg border border-white/10 bg-navy px-2 py-1.5 text-sm text-white w-32" required />
              <select value={challengeForm.targetType} onChange={(e) => setChallengeForm((f) => ({ ...f, targetType: e.target.value }))} className="rounded-lg border border-white/10 bg-navy px-2 py-1.5 text-sm text-white">
                <option value="LEADS">Leads</option>
                <option value="TEST_DRIVES">Test drives</option>
                <option value="CLOSED_DEALS">Closed deals</option>
                <option value="REVENUE">Revenue (KES)</option>
              </select>
              <input type="number" min={1} placeholder="Target" value={challengeForm.targetValue} onChange={(e) => setChallengeForm((f) => ({ ...f, targetValue: e.target.value }))} className="rounded-lg border border-white/10 bg-navy px-2 py-1.5 text-sm text-white w-20" required />
              <input type="text" placeholder="Reward" value={challengeForm.rewardDescription} onChange={(e) => setChallengeForm((f) => ({ ...f, rewardDescription: e.target.value }))} className="rounded-lg border border-white/10 bg-navy px-2 py-1.5 text-sm text-white w-40" />
              <input type="date" value={challengeForm.endDate} onChange={(e) => setChallengeForm((f) => ({ ...f, endDate: e.target.value }))} className="rounded-lg border border-white/10 bg-navy px-2 py-1.5 text-sm text-white" />
              <button type="submit" disabled={creatingChallenge} className="px-3 py-1.5 rounded-lg bg-accent-blue text-white text-sm disabled:opacity-50">Add</button>
            </form>
            {(Array.isArray(challenges) ? challenges : []).length === 0 ? <p className="text-sm text-gray-400">No challenges yet.</p> : (
              <ul className="space-y-1 text-sm text-slate-300">
                {(Array.isArray(challenges) ? challenges : []).map((c) => (
                  <li key={c.id}>{c.name} — {c.targetType} &ge; {c.targetValue}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Materials */}
          <div className="bg-navy-card rounded-xl border border-white/10 p-5 shadow-card">
            <h2 className="font-heading font-semibold text-white text-base mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Marketing materials
            </h2>
            <form onSubmit={handleCreateMaterial} className="flex flex-wrap gap-2 mb-3">
              <input type="text" placeholder="Name" value={materialForm.name} onChange={(e) => setMaterialForm((f) => ({ ...f, name: e.target.value }))} className="rounded-lg border border-white/10 bg-navy px-2 py-1.5 text-sm text-white w-32" required />
              <select value={materialForm.type} onChange={(e) => setMaterialForm((f) => ({ ...f, type: e.target.value }))} className="rounded-lg border border-white/10 bg-navy px-2 py-1.5 text-sm text-white">
                <option value="social_kit">Social kit</option>
                <option value="email_template">Email template</option>
                <option value="print">Print</option>
                <option value="video">Video</option>
                <option value="other">Other</option>
              </select>
              <input type="url" placeholder="URL" value={materialForm.url} onChange={(e) => setMaterialForm((f) => ({ ...f, url: e.target.value }))} className="rounded-lg border border-white/10 bg-navy px-2 py-1.5 text-sm text-white flex-1 min-w-[200px]" required />
              <button type="submit" disabled={creatingMaterial} className="px-3 py-1.5 rounded-lg bg-accent-blue text-white text-sm disabled:opacity-50">Add</button>
            </form>
            {(Array.isArray(materials) ? materials : []).length === 0 ? <p className="text-sm text-gray-400">No materials yet. Affiliates will see links here.</p> : (
              <ul className="space-y-1 text-sm text-slate-300">
                {(Array.isArray(materials) ? materials : []).map((m) => (
                  <li key={m.id} className="flex justify-between items-center">
                    <a href={m.url} target="_blank" rel="noreferrer" className="text-accent-blue hover:underline">{m.name}</a>
                    <button type="button" onClick={async () => { try { await affiliates.deleteMaterial(m.id); await load(); } catch (e) { toast.error(e.message); } }} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Bulk invite */}
          <div className="bg-navy-card rounded-xl border border-white/10 p-5 shadow-card">
            <h2 className="font-heading font-semibold text-white text-base mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Bulk invite
            </h2>
            <form onSubmit={handleBulkInvite} className="space-y-2">
              {bulkRows.map((row, i) => (
                <div key={i} className="flex flex-wrap gap-2 items-center">
                  <input type="text" placeholder="Name" value={row.name} onChange={(e) => setBulkRows((r) => r.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className="rounded-lg border border-white/10 bg-navy px-2 py-1.5 text-sm text-white w-28" />
                  <input type="tel" placeholder="Phone" value={row.phone} onChange={(e) => setBulkRows((r) => r.map((x, j) => j === i ? { ...x, phone: e.target.value } : x))} className="rounded-lg border border-white/10 bg-navy px-2 py-1.5 text-sm text-white w-28" />
                  <input type="email" placeholder="Email" value={row.email} onChange={(e) => setBulkRows((r) => r.map((x, j) => j === i ? { ...x, email: e.target.value } : x))} className="rounded-lg border border-white/10 bg-navy px-2 py-1.5 text-sm text-white w-36" />
                  <input type="number" placeholder="Rate %" value={row.payoutRate} onChange={(e) => setBulkRows((r) => r.map((x, j) => j === i ? { ...x, payoutRate: e.target.value } : x))} className="rounded-lg border border-white/10 bg-navy px-2 py-1.5 text-sm text-white w-16" />
                  {bulkRows.length > 1 && <button type="button" onClick={() => setBulkRows((r) => r.filter((_, j) => j !== i))} className="text-red-400 text-xs">Remove</button>}
                </div>
              ))}
              <div className="flex gap-2">
                <button type="button" onClick={() => setBulkRows((r) => [...r, { name: "", phone: "", email: "", payoutRate: "" }])} className="text-sm text-accent-blue hover:underline">+ Add row</button>
                <button type="submit" disabled={bulkSubmitting} className="px-3 py-1.5 rounded-lg bg-accent-blue text-white text-sm disabled:opacity-50">{bulkSubmitting ? "Inviting…" : "Invite all"}</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-navy-card rounded-xl border border-white/10 p-4 shadow-card">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-heading font-semibold text-white">{value}</p>
    </div>
  );
}

