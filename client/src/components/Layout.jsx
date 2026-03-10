import { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Car, Users, BarChart2, Settings, CheckSquare, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { tasks } from "../api";

const primaryNav = [
  { path: "/dashboard", label: "Overview" },
  { path: "/cars", label: "Cars" },
  { path: "/leads", label: "Leads" },
  { path: "/analytics", label: "Analytics" },
  { path: "/settings", label: "Settings" },
];

const desktopSecondaryNav = [
  { path: "/today", label: "Today" },
  { path: "/tasks", label: "Tasks", badge: true },
  { path: "/test-drives", label: "Test drives" },
  { path: "/ads", label: "Ad copy" },
  { path: "/automation", label: "Automation" },
  { path: "/affiliates", label: "Affiliates" },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [taskCount, setTaskCount] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    tasks.count().then((d) => setTaskCount(d.count ?? 0)).catch(() => {});
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-navy">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link to="/dashboard" className="font-heading font-semibold text-lg text-white flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent-blue/20 text-accent-blue">
              <LayoutDashboard className="w-4 h-4" />
            </span>
            <span className="tracking-tight">
              <span className="text-accent-blue">Motor</span>IQ
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-2 text-xs">
            {primaryNav.map(({ path, label }) => {
              const isActive = location.pathname === path || location.pathname.startsWith(path + "/");
              return (
                <Link
                  key={path}
                  to={path}
                  className={
                    "px-3 py-1.5 rounded-full font-medium transition-colors " +
                    (isActive
                      ? "bg-slate-800 text-white border border-slate-600"
                      : "text-gray-300 hover:text-white hover:bg-slate-800/70")
                  }
                >
                  {label}
                </Link>
              );
            })}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className={
                  "px-3 py-1.5 rounded-full font-medium inline-flex items-center gap-1 " +
                  (desktopSecondaryNav.some((item) => location.pathname === item.path || location.pathname.startsWith(item.path + "/"))
                    ? "bg-slate-800 text-white border border-slate-600"
                    : "text-gray-300 hover:text-white hover:bg-slate-800/70")
                }
              >
                More
                <Menu className="w-3 h-3" />
              </button>
              {moreOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-800 bg-slate-950/95 shadow-lg shadow-black/40 py-1 text-xs">
                  {desktopSecondaryNav.map(({ path, label, badge }) => (
                    <button
                      type="button"
                      key={path}
                      onClick={() => {
                        setMoreOpen(false);
                        navigate(path);
                      }}
                      className={
                        "w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-slate-800/80 " +
                        (location.pathname === path || location.pathname.startsWith(path + "/")
                          ? "text-white"
                          : "text-gray-300")
                      }
                    >
                      <span>{label}</span>
                      {badge && taskCount > 0 && (
                        <span className="ml-2 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                          {taskCount > 99 ? "99+" : taskCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-2 text-xs text-gray-400 max-w-[160px] truncate">
              <Car className="w-3 h-3 text-gray-500" />
              <span className="truncate">{user?.dealershipName}</span>
            </span>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="text-xs text-gray-400 hover:text-white transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-6">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-navy-light/95 backdrop-blur md:hidden safe-area-pb">
        <div className="max-w-7xl mx-auto flex items-stretch justify-between px-1 py-2">
          {[
            { path: "/dashboard", label: "Home", Icon: LayoutDashboard },
            { path: "/cars", label: "Cars", Icon: Car },
            { path: "/leads", label: "Leads", Icon: Users },
            { path: "/analytics", label: "Stats", Icon: BarChart2 },
            { path: "/settings", label: "Settings", Icon: Settings },
          ].map(({ path, label, badge, Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 px-1 py-1.5 text-[11px] font-medium min-h-[48px] touch-manipulation ${
                  isActive ? "text-accent-blue" : "text-gray-400"
                }`
              }
            >
              <span className="relative inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/10">
                <Icon className="w-4 h-4" strokeWidth={2} />
                {badge && taskCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center px-1">
                    {taskCount > 99 ? "99+" : taskCount}
                  </span>
                )}
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
