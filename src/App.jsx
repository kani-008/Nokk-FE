import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

/* Layouts & Guards */
import CustomerLayout from "./components/layout/CustomerLayout";
import ProtectedRoute from "./components/route/ProtectedRoute";

/* Core / Home Page */
import Home from "./pages/Home";

/* Authentication & Profile Features */
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/profile";

/* Catalog & Shopping Features */
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetails";
import Wishlist from "./pages/Wishlist";
import Offers from "./pages/Offers";

/* Cart & Checkout Features */
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";

/* Lazy Loaded Admin Pages (reduces initial bundle size) */
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const ProductManagement = lazy(() => import("./pages/admin/ProductManagement"));
const OrderManagement = lazy(() => import("./pages/admin/OrderManagement"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const OfferManagement = lazy(() => import("./pages/admin/OfferManagement"));
const BannerManagement = lazy(() => import("./pages/admin/BannerManagement"));
const InventoryManagement = lazy(() => import("./pages/admin/InventoryManagement"));
const ReportManagement = lazy(() => import("./pages/admin/ReportManagement"));
const Settings = lazy(() => import("./pages/admin/Settings"));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Customer Routes */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/wishlist" element={<Wishlist />} />

          {/* Protected Customer Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Admin Protected Routes */}
        <Route element={<ProtectedRoute adminOnly redirectTo="/login" />}>
          <Route
            path="/admin"
            element={
              <Suspense
                fallback={
                  <div className="min-h-screen flex flex-col items-center justify-center bg-sandal-50">
                    <Loader2 className="animate-spin text-amber-500 mb-2" size={32} />
                    <p className="font-body text-sm text-amber-600 font-semibold">Loading Admin Panel...</p>
                  </div>
                }
              >
                <AdminLayout />
              </Suspense>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="offers" element={<OfferManagement />} />
            <Route path="banners" element={<BannerManagement />} />
            <Route path="inventory" element={<InventoryManagement />} />
            <Route path="reports" element={<ReportManagement />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
        {/* Catch-all */}
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}