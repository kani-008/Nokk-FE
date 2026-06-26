import { create } from "zustand";
import { persist } from "zustand/middleware";

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
      setItems: (items) => set({ items }),
      setCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),

      // alias used by ProductDetails.jsx and Wishlist.jsx
      addItem: (item) => get().addItemLocal(item),

      addItemLocal: (item) => {
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

      updateQtyLocal: (variantId, quantity) => {
        if (quantity < 1) {
          get().removeItemLocal(variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        });
      },

      removeItemLocal: (variantId) => {
        set({ items: get().items.filter((i) => i.variantId !== variantId) });
      },

      clearCartLocal: () => set({ items: [], coupon: null }),
    }),
    {
      name: "nok-cart",
      partialize: (state) => ({ items: state.items, coupon: state.coupon }),
    }
  )
);