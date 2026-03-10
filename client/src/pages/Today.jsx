import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { today as todayApi } from "../api";
import LeadDetailDrawer from "../components/LeadDetailDrawer";

function SectionCard({ title, children, action }) {
  return (
    <div className="bg-navy-card rounded-xl border border-white/5 p-4 shadow-card">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2 className="font-heading font-semibold text-white text-base">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function Today() {
  const [agenda, setAgenda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const nudgeShown = useRef(false);

  useEffect(() => {
    todayApi
      .get()
      .then((data) => setAgenda(data))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!agenda?.stats || nudgeShown.current) return;
    const { closedThisMonth, monthlyTargetDeals } = agenda.stats;
    const hotCount = (agenda.hotLeads || []).length;
    const overdueCount = (agenda.overdueTasks || []).length;
    if (
      monthlyTargetDeals != null &&
      monthlyTargetDeals > 0 &&
      (closedThisMonth ?? 0) < monthlyTargetDeals &&
      (hotCount > 0 || overdueCount > 0)
    ) {
      nudgeShown.current = true;
      const remaining = monthlyTargetDeals - (closedThisMonth ?? 0);
      const msg =
        remaining === 1
          ? "1 deal to target — you've got this!"
          : `${remaining} deals to target — ${hotCount ? "hot lead" : "follow-up"} waiting!`;
      toast(msg, { icon: "🔥", duration: 5000 });
    }
  }, [agenda?.stats, agenda?.hotLeads?.length, agenda?.overdueTasks?.length]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-navy-card rounded-xl border border-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  const overdueTasks = agenda?.overdueTasks || [];
  const hotLeads = agenda?.hotLeads || [];
  const upcomingTestDrives = agenda?.upcomingTestDrives || [];
  const dueDrips = agenda?.dueDrips || [];
  const stats = agenda?.stats || {};

  const hasAny =
    overdueTasks.length || hotLeads.length || upcomingTestDrives.length || dueDrips.length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading font-bold text-2xl text-white">Today</h1>
        <p className="text-gray-400 mt-0.5">Your focused agenda for closing more deals today</p>
      </div>

      {!hasAny && (
        <div className="bg-navy-card rounded-xl border border-white/5 p-6 text-center text-sm text-gray-400">
          No urgent items for today. Check your{" "}
          <Link to="/leads" className="text-accent-blue hover:underline">
            leads
          </Link>{" "}
          or{" "}
          <Link to="/tasks" className="text-accent-blue hover:underline">
            tasks
          </Link>{" "}
          to plan ahead.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard
            title="Overdue follow-ups"
            action={
              overdueTasks.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-300">
                  {overdueTasks.length} overdue
                </span>
              )
            }
          >
            {overdueTasks.length === 0 ? (
              <p className="text-sm text-gray-500">No overdue tasks. Great job staying on top.</p>
            ) : (
              <ul className="space-y-2">
                {overdueTasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-navy border border-white/5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{t.lead?.name}</p>
                      <p className="text-xs text-gray-400 truncate">{t.message}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Created {new Date(t.createdAt).toLocaleDateString()} ·{" "}
                        {t.lead?.car && (
                          <span>
                            {t.lead.car.make} {t.lead.car.model}
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedLeadId(t.leadId)}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-accent-blue text-white text-xs font-medium"
                    >
                      Open
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Hot leads to contact"
            action={
              hotLeads.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent-orange/10 text-accent-orange">
                  {hotLeads.length} waiting
                </span>
              )
            }
          >
            {hotLeads.length === 0 ? (
              <p className="text-sm text-gray-500">
                No idle hot leads right now. New hot leads will show here automatically.
              </p>
            ) : (
              <ul className="space-y-2">
                {hotLeads.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-navy border border-white/5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{l.name}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {l.car?.make} {l.car?.model} · Score {l.score || "n/a"}
                        {l.urgency != null && ` · Urgency ${l.urgency}/10`}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Last updated {new Date(l.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedLeadId(l.id)}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-accent-orange text-xs font-medium text-black"
                    >
                      Open
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Drip steps due"
            action={
              dueDrips.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300">
                  {dueDrips.length} today
                </span>
              )
            }
          >
            {dueDrips.length === 0 ? (
              <p className="text-sm text-gray-500">No drip messages due right now.</p>
            ) : (
              <ul className="space-y-2">
                {dueDrips.map((d) => (
                  <li
                    key={d.enrollmentId}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-navy border border-white/5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{d.leadName}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {d.sequenceName} · Step {d.stepOrder} · {d.channel}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Due {new Date(d.dueAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedLeadId(d.leadId)}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500 text-xs font-medium text-black"
                    >
                      View
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Upcoming test drives (48h)">
            {upcomingTestDrives.length === 0 ? (
              <p className="text-sm text-gray-500">No test drives scheduled in the next 48 hours.</p>
            ) : (
              <ul className="space-y-2">
                {upcomingTestDrives.map((td) => {
                  const date = new Date(td.date);
                  const label = `${date.toLocaleDateString()} · ${td.timeSlot}`;
                  const carLabel = td.car ? `${td.car.make} ${td.car.model}` : "";
                  return (
                    <li
                      key={td.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-navy border border-white/5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{td.lead?.name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {carLabel} · {label}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedLeadId(td.leadId)}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-accent-blue text-xs font-medium text-white"
                      >
                        Open
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="This week & month">
            <div className="space-y-2 text-sm text-gray-300">
              <div>
                <p className="text-xs text-gray-400">Closed this week</p>
                <p className="text-base font-heading text-white">
                  {stats.closedThisWeek ?? 0} deals
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Closed this month</p>
                <p className="text-base font-heading text-white">
                  {stats.closedThisMonth ?? 0} deals
                  {stats.monthlyTargetDeals != null && (
                    <span className="text-xs text-gray-400 ml-1">
                      / {stats.monthlyTargetDeals} target
                    </span>
                  )}
                </p>
                {stats.progressToTarget != null && (
                  <>
                    <div className="mt-1 h-1.5 bg-navy rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-blue rounded-full"
                        style={{ width: `${stats.progressToTarget}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500">
                      {stats.progressToTarget}% toward monthly target
                    </p>
                  </>
                )}
              </div>
              {stats.estimatedCommissionMonth != null && stats.estimatedCommissionMonth > 0 && (
                <div>
                  <p className="text-xs text-gray-400">Estimated commission this month</p>
                  <p className="text-base font-heading text-emerald-400">
                    {stats.currency || "KES"}{" "}
                    {stats.estimatedCommissionMonth.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
              )}
              <Link
                to="/settings"
                className="inline-block mt-2 text-xs text-accent-blue hover:underline"
              >
                Adjust targets in Settings →
              </Link>
            </div>
          </SectionCard>
        </div>
      </div>

      <LeadDetailDrawer
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onUpdate={() => {
          // Refresh agenda after acting on a lead
          todayApi
            .get()
            .then((data) => setAgenda(data))
            .catch((e) => toast.error(e.message));
        }}
      />
    </div>
  );
}

