import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch, API_URL } from "../../ApiCall/Api";

const CART_BASE = `${API_URL}/cart`;
const COUPON_BASE = `${API_URL}/coupons`;

const cartApi = {
  get: (token) =>
    apiFetch(CART_BASE, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  add: (data, token) =>
    apiFetch(CART_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),
};

const couponApi = {
  validate: (data, token) =>
    apiFetch(`${COUPON_BASE}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),
};

/*
  Cart item shape (local):
  {
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

      // ── local mutations (work without login) ───────────────────────
      addItem: (item) => {
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
      },

      updateQty: (variantId, quantity) => {
        if (quantity < 1) {
          get().removeItem(variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        });
      },

      removeItem: (variantId) =>
        set({ items: get().items.filter((i) => i.variantId !== variantId) }),

      clearCart: () => set({ items: [], coupon: null }),

      // ── coupon ─────────────────────────────────────────────────────
      applyCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),

      // ── validate coupon via API ────────────────────────────────────
      validateCoupon: async (code, token) => {
        const res = await couponApi.validate(
          { code, subtotal: get().subtotal() },
          token
        );
        // API returns { success, coupon: { code, discountType, discountValue, discountAmount } }
        set({ coupon: res.coupon });
        return res.coupon;
      },

      // ── sync LOCAL cart → server after login ───────────────────────
      // Call this once right after login if local items exist
      syncToServer: async (token) => {
        const { items } = get();
        if (!items.length) return;
        for (const item of items) {
          try {
            await cartApi.add(
              { variantId: item.variantId, quantity: item.quantity },
              token
            );
          } catch {
            // ignore individual failures — server may already have the item
          }
        }
      },

      // ── load cart FROM server (after login / page refresh) ─────────
      // Merges server items into local, server wins on price
      loadFromServer: async (token) => {
        try {
          const res = await cartApi.get(token);
          // API shape: { success, cart: { id, items[] } }
          // item: { id, variantId, weightLabel, price, comparePrice, quantity, product{...} }
          const serverItems = (res.cart?.items ?? []).map((i) => ({
            variantId:    i.variantId,
            productId:    i.product?.id,
            productName:  i.product?.nameEn  ?? i.product?.name,
            nameTa:       i.product?.nameTa,
            image:        i.product?.primaryImage,
            price:        i.price,
            comparePrice: i.comparePrice,
            weight:       i.weightLabel,
            quantity:     i.quantity,
          }));

          if (serverItems.length) {
            set({ items: serverItems });
          }
        } catch {
          // stay with local items on error
        }
      },
    }),
    {
      name: "nok-cart",
      // only persist items + coupon, not function state
      partialize: (state) => ({ items: state.items, coupon: state.coupon }),
    }
  )
);