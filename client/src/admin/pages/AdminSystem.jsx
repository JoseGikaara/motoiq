import { useState, useEffect } from "react";
import { admin } from "../../api/admin.js";

export default function AdminSystem() {
  const [health, setHealth] = useState(null);
  const [usage, setUsage] = useState(null);
  const [env, setEnv] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    function load() {
      Promise.all([
        admin.systemHealth().catch(() => null),
        admin.systemUsage().catch(() => null),
        admin.systemEnv().catch(() => []),
      ]).then(([h, u, e]) => {
        if (!cancelled) {
          setHealth(h);
          setUsage(u);
          setEnv(Array.isArray(e) ? e : []);
        }
      }).finally(() => {
        if (!cancelled) setLoading(false);
      });
    }
    load();
    const t = setInterval(load, 30000);
    return () => { clearInterval(t); cancelled = true; };
  }, []);

  if (loading) return <div className="text-slate-400">Loading…</div>;

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-white">System Health</h2>

      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 space-y-4">
        <h3 className="text-sm font-medium text-slate-300">Checks (refresh every 30s)</h3>
        <ul className="space-y-2">
          <li className="flex items-center gap-3">
            <span className={"w-2 h-2 rounded-full " + (health?.database === "Connected" ? "bg-green-500" : "bg-red-500")} />
            <span className="text-slate-300">Database: {health?.database || "—"}</span>
          </li>
          <li className="flex items-center gap-3">
            <span className={"w-2 h-2 rounded-full " + (health?.openai ? "bg-green-500" : "bg-red-500")} />
            <span className="text-slate-300">OpenAI/DeepSeek API: {health?.openai ? "Configured" : "Missing"}</span>
          </li>
          <li className="flex items-center gap-3">
            <span className={"w-2 h-2 rounded-full " + (health?.smtp ? "bg-green-500" : "bg-red-500")} />
            <span className="text-slate-300">SMTP Email: {health?.smtp ? "Configured" : "Missing"}</span>
          </li>
          <li className="flex items-center gap-3">
            <span className={"w-2 h-2 rounded-full " + (health?.africastalking ? "bg-green-500" : "bg-yellow-500")} />
            <span className="text-slate-300">Africa's Talking SMS: {health?.africastalking ? "Configured" : "Optional – Not set"}</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span className="text-slate-300">Server uptime: {health?.uptime || "—"}</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span className="text-slate-300">
              Memory: {health?.memory?.usedMB ?? "—"} / {health?.memory?.totalMB ?? "—"} MB
              {health?.memory?.usedMB != null && health?.memory?.totalMB != null && (
                <span className="ml-2 inline-block w-24 h-1.5 bg-slate-700 rounded overflow-hidden">
                  <span
                    className="block h-full bg-blue-500"
                    style={{ width: Math.min(100, (health.memory.usedMB / health.memory.totalMB) * 100) + "%" }}
                  />
                </span>
              )}
            </span>
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h3 className="text-sm font-medium text-slate-300 mb-4">Usage this month</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div><p className="text-slate-500 text-xs">AI calls</p><p className="text-white font-medium">{usage?.aiCallsThisMonth ?? 0}</p></div>
          <div><p className="text-slate-500 text-xs">Est. cost (USD)</p><p className="text-white font-medium">${usage?.estimatedAiCostUsd ?? "0"}</p></div>
          <div><p className="text-slate-500 text-xs">Leads captured</p><p className="text-white font-medium">{usage?.leadsThisMonth ?? 0}</p></div>
          <div><p className="text-slate-500 text-xs">Photo URLs</p><p className="text-white font-medium">{usage?.photoCount ?? 0}</p></div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h3 className="text-sm font-medium text-slate-300 mb-4">Quick actions</h3>
        <button onClick={() => admin.testEmail().then(() => alert("Test email sent")).catch((e) => alert(e.message))} className="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm hover:bg-slate-600 mr-2">
          Send test email
        </button>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h3 className="text-sm font-medium text-slate-300 mb-4">Environment variables</h3>
        <ul className="space-y-2">
          {(env.length ? env : [{ key: "DATABASE_URL", set: false }, { key: "JWT_SECRET", set: false }]).map((e) => (
            <li key={e.key} className="flex items-center gap-3 text-sm">
              <span className={e.set ? "text-green-400" : "text-red-400"}>{e.set ? "✓" : "✗"}</span>
              <span className="text-slate-400 font-mono">{e.key}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
