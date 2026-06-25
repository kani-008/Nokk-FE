import { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingBag, Users,
  Tag, Image, BarChart2, Settings, Warehouse,
  LogOut, Menu, X, Fish,
  Bell, ExternalLink, Search, RefreshCw,
  ShoppingCart, RotateCcw, CheckCheck,
  AlertCircle, MessageSquare, UserPlus,
} from "lucide-react";
import { useAuthStore } from "../../components/store/AuthStore";
import API from "../../ApiCall/Api.jsx";

// ── Nav items ──────────────────────────────────────────────────────────
const NAV_GROUPS = [
  { label: "Overview",  items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }] },
  { label: "Catalogue", items: [
      { to: "/admin/products",  label: "Products",  icon: Package },
      { to: "/admin/inventory", label: "Inventory", icon: Warehouse },
  ] },
  { label: "Sales", items: [
      { to: "/admin/orders",  label: "Orders",  icon: ShoppingBag },
      { to: "/admin/offers",  label: "Offers",  icon: Tag },
      { to: "/admin/banners", label: "Banners", icon: Image },
  ] },
  { label: "People",   items: [{ to: "/admin/users",   label: "Users",   icon: Users }] },
  { label: "Insights", items: [{ to: "/admin/reports", label: "Reports", icon: BarChart2 }] },
  { label: "System",   items: [{ to: "/admin/settings", label: "Settings", icon: Settings }] },
];

const TITLE_LOOKUP = NAV_GROUPS.flatMap((g) => g.items);

function useIsActive() {
  const { pathname } = useLocation();
  return (item) => (item.exact ? pathname === item.to : pathname.startsWith(item.to));
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
        group relative flex items-center gap-3 rounded-xl transition-all duration-150
        ${collapsed ? "justify-center px-0 py-2.5 mx-1" : "px-3 py-2.5 mx-2"}
        ${active ? "bg-brand-800 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}
      `}
    >
      <Icon size={18} className={`shrink-0 transition-colors ${active ? "text-white" : "text-gray-400 group-hover:text-gray-600"}`} />
      {!collapsed && <span className="font-body text-[13px] font-medium leading-none">{item.label}</span>}
      {collapsed && active && <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-amber-400" />}
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
    <div className={`flex flex-col h-full bg-white border-r border-gray-100 transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}>

      {/* Logo + mobile close */}
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

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-1">
            {!collapsed && (
              <p className="font-body text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-5 py-1.5">{group.label}</p>
            )}
            {collapsed && <div className="border-t border-gray-100 my-2 mx-3" />}
            {group.items.map((item) => (
              <NavLink key={item.to} item={item} collapsed={collapsed} onClick={onClose} />
            ))}
          </div>
        ))}
      </nav>

      {/* User + logout */}
      <div className={`border-t border-gray-100 py-3 shrink-0 ${collapsed ? "px-1 space-y-1" : "px-2 space-y-1"}`}>
        <Link
          to="/"
          onClick={onClose}
          className={`flex items-center gap-3 rounded-xl py-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors ${collapsed ? "justify-center px-0" : "px-3"}`}
          title={collapsed ? "View Store" : undefined}
        >
          <ExternalLink size={16} className="shrink-0" />
          {!collapsed && <span className="font-body text-[13px]">View Store</span>}
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
              <p className="font-body text-[10px] text-gray-400 truncate mt-0.5 leading-none">{user?.email ?? "admin"}</p>
            </div>
          </div>
        )}

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

// ── Notification helpers ───────────────────────────────────────────────
const NOTIF_ICONS = {
  new_order:            { Icon: ShoppingCart,   color: "text-amber-500",  bg: "bg-amber-50"  },
  order_status_changed: { Icon: ShoppingBag,    color: "text-blue-500",   bg: "bg-blue-50"   },
  payment_failed:       { Icon: AlertCircle,    color: "text-red-500",    bg: "bg-red-50"    },
  return_requested:     { Icon: RotateCcw,      color: "text-pink-500",   bg: "bg-pink-50"   },
  new_review:           { Icon: MessageSquare,  color: "text-purple-500", bg: "bg-purple-50" },
  stock_changed:        { Icon: Warehouse,      color: "text-orange-500", bg: "bg-orange-50" },
  new_signup:           { Icon: UserPlus,       color: "text-green-500",  bg: "bg-green-50"  },
  coupon_limit_near:    { Icon: Tag,            color: "text-yellow-600", bg: "bg-yellow-50" },
  default:              { Icon: Bell,           color: "text-gray-500",   bg: "bg-gray-100"  },
};

const fmtRelative = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60_000)   return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

// ── NotificationPanel ──────────────────────────────────────────────────
// open  — animation state (true = slid in, false = slid out)
// onClose — called immediately by backdrop / close button; parent unmounts after 300 ms
function NotificationPanel({ open, onClose, onCountChange }) {
  const navigate = useNavigate();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/notifications/list", { params: { limit: 20, page: 1 } });
      const notifs = res.data?.notifications ?? [];
      setItems(notifs);
      onCountChange?.(notifs.filter((n) => !n.isRead).length);
    } catch { /* silently ignore */ }
    finally { setLoading(false); }
  }, [onCountChange]);

  useEffect(() => { load(); }, [load]);

  const markAllRead = async () => {
    // optimistic update
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    onCountChange?.(0);
    try {
      await API.patch("/notifications/mark-all-read");
    } catch { load(); } // revert on failure
  };

  const handleClick = async (item) => {
    if (!item.isRead) {
      // optimistic update
      setItems((prev) => prev.map((n) => n.id === item.id ? { ...n, isRead: true } : n));
      onCountChange?.((c) => Math.max(0, c - 1));
      try {
        await API.patch("/notifications/mark-read", { notificationId: item.id });
      } catch { /* best-effort */ }
    }
    if (item.link) navigate(item.link);
    else if (item.entityType === "orders") navigate(`/admin/orders`);
    onClose();
  };

  const unreadCount = items.filter((n) => !n.isRead).length;

  // ── shared inner content ──────────────────────────────────────────────
  const panelHeader = (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
      <div className="flex items-center gap-2">
        <span className="font-display text-sm font-bold text-gray-900">Notifications</span>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white font-num text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">{unreadCount}</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button onClick={load} title="Refresh" className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <RefreshCw size={13} />
        </button>
        {unreadCount > 0 && (
          <button onClick={markAllRead} title="Mark all read" className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <CheckCheck size={13} />
          </button>
        )}
        <button onClick={onClose} className="md:hidden p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ml-1" aria-label="Close">
          <X size={15} />
        </button>
      </div>
    </div>
  );

  const panelList = (
    <div className="flex-1 overflow-y-auto md:max-h-80">
      {loading ? (
        <div className="flex items-center justify-center py-10 text-gray-400">
          <RefreshCw size={16} className="animate-spin mr-2" />
          <span className="font-body text-sm">Loading…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10">
          <Bell size={24} className="mx-auto text-gray-200 mb-2" />
          <p className="font-body text-sm text-gray-400">All caught up!</p>
        </div>
      ) : (
        items.map((item) => {
          const { Icon, color, bg } = NOTIF_ICONS[item.eventType] ?? NOTIF_ICONS.default;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className={`w-full flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left border-b border-gray-50 last:border-0 ${!item.isRead ? "bg-blue-50/30" : ""}`}
            >
              <div className={`mt-0.5 p-2 rounded-xl ${bg} shrink-0`}>
                <Icon size={14} className={color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className={`font-body text-xs text-gray-900 ${!item.isRead ? "font-bold" : "font-semibold"}`}>{item.title}</p>
                  <span className="font-num text-[10px] text-gray-400 shrink-0">{fmtRelative(item.createdAt)}</span>
                </div>
                <p className="font-body text-[11px] text-gray-500 mt-0.5 truncate">{item.message}</p>
              </div>
              {!item.isRead && <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
            </button>
          );
        })
      )}
    </div>
  );

  const panelFooter = (
    <div className="border-t border-gray-100 px-4 py-3 shrink-0">
      <button
        onClick={() => { navigate("/admin/orders"); onClose(); }}
        className="w-full text-center font-body text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors"
      >
        View all orders →
      </button>
    </div>
  );

  return (
    <>
      {/* ── Mobile: full-height slide drawer from the right ── */}
      <div className="md:hidden">
        {/* backdrop */}
        <div
          aria-hidden="true"
          onClick={onClose}
          className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        />
        {/* drawer */}
        <div
          className={`fixed inset-y-0 right-0 z-50 w-3/4 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          {panelHeader}
          {panelList}
          {panelFooter}
        </div>
      </div>

      {/* ── Desktop: absolute dropdown ── */}
      <div className="hidden md:block absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden">
        <div className="flex flex-col">
          {panelHeader}
          {panelList}
          {panelFooter}
        </div>
      </div>
    </>
  );
}

// ── Top header bar ─────────────────────────────────────────────────────
function TopBar({ onToggle, onMobileOpen, pathname }) {
  const { user } = useAuthStore();
  const [searchVal,   setSearchVal]   = useState("");
  const [notifOpen,   setNotifOpen]   = useState(false);   // drives CSS transition
  const [notifMounted, setNotifMounted] = useState(false); // drives DOM presence
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef    = useRef(null);
  const closeTimerRef = useRef(null);

  const title =
    TITLE_LOOKUP.find((i) => (i.exact ? pathname === i.to : pathname.startsWith(i.to)))?.label ?? "Admin";

  const openNotif = () => {
    clearTimeout(closeTimerRef.current);
    setNotifMounted(true);
    // two rAF to let the DOM paint before the transition fires
    requestAnimationFrame(() => requestAnimationFrame(() => setNotifOpen(true)));
  };

  const closeNotif = () => {
    setNotifOpen(false);
    setUnreadCount(0);
    closeTimerRef.current = setTimeout(() => setNotifMounted(false), 300);
  };

  const toggleNotif = () => (notifOpen ? closeNotif() : openNotif());

  // poll unread count every 60 s
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await API.get("/notifications/unread-count");
        setUnreadCount(res.data?.unreadCount ?? 0);
      } catch { /* */ }
    };
    fetchUnread();
    const t = setInterval(fetchUnread, 60_000);
    return () => { clearInterval(t); clearTimeout(closeTimerRef.current); };
  }, []);

  // desktop outside-click: only relevant when panel is open
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) closeNotif();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <header className="flex items-center gap-3 h-14 px-4 sm:px-6 bg-white border-b border-gray-100 shrink-0">

      {/* Mobile: opens sidebar drawer */}
      <button
        onClick={onMobileOpen}
        className="md:hidden p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
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

      <h1 className="font-display text-base font-bold text-gray-900">{title}</h1>

      <div className="flex-1" />

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

      {/* Notification bell */}
      <div className="relative" ref={notifRef}>
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
        {notifMounted && <NotificationPanel open={notifOpen} onClose={closeNotif} onCountChange={setUnreadCount} />}
      </div>

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
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMobileOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setMobileOpen(false); };
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
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}