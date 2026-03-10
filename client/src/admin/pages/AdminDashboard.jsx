import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { admin } from "../../api/admin.js";
import {
  Users,
  UserCheck,
  TrendingUp,
  DollarSign,
  UserPlus,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const statCards = [
  { key: "totalDealers", label: "Total Dealers", icon: Users, color: "blue" },
  { key: "activeDealers", label: "Active Dealers", icon: UserCheck, color: "green" },
  { key: "totalLeads", label: "Total Leads", icon: TrendingUp, color: "orange" },
  { key: "totalRevenue", label: "Revenue (KES)", icon: DollarSign, color: "green" },
  { key: "newDealersThisMonth", label: "New This Month", icon: UserPlus, color: "blue" },
  { key: "trialDealers", label: "Trials", icon: Zap, color: "purple" },
];

const COLORS = { blue: "#3B82F6", green: "#22C55E", orange: "#F97316", purple: "#A855F7" };

function formatNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [expiring, setExpiring] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [s, e, a] = await Promise.all([
          admin.stats(),
          admin.expiringSubscriptions().catch(() => []),
          admin.activity({ limit: 20 }).catch(() => []),
        ]);
        if (cancelled) return;
        setStats(s);
        setExpiring(Array.isArray(e) ? e : []);
        setActivity(Array.isArray(a) ? a : []);
        if (s) {
          setChartData([{ month: "This month", dealers: s.newDealersThisMonth || 0 }]);
          setPieData([
            { name: "Trial", value: s.trialDealers || 0 },
            { name: "Basic", value: 0 },
            { name: "Pro", value: 0 },
            { name: "Enterprise", value: 0 },
          ]);
        }
      } catch (err) {
        if (!cancelled) setStats({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="text-slate-400">Loading…</div>;
  if (!stats) return <div className="text-red-400">Failed to load stats</div>;

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-white">Overview</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(({ key, label, icon: Icon, color }) => (
          <div
            key={key}
            className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 flex items-center gap-4"
          >
            <div className="p-2 rounded-lg bg-slate-700">
              <Icon className="w-5 h-5" style={{ color: COLORS[color] }} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">{label}</p>
              <p className="text-xl font-semibold text-white">
                {key === "totalRevenue" ? formatNum(stats[key] || 0) : (stats[key] ?? 0)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Dealer growth</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155" }} />
                <Line type="monotone" dataKey="dealers" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Subscription breakdown</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  label
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={["#64748b", "#3B82F6", "#F97316", "#A855F7"][i]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
        <h3 className="text-sm font-medium text-slate-300 px-4 py-3 border-b border-slate-700">Expiring soon (≤7 days)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-700">
                <th className="p-3">Dealer</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Expires</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {expiring.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-slate-500">None</td></tr>
              ) : (
                expiring.map((sub) => {
                  const end = sub.endDate ? new Date(sub.endDate) : null;
                  const daysLeft = end ? Math.ceil((end - new Date()) / 86400000) : null;
                  const urgent = daysLeft != null && daysLeft < 3;
                  return (
                    <tr key={sub.id} className="border-b border-slate-700/50">
                      <td className="p-3 text-white">{sub.dealer?.dealershipName || sub.dealer?.name || sub.dealerId}</td>
                      <td className="p-3 text-slate-300">{sub.plan}</td>
                      <td className={"p-3 " + (urgent ? "text-red-400 font-medium" : "text-slate-300")}>
                        {end ? end.toLocaleDateString() : "—"} {daysLeft != null && `(${daysLeft}d)`}
                      </td>
                      <td className="p-3">
                        <Link to={"/admin/dealers/" + sub.dealerId} className="text-red-400 hover:text-red-300 text-xs">
                          Renew
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
        <h3 className="text-sm font-medium text-slate-300 px-4 py-3 border-b border-slate-700">Recent activity</h3>
        <ul className="divide-y divide-slate-700/50">
          {activity.length === 0 ? (
            <li className="p-4 text-slate-500 text-sm">No recent activity</li>
          ) : (
            activity.map((log) => (
              <li key={log.id} className="px-4 py-2 flex items-center gap-3 text-sm">
                <span className="text-slate-500 shrink-0 w-32">
                  {log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
                </span>
                <span className="text-slate-300">{log.dealer?.dealershipName || log.dealer?.name || "—"}</span>
                <span className={
                  log.action?.includes("LEAD") ? "text-green-400" :
                  log.action?.includes("CAR") ? "text-blue-400" :
                  log.action?.includes("TEST_DRIVE") ? "text-orange-400" : "text-slate-400"
                }>
                  {log.action}
                </span>
                {log.detail && <span className="text-slate-500 truncate">{log.detail}</span>}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
