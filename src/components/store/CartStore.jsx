import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch, API_URL } from "../../ApiCall/Api";
import { useAuthStore } from "./AuthStore";

const CART_BASE = `${API_URL}/cart`;
const COUPON_BASE = `${API_URL}/coupons`;

const cartApi = {
  get: () =>
    apiFetch(`${CART_BASE}/get-cart`),
  add: (data) =>
    apiFetch(`${CART_BASE}/add-item`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  update: (data) =>
    apiFetch(`${CART_BASE}/update-item`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  remove: (data) =>
    apiFetch(`${CART_BASE}/remove-item`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  clear: () =>
    apiFetch(`${CART_BASE}/clear-cart`, {
      method: "DELETE",
    }),
};

const couponApi = {
  validate: (data) =>
    apiFetch(`${COUPON_BASE}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
};

/*
  Cart item shape (local & mapped from server):
  {
    itemId:       number (optional, server only),
    variantId:    string,
    productId:    string,
    productName:  string,   // nameEn
    nameTa:       string,
    image:        string,   // primaryImage
    price:        number,   // variant.price
    comparePrice: number,
    weight:       string,   // variant.weightLabel  e.g. "250g"
    quantity:     number,
  }

  Coupon shape (from API /api/coupons/validate):
  {
    code:          string,
    discountType:  "percentage" | "flat",
    discountValue: number,
    discountAmount: number,   // resolved amount on current subtotal
  }
*/

export const useCartStore = create(
  persist(
    (set, get) => ({
      // ── state ──────────────────────────────────────────────────────
      items:  [],
      coupon: null,

      // ── derived (called as functions, not getters) ─────────────────
      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      discount: () =>
        get().coupon?.discountAmount ?? 0,

      total: () => {
        const { subtotal, discount } = get();
        const shipping = subtotal() >= 499 ? 0 : 60;
        return subtotal() - discount() + shipping;
      },

      shipping: () =>
        get().subtotal() >= 499 ? 0 : 60,

      // ── mutations ──────────────────────────────────────────────────
      addItem: async (item) => {
        const token = useAuthStore.getState().token;
        if (token) {
          try {
            const res = await cartApi.add({
              variantId: item.variantId,
              quantity: item.quantity ?? 1,
            });
            const serverItems = (res.cart?.items ?? []).map((i) => ({
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
            }));
            set({ items: serverItems });
          } catch (err) {
            console.error("addItem server sync failed:", err);
            throw err;
          }
        } else {
          // Local/guest session
          const existing = get().items.find((i) => i.variantId === item.variantId);
          if (existing) {
            set({
              items: get().items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
                  : i
              ),
            });
          } else {
            set({ items: [...get().items, { ...item, quantity: item.quantity ?? 1 }] });
          }
        }
      },

      updateQty: async (variantId, quantity) => {
        if (quantity < 1) {
          await get().removeItem(variantId);
          return;
        }
        const token = useAuthStore.getState().token;
        if (token) {
          const item = get().items.find((i) => i.variantId === variantId);
          if (!item || !item.itemId) return;
          try {
            const res = await cartApi.update({
              itemId: item.itemId,
              quantity,
            });
            const serverItems = (res.cart?.items ?? []).map((i) => ({
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
            }));
            set({ items: serverItems });
          } catch (err) {
            console.error("updateQty server sync failed:", err);
            throw err;
          }
        } else {
          set({
            items: get().items.map((i) =>
              i.variantId === variantId ? { ...i, quantity } : i
            ),
          });
        }
      },

      removeItem: async (variantId) => {
        const token = useAuthStore.getState().token;
        if (token) {
          const item = get().items.find((i) => i.variantId === variantId);
          if (!item || !item.itemId) return;
          try {
            const res = await cartApi.remove({
              itemId: item.itemId,
            });
            const serverItems = (res.cart?.items ?? []).map((i) => ({
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
            }));
            set({ items: serverItems });
          } catch (err) {
            console.error("removeItem server sync failed:", err);
            throw err;
          }
        } else {
          set({ items: get().items.filter((i) => i.variantId !== variantId) });
        }
      },

      clearCart: async () => {
        const token = useAuthStore.getState().token;
        if (token) {
          try {
            await cartApi.clear();
          } catch (err) {
            console.error("clearCart server sync failed:", err);
          }
        }
        set({ items: [], coupon: null });
      },

      // ── coupon ─────────────────────────────────────────────────────
      applyCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),

      // ── validate coupon via API ────────────────────────────────────
      validateCoupon: async (code) => {
        const res = await couponApi.validate({
          code,
          subtotal: get().subtotal(),
        });
        set({ coupon: res.coupon });
        return res.coupon;
      },

      // ── sync LOCAL cart → server after login ───────────────────────
      syncToServer: async (token) => {
        const { items } = get();
        if (!items.length) return;
        for (const item of items) {
          try {
            // Using raw axios post inside loop to avoid intercepting issues during auth bootstrap
            await apiFetch(`${CART_BASE}/add-item`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                variantId: item.variantId,
                quantity: item.quantity,
              }),
            });
          } catch {
            // ignore individual failures
          }
        }
      },

      // ── load cart FROM server ──────────────────────────────────────
      loadFromServer: async (token) => {
        try {
          // If token is explicitly passed (e.g. at login), map it manually or rely on interceptor
          const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
          const res = await apiFetch(`${CART_BASE}/get-cart`, { headers });
          const serverItems = (res.cart?.items ?? []).map((i) => ({
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
          }));
          set({ items: serverItems });
        } catch (err) {
          console.error("loadFromServer failed:", err);
        }
      },
    }),
    {
      name: "nok-cart",
      partialize: (state) => ({ items: state.items, coupon: state.coupon }),
    }
  )
);