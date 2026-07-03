import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Loader2 } from "lucide-react";

/* Layouts & Guards */
import CustomerLayout from "./components/layout/CustomerLayout";
import ProtectedRoute from "./components/route/ProtectedRoute";
import { usePublicSettings } from "./hookqueries/useSettings";

/* Shown to customers when admin enables Maintenance Mode */
function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sandal-50 px-6 text-center">
      <span className="text-5xl mb-6">🐟</span>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900 mb-3">
        We'll be back soon!
      </h1>
      <p className="font-body text-sm text-amber-700 max-w-sm">
        Namma Oor Karuvattu Kadai is undergoing scheduled maintenance.
        Thank you for your patience — we'll be up shortly.
      </p>
    </div>
  );
}

/* Wraps all customer-facing routes; redirects to maintenance page when enabled */
function CustomerRoutes() {
  const { data: settings = {}, isLoading } = usePublicSettings();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sandal-50">
        <Loader2 className="animate-spin text-amber-500" size={28} />
      </div>
    );
  }

  if (settings.maintenanceMode === true) {
    return <MaintenancePage />;
  }

  return <CustomerLayout />;
}

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
import ReviewsOverview from "./pages/ReviewsOverview";
import ProductReviewsPage from "./pages/ProductReviewsPage";

/* Cart & Checkout Features */
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import ReviewPage from "./components/orders/ReviewPage";

/* Lazy Loaded Admin Pages (reduces initial bundle size) */
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const ProductManagement = lazy(() => import("./pages/admin/ProductManagement"));
const OrderManagement = lazy(() => import("./pages/admin/OrderManagement"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const OfferManagement = lazy(() => import("./pages/admin/OfferManagement"));
const CouponManagement = lazy(() => import("./pages/admin/CouponManagement"));
const BannerManagement = lazy(() => import("./pages/admin/BannerManagement"));
const InventoryManagement = lazy(() => import("./pages/admin/InventoryManagement"));
const ReportManagement = lazy(() => import("./pages/admin/ReportManagement"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const ReviewManagement = lazy(() => import("./pages/admin/ReviewManagement"));
const CategoryManagement = lazy(() => import("./pages/admin/CategoryManagement"));

export default function App() {
  return (
    <HelmetProvider>
    <BrowserRouter>
      <Routes>

        {/* Public Customer Routes — CustomerRoutes enforces maintenance mode */}
        <Route element={<CustomerRoutes />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/reviews" element={<ReviewsOverview />} />
          <Route path="/reviews/:slug" element={<ProductReviewsPage />} />

          {/* Protected Customer Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout/:stepParam?" element={<Checkout />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/my-orders/review" element={<ReviewPage />} />
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
            <Route path="categories" element={<CategoryManagement />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="reviews" element={<ReviewManagement />} />
            <Route path="reviews/:productId" element={<ReviewManagement />} />
            <Route path="offers" element={<OfferManagement />} />
            <Route path="coupons" element={<CouponManagement />} />
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
    </HelmetProvider>
  );
}