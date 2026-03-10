import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { admin } from "../../api/admin.js";

const planColors = { TRIAL: "bg-slate-500", BASIC: "bg-blue-600", PRO: "bg-orange-600", ENTERPRISE: "bg-purple-600" };
const statusColors = { ACTIVE: "bg-green-600", SUSPENDED: "bg-red-600", EXPIRED: "bg-yellow-600", CANCELLED: "bg-slate-500" };

function initials(name) {
  return (name || "").split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

export default function AdminDealers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ dealers: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const status = searchParams.get("status") || "all";
  const plan = searchParams.get("plan") || "";
  const page = parseInt(searchParams.get("page"), 10) || 1;
  const limit = 20;

  const [creating, setCreating] = useState(false);
  const [creatingDealer, setCreatingDealer] = useState(false);
  const [form, setForm] = useState({
    dealerName: "",
    dealershipName: "",
    email: "",
    phone: "",
    dealershipSlug: "",
    plan: "BASIC",
    credits: "",
    domain: "",
    subdomain: "",
  });
  const [tempPassword, setTempPassword] = useState(null);

  useEffect(() => {
    const params = { page, limit };
    if (search) params.search = search;
    if (status !== "all") params.status = status;
    if (plan) params.plan = plan;
    setSearchParams(params, { replace: true });
    admin
      .dealers(params)
      .then(setData)
      .catch(() => setData({ dealers: [], total: 0 }))
      .finally(() => setLoading(false));
  }, [page, search, status, plan]);

  const totalPages = Math.ceil((data.total || 0) / limit) || 1;

  const handleFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  async function handleCreateDealer(e) {
    e.preventDefault();
    if (!form.email || (!form.dealerName && !form.dealershipName)) return;
    setCreatingDealer(true);
    setTempPassword(null);
    try {
      const payload = {
        dealerName: form.dealerName || undefined,
        dealershipName: form.dealershipName || undefined,
        email: form.email,
        phone: form.phone || undefined,
        dealershipSlug: form.dealershipSlug || undefined,
        plan: form.plan || undefined,
        credits: form.credits ? Number(form.credits) : undefined,
        domain: form.domain || undefined,
        subdomain: form.subdomain || undefined,
      };
      const res = await admin.createDealer(payload);
      setTempPassword(res.tempPassword || null);
      // Optimistically prepend dealer to list
      setData((prev) => ({
        dealers: [res.dealer, ...(prev.dealers || [])],
        total: (prev.total || 0) + 1,
      }));
      setForm({
        dealerName: "",
        dealershipName: "",
        email: "",
        phone: "",
        dealershipSlug: "",
        plan: "BASIC",
        credits: "",
        domain: "",
        subdomain: "",
      });
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(err.message || "Failed to create dealer");
    } finally {
      setCreatingDealer(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-white">Dealers</h2>
        <button
          type="button"
          onClick={() => {
            setCreating((prev) => !prev);
            setTempPassword(null);
          }}
          className="px-3 py-2 rounded-lg bg-slate-700 text-sm text-white hover:bg-slate-600"
        >
          {creating ? "Close create form" : "Create dealer"}
        </button>
      </div>

      {creating && (
        <form
          onSubmit={handleCreateDealer}
          className="rounded-xl border border-slate-700 bg-slate-800/70 p-4 space-y-3 text-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Dealer contact name</label>
              <input
                type="text"
                value={form.dealerName}
                onChange={(e) => handleFormChange("dealerName", e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Dealership name</label>
              <input
                type="text"
                value={form.dealershipName}
                onChange={(e) => handleFormChange("dealershipName", e.target.value)}
                required={!form.dealerName}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleFormChange("email", e.target.value)}
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleFormChange("phone", e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Subdomain (slug)</label>
              <input
                type="text"
                placeholder="e.g. westlands-cars"
                value={form.dealershipSlug}
                onChange={(e) => handleFormChange("dealershipSlug", e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
              />
              <p className="text-xs text-slate-500 mt-1">Used for `https://slug.motoriq.co.ke`</p>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Custom domain</label>
              <input
                type="text"
                placeholder="cars.yourdealer.co.ke"
                value={form.domain}
                onChange={(e) => handleFormChange("domain", e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Plan</label>
              <select
                value={form.plan}
                onChange={(e) => handleFormChange("plan", e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
              >
                <option value="BASIC">Starter</option>
                <option value="PRO">Professional</option>
                <option value="ENTERPRISE">Enterprise</option>
                <option value="TRIAL">Trial</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Initial credits</label>
              <input
                type="number"
                min="0"
                value={form.credits}
                onChange={(e) => handleFormChange("credits", e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-500">
              The dealer will receive an email with their login URL, email, and temporary password.
            </div>
            <button
              type="submit"
              disabled={creatingDealer}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-500 disabled:opacity-60"
            >
              {creatingDealer ? "Creating…" : "Create dealer"}
            </button>
          </div>
          {tempPassword && (
            <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-emerald-500/60 text-xs text-emerald-300">
              Temp password:{" "}
              <code className="font-mono">{tempPassword}</code>{" "}
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(tempPassword)}
                className="ml-2 underline"
              >
                Copy
              </button>
            </div>
          )}
        </form>
      )}

      <div className="flex flex-wrap gap-4">
        <input
          type="search"
          placeholder="Search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSearchParams({ ...Object.fromEntries(searchParams), search: e.target.value, page: 1 }, { replace: true }); }}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white w-64 text-sm"
        />
        {["all", "active", "inactive", "suspended", "expired"].map((s) => (
          <button
            key={s}
            onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), status: s, page: 1 }, { replace: true })}
            className={"px-3 py-1.5 rounded-lg text-sm " + (status === s ? "bg-slate-600 text-white" : "text-slate-400 hover:bg-slate-700")}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <select
          value={plan}
          onChange={(e) => setSearchParams({ ...Object.fromEntries(searchParams), plan: e.target.value, page: 1 }, { replace: true })}
          className="rounded-lg border border-slate-600 bg-slate-800 text-white px-3 py-2 text-sm"
        >
          <option value="">All plans</option>
          <option value="TRIAL">Trial</option>
          <option value="BASIC">Basic</option>
          <option value="PRO">Pro</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>
      </div>
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
        {loading ? (
          <div className="p-8 text-slate-400 text-center">Loading...</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-700">
                  <th className="p-3">Dealer</th>
                  <th className="p-3">Dealership</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Website</th>
                  <th className="p-3">Leads</th>
                  <th className="p-3">Cars</th>
                  <th className="p-3">Joined</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data.dealers || []).map((d) => (
                  <tr key={d.id} className="border-b border-slate-700/50">
                    <td className="p-3">
                      <Link to={"/admin/dealers/" + d.id} className="flex items-center gap-2 text-white hover:underline">
                        <span className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs">{initials(d.name || d.dealershipName)}</span>
                        {d.name} <span className="text-slate-500 text-xs">{d.email}</span>
                      </Link>
                    </td>
                    <td className="p-3 text-slate-300">{d.dealershipName || "-"}</td>
                    <td className="p-3"><span className={"px-2 py-0.5 rounded text-xs " + (planColors[d.subscription?.plan] || "bg-slate-600")}>{d.subscription?.plan || "-"}</span></td>
                    <td className="p-3"><span className={"px-2 py-0.5 rounded text-xs " + (statusColors[d.subscription?.status] || "bg-slate-600")}>{d.isActive === false ? "Inactive" : (d.subscription?.status || "-")}</span></td>
                    <td className="p-3 text-slate-300">
                      {d.websiteActive ? (
                        <a
                          href={`/s/${d.websiteSlug || ""}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-400 hover:underline"
                        >
                          Live{d.websiteExpiresAt ? ` · exp ${new Date(d.websiteExpiresAt).toLocaleDateString()}` : ""}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">Off</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-300">{d.leadCount ?? 0}</td>
                    <td className="p-3 text-slate-300">{d.carCount ?? 0}</td>
                    <td className="p-3 text-slate-500">{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "-"}</td>
                    <td className="p-3"><Link to={"/admin/dealers/" + d.id} className="text-red-400 hover:text-red-300 text-xs">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between px-4 py-3 border-t border-slate-700">
              <p className="text-slate-500 text-sm">{data.total} dealers</p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: page - 1 }, { replace: true })} className="px-3 py-1 rounded bg-slate-700 text-sm disabled:opacity-50">Previous</button>
                <span className="px-3 py-1 text-slate-400 text-sm">Page {page} of {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: page + 1 }, { replace: true })} className="px-3 py-1 rounded bg-slate-700 text-sm disabled:opacity-50">Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
