import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { downloadMonthlyReport, downloadAnalyticsCsv } from "../api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from "recharts";
import { leads as leadsApi } from "../api";

const PIE_COLORS = ["#2563EB", "#F97316", "#22c55e", "#eab308", "#a855f7", "#64748b"];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [affiliateOnly, setAffiliateOnly] = useState(false);
  const [reportMonth, setReportMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [reportLoading, setReportLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    leadsApi.analytics({ affiliateOnly }).then(setData).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, [affiliateOnly]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-navy-card rounded animate-pulse" />
        <div className="h-64 bg-navy-card rounded-xl animate-pulse" />
      </div>
    );
  }

  const byStatus = data?.byStatus ?? {};
  const pieData = Object.entries(byStatus).map(([name, value]) => ({ name: name.replace("_", " "), value }));

  const bySource = data?.bySource ?? {};
  const knownKeys = ["facebook", "instagram", "whatsapp", "direct", "affiliate"];
  const otherCount = Object.entries(bySource).reduce((s, [k, v]) => (knownKeys.includes(k) ? s : s + v), 0);
  const allSourceData = [
    { name: "Facebook", count: bySource.facebook ?? 0 },
    { name: "Instagram", count: bySource.instagram ?? 0 },
    { name: "WhatsApp", count: bySource.whatsapp ?? 0 },
    { name: "Affiliate", count: bySource.affiliate ?? 0 },
    { name: "Direct", count: bySource.direct ?? 0 },
    { name: "Other", count: otherCount },
  ];
  const whatsappByCar = data?.whatsappLeadsByCar ?? [];
  const conversionFunnel = data?.conversionFunnel ?? [];
  const topCarsChart = (data?.topCars ?? []).map((o) => ({ name: `${o.car?.year} ${o.car?.make} ${o.car?.model}`.trim() || "Car", leads: o.count }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-white">Analytics</h1>
          <p className="text-gray-400 mt-0.5">Leads and sales leakage</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={affiliateOnly}
              onChange={(e) => setAffiliateOnly(e.target.checked)}
              className="rounded border-white/20 bg-navy text-accent-blue focus:ring-accent-blue"
            />
            <span className="text-sm text-gray-300">Referred by affiliate only</span>
          </label>
          <input type="month" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} className="px-3 py-2 rounded-lg bg-navy border border-white/10 text-white" />
          <button
            onClick={async () => {
              setReportLoading(true);
              try {
                await downloadMonthlyReport(reportMonth);
                toast.success("Report downloaded");
              } catch (e) {
                toast.error(e.message || "Failed to generate report");
              } finally {
                setReportLoading(false);
              }
            }}
            disabled={reportLoading}
            className="px-4 py-2 rounded-lg bg-accent-blue text-white font-medium hover:bg-accent-blue/90 disabled:opacity-50"
          >
            {reportLoading ? "Generating…" : "Download PDF"}
          </button>
          <button
            onClick={async () => {
              setCsvLoading(true);
              try {
                await downloadAnalyticsCsv(reportMonth);
                toast.success("CSV downloaded");
              } catch (e) {
                toast.error(e.message || "Failed to export CSV");
              } finally {
                setCsvLoading(false);
              }
            }}
            disabled={csvLoading}
            className="px-4 py-2 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 disabled:opacity-50 border border-white/10"
          >
            {csvLoading ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-navy-card rounded-xl border border-white/5 p-5 shadow-card">
          <h2 className="font-heading font-semibold text-white mb-4">Leads over time</h2>
          <div className="h-64">
            {(data?.leadsOverTime?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.leadsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "#151B2E", border: "1px solid rgba(255,255,255,0.1)" }} labelStyle={{ color: "#fff" }} />
                  <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot={{ fill: "#2563EB" }} name="Leads" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">No data yet</div>
            )}
          </div>
        </div>

        <div className="bg-navy-card rounded-xl border border-white/5 p-5 shadow-card">
          <h2 className="font-heading font-semibold text-white mb-4">Lead status breakdown</h2>
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#151B2E", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">No data yet</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-navy-card rounded-xl border border-white/5 p-5 shadow-card">
        <h2 className="font-heading font-semibold text-white mb-4">Lead Sources</h2>
        <div className="h-64">
          {allSourceData.some((d) => d.count > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={allSourceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "#151B2E", border: "1px solid rgba(255,255,255,0.1)" }} />
                <Bar dataKey="count" fill="#2563EB" name="Leads" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">No source data yet</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-navy-card rounded-xl border border-white/5 p-5 shadow-card">
          <h2 className="font-heading font-semibold text-white mb-4">WhatsApp leads per car</h2>
          <div className="h-64">
            {whatsappByCar.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={whatsappByCar} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis type="category" dataKey="carLabel" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 11 }} width={75} />
                  <Tooltip contentStyle={{ background: "#151B2E", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <Bar dataKey="count" fill="#22c55e" name="WhatsApp leads" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">No WhatsApp leads yet</div>
            )}
          </div>
        </div>
        <div className="bg-navy-card rounded-xl border border-white/5 p-5 shadow-card">
          <h2 className="font-heading font-semibold text-white mb-4">Conversion funnel</h2>
          <p className="text-gray-400 text-sm mb-3">Visitor → Lead → Test drive → Sale</p>
          <div className="h-64">
            {conversionFunnel.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionFunnel} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis type="category" dataKey="stage" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} width={90} />
                  <Tooltip contentStyle={{ background: "#151B2E", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                    {conversionFunnel.map((entry, i) => (
                      <Cell key={i} fill={entry.fill || "#2563EB"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">No funnel data yet</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-navy-card rounded-xl border border-white/5 p-5 shadow-card">
        <h2 className="font-heading font-semibold text-white mb-4">Top performing cars (all leads)</h2>
        <div className="h-64">
          {topCarsChart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCarsChart} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 11 }} width={75} />
                <Tooltip contentStyle={{ background: "#151B2E", border: "1px solid rgba(255,255,255,0.1)" }} />
                <Bar dataKey="leads" fill="#2563EB" name="Leads" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">No leads yet</div>
          )}
        </div>
      </div>

      <div className="bg-navy-card rounded-xl border border-white/5 p-5 shadow-card">
        <h2 className="font-heading font-semibold text-white mb-2">Sales Leakage</h2>
        <p className="text-gray-400 text-sm mb-4">Estimated revenue lost due to poor follow-up (leads not contacted × avg car price × 10%)</p>
        <p className="text-2xl font-heading font-bold text-accent-orange">KES {(data?.estimatedLost ?? 0).toLocaleString()}</p>
      </div>

      <div className="bg-navy-card rounded-xl border border-white/5 p-5 shadow-card">
        <h2 className="font-heading font-semibold text-white mb-4">Top performing cars by leads</h2>
        {data?.topCars?.length > 0 ? (
          <ul className="space-y-2">
            {data.topCars.map(({ car, count }, i) => (
              <li key={car?.id || i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                <span className="text-white">{car?.make} {car?.model} ({car?.year})</span>
                <span className="text-accent-blue font-medium">{count} leads</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No leads yet.</p>
        )}
      </div>
    </div>
  );
}
