import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { leads, cars as carsApi, settings } from "../api";
import { useAuth } from "../context/AuthContext";
import OnboardingOverlay from "../components/OnboardingOverlay";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [carCount, setCarCount] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [loading, setLoading] = useState(true);
  const [incentive, setIncentive] = useState(null);
  const isDemo = user?.email === "demo@motoriq.co.ke";

  useEffect(() => {
    Promise.all([
      leads.analytics(),
      leads.list(),
      carsApi.list(),
      settings.incentive().catch(() => null),
    ])
      .then(([analytics, list, cars, inc]) => {
        setData(analytics);
        setRecentLeads(list.slice(0, 5));
        setCarCount(cars.length);
        setIncentive(inc);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const onboarded = user?.id && typeof window !== "undefined" && localStorage.getItem("motoriq_onboarded_" + user.id);
  const showOnboardingOverlay = user?.id && !onboarded && showOnboarding;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-navy-card rounded-xl animate-pulse" />
        ))}
        <div className="lg:col-span-2 h-64 bg-navy-card rounded-xl animate-pulse" />
        <div className="h-64 bg-navy-card rounded-xl animate-pulse" />
      </div>
    );
  }

  const total = data?.total ?? 0;
  const hot = data?.byStatus ? (data.byStatus.CONTACTED || 0) + (data.byStatus.TEST_DRIVE || 0) + (data.byStatus.NEGOTIATION || 0) : 0;
  const testDrives = data?.byStatus?.TEST_DRIVE ?? 0;
  const closed = data?.closed ?? 0;
  const contacted = data?.contacted ?? 0;
  const notContacted = data?.notContacted ?? 0;
  const pctContacted = total ? Math.round((contacted / total) * 100) : 0;
  const booked = data?.booked ?? 0;
  const pctBooked = total ? Math.round((booked / total) * 100) : 0;
  const pctClosed = total ? Math.round((closed / total) * 100) : 0;
  const estimatedLost = data?.estimatedLost ?? 0;

  const stats = [
    { label: "Total Leads", value: total, link: "/leads" },
    { label: "Hot Leads", value: hot, color: "text-accent-orange" },
    { label: "Test Drives Booked", value: testDrives },
    { label: "Closed Deals", value: closed },
  ];

  return (
    <div className="space-y-6">
      {/* Onboarding overlay removed: admin now preconfigures dealer accounts */}
      {isDemo && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <p className="text-yellow-200 text-sm">
            DEMO MODE — Changes here are for demo only and may reset every 24 hours.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            {user?.websiteSlug && (
              <a
                href={`/s/${user.websiteSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-accent-blue/80 text-white font-medium hover:bg-accent-blue"
              >
                View my website →
              </a>
            )}
          </div>
        </div>
      )}
      <div>
        <h1 className="font-heading font-bold text-2xl text-white">Dashboard</h1>
        <p className="text-gray-400 mt-0.5">Overview of your sales pipeline</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, link, color }) => (
          <div key={label} className="bg-navy-card rounded-xl border border-white/5 p-5 shadow-card">
            <p className="text-sm text-gray-400">{label}</p>
            <p className={`mt-1 text-2xl font-heading font-semibold ${color || "text-white"}`}>{value}</p>
            {link && (
              <Link to={link} className="mt-2 inline-block text-sm text-accent-blue hover:underline">View all →</Link>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {incentive && (incentive.monthlyTargetDeals != null || incentive.commissionRate != null) && (
          <div className="bg-navy-card rounded-xl border border-white/5 p-5 shadow-card">
            <p className="text-sm text-gray-400">Monthly target</p>
            <div className="mt-1 flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-heading font-semibold text-white">{incentive.closedThisMonth ?? 0}</span>
              {incentive.monthlyTargetDeals != null && (
                <span className="text-gray-400">/ {incentive.monthlyTargetDeals} deals</span>
              )}
            </div>
            {incentive.monthlyTargetDeals != null && incentive.monthlyTargetDeals > 0 && (
              <>
                <div className="mt-2 h-2 bg-navy rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-blue rounded-full transition-all"
                    style={{ width: `${Math.min(100, (100 * (incentive.closedThisMonth ?? 0)) / incentive.monthlyTargetDeals)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {((100 * (incentive.closedThisMonth ?? 0)) / incentive.monthlyTargetDeals).toFixed(0)}% toward target
                  {((incentive.closedThisMonth ?? 0) >= incentive.monthlyTargetDeals && (
                    <span className="ml-1 text-green-400">· Ahead</span>
                  ))}
                  {((incentive.closedThisMonth ?? 0) < incentive.monthlyTargetDeals && (incentive.closedThisMonth ?? 0) >= incentive.monthlyTargetDeals * 0.8) && (
                    <span className="ml-1 text-amber-400">· On track</span>
                  )}
                  {((incentive.closedThisMonth ?? 0) < incentive.monthlyTargetDeals * 0.8) && (
                    <span className="ml-1 text-orange-400">· Behind</span>
                  )}
                </p>
              </>
            )}
            {incentive.commissionRate != null && incentive.commissionRate > 0 && (
              <p className="mt-2 text-sm text-gray-300">
                Est. commission: {incentive.currency ?? "KES"} {(incentive.totalValueThisMonth * incentive.commissionRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            )}
            <Link to="/settings" className="mt-2 inline-block text-xs text-accent-blue hover:underline">Set target in Settings</Link>
          </div>
        )}
        <div className="bg-green-900/20 rounded-xl border border-green-500/30 p-5 shadow-card">
          <p className="text-sm text-green-300">Revenue Recovered This Week</p>
          <p className="mt-1 text-2xl font-heading font-semibold text-green-400">KES {(data?.revenueRecovered ?? 0).toLocaleString()}</p>
          <p className="mt-1 text-sm text-gray-400">Based on {data?.recoveredCount ?? 0} leads you followed up on this week</p>
        </div>
        <div className="bg-navy-card rounded-xl border border-white/5 p-5 shadow-card">
          <p className="text-sm text-gray-400">Pending Follow-ups</p>
          <p className="mt-1 text-2xl font-heading font-semibold text-accent-orange">{(data?.taskCount ?? 0)}</p>
          <Link to="/tasks" className="mt-2 inline-block text-sm text-accent-blue hover:underline">View tasks →</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-navy-card rounded-xl border border-white/5 p-5 shadow-card">
          <h2 className="font-heading font-semibold text-white mb-4">Sales Leakage</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Contacted</span>
              <span className="text-white">{pctContacted}%</span>
            </div>
            <div className="h-2 bg-navy rounded-full overflow-hidden">
              <div className="h-full bg-accent-blue rounded-full" style={{ width: `${pctContacted}%` }} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Booked (test drive / negotiation)</span>
              <span className="text-white">{pctBooked}%</span>
            </div>
            <div className="h-2 bg-navy rounded-full overflow-hidden">
              <div className="h-full bg-accent-orange rounded-full" style={{ width: `${pctBooked}%` }} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Closed</span>
              <span className="text-white">{pctClosed}%</span>
            </div>
            <div className="h-2 bg-navy rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${pctClosed}%` }} />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            Estimated revenue lost due to poor follow-up: <span className="text-accent-orange font-semibold">KES {estimatedLost.toLocaleString()}</span>
          </p>
        </div>

        <div className="bg-navy-card rounded-xl border border-white/5 p-5 shadow-card">
          <h2 className="font-heading font-semibold text-white mb-4">Recent leads</h2>
          {recentLeads.length > 0 ? (
            <ul className="space-y-2">
              {recentLeads.map((lead) => (
                <li key={lead.id}>
                  <Link to="/leads" className="block text-sm text-white hover:text-accent-blue truncate">{lead.name}</Link>
                  <p className="text-xs text-gray-500 truncate">{lead.car?.make} {lead.car?.model} · {new Date(lead.createdAt).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No leads yet. Share your <Link to="/cars" className="text-accent-blue hover:underline">car links</Link> to capture leads.</p>
          )}
          <Link to="/leads" className="mt-3 inline-block text-sm text-accent-blue hover:underline">View all leads →</Link>
        </div>
      </div>
    </div>
  );
}
