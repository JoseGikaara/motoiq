import { Link, useLocation } from "react-router-dom";

export default function DealerNavbar({ dealer, slug, resolvedSlug, offsetTop = 0 }) {
  const location = useLocation();
  const baseSlug = resolvedSlug || slug;
  const basePath = `/s/${baseSlug}`;

  const navItems = [
    { key: "home", label: "Home", to: basePath },
    { key: "inventory", label: "Inventory", to: `${basePath}/inventory` },
    { key: "about", label: "About", to: `${basePath}/about` },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header
      className="border-b border-slate-800 bg-slate-950/90 backdrop-blur"
      style={offsetTop ? { marginTop: offsetTop } : undefined}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {dealer.logoUrl && (
            <img
              src={dealer.logoUrl}
              alt={dealer.dealershipName}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg object-contain bg-slate-900"
            />
          )}
          <div>
            <p className="font-heading font-bold text-lg sm:text-xl">
              {dealer.dealershipName}
            </p>
            {dealer.tagline ? (
              <p className="text-[11px] text-slate-400">{dealer.tagline}</p>
            ) : dealer.city ? (
              <p className="text-[11px] text-slate-500">{dealer.city}</p>
            ) : null}
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-2 text-xs sm:text-sm text-gray-300">
          {navItems.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              className={
                "px-3 py-1.5 rounded-full font-medium transition-colors " +
                (isActive(item.to)
                  ? "bg-slate-800 text-white border border-slate-600"
                  : "text-gray-300 hover:text-white hover:bg-slate-800/70")
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

