import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  ShoppingCart,
  Heart,
  ArrowLeft,
  User,
  Menu,
  X,
  Search,
  ChevronDown,
  Package,
  LogOut,
  Settings,
  Tag,
  TrendingUp,
  Loader2,
} from "lucide-react";
import Logo from "./Logo";
import MobileDrawer from "./MobileDrawer.jsx";
import AnnouncementBar from "./AnnouncementBar.jsx";
import { useAuthStore } from "../store/AuthStore";
import { useCartStore } from "../store/CartStore";
import { useWishlistStore } from "../store/WishlistStore";
import API from "../../ApiCall/Api.jsx";
import { usePublicSettings } from "../../hookqueries/useSettings";
import { useProductSuggestions } from "../../hookqueries/useProducts";

function SuggestionsDropdown({
  suggestions,
  loading,
  visible,
  highlightedIdx,
  onSelect
}) {
  if (!visible) return null;

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-surface border border-gray-100 rounded-2xl shadow-xl overflow-hidden py-1.5 max-h-72 overflow-y-auto">
      {loading ? (
        <div className="flex items-center justify-center py-4 text-xs text-gray-400 gap-2">
          <Loader2 size={14} className="animate-spin text-sandal-500" />
          <span>Searching...</span>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="px-4 py-3 text-sm text-gray-500 text-center font-body">No products found</div>
      ) : (
        suggestions.map((s, idx) => (
          <div
            key={s.id}
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent input blur before onClick fires
            }}
            onClick={() => onSelect(s)}
            className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
              idx === highlightedIdx ? "bg-sandal-50" : "hover:bg-sandal-50/50"
            }`}
          >
            {s.primaryImage ? (
              <img
                src={s.primaryImage}
                alt=""
                className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                <Package size={18} className="text-gray-300" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-gray-800 truncate font-body">
                {s.name}
              </div>
            </div>
            <div className="text-xs text-sandal-600 font-num font-bold shrink-0">
              ₹{s.minPrice}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();
  const { data: settings = {} } = usePublicSettings();

  const isProductsPage = location.pathname === "/products";

  const [mobileOpen, setMobileOpen] = useState(false);
  // On /products the search bar is always open — no toggle needed
  const [searchOpen, setSearchOpen] = useState(false);
  const navbarSearchDebounceRef = useRef(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false); // collapsible category list inside the drawer (currently unused — category section is commented out in MobileDrawer)
  // On /products, seed query from the current search URL param so the input stays in sync
  const [query, setQuery] = useState(() =>
    location.pathname === "/products" ? (new URLSearchParams(location.search).get("search") || "") : ""
  );
  const [categories, setCategories] = useState([]);

  const profileRef = useRef(null);
  const searchRef = useRef(null);
  const desktopSearchRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

  const [searchFocused, setSearchFocused] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [highlightedIdx, setHighlightedIdx] = useState(-1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: suggestions = [], isPending: suggestionsLoading } = useProductSuggestions(debouncedQuery);

  const showSuggestions = searchFocused && query.trim().length >= 2;
  const isTypingOrLoading = suggestionsLoading || query !== debouncedQuery;

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
    navigate(`/products/${s.slug}`);
    setQuery("");
    setSearchOpen(false);
    setMobileOpen(false);
    setSearchFocused(false);
  };

  const { isAuthenticated, user, logout } = useAuthStore();
  const cartCount = useCartStore((s) => s.items.length);
  const wishlistCount = useWishlistStore((s) => s.ids.length);

  // fetch categories once for the category strip
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await API.get("/categories/get-all");
        console.log(res.data);
        setCategories((res.data.categories || []).filter((c) => c.isActive));
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    fetchCats();
  }, []);

  // close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
      
      const outsideMobileSearch = !searchRef.current || !searchRef.current.contains(e.target);
      const outsideDesktopSearch = !desktopSearchRef.current || !desktopSearchRef.current.contains(e.target);
      
      if (outsideMobileSearch && outsideDesktopSearch) {
        setSearchOpen(false);
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // close mobile menu on route change
  useEffect(() => {
    const timer = setTimeout(() => {
      setMobileOpen(false);
      setProfileOpen(false);
      setMobileCatOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // focus mobile search input when opened
  useEffect(() => {
    if (searchOpen) {
      requestAnimationFrame(() => mobileSearchInputRef.current?.focus());
    }
  }, [searchOpen]);

  // lock page scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (isProductsPage) {
      // Already on /products — update URL param in-place (live filter, no navigation)
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (query.trim()) next.set("search", query.trim()); else next.delete("search");
        next.delete("page");
        return next;
      }, { replace: true });
    } else {
      if (!query.trim()) return;
      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
      setQuery("");
      setSearchOpen(false);
      setMobileOpen(false);
    }
  };

  // Debounced live filter — only active on /products, drives URL params
  const handleProductsQueryChange = (val) => {
    setQuery(val);
    clearTimeout(navbarSearchDebounceRef.current);
    navbarSearchDebounceRef.current = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (val.trim()) next.set("search", val.trim()); else next.delete("search");
        next.delete("page");
        return next;
      }, { replace: true });
    }, 250);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (to) => {
    if (to.includes("?")) {
      const [path, queryPart] = to.split("?");
      return location.pathname === path && location.search.includes(queryPart);
    }
    return location.pathname === to;
  };

  const navLinks = [
    { label: "Products", to: "/products" },
    { label: "Bestsellers", to: "/products?isBestseller=true" },  
  ];

  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 shadow-sm">

      {/* ── Announcement Bar — full-width strip, separate from nav ───── */}
      {settings.announcementEnabled && (
        <div className={`w-full bg-gray-900 overflow-hidden ${isAuthPage ? "hidden lg:block" : "block"}`}>
          <AnnouncementBar settings={settings} />
        </div>
      )}

      {/* ── Main nav bar ─────────────────────────────────────────────── */}
      <div className="bg-gray-800">
        
        {/* ── DESKTOP NAVIGATION BAR (Desktop Only) ────────────────── */}
        <div className="hidden md:block">
          <div className="max-w-7xl mx-auto px-10 sm:px-26">
            <div className="flex items-center justify-between h-17">
              
              {/* Left: Logo */}
              <div className="shrink-0 flex items-center">
                <Logo showText={true} inverse={true} imgClassName="h-32" />
              </div>

              {/* Center: Search Bar */}
              <div className="flex-1 max-w-2xl  relative" ref={desktopSearchRef}>
                <form onSubmit={handleSearch} className="relative w-full">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => isProductsPage ? handleProductsQueryChange(e.target.value) : setQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={isProductsPage ? "Search products…" : "Search dry fish, pickles, nethili…"}
                    className="w-full rounded-full py-2.5 pl-5 pr-12 text-sm bg-surface text-gray-800 placeholder:text-gray-400 outline-none focus:ring-3 focus:ring-sandal-400/30 shadow-inner"
                  />
                  <button
                    type="submit"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <Search size={18} />
                  </button>
                  <SuggestionsDropdown
                    suggestions={suggestions}
                    loading={isTypingOrLoading}
                    visible={showSuggestions}
                    highlightedIdx={highlightedIdx}
                    onSelect={handleSelectSuggestion}
                  />
                </form>
              </div>

              {/* Right: Actions (Wishlist, Cart, Profile/Login) */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Wishlist */}
                <Link
                  to="/wishlist"
                  className="relative p-2.5 text-sandal-100 hover:text-rose-300 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center"
                  aria-label="Wishlist"
                >
                  <Heart size={22} />
                  {wishlistCount > 0 && (
                    <span className="absolute top-1 right-1 bg-rose-500 text-white font-num text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 leading-none">
                      {wishlistCount > 99 ? "99+" : wishlistCount}
                    </span>
                  )}
                </Link>

                {/* Cart */}
                <Link
                  to="/cart"
                  className="relative p-2.5 text-sandal-100 hover:text-white rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center"
                  aria-label="Cart"
                >
                  <ShoppingCart size={22} />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 bg-sandal-400 text-gray-900 font-num text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 leading-none">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Link>

                {/* Account / Login */}
                {isAuthenticated ? (
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setProfileOpen((s) => !s)}
                      className="flex items-center gap-2.5 pl-2.5 pr-2 py-1.5 rounded-xl text-sandal-100 hover:bg-white/10 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-sandal-400 text-gray-900 flex items-center justify-center font-num text-xs font-bold shrink-0 shadow">
                        {user?.fullName?.[0] ?? user?.name?.[0] ?? "U"}
                      </div>
                      <span className="font-body text-sm font-semibold max-w-[100px] truncate text-sandal-100">
                        {(user?.fullName ?? user?.name ?? "Account").split(" ")[0]}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {/* Desktop Dropdown */}
                    {profileOpen && (
                      <div className="absolute right-0 top-full mt-2 bg-surface border border-sandal-100 rounded-2xl shadow-xl py-2 w-52 z-50">
                        <DropItem to="/profile" icon={<User size={14} />} label="My Profile" />
                        <DropItem to="/my-orders" icon={<Package size={14} />} label="My Orders" />
                        <DropItem to="/products?isBestseller=true" icon={<TrendingUp size={14} />} label="Bestsellers" />
                        {user?.role === "admin" && (
                          <>
                            <div className="border-t border-sandal-100 my-1" />
                            <DropItem to="/admin" icon={<Settings size={14} />} label="Admin Panel" highlight />
                          </>
                        )}
                        <div className="border-t border-sandal-100 mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 font-body text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={14} /> Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="btn-md bg-sandal-400 text-gray-950 font-semibold rounded-full px-5 py-2 text-sm hover:bg-sandal-300 transition-colors shadow-sm"
                  >
                    Login
                  </Link>
                )}
              </div>

            </div>
          </div>
        </div>


        {/* ── MOBILE NAVIGATION BAR (Mobile Only) ─────────────────── */}
        <div className="md:hidden">
          <div className="pl-2 pr-1">
            <div className="flex items-center justify-between h-16 gap-2">
              
              {/* Back arrow — mobile /products page only */}
              {isProductsPage && (
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 text-sandal-100 hover:text-white rounded-xl hover:bg-white/10 transition-colors shrink-0 -ml-1"
                  aria-label="Go back"
                >
                  <ArrowLeft size={20} />
                </button>
              )}

              {/* Mobile Logo — visible when search is not actively expanded */}
              {!searchOpen && !isProductsPage && (
                <div className="shrink-0 flex items-center">
                  <Logo showText={true} inverse={true} imgClassName="h-28 mt-2.5" />
                </div>
              )}

              {/* Mobile Search Form — active on /products OR when search button toggled */}
              {(isProductsPage || searchOpen) && (
                <form
                  onSubmit={handleSearch}
                  className="flex-1 flex items-center gap-2 min-w-0"
                  ref={searchRef}
                >
                  <div className="relative flex-1 min-w-0">
                    <Search
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      ref={mobileSearchInputRef}
                      type="text"
                      value={query}
                      onChange={(e) => isProductsPage ? handleProductsQueryChange(e.target.value) : setQuery(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onKeyDown={handleKeyDown}
                      placeholder={isProductsPage ? "Search products…" : "Search dry fish, pickles…"}
                      className="w-full rounded-full py-2 pl-10 pr-4 text-sm bg-surface text-gray-800 placeholder:text-gray-400 outline-none focus:ring-3 focus:ring-sandal-400/30"
                      autoFocus={!isProductsPage}
                    />
                    <SuggestionsDropdown
                      suggestions={suggestions}
                      loading={isTypingOrLoading}
                      visible={showSuggestions}
                      highlightedIdx={highlightedIdx}
                      onSelect={handleSelectSuggestion}
                    />
                  </div>
                  {!isProductsPage && (
                    <button
                      type="button"
                      onClick={() => setSearchOpen(false)}
                      className="p-2 text-sandal-100 hover:text-white rounded-xl hover:bg-white/10 transition-colors shrink-0"
                      aria-label="Close search"
                    >
                      <X size={20} />
                    </button>
                  )}
                </form>
              )}

              {/* Mobile Right Action Icons */}
              <div className="flex items-center gap-1.5 ml-auto shrink-0">
                {/* Search Toggle Icon */}
                {!isProductsPage && !searchOpen && (
                  <button
                    className="p-2 text-sandal-100 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                    onClick={() => setSearchOpen(true)}
                    aria-label="Search"
                  >
                    <Search size={20} />
                  </button>
                )}

                {/* Wishlist Icon */}
                {!isProductsPage && (
                  <Link
                    to="/wishlist"
                    className="relative p-2 text-sandal-100 hover:text-rose-300 rounded-xl hover:bg-white/10 transition-colors"
                    aria-label="Wishlist"
                  >
                    <Heart size={20} />
                    {wishlistCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 bg-rose-500 text-white font-num text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5 leading-none">
                        {wishlistCount > 99 ? "99+" : wishlistCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Cart Icon */}
                <Link
                  to="/cart"
                  className="relative p-2 text-sandal-100 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                  aria-label="Cart"
                >
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 bg-sandal-400 text-gray-900 font-num text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5 leading-none">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Link>

                {/* Mobile Login Icon */}
                {!isAuthenticated && !isProductsPage && (
                  <Link
                    to="/login"
                    className="p-2 text-sandal-100 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                    aria-label="Login"
                  >
                    <User size={20} />
                  </Link>
                )}

                {/* Mobile Drawer Hamburger Menu */}
                {!isProductsPage && (
                  <button
                    className="p-2 text-sandal-100 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                    onClick={() => setMobileOpen((s) => !s)}
                    aria-label="Menu"
                  >
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>


      {/* Mobile drawer — extracted to components/layout/MobileDrawer.jsx */}
      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navLinks={navLinks}
        categories={categories}
        mobileCatOpen={mobileCatOpen}
        onToggleMobileCat={() => setMobileCatOpen((s) => !s)}
        isAuthenticated={isAuthenticated}
        user={user}
        wishlistCount={wishlistCount}
        onLogout={handleLogout}
      />
    </header>
  );
}

// ── small helper ────────────────────────────────────────────────────────
function DropItem({ to, icon, label, highlight }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2.5 px-4 py-2.5 font-body text-sm font-medium transition-colors ${
        highlight
          ? "text-sandal-700 font-bold hover:bg-sandal-50"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <span className="text-sandal-500">{icon}</span>
      {label}
    </Link>
  );
}
