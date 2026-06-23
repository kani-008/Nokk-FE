import { BrowserRouter, Routes, Route } from "react-router-dom";
/* Customer Layouts */
import CustomerLayout from "./components/layout/CustomerLayout";
/* Route Guard */
import ProtectedRoute from "./components/route/ProtectedRoute";
/* Customer Pages */
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import Profile from "./pages/profile";
import Wishlist from "./pages/Wishlist";
import Offers from "./pages/Offers";
/* Admin Pages */
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import ProductManagement from "./pages/admin/ProductManagement";
import OrderManagement from "./pages/admin/OrderManagement";
import UserManagement from "./pages/admin/UserManagement";
import OfferManagement from "./pages/admin/OfferManagement";
import BannerManagement from "./pages/admin/BannerManagement";
import InventoryManagement from "./pages/admin/InventoryManagement";
import ReportManagement from "./pages/admin/ReportManagement";
import Settings from "./pages/admin/Settings";
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

          {/* Protected Customer Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/wishlist" element={<Wishlist />} />
          </Route>
        </Route>

        {/* Admin Protected Routes */}
        <Route element={<ProtectedRoute adminOnly redirectTo="/login" />}>
          <Route path="/admin" element={<AdminLayout />}>
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