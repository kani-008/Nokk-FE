import { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  Ticket,
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
  MessageSquare,
  Grid3x3,
  Loader2,
  Palette,
  Video,
  FileText,
} from "lucide-react";
import { useAuthStore } from "../../components/store/AuthStore";
import API from "../../ApiCall/Api.jsx";
import NotificationPanel from "./Notification.jsx";
import IconButton from "../../components/admin/IconButton.jsx";
import { useProductSuggestions } from "../../hookqueries/useProducts";

function SuggestionsDropdown({
  suggestions,
  loading,
  visible,
  highlightedIdx,
  onSelect,
  emptyText = "No products found",
}) {
  if (!visible) return null;

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-surface border border-gray-200 rounded-xl shadow-lg overflow-hidden py-1.5 max-h-72 overflow-y-auto w-64 md:w-80">
      {loading ? (
        <div className="flex items-center justify-center py-4 text-xs text-gray-400 gap-2">
          <Loader2 size={14} className="animate-spin text-amber-500" />
          <span>Searching...</span>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="px-4 py-3 text-sm text-gray-500 text-center font-body">{emptyText}</div>
      ) : (
        suggestions.map((s, idx) => (
          <div
            key={s.id}
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent input blur before onClick fires
            }}
            onClick={() => onSelect(s)}
            className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${
              idx === highlightedIdx ? "bg-amber-50 text-amber-900" : "hover:bg-gray-50"
            }`}
          >
            {s.primaryImage ? (
              <img
                src={s.primaryImage}
                alt=""
                className="w-8 h-8 rounded-lg object-cover border border-gray-100 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                <Search size={14} className="text-gray-300" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-gray-700 truncate font-body">
                {s.name}
              </div>
            </div>
            <div className="text-[11px] text-gray-400 font-num font-bold shrink-0">
              ₹{s.minPrice}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Nav items — single flat list, no section grouping/labels ───────────
const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Grid3x3 },
  { to: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/offers", label: "Offers", icon: Tag },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket },
  { to: "/admin/banners", label: "Banners", icon: Image },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { to: "/admin/reports", label: "Reports", icon: BarChart2 },
  { to: "/admin/appearance", label: "Appearance", icon: Palette },
  { to: "/admin/customer-videos", label: "Customer Videos", icon: Video },
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
  return (
    <div
      className={`flex flex-col h-full bg-surface border-r border-gray-100 transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}
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
          <IconButton
            onClick={onClose}
            className="md:hidden ml-auto"
            aria-label="Close menu"
          >
            <X size={18} />
          </IconButton>
        )}
      </div>

      {/* Nav — single continuous list, no group labels or dividers */}
      <nav className="flex-1 overflow-y-auto space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            item={item}
            collapsed={collapsed}
            onClick={onClose}
          />
        ))}
      </nav>

      {/* Footer / View Store */}
      <div
        className={`border-t border-gray-100 shrink-0 ${collapsed ? "p-1.5" : "p-2"}`}
      >
        <Link
          to="/"
          onClick={onClose}
          className={`flex items-center gap-3 rounded-xl py-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors ${collapsed ? "justify-center px-0" : "px-3"}`}
          title={collapsed ? "View Store" : undefined}
        >
          <ExternalLink size={16} className="shrink-0" />
          {!collapsed && (
            <span className="font-body text-[13px] font-medium leading-none">View Store</span>
          )}
        </Link>
      </div>
    </div>
  );
}


// `searchConfig` — { placeholder, value, onChange } registered by whichever
// child admin page wants the topbar's search box to drive its own filtering.
// When no page has registered, the box still renders (desktop) / the icon
// still renders (mobile) but typing is a no-op — purely cosmetic until a
// page opts in via useOutletContext().registerSearch(...).
function TopBar({ onMobileOpen, pathname, searchConfig }) {
  const { user, logout } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [localSearchVal, setLocalSearchVal] = useState(""); // fallback when no page has registered
  const [notifOpen, setNotifOpen] = useState(false); // drives CSS transition
  const [notifMounted, setNotifMounted] = useState(false); // drives DOM presence

  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
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

  const mobileSearchContainerRef = useRef(null);
  const desktopSearchContainerRef = useRef(null);
  const searchDomain = searchConfig?.domain; // "products" | "combos" | undefined
  const isProductSearch = searchDomain === "products";
  const isComboSearch = searchDomain === "combos";
  const hasSuggestionDomain = isProductSearch || isComboSearch;
  const [searchFocused, setSearchFocused] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(isProductSearch ? searchValue : "");
    }, 200);
    return () => clearTimeout(timer);
  }, [searchValue, isProductSearch]);

  const { data: productSuggestions = [], isPending: suggestionsLoading } = useProductSuggestions(debouncedQuery);

  const suggestions = isComboSearch ? (searchConfig?.suggestions || []) : productSuggestions;

  const showSuggestions = hasSuggestionDomain && searchFocused && searchValue.trim().length >= 2;
  const isTypingOrLoading = isProductSearch
    ? (suggestionsLoading || searchValue !== debouncedQuery)
    : false;

  useEffect(() => {
    setHighlightedIdx(-1);
  }, [suggestions]);

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIdx((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIdx((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      if (highlightedIdx >= 0 && highlightedIdx < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[highlightedIdx]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setSearchFocused(false);
    }
  };

  const handleSelectSuggestion = (s) => {
    if (isComboSearch) {
      navigate(`/admin/products?tab=combos&editComboId=${s.id}`);
    } else {
      navigate(`/admin/products?editProductSlug=${s.slug}`);
    }
    setSearchFocused(false);
    setMobileSearchOpen(false);
  };

  useEffect(() => {
    const handler = (e) => {
      const outsideMobile = !mobileSearchContainerRef.current || !mobileSearchContainerRef.current.contains(e.target);
      const outsideDesktop = !desktopSearchContainerRef.current || !desktopSearchContainerRef.current.contains(e.target);
      if (outsideMobile && outsideDesktop) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    <header className="flex items-center gap-3 h-14 px-4 sm:px-6 bg-surface border-b border-gray-100 shrink-0">

      {/* Mobile: opens sidebar drawer — stays visible even while mobile search is expanded */}
      <IconButton onClick={onMobileOpen} className="md:hidden shrink-0" aria-label="Open menu">
        <Menu size={20} />
      </IconButton>


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
          <div className="relative flex-1 min-w-0 topbar-search-fluid-container" ref={mobileSearchContainerRef}>
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 text-sm font-body text-gray-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 placeholder:text-gray-400 topbar-search-fluid"
            />
            <SuggestionsDropdown
              suggestions={suggestions}
              loading={isTypingOrLoading}
              visible={showSuggestions}
              highlightedIdx={highlightedIdx}
              onSelect={handleSelectSuggestion}
              emptyText={isComboSearch ? "No combos found" : "No products found"}
            />
          </div>
          <IconButton onClick={closeMobileSearch} className="shrink-0" aria-label="Close search">
            <X size={18} />
          </IconButton>
        </div>
      )}

      {/* Spacer — only when the mobile search isn't occupying the flex-1 slot itself */}
      <div className={`flex-1 ${mobileSearchOpen ? "hidden md:block" : ""}`} />

      {/* Desktop search box — always visible, page-aware via searchConfig */}
      <div className="relative hidden md:block" ref={desktopSearchContainerRef}>
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-52 bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 text-sm font-body text-gray-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 placeholder:text-gray-400"
        />
        <SuggestionsDropdown
          suggestions={suggestions}
          loading={isTypingOrLoading}
          visible={showSuggestions}
          highlightedIdx={highlightedIdx}
          onSelect={handleSelectSuggestion}
        />
      </div>

      {/* Mobile search icon — hidden once expanded (input above takes its place) */}
      {!mobileSearchOpen && (
        <IconButton onClick={openMobileSearch} size="xl" className="md:hidden" aria-label="Open search">
          <Search size={18} />
        </IconButton>
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
        ref={profileRef}
        className={`relative ${mobileSearchOpen ? "hidden md:block" : ""}`}
      >
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="w-8 h-8 rounded-full bg-brand-700 hover:bg-brand-800 flex items-center justify-center text-white font-num text-xs font-bold shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer"
          aria-label="User menu"
        >
          {user?.fullName?.[0] ?? user?.name?.[0] ?? "A"}
        </button>

        {profileOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-surface border border-gray-100 rounded-xl shadow-lg py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* User Profile Card */}
            <div className="flex items-center gap-2.5 px-4 py-2 border-b border-gray-50 pb-3">
              <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-white font-num text-xs font-bold shrink-0">
                {user?.fullName?.[0] ?? user?.name?.[0] ?? "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-[12px] font-semibold text-gray-900 truncate leading-none">
                  {user?.fullName ?? user?.name ?? "Admin"}
                </p>
                <p className="font-body text-[10px] text-gray-400 truncate mt-1.5 leading-none">
                  {user?.email ?? "admin"}
                </p>
              </div>
            </div>

            {/* Logout Action */}
            <div className="px-1 pt-1.5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-red-500 hover:bg-red-50 transition-colors text-left cursor-pointer"
              >
                <LogOut size={16} className="shrink-0" />
                <span className="font-body text-[13px] font-medium leading-none">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
// ══════════════════════════════════════════════════════════════════════
// ADMIN LAYOUT
// ══════════════════════════════════════════════════════════════════════
export default function AdminLayout() {
  const { pathname } = useLocation();
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
        <Sidebar collapsed={false} />
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
          onMobileOpen={() => setMobileOpen(true)}
          pathname={pathname}
          searchConfig={searchConfig}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 pb-2 sm:pb-6 pt-0 sm:pt-0 admin-content-fluid mx-auto">
            <Outlet context={{ registerSearch, unregisterSearch }} />
          </div>
        </main>
      </div>
    </div>
  );
}
