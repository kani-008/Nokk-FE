import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Reusable Shared Layout Components
import AnnouncementBar from './components/AnnouncementBar';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import CartDrawer from './components/CartDrawer';
import Toast from './components/Toast';

// Customer Facing Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import Offers from './pages/Offers';

// Admin Panel Layout & Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';
import AdminOffers from './pages/admin/Offers';
import AdminBanners from './pages/admin/Banners';
import AdminInventory from './pages/admin/Inventory';
import AdminReports from './pages/admin/Reports';
import AdminSettings from './pages/admin/Settings';

// Initialize React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false
    }
  }
});

// Layout wrapper for customer facing pages
function CustomerLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-grow pt-2.5">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
      <WhatsAppButton />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        {/* Global UI Components */}
        <Toast />
        <CartDrawer />

        <Routes>
          {/* Customer Facing Routes */}
          <Route element={<CustomerLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/offers" element={<Offers />} />
          </Route>

          {/* Admin Protected Panel Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="offers" element={<AdminOffers />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Catch All Redirect */}
          <Route path="*" element={<Home />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
