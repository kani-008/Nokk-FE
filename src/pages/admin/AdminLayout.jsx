import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingBag, ClipboardList, Users, Ticket, 
  Image, Layers, BarChart3, Settings, LogOut, ChevronLeft, 
  ChevronRight, ShieldCheck, User, Menu, X, ArrowLeft
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user, logout } = useAuthStore();
  const addToast = useToastStore(state => state.addToast);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Security guard - only allow Admin
  useEffect(() => {
    if (!isLoggedIn) {
      addToast('Please login to access the admin portal.', 'warning');
      navigate('/login');
      return;
    }
    if (user?.role !== 'admin') {
      addToast('Access Denied. Admin privileges required.', 'error');
      navigate('/');
    }
  }, [isLoggedIn, user, navigate]);

  if (!isLoggedIn || user?.role !== 'admin') return null;

  const navGroups = [
    {
      title: 'Core Management',
      items: [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/products', label: 'Products & Catalog', icon: ShoppingBag },
        { path: '/admin/orders', label: 'Orders Ledger', icon: ClipboardList },
        { path: '/admin/users', label: 'Customer Log', icon: Users },
        { path: '/admin/inventory', label: 'Inventory Stock', icon: Layers }
      ]
    },
    {
      title: 'Promotions',
      items: [
        { path: '/admin/offers', label: 'Offers & Coupons', icon: Ticket },
        { path: '/admin/banners', label: 'Hero Banners', icon: Image }
      ]
    },
    {
      title: 'Analytics & Settings',
      items: [
        { path: '/admin/reports', label: 'Sales Reports', icon: BarChart3 },
        { path: '/admin/settings', label: 'Global Settings', icon: Settings }
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    addToast('Signed out from admin session.', 'info');
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname.startsWith(path);
  };

  const linkClasses = (path) => `flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
    isActive(path)
      ? 'bg-brand-primary text-brand-cream shadow-sm scale-98'
      : 'text-brand-cream/75 hover:bg-brand-primary/10 hover:text-brand-cream'
  }`;

  return (
    <div className="min-h-screen bg-brand-cream/35 flex flex-col lg:flex-row font-inter">
      {/* 1. Mobile Admin Header */}
      <header className="lg:hidden bg-brand-ocean text-brand-cream px-4 py-3 flex items-center justify-between border-b border-brand-primary/10 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-brand-primary p-1.5 rounded-full text-brand-cream">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-tiro-tamil text-sm font-bold text-brand-secondary">Admin Kadai</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1 hover:bg-brand-primary/20 rounded">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* 2. Left Sidebar (Desktop / Mobile overlay) */}
      <aside
        className={`bg-brand-ocean text-brand-cream border-r border-brand-primary/10 flex flex-col justify-between shrink-0 transition-all duration-300 z-30 ${
          collapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          mobileOpen ? 'fixed inset-y-0 left-0 w-64 block' : 'hidden lg:flex'
        }`}
      >
        {/* Logo Section */}
        <div className="p-5 border-b border-brand-cream/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="bg-brand-primary text-brand-cream p-2 rounded-xl shrink-0">
              <ShieldCheck className="w-5.5 h-5.5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-tiro-tamil text-sm font-bold leading-tight text-brand-secondary">
                  நிர்வாக குழு
                </span>
                <span className="text-[9px] text-brand-cream/60 font-bold uppercase tracking-wider font-space">Admin Console</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:block p-1 hover:bg-brand-primary/15 rounded text-brand-cream/70 hover:text-brand-cream"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Links Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6 no-scrollbar">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              {!collapsed && (
                <p className="text-[9px] font-bold text-brand-secondary uppercase tracking-widest px-4 mb-2">
                  {group.title}
                </p>
              )}
              {group.items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={idx}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={linkClasses(item.path)}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-4.5 h-4.5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-brand-cream/10 space-y-2 font-bold text-xs">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-brand-cream/75 hover:bg-brand-primary/10 hover:text-brand-cream"
          >
            <ArrowLeft className="w-4.5 h-4.5 shrink-0 text-brand-secondary" />
            {!collapsed && <span>Storefront</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-rose-300 hover:bg-rose-950/20 hover:text-rose-400 cursor-pointer text-left"
          >
            <LogOut className="w-4.5 h-4.5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Background Mask for Mobile Sidebar */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-brand-dark/60 backdrop-blur-xs z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 3. Main content area (Right) */}
      <main className="flex-1 flex flex-col min-w-0 max-w-full">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-brand-sand shadow-sm relative z-10 font-bold text-xs">
          <div>
            <p className="text-brand-dark/45">Welcome back, Admin</p>
            <h2 className="text-sm text-brand-ocean font-playfair font-bold">Selvam M. (Cooperative Head)</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-brand-sand text-brand-ocean px-3 py-1 rounded-xl text-[10px] font-bold border border-brand-sand/65">
              🛡️ Super Administrator
            </span>
            <div className="w-8 h-8 rounded-full bg-brand-primary text-brand-cream flex items-center justify-center font-bold text-xs border border-brand-sand shadow">
              AS
            </div>
          </div>
        </header>

        {/* Content Body Container */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
