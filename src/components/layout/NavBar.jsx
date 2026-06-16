import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart, Heart, User, Menu, X, Search,
  Fish, ChevronDown, Package, LogOut, Settings,
  ClipboardList, Tag,
} from "lucide-react";
import { useAuthStore } from "../store/AuthStore";
import { useCartStore } from "../store/CartStore";
import { useWishlistStore } from "../store/WishlistStore";

const NAV_LINKS = [
  { label: "Products", to: "/products" },
  { label: "Offers",   to: "/offers"   },
];

export default function NavBar() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query,       setQuery]       = useState("");

  const profileRef = useRef(null);
  const searchRef  = useRef(null);

  const { isAuthenticated, user, logout } = useAuthStore();
  const cartCount     = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const wishlistCount = useWishlistStore((s) => s.ids.length);

  // close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (searchRef.current  && !searchRef.current.contains(e.target))  setSearchOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setProfileOpen(false); }, [location.pathname]);

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

  const isActive = (to) => location.pathname === to;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">

      {/* ── Announcement bar ──────────────────────────────────────── */}
      <div className="bg-brand-800 text-amber-50 text-[11px] sm:text-xs text-center py-1.5 font-body font-medium tracking-wide px-4">
        🐟 Free shipping above ₹499 &nbsp;·&nbsp; Direct from Rameswaram fishermen &nbsp;·&nbsp;
        <Link to="/offers" className="underline underline-offset-2 hover:text-amber-200">Today's Deals</Link>
      </div>

      {/* ── Main nav row ──────────────────────────────────────────── */}
      <div className="border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-14 gap-3">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 mr-2">
            <div className="bg-brand-700 text-white p-1.5 rounded-lg">
              <Fish size={20} />
            </div>
            <div className="hidden sm:block leading-none">
              <span className="font-display text-brand-900 font-bold text-[15px] block">NammaOor</span>
              <span className="font-tamil text-brand-600 text-[10px]">கருவாட்டு கடை</span>
            </div>
          </Link>

          {/* Desktop search — grows to fill space */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search dry fish, pickles, nethili…"
                className="w-full field-input rounded-full py-2 pl-4 pr-10 text-sm"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-600 hover:text-brand-900 transition-colors"
              >
                <Search size={16} />
              </button>
            </div>
          </form>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`font-body text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  isActive(l.to)
                    ? "bg-brand-50 text-brand-800"
                    : "text-amber-800 hover:bg-amber-50 hover:text-brand-800"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right icon group */}
          <div className="flex items-center gap-0.5 ml-auto">

            {/* Mobile search toggle */}
            <button
              className="md:hidden p-2 text-amber-800 hover:text-brand-700 rounded-lg hover:bg-amber-50 transition-colors"
              onClick={() => setSearchOpen((s) => !s)}
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative p-2 text-amber-800 hover:text-rose-500 rounded-lg hover:bg-amber-50 transition-colors"
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
              className="relative p-2 text-amber-800 hover:text-brand-700 rounded-lg hover:bg-amber-50 transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-brand-700 text-white font-num text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5 leading-none">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {/* Auth — desktop dropdown / mobile link */}
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((s) => !s)}
                  className="hidden md:flex items-center gap-1.5 pl-2 pr-1 py-1.5 rounded-xl text-amber-800 hover:bg-amber-50 transition-colors"
                >
                  {/* avatar initial */}
                  <div className="w-7 h-7 rounded-full bg-brand-700 text-white flex items-center justify-center font-num text-xs font-bold shrink-0">
                    {user?.fullName?.[0] ?? user?.name?.[0] ?? "U"}
                  </div>
                  <span className="font-body text-sm font-medium max-w-[80px] truncate">
                    {(user?.fullName ?? user?.name ?? "Account").split(" ")[0]}
                  </span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Desktop dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 bg-white border border-amber-100 rounded-2xl shadow-xl py-2 w-48 z-50">
                    {/* user info */}
                    <div className="px-4 py-2 border-b border-amber-50 mb-1">
                      <p className="font-body text-xs font-semibold text-brand-900 truncate">
                        {user?.fullName ?? user?.name}
                      </p>
                      <p className="font-body text-[11px] text-amber-500 truncate">
                        {user?.phone ?? user?.email}
                      </p>
                    </div>
                    <DropItem to="/profile"   icon={<User size={14} />}       label="My Profile" />
                    <DropItem to="/my-orders" icon={<Package size={14} />}    label="My Orders" />
                    <DropItem to="/wishlist"  icon={<Heart size={14} />}      label="Wishlist" />
                    <DropItem to="/offers"    icon={<Tag size={14} />}        label="Offers" />
                    {user?.role === "admin" && (
                      <>
                        <div className="border-t border-amber-50 my-1" />
                        <DropItem to="/admin" icon={<Settings size={14} />} label="Admin Panel" highlight />
                      </>
                    )}
                    <div className="border-t border-amber-50 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 font-body text-sm text-red-600 hover:bg-red-50 transition-colors"
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
                className="hidden md:inline-flex btn-md btn-primary ml-1"
              >
                Login
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-amber-800 hover:text-brand-700 rounded-lg hover:bg-amber-50 transition-colors ml-1"
              onClick={() => setMobileOpen((s) => !s)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile search bar (slides down) ──────────────────────── */}
      {searchOpen && (
        <div className="md:hidden border-b border-amber-100 bg-white px-4 py-3" ref={searchRef}>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-600"
              >
                <Search size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Mobile drawer ─────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-amber-100 bg-white">
          {/* user info if logged in */}
          {isAuthenticated && (
            <div className="flex items-center gap-3 px-4 py-3 border-b border-amber-50 bg-brand-50">
              <div className="w-9 h-9 rounded-full bg-brand-700 text-white flex items-center justify-center font-num text-sm font-bold shrink-0">
                {user?.fullName?.[0] ?? user?.name?.[0] ?? "U"}
              </div>
              <div className="min-w-0">
                <p className="font-body text-sm font-semibold text-brand-900 truncate">
                  {user?.fullName ?? user?.name}
                </p>
                <p className="font-body text-xs text-amber-500 truncate">
                  {user?.phone ?? user?.email}
                </p>
              </div>
            </div>
          )}

          <nav className="flex flex-col py-2">
            {NAV_LINKS.map((l) => (
              <MobileNavLink key={l.to} to={l.to} onClick={() => setMobileOpen(false)}>
                {l.label}
              </MobileNavLink>
            ))}

            <div className="border-t border-amber-50 mt-1 pt-1">
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
                    className="w-full flex items-center gap-3 px-4 py-3 font-body text-sm text-red-600 hover:bg-red-50 transition-colors"
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
      className={`flex items-center gap-2.5 px-4 py-2 font-body text-sm transition-colors ${
        highlight
          ? "text-brand-700 font-semibold hover:bg-brand-50"
          : "text-amber-900 hover:bg-amber-50"
      }`}
    >
      <span className="text-amber-500">{icon}</span>
      {label}
    </Link>
  );
}

function MobileNavLink({ to, icon, onClick, highlight, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 font-body text-sm font-medium transition-colors ${
        highlight
          ? "text-brand-700 hover:bg-brand-50"
          : "text-amber-900 hover:bg-amber-50"
      }`}
    >
      {icon && <span className="text-amber-500 shrink-0">{icon}</span>}
      {children}
    </Link>
  );
}