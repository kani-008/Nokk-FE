import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingBag, Users,
  Tag, Image, BarChart2, Settings, Warehouse,
  LogOut, Menu, X, Fish, ChevronDown,
  Bell, ExternalLink, Search,
} from "lucide-react";
import { useAuthStore } from "../../components/store/AuthStore";

// ── Nav items ──────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { to: "/admin",           label: "Dashboard",  icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { to: "/admin/products",  label: "Products",   icon: Package },
      { to: "/admin/inventory", label: "Inventory",  icon: Warehouse },
    ],
  },
  {
    label: "Sales",
    items: [
      { to: "/admin/orders",    label: "Orders",     icon: ShoppingBag },
      { to: "/admin/offers",    label: "Offers",     icon: Tag },
      { to: "/admin/banners",   label: "Banners",    icon: Image },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/admin/users",     label: "Users",      icon: Users },
    ],
  },
  {
    label: "Insights",
    items: [
      { to: "/admin/reports",   label: "Reports",    icon: BarChart2 },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/admin/settings",  label: "Settings",   icon: Settings },
    ],
  },
];

// ── Active check ───────────────────────────────────────────────────────
function useIsActive() {
  const { pathname } = useLocation();
  return (item) =>
    item.exact ? pathname === item.to : pathname.startsWith(item.to);
}

// ── Single nav link ────────────────────────────────────────────────────
function NavLink({ item, collapsed, onClick }) {
  const isActive = useIsActive();
  const active   = isActive(item);
  const Icon     = item.icon;

  return (
    <Link
      to={item.to}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`
        relative flex items-center gap-3 rounded-xl transition-all duration-150
        ${collapsed ? "justify-center px-0 py-2.5 mx-1" : "px-3 py-2.5 mx-2"}
        ${active
          ? "bg-brand-800 text-white shadow-sm"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        }
      `}
    >
      <Icon
        size={18}
        className={`shrink-0 transition-colors ${active ? "text-white" : "text-gray-400 group-hover:text-gray-600"}`}
      />
      {!collapsed && (
        <span className="font-body text-[13px] font-medium leading-none">{item.label}</span>
      )}
      {/* active indicator dot when collapsed */}
      {collapsed && active && (
        <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
      )}
    </Link>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────
function Sidebar({ collapsed, onClose, isMobile }) {
  const navigate  = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
    if (onClose) onClose();
  };

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-100 transition-all duration-300 ${collapsed ? "w-16" : "w-56"}`}>

      {/* ── Logo ──────────────────────────────────────────────────── */}
      <div className={`flex items-center border-b border-gray-100 shrink-0 ${collapsed ? "justify-center px-0 py-4" : "gap-2.5 px-4 py-4"}`}>
        <div className="w-8 h-8 rounded-xl bg-brand-800 flex items-center justify-center shrink-0">
          <Fish size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-display text-[13px] font-bold text-gray-900 leading-none">NammaOor</p>
            <p className="font-body text-[10px] text-amber-600 mt-0.5 leading-none">Admin Console</p>
          </div>
        )}
      </div>

      {/* ── Nav groups ────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-1">
            {/* group label — hidden when collapsed */}
            {!collapsed && (
              <p className="font-body text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-5 py-1.5">
                {group.label}
              </p>
            )}
            {collapsed && <div className="border-t border-gray-100 my-2 mx-3" />}

            {group.items.map((item) => (
              <NavLink key={item.to} item={item} collapsed={collapsed} onClick={onClose} />
            ))}
          </div>
        ))}
      </nav>

      {/* ── User + logout ──────────────────────────────────────────── */}
      <div className={`border-t border-gray-100 py-3 shrink-0 ${collapsed ? "px-1 space-y-1" : "px-2 space-y-1"}`}>

        {/* view store */}
        <Link
          to="/"
          className={`flex items-center gap-3 rounded-xl py-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors ${collapsed ? "justify-center px-0" : "px-3"}`}
          title={collapsed ? "View Store" : undefined}
        >
          <ExternalLink size={16} className="shrink-0" />
          {!collapsed && <span className="font-body text-[13px]">View Store</span>}
        </Link>

        {/* user row */}
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50 mx-0">
            <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center text-white font-num text-xs font-bold shrink-0">
              {user?.fullName?.[0] ?? user?.name?.[0] ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-[12px] font-semibold text-gray-900 truncate leading-none">
                {(user?.fullName ?? user?.name ?? "Admin").split(" ")[0]}
              </p>
              <p className="font-body text-[10px] text-gray-400 truncate mt-0.5 leading-none">
                {user?.email ?? "admin"}
              </p>
            </div>
          </div>
        )}

        {/* logout */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 rounded-xl py-2 text-red-500 hover:bg-red-50 transition-colors ${collapsed ? "justify-center px-0" : "px-3"}`}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span className="font-body text-[13px] font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}

// ── Top header bar ─────────────────────────────────────────────────────
function TopBar({ collapsed, onToggle, onMobileOpen, isMobile, pathname }) {
  const { user } = useAuthStore();
  const [searchVal, setSearchVal] = useState("");

  // derive page title from pathname
  const title = (() => {
    if (pathname === "/admin")               return "Dashboard";
    if (pathname.includes("products"))       return "Products";
    if (pathname.includes("inventory"))      return "Inventory";
    if (pathname.includes("orders"))         return "Orders";
    if (pathname.includes("offers"))         return "Offers";
    if (pathname.includes("banners"))        return "Banners";
    if (pathname.includes("users"))          return "Users";
    if (pathname.includes("reports"))        return "Reports";
    if (pathname.includes("settings"))       return "Settings";
    return "Admin";
  })();

  return (
    <header className="flex items-center gap-3 h-14 px-4 sm:px-6 bg-white border-b border-gray-100 shrink-0">

      {/* hamburger / collapse toggle */}
      <button
        onClick={isMobile ? onMobileOpen : onToggle}
        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu size={19} />
      </button>

      {/* page title */}
      <h1 className="font-display text-base font-bold text-gray-900 hidden sm:block">
        {title}
      </h1>

      {/* spacer */}
      <div className="flex-1" />

      {/* desktop search */}
      <div className="relative hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          placeholder="Quick search…"
          className="w-52 bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 text-sm font-body text-gray-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 placeholder:text-gray-400"
        />
      </div>

      {/* notification bell */}
      <button className="relative p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
      </button>

      {/* avatar */}
      <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-white font-num text-xs font-bold shrink-0">
        {user?.fullName?.[0] ?? user?.name?.[0] ?? "A"}
      </div>

    </header>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ADMIN LAYOUT
// ══════════════════════════════════════════════════════════════════════
export default function AdminLayout() {
  const { pathname } = useLocation();
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  // close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <div className="flex h-screen bg-sandal-50 overflow-hidden">

      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <div className="hidden md:flex shrink-0 transition-all duration-300">
        <Sidebar collapsed={collapsed} />
      </div>

      {/* ── Mobile overlay ──────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          {/* drawer */}
          <div className="relative z-10 flex shadow-xl">
            <Sidebar collapsed={false} onClose={() => setMobileOpen(false)} isMobile />
          </div>
          {/* close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 z-20 p-2 bg-white rounded-xl text-gray-500 shadow"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ── Main content area ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <TopBar
          collapsed={collapsed}
          onToggle={() => setCollapsed((s) => !s)}
          onMobileOpen={() => setMobileOpen(true)}
          isMobile={false}
          pathname={pathname}
        />

        {/* page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}