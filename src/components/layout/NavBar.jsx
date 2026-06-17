import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart, Heart, User, Menu, X, Search,
  ChevronDown, Package, LogOut, Settings,
  ClipboardList, Tag, Flame, Grid3x3,
} from "lucide-react";
import Logo from "./Logo";
import { useAuthStore } from "../store/AuthStore";
import { useCartStore } from "../store/CartStore";
import { useWishlistStore } from "../store/WishlistStore";
import { categoryApi } from "../../ApiCall/Api.jsx";

const NAV_LINKS = [
  { label: "Products", to: "/products" },
  { label: "Offers",   to: "/offers"   },
  { label: "Bestsellers", to: "/products?isBestseller=true" },
  { label: "Today's Deals", to: "/offers" },
];

export default function NavBar() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [query,       setQuery]       = useState("");
  const [categories,  setCategories]  = useState([]);

  const profileRef = useRef(null);
  const searchRef  = useRef(null);
  const catDropdownRef = useRef(null);

  const { isAuthenticated, user, logout } = useAuthStore();
  const cartCount     = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const wishlistCount = useWishlistStore((s) => s.ids.length);

  // fetch categories once for the category strip
  useEffect(() => {
    categoryApi.list()
      .then((r) => setCategories((r.categories || []).filter((c) => c.isActive)))
      .catch(() => {});
  }, []);

  // close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (searchRef.current  && !searchRef.current.contains(e.target))  setSearchOpen(false);
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) setCatDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setCatDropdownOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    setQuery("");
    setSearchOpen(false);
    setMobileOpen(false);
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

  return (
    <header className="sticky top-0 z-50 shadow-sm">

      {/* ── Main bar — single unified gray bar (Amazon-style) ──────── */}
      <div className="bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* thin shipping note — folded into the top of the gray bar, not a separate row */}
          <div className="hidden sm:block text-center py-1 text-[11px] text-sandal-200/80 font-body font-medium tracking-wide border-b border-white/5">
            🐟 Free shipping above ₹499 &nbsp;·&nbsp; Sourced from Rameswaram fishermen &nbsp;·&nbsp;
            <Link to="/offers" className="underline underline-offset-2 hover:text-sandal-100 transition-colors ml-1">Today's Deals</Link>
          </div>

          <div className="flex items-center h-16 gap-3">

            {/* Logo — pinned to the true far-left edge */}
            <Logo className="shrink-0 mr-2" inverse />

            {/* Desktop search — grows to fill center space */}
            {location.pathname !== "/products" && (
              <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
                <div className="relative w-full">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search dry fish, pickles, nethili…"
                    className="w-full rounded-full py-2 pl-4 pr-10 text-sm bg-white text-gray-800 placeholder:text-gray-400 outline-none focus:ring-3 focus:ring-sandal-400/30"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <Search size={16} />
                  </button>
                </div>
              </form>
            )}

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-1">
              {/* Categories Dropdown */}
              <div
                ref={catDropdownRef}
                className="relative"
                onMouseEnter={() => setCatDropdownOpen(true)}
                onMouseLeave={() => setCatDropdownOpen(false)}
              >
                <button
                  onClick={() => setCatDropdownOpen((prev) => !prev)}
                  className={`font-body text-sm font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                    catDropdownOpen
                      ? "bg-white/10 text-white"
                      : "text-sandal-100 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Grid3x3 size={14} />
                  Categories
                  <ChevronDown size={14} className={`transition-transform duration-200 ${catDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {catDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-sandal-100 rounded-2xl shadow-xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link
                      to="/products"
                      onClick={() => setCatDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-sandal-50 hover:text-sandal-700 transition-colors"
                    >
                      <Grid3x3 size={14} className="text-sandal-500" />
                      All Products
                    </Link>
                    <div className="border-t border-sandal-100/50 my-1.5" />
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/products?category=${cat.slug}`}
                        onClick={() => setCatDropdownOpen(false)}
                        className="flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 hover:bg-sandal-50 hover:text-sandal-700 transition-colors"
                      >
                        <span>{cat.nameEn}</span>
                        {cat.nameTa && <span className="font-tamil text-[10px] text-sandal-400 font-normal">{cat.nameTa}</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {NAV_LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`font-body text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
                    isActive(l.to)
                      ? "bg-white/10 text-white"
                      : "text-sandal-100 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* Right icon group */}
            <div className="flex items-center gap-1.5 ml-auto">

              {/* Mobile search toggle */}
              {location.pathname !== "/products" && (
                <button
                  className="md:hidden p-2 text-sandal-100 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                  onClick={() => setSearchOpen((s) => !s)}
                  aria-label="Search"
                >
                  <Search size={20} />
                </button>
              )}

              {/* Wishlist */}
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

              {/* Auth — desktop dropdown / mobile link */}
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
                      {(user?.fullName ?? user?.name ?? "Account").split(" ")[0]}
                    </span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Desktop dropdown */}
                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 bg-white border border-sandal-100 rounded-2xl shadow-xl py-2 w-52 z-50">
                      {/* user info */}
                      <div className="px-4 py-2.5 border-b border-sandal-100 mb-1">
                        <p className="font-body text-xs font-bold text-gray-800 truncate">
                          {user?.fullName ?? user?.name}
                        </p>
                        <p className="font-body text-[11px] text-gray-500 truncate">
                          {user?.phone ?? user?.email}
                        </p>
                      </div>
                      <DropItem to="/profile"   icon={<User size={14} />}       label="My Profile" />
                      <DropItem to="/my-orders" icon={<Package size={14} />}    label="My Orders" />
                      <DropItem to="/wishlist"  icon={<Heart size={14} />}      label="Wishlist" />
                      <DropItem to="/offers"    icon={<Tag size={14} />}        label="Offers" />
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
                  className="hidden md:inline-flex btn-md bg-sandal-400 text-gray-950 font-semibold rounded-full px-5 py-2 text-sm hover:bg-sandal-300 transition-colors ml-1"
                >
                  Login
                </Link>
              )}

              {/* Mobile hamburger */}
              <button
                className="md:hidden p-2 text-sandal-100 hover:text-white rounded-xl hover:bg-white/10 transition-colors ml-1"
                onClick={() => setMobileOpen((s) => !s)}
                aria-label="Menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile search bar (slides down) ──────────────────────── */}
      {searchOpen && (
        <div className="md:hidden border-b border-sandal-100 bg-white px-4 py-3" ref={searchRef}>
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search dry fish, pickles…"
                className="field-input rounded-full pl-4 pr-10 py-2 text-sm"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                <Search size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Mobile drawer ─────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-sandal-100 bg-white shadow-inner">
          {/* user info if logged in */}
          {isAuthenticated && (
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-sandal-100 bg-sandal-50">
              <div className="w-10 h-10 rounded-full bg-gray-800 text-sandal-100 flex items-center justify-center font-num text-sm font-bold shrink-0">
                {user?.fullName?.[0] ?? user?.name?.[0] ?? "U"}
              </div>
              <div className="min-w-0">
                <p className="font-body text-sm font-bold text-gray-800 truncate">
                  {user?.fullName ?? user?.name}
                </p>
                <p className="font-body text-xs text-gray-500 truncate">
                  {user?.phone ?? user?.email}
                </p>
              </div>
            </div>
          )}

          <nav className="flex flex-col py-2">

            {/* Shop by category — mobile */}
            {categories.length > 0 && (
              <div className="px-4 pb-3 mb-1 border-b border-sandal-100">
                <p className="font-body text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Shop by Category
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/products"
                    onClick={() => setMobileOpen(false)}
                    className="font-body text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-800 text-sandal-100"
                  >
                    All
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/products?category=${cat.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="font-body text-xs font-semibold px-3 py-1.5 rounded-full bg-sandal-50 text-sandal-800 border border-sandal-200"
                    >
                      {cat.nameEn}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {NAV_LINKS.map((l) => (
              <MobileNavLink key={l.to} to={l.to} onClick={() => setMobileOpen(false)}>
                {l.label}
              </MobileNavLink>
            ))}

            <div className="border-t border-sandal-100 mt-1 pt-1">
              {isAuthenticated ? (
                <>
                  <MobileNavLink to="/profile"   icon={<User size={16} />}    onClick={() => setMobileOpen(false)}>My Profile</MobileNavLink>
                  <MobileNavLink to="/my-orders" icon={<ClipboardList size={16} />} onClick={() => setMobileOpen(false)}>My Orders</MobileNavLink>
                  <MobileNavLink to="/wishlist"  icon={<Heart size={16} />}   onClick={() => setMobileOpen(false)}>
                    Wishlist {wishlistCount > 0 && <span className="ml-auto badge-red">{wishlistCount}</span>}
                  </MobileNavLink>
                  {user?.role === "admin" && (
                    <MobileNavLink to="/admin" icon={<Settings size={16} />} onClick={() => setMobileOpen(false)} highlight>
                      Admin Panel
                    </MobileNavLink>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 font-body text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </>
              ) : (
                <div className="flex gap-3 px-4 py-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 btn-md btn-primary text-center"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 btn-md btn-outline text-center"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

// ── small helpers ───────────────────────────────────────────────────────
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

function MobileNavLink({ to, icon, onClick, highlight, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 font-body text-sm font-semibold transition-colors ${
        highlight
          ? "text-sandal-700 hover:bg-sandal-50"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {icon && <span className="text-sandal-500 shrink-0">{icon}</span>}
      {children}
    </Link>
  );
}