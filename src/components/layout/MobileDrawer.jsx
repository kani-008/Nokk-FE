import { Link } from "react-router-dom";
import {
  X, User, Heart, LogOut, Settings,
  ClipboardList, ChevronDown, Grid3x3, // eslint-disable-line no-unused-vars -- kept for the commented-out "Shop by Category" block below; re-enable that block to use these again
} from "lucide-react";

/*
  MOBILE DRAWER
  ───────────────────────────────────────────────────────────────────
  Extracted out of NavBar.jsx so the drawer's markup lives in its own
  file. Slides in from the right, covering the right half of the
  screen (w-80, capped at 85% viewport width on very small phones),
  with a dimmed backdrop — same pattern as the Products page filter
  drawer.

  All state (open/closed, categories, auth info, counts) and handlers
  are passed down as props from NavBar, which remains the single
  source of truth for that state.
*/
export default function MobileDrawer({
  open,
  onClose,
  navLinks,
  isAuthenticated,
  user,
  wishlistCount,
  onLogout,
}) {
  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative ml-auto w-80 max-w-[85vw] h-full bg-white shadow-xl flex flex-col">

        {/* drawer header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-sandal-100 shrink-0">
          <span className="font-display text-base font-bold text-gray-800">Menu</span>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* scrollable body */}
        <div className="flex-1 overflow-y-auto">

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

            {/*
              Shop by category — commented out for now per request.
              To re-enable: uncomment this block. `categories`,
              `mobileCatOpen`, and `onToggleMobileCat` are already
              wired in via props, so no other changes are needed.

            {categories.length > 0 && (
              <div className="border-b border-sandal-100 pb-2 mb-1">
                <button
                  onClick={onToggleMobileCat}
                  className="w-full flex items-center justify-between px-4 py-3 font-body text-sm font-semibold text-gray-700"
                >
                  <span className="flex items-center gap-3">
                    <Grid3x3 size={16} className="text-sandal-500 shrink-0" />
                    Shop by Category
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 ${mobileCatOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {mobileCatOpen && (
                  <div className="flex flex-col">
                    <Link
                      to="/products"
                      onClick={onClose}
                      className="flex items-center gap-3 pl-11 pr-4 py-2.5 font-body text-sm font-semibold text-sandal-700 hover:bg-sandal-50 transition-colors"
                    >
                      All Products
                    </Link>
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/products?category=${cat.slug}`}
                        onClick={onClose}
                        className="flex items-center justify-between pl-11 pr-4 py-2.5 font-body text-sm text-gray-700 hover:bg-sandal-50 hover:text-sandal-700 transition-colors"
                      >
                        <span>{cat.nameEn}</span>
                        {cat.nameTa && (
                          <span className="font-tamil text-[10px] text-sandal-400 font-normal">{cat.nameTa}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
            */}

            {navLinks.filter((l) => l.label !== "Orders").map((l) => (
              <MobileNavLink key={l.label} to={l.to} onClick={onClose}>
                {l.label}
              </MobileNavLink>
            ))}

            <div className="border-t border-sandal-100 mt-1 pt-1">
              {isAuthenticated ? (
                <>
                  <MobileNavLink to="/profile"   icon={<User size={16} />}    onClick={onClose}>My Profile</MobileNavLink>
                  <MobileNavLink to="/my-orders" icon={<ClipboardList size={16} />} onClick={onClose}>My Orders</MobileNavLink>
                  <MobileNavLink to="/wishlist"  icon={<Heart size={16} />}   onClick={onClose}>
                    Wishlist {wishlistCount > 0 && <span className="ml-auto badge-red">{wishlistCount}</span>}
                  </MobileNavLink>
                  {user?.role === "admin" && (
                    <MobileNavLink to="/admin" icon={<Settings size={16} />} onClick={onClose} highlight>
                      Admin Panel
                    </MobileNavLink>
                  )}
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 font-body text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </>
              ) : (
                // Login/Register buttons removed from the drawer — the
                // mobile top bar now has a dedicated login icon for
                // logged-out users (see NavBar.jsx icon row).
                null
              )}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

// ── small helper ──────────────────────────────────────────────────────
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