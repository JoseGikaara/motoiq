import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { clearAdminToken } from "../api/admin.js";

const nav = [
  { path: "/admin/interested-dealers", label: "Interest inbox" },
  { path: "/admin/dashboard", label: "Overview" },
  { path: "/admin/dealers", label: "Dealers" },
  { path: "/admin/subscriptions", label: "Subscriptions" },
  { path: "/admin/activity", label: "Activity Log" },
  { path: "/admin/system", label: "System Health" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const adminName = localStorage.getItem("motoriq_admin_name") || "Admin";
  const adminEmail = localStorage.getItem("motoriq_admin_email") || "";

  function handleLogout() {
    clearAdminToken();
    localStorage.removeItem("motoriq_admin_name");
    localStorage.removeItem("motoriq_admin_email");
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="min-h-screen flex bg-slate-900 text-white">
      <aside className="w-[220px] flex flex-col border-r border-slate-700 bg-slate-800/50">
        <div className="p-4 border-b border-slate-700">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <span className="font-semibold text-lg">MotorIQ</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white font-medium">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {nav.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={"block px-3 py-2 rounded-lg text-sm " + (location.pathname === path ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-700 hover:text-white")}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <p className="text-sm font-medium truncate">{adminName}</p>
          <p className="text-xs text-slate-500 truncate">{adminEmail}</p>
          <button type="button" onClick={handleLogout} className="mt-2 text-xs text-red-400 hover:text-red-300">
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="h-14 border-b border-slate-700 flex items-center justify-between px-6">
          <h1 className="font-semibold text-slate-200">MotorIQ Admin Console</h1>
          <div className="w-2 h-2 rounded-full bg-emerald-500" title="System healthy" />
        </header>
        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
