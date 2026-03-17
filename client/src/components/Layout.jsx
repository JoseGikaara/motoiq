import { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Car,
  Users,
  BarChart2,
  Settings,
  CheckSquare,
  Menu,
  Activity,
  Sparkles,
  Workflow,
  FileText,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { tasks } from "../api";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Overview", Icon: LayoutDashboard, group: "primary", mobile: true },
  { path: "/cars", label: "Cars", Icon: Car, group: "primary", mobile: true },
  { path: "/leads", label: "Leads", Icon: Users, group: "primary", mobile: true },
  { path: "/today", label: "Pipeline", Icon: Activity, group: "primary", mobile: true },
  { path: "/test-drives", label: "Test Drives", Icon: CheckSquare, group: "secondary" },
  { path: "/analytics", label: "Analytics", Icon: BarChart2, group: "primary" },
  { path: "/ads", label: "AI Tools", Icon: Sparkles, group: "secondary" },
  { path: "/automation", label: "Automation", Icon: Workflow, group: "secondary" },
  { path: "/affiliates", label: "Affiliates", Icon: Users, group: "secondary" },
  { path: "/posts", label: "Posts", Icon: FileText, group: "secondary" },
  { path: "/settings", label: "Settings", Icon: Settings, group: "primary", mobile: true },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [taskCount, setTaskCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 1024; // collapsed by default on tablet
  });
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    tasks
      .count()
      .then((d) => setTaskCount(d.count ?? 0))
      .catch(() => {});
  }, [location.pathname]);

  const mobileNavItems = NAV_ITEMS.filter((item) => item.mobile);

  return (
    <div className="min-h-screen bg-navy flex">
      {/* Desktop / tablet sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-slate-800 bg-slate-950/95 backdrop-blur transition-all duration-200 ${
          sidebarCollapsed ? "md:w-16 lg:w-20" : "md:w-56 lg:w-64"
        } sticky top-0 h-screen z-30`}
      >
        {/* Sidebar header */}
        <div className="flex items-center gap-2 px-3 py-3 border-b border-slate-800">
          <button
            type="button"
            onClick={() => setSidebarCollapsed((v) => !v)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-white"
            >
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent-blue/20 text-accent-blue">
                <LayoutDashboard className="w-4 h-4" />
              </span>
              <span className="font-heading font-semibold tracking-tight text-sm">
                <span className="text-accent-blue">Motor</span>IQ
              </span>
            </button>
          )}
        </div>

        {/* Dealer info */}
        <div className="px-3 py-3 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-white">
            {(user?.dealershipName || user?.name || "D").slice(0, 2).toUpperCase()}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-xs text-gray-300 truncate">{user?.dealershipName || "Your Dealership"}</p>
              <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-4">
          <div className="px-2 space-y-1">
            {NAV_ITEMS.filter((item) => item.group === "primary").map(({ path, label, Icon }) => {
              const isActive =
                location.pathname === path || location.pathname.startsWith(path + "/");
              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => navigate(path)}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-gray-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 text-slate-200">
                    <Icon className="w-4 h-4" />
                  </span>
                  {!sidebarCollapsed && <span className="truncate">{label}</span>}
                </button>
              );
            })}
          </div>

          <div className="px-2 space-y-1">
            {NAV_ITEMS.filter((item) => item.group === "secondary").map(({ path, label, Icon }) => {
              const isActive =
                location.pathname === path || location.pathname.startsWith(path + "/");
              const showBadge = path === "/tasks" && taskCount > 0;
              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => navigate(path)}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-gray-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <span className="relative inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 text-slate-200">
                    <Icon className="w-4 h-4" />
                    {showBadge && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center px-1">
                        {taskCount > 99 ? "99+" : taskCount}
                      </span>
                    )}
                  </span>
                  {!sidebarCollapsed && <span className="truncate">{label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Logout fixed at bottom */}
        <div className="px-3 py-3 border-t border-slate-800 mt-auto">
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 text-slate-300">
              <Settings className="w-3.5 h-3.5" />
            </span>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar (shows on all breakpoints) */}
        <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-20 md:z-10">
          <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-white md:hidden"
            >
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent-blue/20 text-accent-blue">
                <LayoutDashboard className="w-4 h-4" />
              </span>
              <span className="font-heading font-semibold tracking-tight text-sm">
                <span className="text-accent-blue">Motor</span>IQ
              </span>
            </button>
            <div className="hidden md:flex items-center gap-3">
              <span className="inline-flex items-center gap-2 text-xs text-gray-400 max-w-[200px] truncate">
                <Car className="w-3 h-3 text-gray-500" />
                <span className="truncate">{user?.dealershipName}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="md:hidden inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <Menu className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="hidden sm:inline-flex text-xs text-gray-400 hover:text-white transition"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-8">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-navy-light/95 backdrop-blur md:hidden safe-area-pb">
          <div className="max-w-4xl mx-auto flex items-stretch justify-between px-1 py-2">
            {mobileNavItems.map(({ path, label, Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center gap-1 px-1 py-1.5 text-[11px] font-medium min-h-[48px] touch-manipulation ${
                    isActive ? "text-accent-blue" : "text-gray-400"
                  }`
                }
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/10">
                  <Icon className="w-4 h-4" />
                </span>
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Mobile drawer */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <div className="absolute inset-y-0 right-0 w-[80%] max-w-sm bg-slate-950 border-l border-slate-800 shadow-xl shadow-black/40 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-white">
                    {(user?.dealershipName || user?.name || "D").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-200 truncate">
                      {user?.dealershipName || "Your Dealership"}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-3 space-y-1">
                {NAV_ITEMS.map(({ path, label, Icon }) => {
                  const isActive =
                    location.pathname === path ||
                    location.pathname.startsWith(path + "/");
                  const showBadge = path === "/tasks" && taskCount > 0;
                  return (
                    <button
                      key={path}
                      type="button"
                      onClick={() => {
                        setMobileDrawerOpen(false);
                        navigate(path);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-left transition-colors ${
                        isActive
                          ? "bg-slate-800 text-white"
                          : "text-gray-300 hover:text-white hover:bg-slate-900"
                      }`}
                    >
                      <span className="relative inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 text-slate-200">
                        <Icon className="w-4 h-4" />
                        {showBadge && (
                          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center px-1">
                            {taskCount > 99 ? "99+" : taskCount}
                          </span>
                        )}
                      </span>
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </nav>
              <div className="px-4 py-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    logout();
                    navigate("/login");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-slate-900 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
