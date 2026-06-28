import { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  Image,
  BarChart2,
  Settings,
  Warehouse,
  LogOut,
  Menu,
  X,
  Fish,
  Bell,
  ExternalLink,
  Search,
} from "lucide-react";
import { useAuthStore } from "../../components/store/AuthStore";
import API from "../../ApiCall/Api.jsx";
import NotificationPanel from "./Notification.jsx";

// ── Nav items — single flat list, no section grouping/labels ───────────
const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/offers", label: "Offers", icon: Tag },
  { to: "/admin/banners", label: "Banners", icon: Image },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/reports", label: "Reports", icon: BarChart2 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

const TITLE_LOOKUP = NAV_ITEMS;

function useIsActive() {
  const { pathname } = useLocation();
  return (item) =>
    item.exact ? pathname === item.to : pathname.startsWith(item.to);
}

// ── Single nav link ────────────────────────────────────────────────────
function NavLink({ item, collapsed, onClick }) {
  const isActive = useIsActive();
  const active = isActive(item);
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`
        group relative flex items-center gap-3 rounded-xl transition-all duration-150
        ${collapsed ? "justify-center px-0 py-2.5 mx-1" : "px-3 py-2.5 mx-2"}
        ${active ? "bg-brand-800 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}
      `}
    >
      <Icon
        size={18}
        className={`shrink-0 transition-colors ${active ? "text-white" : "text-gray-400 group-hover:text-gray-600"}`}
      />
      {!collapsed && (
        <span className="font-body text-[13px] font-medium leading-none">
          {item.label}
        </span>
      )}
      {collapsed && active && (
        <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
      )}
    </Link>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────
function Sidebar({ collapsed, onClose }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
    if (onClose) onClose();
  };

  return (
    <div
      className={`flex flex-col h-full bg-white border-r border-gray-100 transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}
    >
      {/* Logo + mobile close */}
      <div
        className={`flex items-center border-b border-gray-100 shrink-0 ${collapsed ? "justify-center px-0 py-4" : "gap-2.5 px-4 py-4"}`}
      >
        <div className="w-8 h-8 rounded-md bg-brand-800 flex items-center justify-center shrink-0">
          <Fish size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-display text-[13px] font-bold text-gray-900 leading-none">
              NammaOor
            </p>
            <p className="font-body text-[10px] text-amber-600 mt-0.5 leading-none">
              Admin Console
            </p>
          </div>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden ml-auto p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-800 transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav — single continuous list, no group labels or dividers */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            item={item}
            collapsed={collapsed}
            onClick={onClose}
          />
        ))}
      </nav>

      {/* User + logout */}
      <div
        className={`border-t border-gray-100 py-3 shrink-0 ${collapsed ? "px-1 space-y-1" : "px-2 space-y-1"}`}
      >
        <Link
          to="/"
          onClick={onClose}
          className={`flex items-center gap-3 rounded-xl py-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors ${collapsed ? "justify-center px-0" : "px-3"}`}
          title={collapsed ? "View Store" : undefined}
        >
          <ExternalLink size={16} className="shrink-0" />
          {!collapsed && (
            <span className="font-body text-[13px]">View Store</span>
          )}
        </Link>

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

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 rounded-xl py-2 text-red-500 hover:bg-red-50 transition-colors ${collapsed ? "justify-center px-0" : "px-3"}`}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && (
            <span className="font-body text-[13px] font-medium">Logout</span>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Top header bar ─────────────────────────────────────────────────────
const SEARCH_FLUID_STYLES = `
  @media (max-width: 767.98px) {
    .topbar-search-fluid {
      font-size: clamp(0.72rem, 2.6vw, 0.875rem) !important;
      padding-top: clamp(0.35rem, 1.4vw, 0.5rem) !important;
      padding-bottom: clamp(0.35rem, 1.4vw, 0.5rem) !important;
      height: clamp(2.0rem, 8.0vw, 2.25rem) !important;
    }
    .topbar-search-fluid::placeholder {
      font-size: clamp(0.72rem, 2.6vw, 0.875rem) !important;
    }
    .topbar-search-fluid-container svg {
      width: clamp(12px, 2.8vw, 14px) !important;
      height: clamp(12px, 2.8vw, 14px) !important;
    }
  }
`;

// `searchConfig` — { placeholder, value, onChange } registered by whichever
// child admin page wants the topbar's search box to drive its own filtering.
// When no page has registered, the box still renders (desktop) / the icon
// still renders (mobile) but typing is a no-op — purely cosmetic until a
// page opts in via useOutletContext().registerSearch(...).
function TopBar({ onToggle, onMobileOpen, pathname, searchConfig }) {
  const { user } = useAuthStore();
  const [localSearchVal, setLocalSearchVal] = useState(""); // fallback when no page has registered
  const [notifOpen, setNotifOpen] = useState(false); // drives CSS transition
  const [notifMounted, setNotifMounted] = useState(false); // drives DOM presence
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false); // mobile expand/collapse state
  const notifRef = useRef(null);
  const closeTimerRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

  const title =
    TITLE_LOOKUP.find((i) =>
      i.exact ? pathname === i.to : pathname.startsWith(i.to),
    )?.label ?? "Admin";

  const placeholder = searchConfig?.placeholder ?? "Quick search…";
  const searchValue = searchConfig?.value ?? localSearchVal;
  const handleSearchChange = (val) => {
    if (searchConfig?.onChange) searchConfig.onChange(val);
    else setLocalSearchVal(val);
  };

  const openNotif = () => {
    clearTimeout(closeTimerRef.current);
    setNotifMounted(true);
    // two rAF to let the DOM paint before the transition fires
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setNotifOpen(true)),
    );
  };

  const closeNotif = () => {
    setNotifOpen(false);
    setUnreadCount(0);
    closeTimerRef.current = setTimeout(() => setNotifMounted(false), 300);
  };

  const toggleNotif = () => (notifOpen ? closeNotif() : openNotif());

  const openMobileSearch = () => {
    setMobileSearchOpen(true);
    // focus once the expand transition has had a frame to start
    requestAnimationFrame(() => mobileSearchInputRef.current?.focus());
  };

  const closeMobileSearch = () => {
    setMobileSearchOpen(false);
  };

  // poll unread notification count every 60 s
  useEffect(() => {
    const computeUnread = async () => {
      try {
        const res = await API.get("/notifications/unread-count");
        setUnreadCount(res.data?.unreadCount ?? 0);
        console.log(res.data);
      } catch (err) {
        console.error("Failed to fetch unread count:", err.response?.data || err.message);
      }
    };
    computeUnread();
    const t = setInterval(computeUnread, 60_000);
    return () => {
      clearInterval(t);
      clearTimeout(closeTimerRef.current);
    };
  }, []);

  // desktop outside-click: only relevant when panel is open
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        closeNotif();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <header className="flex items-center gap-3 h-14 px-4 sm:px-6 bg-white border-b border-gray-100 shrink-0">
      <style>{SEARCH_FLUID_STYLES}</style>

      {/* Mobile: opens sidebar drawer — stays visible even while mobile search is expanded */}
      <button
        onClick={onMobileOpen}
        className="md:hidden p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Desktop: collapse sidebar */}
      <button
        onClick={onToggle}
        className="hidden md:inline-flex p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Collapse sidebar"
      >
        <Menu size={19} />
      </button>

      {/* Title — always visible on desktop; hidden on mobile while the search is expanded */}
      <h1
        className={`font-display text-base font-bold text-gray-900 md:inline ${mobileSearchOpen ? "hidden" : ""}`}
      >
        {title}
      </h1>

      {/* Mobile expanded search — fills the row between hamburger and the right edge,
          replacing title/notification/avatar for the duration it's open. Explicitly
          md:hidden so this can never render on desktop even if mobileSearchOpen
          were somehow true there. */}
      {mobileSearchOpen && (
        <div className="md:hidden flex-1 flex items-center gap-2 min-w-0">
          <div className="relative flex-1 min-w-0 topbar-search-fluid-container">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 text-sm font-body text-gray-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 placeholder:text-gray-400 topbar-search-fluid"
            />
          </div>
          <button
            onClick={closeMobileSearch}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            aria-label="Close search"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Spacer — only when the mobile search isn't occupying the flex-1 slot itself */}
      <div className={`flex-1 ${mobileSearchOpen ? "hidden md:block" : ""}`} />

      {/* Desktop search box — always visible, page-aware via searchConfig */}
      <div className="relative hidden md:block">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-52 bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 text-sm font-body text-gray-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 placeholder:text-gray-400"
        />
      </div>

      {/* Mobile search icon — hidden once expanded (input above takes its place) */}
      {!mobileSearchOpen && (
        <button
          onClick={openMobileSearch}
          className="md:hidden p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          aria-label="Open search"
        >
          <Search size={18} />
        </button>
      )}

      {/* Notification bell + avatar — always visible on desktop; hidden on mobile while search is expanded */}
      <div
        className={`relative ${mobileSearchOpen ? "hidden md:block" : ""}`}
        ref={notifRef}
      >
        <button
          onClick={toggleNotif}
          className={`relative p-2 rounded-xl transition-colors ${notifOpen ? "bg-gray-100 text-gray-700" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white font-num text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        {notifMounted && (
          <NotificationPanel
            open={notifOpen}
            onClose={closeNotif}
            onCountChange={setUnreadCount}
          />
        )}
      </div>

      <div
        className={`w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-white font-num text-xs font-bold shrink-0 ${mobileSearchOpen ? "hidden md:flex" : ""}`}
      >
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
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Page-aware topbar search ──
  // Any child admin page can call `registerSearch({ placeholder, value, onChange })`
  // (via useOutletContext()) to make the shared topbar search box drive its own
  // filtering. Calling `unregisterSearch()` (or unmounting without cleanup) falls
  // back to the topbar's local, no-op search state.
  //
  // No pathname-watching reset is needed here: when navigating to a different
  // admin page, React unmounts the old page (firing its `unregisterSearch()`
  // cleanup) before mounting the new one, so stale config never lingers.
  // (A pathname-effect here would actually be a bug — parent effects run
  // *after* child effects on mount, so it would wipe out the new page's
  // registration immediately after it registers.)
  const [searchConfig, setSearchConfig] = useState(null);

  const registerSearch = useCallback((config) => setSearchConfig(config), []);
  const unregisterSearch = useCallback(() => setSearchConfig(null), []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMobileOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <div className="flex h-screen bg-sandal-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Mobile drawer — always mounted, slides via transform */}
      <div className="md:hidden">
        <div
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
          className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />
        <div
          role="dialog"
          aria-modal="true"
          className={`fixed inset-y-0 left-0 z-50 w-64 shadow-2xl transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar collapsed={false} onClose={() => setMobileOpen(false)} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          onToggle={() => setCollapsed((s) => !s)}
          onMobileOpen={() => setMobileOpen(true)}
          pathname={pathname}
          searchConfig={searchConfig}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 pb-2 sm:pb-6 pt-0 sm:pt-0 max-w-[1400px] mx-auto">
            <Outlet context={{ registerSearch, unregisterSearch }} />
          </div>
        </main>
      </div>
    </div>
  );
}
