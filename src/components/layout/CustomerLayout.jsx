import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";
import { useAuthStore } from "../store/AuthStore";
import { useCartStore } from "../store/CartStore";
import { useWishlistStore } from "../store/WishlistStore";
import { usePublicSettings } from "../../hookqueries/useSettings";
import API from "../../ApiCall/Api.jsx";
import {
  applyTheme,
  applyBackgroundColor,
  applySurfaceColor,
  applyTextColor
} from "../Theme.js";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [pathname]);
  return null;
}

export default function CustomerLayout() {
  const location = useLocation();
  const isAuthPage     = location.pathname === "/login" || location.pathname === "/register";
  const isCheckoutPage = location.pathname.startsWith("/checkout");
  // footer hidden on mobile for auth + shopping-flow pages where bottom UX is self-contained
  const isNoFooterMobile = isAuthPage
    || isCheckoutPage
    || location.pathname === "/cart"
    || location.pathname === "/wishlist"
    || location.pathname === "/my-orders"
    || location.pathname === "/profile";

  const { token, isAuthenticated } = useAuthStore();
  const { data: settings } = usePublicSettings();

  // Dynamically apply dynamic storefront color configured in settings
  useEffect(() => {
    const pColor = settings?.primaryColor || settings?.themeColor;
    if (pColor) {
      applyTheme(pColor);
    }
  }, [settings?.primaryColor, settings?.themeColor]);

  useEffect(() => {
    if (settings?.backgroundColor) {
      applyBackgroundColor(settings.backgroundColor);
    }
  }, [settings?.backgroundColor]);

  useEffect(() => {
    if (settings?.surfaceColor) {
      applySurfaceColor(settings.surfaceColor);
    }
  }, [settings?.surfaceColor]);

  useEffect(() => {
    if (settings?.textColor) {
      applyTextColor(settings.textColor);
    }
  }, [settings?.textColor]);

  // Announcement strip adds ~24px on sm+ → offset changes when it is on/off
  const announcementOn = !!settings?.announcementEnabled;

  useEffect(() => {
    if (isAuthenticated && token) {
      const syncAndLoad = async () => {
        // 1. Sync local cart items to server — all in parallel, ignore individual failures
        const localItems = useCartStore.getState().items;
        const guestItems = localItems.filter((item) => !item.itemId);
        if (guestItems.length > 0) {
          await Promise.all(
            guestItems.map((item) =>
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

        // 3. Sync and merge local guest wishlist items to server
        const localWishlistIds = useWishlistStore.getState().ids;
        try {
          let res;
          if (localWishlistIds.length > 0) {
            res = await API.post("/wishlist/merge", { productIds: localWishlistIds });
          } else {
            res = await API.get("/wishlist/get-wishlist");
          }
          console.log(res.data);
          const serverIds = (res.data.wishlist ?? []).map((i) => i.productId);
          const merged = Array.from(new Set([...useWishlistStore.getState().ids, ...serverIds]));
          useWishlistStore.getState().setIds(merged);
        } catch (err) {
          console.error("sync/load wishlist failed:", err);
        }
      };

      syncAndLoad();
    }
  // token is intentionally excluded: Api.jsx always reads the latest token from the store
  // via the request interceptor, so we don't need to re-run the sync on every silent
  // token refresh (which would cause a second redundant cart/wishlist fetch).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-page)" }}>
      <ScrollToTop />
      {/* 
        The top navigation bar is commented/hidden on mobile for checkout pages (address, summary, payment)
        but is restored on desktop viewports.
      */}
      {isCheckoutPage ? (
        <div className="hidden md:block">
          <NavBar />
        </div>
      ) : (
        <NavBar />
      )}
      {/*
        Padding offsets the fixed NavBar height:
          - NavBar always visible → pt-16 (mobile) / pt-[88px] (sm+)
          - If isCheckoutPage, top navbar is hidden on mobile (so no top padding)
            but visible on desktop (needs md:pt-[88px] offset).
      */}
      <main className={`flex-1 ${
        isCheckoutPage
          ? announcementOn ? "md:pt-[86px]" : "md:pt-16"
          : announcementOn ? "pt-[86px]" : "pt-16"
      }`}>
        <Outlet />
      </main>
      {/* Hide footer on mobile for auth + focused shopping-flow pages */}
      <div className={isNoFooterMobile ? "hidden md:block" : "block"}>
        <Footer />
      </div>
    </div>
  );
}