import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Store, ShoppingBag, ClipboardList, User } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';

export default function BottomNav() {
  const location = useLocation();
  const { items } = useCartStore();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const isActive = (path) => location.pathname === path;
  
  const linkClasses = (path) => `flex flex-col items-center justify-center gap-1 flex-1 text-[10px] font-bold ${
    isActive(path) ? 'text-brand-secondary' : 'text-brand-cream/75 hover:text-brand-cream'
  }`;

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 bg-brand-ocean text-brand-cream border-t border-brand-primary/10 py-2.5 px-4 z-40 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.1)] pb-safe">
      <Link to="/" className={linkClasses('/')}>
        <Home className="w-5.5 h-5.5" />
        <span>Home</span>
      </Link>
      
      <Link to="/products" className={linkClasses('/products')}>
        <Store className="w-5.5 h-5.5" />
        <span>Products</span>
      </Link>
      
      <Link to="/cart" className={`${linkClasses('/cart')} relative`}>
        <div className="relative">
          <ShoppingBag className="w-5.5 h-5.5" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-brand-secondary text-brand-cream text-[9px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center font-space">
              {cartCount}
            </span>
          )}
        </div>
        <span>Cart</span>
      </Link>
      
      <Link to="/my-orders" className={linkClasses('/my-orders')}>
        <ClipboardList className="w-5.5 h-5.5" />
        <span>Orders</span>
      </Link>
      
      <Link to="/profile" className={linkClasses('/profile')}>
        <User className="w-5.5 h-5.5" />
        <span>Profile</span>
      </Link>
    </div>
  );
}
