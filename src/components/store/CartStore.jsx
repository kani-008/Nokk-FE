import { create } from "zustand";
import { persist } from "zustand/middleware";
import API from "../../ApiCall/Api.jsx";
import { useAuthStore } from "./AuthStore.jsx";

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
const logAction = (set, get, actionType, message, details) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp,
    type: actionType, // 'add' | 'update' | 'remove' | 'clear' | 'coupon' | 'sync'
    message,
    details
  };

  const colors = {
    add: "#10b981",    // Emerald
    update: "#3b82f6", // Blue
    remove: "#ef4444", // Red
    clear: "#6b7280",  // Gray
    coupon: "#8b5cf6", // Violet
    sync: "#f59e0b"    // Amber
  };
  const color = colors[actionType] || "#000000";
  console.log(
    `%c[Cart Log] %c${actionType.toUpperCase()}%c: ${message}`,
    "color: #888; font-weight: normal;",
    `color: ${color}; font-weight: bold;`,
    "color: inherit;",
    details
  );

  set((state) => ({
    logs: [logEntry, ...(state.logs || [])].slice(0, 100)
  }));

  // Send the log to the backend console terminal (works for guest and authenticated user)
  const userId = useAuthStore.getState().user?.id || "GUEST";
  API.post("/cart/log", { actionType, message, details, userId }).catch(() => {});
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      // ── state ──────────────────────────────────────────────────────
      items:  [],
      coupon: null,
      logs:   [],

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
      setItems: (items) => {
        const oldItems = get().items;
        set({ items });
        logAction(set, get, "sync", `Sync/Load Cart items: set to ${items.length} items`, {
          previousCount: oldItems.length,
          newCount: items.length,
          items: items.map(i => ({ name: i.productName, qty: i.quantity, price: i.price }))
        });
      },
      setCoupon: (coupon) => {
        set({ coupon });
        logAction(set, get, "coupon", `Applied coupon: ${coupon.code}`, {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount: coupon.discountAmount
        });
      },
      removeCoupon: () => {
        const prevCoupon = get().coupon;
        set({ coupon: null });
        logAction(set, get, "coupon", `Removed coupon: ${prevCoupon?.code || "none"}`, {
          removedCoupon: prevCoupon
        });
      },

      // alias used by ProductDetails.jsx and Wishlist.jsx
      addItem: (item) => get().addItemLocal(item),

      addItemLocal: (item) => {
        const existing = get().items.find((i) => i.variantId === item.variantId);
        const name = item.productName || item.name || "Unknown Product";
        const addQty = item.quantity ?? 1;

        if (existing) {
          set({
            items: get().items.map((i) =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + addQty }
                : i
            ),
          });
          logAction(set, get, "add", `Increased quantity of ${name} by ${addQty}`, {
            productId: item.productId,
            variantId: item.variantId,
            productName: name,
            previousQty: existing.quantity,
            addedQty: addQty,
            newQty: existing.quantity + addQty,
            price: item.price
          });
        } else {
          set({ items: [...get().items, { ...item, quantity: addQty }] });
          logAction(set, get, "add", `Added ${name} to cart (Qty: ${addQty})`, {
            productId: item.productId,
            variantId: item.variantId,
            productName: name,
            quantity: addQty,
            price: item.price
          });
        }
      },

      updateQtyLocal: (variantId, quantity) => {
        const existing = get().items.find((i) => i.variantId === variantId);
        if (!existing) return;
        const name = existing.productName || existing.name || "Unknown Product";

        if (quantity < 1) {
          get().removeItemLocal(variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        });
        logAction(set, get, "update", `Updated quantity of ${name} to ${quantity}`, {
          productId: existing.productId,
          variantId: variantId,
          productName: name,
          previousQty: existing.quantity,
          newQty: quantity,
          price: existing.price
        });
      },

      removeItemLocal: (variantId) => {
        const existing = get().items.find((i) => i.variantId === variantId);
        if (!existing) return;
        const name = existing.productName || existing.name || "Unknown Product";

        set({ items: get().items.filter((i) => i.variantId !== variantId) });
        logAction(set, get, "remove", `Removed ${name} from cart`, {
          productId: existing.productId,
          variantId: variantId,
          productName: name,
          quantityAtRemoval: existing.quantity,
          price: existing.price
        });
      },

      clearCartLocal: () => {
        const prevItemsCount = get().items.length;
        set({ items: [], coupon: null });
        logAction(set, get, "clear", `Cleared cart and removed coupons`, {
          clearedItemsCount: prevItemsCount
        });
      },

      clearLogs: () => {
        set({ logs: [] });
      },
    }),
    {
      name: "nok-cart",
      partialize: (state) => ({ items: state.items, coupon: state.coupon, logs: state.logs }),
    }
  )
);