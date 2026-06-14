import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, Search, User, LogOut, ShieldCheck, ChevronDown, Menu, X } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { useWishlistStore } from '../stores/wishlistStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { api } from '../services/api';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items } = useCartStore(); 
  const { wishlistItems } = useWishlistStore();
  const { user, isLoggedIn, logout } = useAuthStore();
  const { toggleCartDrawer } = useUIStore();

  const [settings, setSettings] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    api.getSettings().then(setSettings);
  }, []);

  const cartItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/');
    setProfileDropdownOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-brand-ocean text-brand-cream sticky top-0 z-40 shadow-md border-b border-brand-primary/10">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo & Brand Info */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            {/* Traditional Fish Icon Logo in Circle */}
            <div className="bg-brand-primary hover:bg-brand-secondary text-brand-cream p-2.5 rounded-full shadow-inner transition-colors duration-300">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12,2A10,10,0,0,0,2,12a9.89,9.89,0,0,0,2.15,6.08L2.09,20.14a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l2.06-2.06A9.89,9.89,0,0,0,12,22a10,10,0,0,0,10-10C22,5.2,16.5,2,12,2Zm5,11H7a1,1,0,0,1,0-2H17a1,1,0,0,1,0,2Z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-tiro-tamil text-lg md:text-xl font-bold leading-tight text-brand-secondary tracking-wide group-hover:text-brand-cream transition-colors">
                {settings?.websiteNameTa || 'நம்ம ஊர் கருவாடு கடை'}
              </span>
              <span className="font-playfair text-[10px] md:text-xs font-semibold tracking-wider text-brand-cream/80 uppercase group-hover:text-brand-secondary transition-colors">
                {settings?.websiteName || 'Namma Oor Karuvattu Kadai'}
              </span>
            </div>
          </Link>

          {/* Desktop Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Anchovy (Nethili), Prawns, Pickles..."
              className="w-full bg-brand-cream text-brand-dark px-4 py-2 pl-10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary placeholder-brand-dark/50"
            />
            <Search className="w-4 h-4 text-brand-dark/55 absolute left-3.5 top-3" />
            <button type="submit" className="hidden">Search</button>
          </form>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-6 font-semibold text-sm">
            <Link to="/" className={`hover:text-brand-secondary transition-colors ${isActive('/') ? 'text-brand-secondary border-b-2 border-brand-secondary pb-1' : ''}`}>
              Home
            </Link>
            <Link to="/products" className={`hover:text-brand-secondary transition-colors ${isActive('/products') ? 'text-brand-secondary border-b-2 border-brand-secondary pb-1' : ''}`}>
              Shop Products
            </Link>
            <Link to="/offers" className={`hover:text-brand-secondary transition-colors ${isActive('/offers') ? 'text-brand-secondary border-b-2 border-brand-secondary pb-1' : ''}`}>
              Active Offers
            </Link>
            <Link to="/wishlist" className={`hover:text-brand-secondary transition-colors ${isActive('/wishlist') ? 'text-brand-secondary border-b-2 border-brand-secondary pb-1' : ''}`}>
              Wishlist
            </Link>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 md:gap-3.5">
            {/* Search Toggle (mobile only) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-brand-primary/20 rounded-full transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist Link Icon (Desktop) */}
            <Link
              to="/wishlist"
              className="relative p-2 hover:bg-brand-primary/20 rounded-full transition-colors hidden sm:block cursor-pointer text-brand-cream"
              aria-label="Wishlist"
            >
              <Heart className={`w-5.5 h-5.5 ${wishlistItems.length > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-secondary text-brand-cream text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center font-space">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            {/* Cart Icon Drawer Trigger */}
            <button
              onClick={toggleCartDrawer}
              className="relative p-2.5 bg-brand-primary hover:bg-brand-secondary rounded-xl transition-colors cursor-pointer text-brand-cream flex items-center gap-1.5"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-secondary text-brand-cream text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center font-space shadow">
                  {cartItemsCount}
                </span>
              )}
              <span className="hidden sm:inline text-xs font-bold font-space">
                ₹{items.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}
              </span>
            </button>

            {/* Profile Menu / Dropdown */}
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-1.5 bg-brand-primary/20 hover:bg-brand-primary/30 px-3 py-1.5 rounded-xl cursor-pointer font-semibold text-xs md:text-sm text-brand-cream border border-brand-cream/10"
                >
                  <User className="w-4 h-4 text-brand-secondary" />
                  <span className="max-w-[70px] truncate">{user.name}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-48 bg-white text-brand-dark rounded-2xl shadow-2xl border border-brand-sand overflow-hidden py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-brand-sand">
                      <p className="text-[10px] text-brand-dark/45 font-bold uppercase tracking-wider">Signed in as</p>
                      <p className="text-xs font-bold text-brand-ocean truncate">{user.email}</p>
                    </div>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-brand-primary hover:bg-brand-sand/30"
                      >
                        <ShieldCheck className="w-4.5 h-4.5" />
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-bold hover:bg-brand-sand/30"
                    >
                      <User className="w-4.5 h-4.5 text-brand-ocean" />
                      My Profile
                    </Link>
                    <Link
                      to="/my-orders"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-bold hover:bg-brand-sand/30"
                    >
                      <ShoppingCart className="w-4.5 h-4.5 text-brand-ocean" />
                      My Orders
                    </Link>
                    <button
                      onClick={handleLogoutClick}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 text-left border-t border-brand-sand mt-1 cursor-pointer"
                    >
                      <LogOut className="w-4.5 h-4.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 bg-brand-primary hover:bg-brand-secondary text-brand-cream px-4 py-2 rounded-xl font-bold text-xs md:text-sm shadow-md transition-colors"
              >
                <User className="w-4 h-4" />
                Login
              </Link>
            )}

            {/* Mobile Hamburger (Only visible on tablet & mobile) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-brand-primary/20 rounded-full transition-colors cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Search & Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-brand-primary/15 py-4 space-y-4">
            {/* Search Input for Mobile */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dry fish, pickles, masalas..."
                className="w-full bg-brand-cream text-brand-dark px-4 py-2 pl-10 rounded-xl text-sm focus:outline-none"
              />
              <Search className="w-4 h-4 text-brand-dark/50 absolute left-3.5 top-3" />
            </form>

            <div className="flex flex-col gap-3 font-semibold text-sm px-1">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-secondary transition-colors">
                Home
              </Link>
              <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-secondary transition-colors">
                Shop Products
              </Link>
              <Link to="/offers" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-secondary transition-colors">
                Active Offers
              </Link>
              <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-secondary transition-colors">
                Wishlist
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
