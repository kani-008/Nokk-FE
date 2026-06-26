import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";
import { useAuthStore } from "../store/AuthStore";
import { useCartStore } from "../store/CartStore";
import { useWishlistStore } from "../store/WishlistStore";

import API from "../../ApiCall/Api.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [pathname]);
  return null;
}

export default function CustomerLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  const { token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && token) {
      const syncAndLoad = async () => {
        // 1. Sync local cart items to server — all in parallel, ignore individual failures
        const localItems = useCartStore.getState().items;
        if (localItems.length > 0) {
          await Promise.all(
            localItems.map((item) =>
              API.post("/cart/add-item", { variantId: item.variantId, quantity: item.quantity }).catch(() => {})
            )
          );
        }

        // 2. Load cart from server
        try {
          const res = await API.get("/cart/get-cart");
          const serverItems = (res.data.cart?.items ?? []).map((i) => ({
            itemId:       i.itemId,
            variantId:    i.variantId,
            productId:    i.productId,
            productName:  i.nameEn ?? i.name,
            nameTa:       i.nameTa,
            image:        i.primaryImage,
            price:        i.price,
            comparePrice: i.comparePrice,
            weight:       i.weightLabel,
            quantity:     i.quantity,
            slug:         i.slug,
            inStock:      i.inStock,
          }));
          useCartStore.getState().setItems(serverItems);
        } catch (err) {
          console.error("loadFromServer cart failed:", err);
        }

        // 3. Load wishlist from server
        try {
          const res = await API.get("/wishlist/get-wishlist");
          console.log(res.data);
          const serverIds = (res.data.wishlist ?? []).map((i) => i.productId);
          const merged = Array.from(new Set([...useWishlistStore.getState().ids, ...serverIds]));
          useWishlistStore.getState().setIds(merged);
        } catch (err) {
          console.error("loadFromServer wishlist failed:", err);
        }
      };

      syncAndLoad();
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