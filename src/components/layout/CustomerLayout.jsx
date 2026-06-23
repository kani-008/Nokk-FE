import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";
import { useAuthStore } from "../store/AuthStore";
import { useCartStore } from "../store/CartStore";
import { useWishlistStore } from "../store/WishlistStore";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [pathname]);
  return null;
}

export default function CustomerLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  const { token, isAuthenticated } = useAuthStore();
  const { loadFromServer: loadCart, syncToServer: syncCart } = useCartStore();
  const { loadFromServer: loadWishlist } = useWishlistStore();

  useEffect(() => {
    if (isAuthenticated && token) {
      syncCart(token).then(() => loadCart(token));
      loadWishlist(token);
    }
  }, [isAuthenticated, token]);

  return (
    <div className="min-h-screen flex flex-col bg-sandal-50">
      <ScrollToTop />
      <NavBar />
      <main className="flex-1">
        <Outlet />
      </main>
      {/* Hide footer on mobile view alone for the login and register pages */}
      <div className={isAuthPage ? "hidden md:block" : "block"}>
        <Footer />
      </div>
    </div>
  );
}