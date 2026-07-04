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
} from "lucide-react";
import Logo from "./Logo";
import MobileDrawer from "./MobileDrawer.jsx";
import { useAuthStore } from "../store/AuthStore";
import { useCartStore } from "../store/CartStore";
import { useWishlistStore } from "../store/WishlistStore";
import API from "../../ApiCall/Api.jsx";
import { usePublicSettings } from "../../hookqueries/useSettings";


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
  const mobileSearchInputRef = useRef(null);

  const { isAuthenticated, user, logout } = useAuthStore();
  const cartCount = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.quantity, 0),
  );
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
      if (searchRef.current && !searchRef.current.contains(e.target))
        setSearchOpen(false);
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
    { label: "Offers", to: "/offers" },
    { label: "Bestsellers", to: "/products?isBestseller=true" },  
    
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 shadow-sm">
      {/* ── Main bar — single unified gray bar (Amazon-style) ──────── */}
      <div className="bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* thin strip — only rendered when admin has enabled the announcement */}
          {settings.announcementEnabled ? (
            <div className="hidden sm:block text-center py-1 text-[11px] text-sandal-200/80 font-body font-medium tracking-wide border-b border-white/5">
              {settings.announcementText && settings.announcementText.trim()
                ? settings.announcementText
                : <>🐟 Free shipping above ₹{settings.freeShippingThreshold || 499} &nbsp;·&nbsp; Sourced from coastal fishermen &nbsp;·&nbsp;
                    <Link to="/offers" className="underline underline-offset-2 hover:text-sandal-100 transition-colors ml-1">Today's Deals</Link>
                  </>
              }
            </div>
          ) : null}

          <div className="flex items-center h-16 gap-3">
            {/* Back arrow — mobile /products only: lets user navigate back without the hamburger menu */}
            {isProductsPage && (
              <button
                onClick={() => navigate(-1)}
                className="md:hidden p-2 text-sandal-100 hover:text-white rounded-xl hover:bg-white/10 transition-colors shrink-0 -ml-1"
                aria-label="Go back"
              >
                <ArrowLeft size={20} />
              </button>
            )}

            {/* Logo — always on desktop; hidden on mobile when search is open OR on /products
                (on /products it moves to the sub-row below — see below) */}
            <Logo className={`shrink-0 mr-2 ${(searchOpen || isProductsPage) ? "hidden md:flex" : ""}`} inverse />

            {/* Mobile inline search — always visible on /products, toggle-triggered elsewhere */}
            {(isProductsPage || searchOpen) && (
              <form
                onSubmit={handleSearch}
                className="flex md:hidden flex-1 items-center gap-2 min-w-0"
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
                    placeholder={isProductsPage ? "Search products…" : "Search dry fish, pickles…"}
                    className="w-full rounded-full py-2 pl-10 pr-4 text-sm bg-white text-gray-800 placeholder:text-gray-400 outline-none focus:ring-3 focus:ring-sandal-400/30"
                    autoFocus={!isProductsPage}
                  />
                </div>
                {/* Only show close button on non-products pages (products search is permanently open) */}
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

            {/* Desktop search — always shown; on /products drives live URL filter, elsewhere navigates */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex w-full max-w-2xl md:ml-10"
            >
              <div className="relative w-full">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => isProductsPage ? handleProductsQueryChange(e.target.value) : setQuery(e.target.value)}
                  placeholder={isProductsPage ? "Search products…" : "Search dry fish, pickles, nethili…"}
                  className="w-full rounded-4xl py-2 pl-4 pr-10 text-sm bg-white text-gray-800 placeholder:text-gray-400 outline-none focus:ring-3 focus:ring-sandal-400/30"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <Search size={16} />
                </button>
              </div>
            </form>

            {/* Right icon group */}
            {/* On /products, icons always visible even though search is open (it's permanently open, not a toggle) */}
            <div className={`flex items-center gap-1.5 ml-auto md:ml-4 md:mr-auto md:gap-4 ${searchOpen && !isProductsPage ? "hidden md:flex" : ""}`}>
              {/* Mobile search toggle — hidden on /products since search is always-open there */}
              {!isProductsPage && (
                <button
                  className="md:hidden p-2 text-sandal-100 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                  onClick={() => setSearchOpen((s) => !s)}
                  aria-label="Search"
                >
                  <Search size={20} />
                </button>
              )}

              {/* Wishlist — hidden on mobile /products (only back+search+cart shown there) */}
              <Link
                to="/wishlist"
                className={`relative p-2 text-sandal-100 hover:text-rose-300 rounded-xl hover:bg-white/10 transition-colors ${isProductsPage ? "hidden md:flex" : ""}`}
                aria-label="Wishlist"
              >
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-rose-500 text-white font-num text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5 leading-none">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
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

              {/* Auth — desktop dropdown / mobile icon */}
              {isAuthenticated ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen((s) => !s)}
                    className="hidden md:flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl text-sandal-100 hover:bg-white/10 transition-colors"
                  >
                    {/* avatar initial */}
                    <div className="w-8 h-8 rounded-full bg-sandal-400 text-gray-900 flex items-center justify-center font-num text-xs font-bold shrink-0">
                      {user?.fullName?.[0] ?? user?.name?.[0] ?? "U"}
                    </div>
                    <span className="font-body text-sm font-semibold max-w-[80px] truncate text-sandal-100">
                      {
                        (user?.fullName ?? user?.name ?? "Account").split(
                          " ",
                        )[0]
                      }
                    </span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Desktop dropdown */}
                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 bg-white border border-sandal-100 rounded-2xl shadow-xl py-2 w-52 z-50">
                      <DropItem
                        to="/profile"
                        icon={<User size={14} />}
                        label="My Profile"
                      />
                      <DropItem
                        to="/my-orders"
                        icon={<Package size={14} />}
                        label="My Orders"
                      />
                      <DropItem
                        to="/offers"
                        icon={<Tag size={14} />}
                        label="Offers"
                      />
                      <DropItem
                        to="/products?isBestseller=true"
                        icon={<TrendingUp size={14} />}
                        label="Bestsellers"
                      />
                      {user?.role === "admin" && (
                        <>
                          <div className="border-t border-sandal-100 my-1" />
                          <DropItem
                            to="/admin"
                            icon={<Settings size={14} />}
                            label="Admin Panel"
                            highlight
                          />
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
                <>
                  {/* Desktop login button — unchanged */}
                  <Link
                    to="/login"
                    className="hidden md:inline-flex btn-md bg-sandal-400 text-gray-950 font-semibold rounded-full px-5 py-2 text-sm hover:bg-sandal-300 transition-colors ml-1"
                  >
                    Login
                  </Link>

                  {/* Mobile login icon — hidden on /products (search-focused topbar) */}
                  <Link
                    to="/login"
                    className={`p-2 text-sandal-100 hover:text-white rounded-xl hover:bg-white/10 transition-colors ${isProductsPage ? "hidden" : "md:hidden"}`}
                    aria-label="Login"
                  >
                    <User size={20} />
                  </Link>
                </>
              )}

              {/* Mobile hamburger — hidden on /products (search-focused topbar needs no nav drawer) */}
              <button
                className={`p-2 text-sandal-100 hover:text-white rounded-xl hover:bg-white/10 transition-colors ml-1 ${isProductsPage ? "hidden" : "md:hidden"}`}
                onClick={() => setMobileOpen((s) => !s)}
                aria-label="Menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
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
