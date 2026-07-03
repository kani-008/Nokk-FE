import { create } from "zustand";
import { persist } from "zustand/middleware";
import API from "../../ApiCall/Api.jsx";
import { useAuthStore, logoutListeners } from "./AuthStore.jsx";

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
  const isGuest = userId === "GUEST";
  const isProduction = import.meta.env.PROD;

  // Gate: do not run for guests in production
  if (isGuest && isProduction) {
    return;
  }

  // Confirm we don't transmit cart contents for unauthenticated sessions
  const logDetails = isGuest ? undefined : details;

  API.post("/cart/log", { actionType, message, details: logDetails, userId }).catch(() => {});
};

const checkCouponEligibility = (set, get) => {
  const coupon = get().coupon;
  if (!coupon) return;
  const sub = get().subtotal();
  const minOrderVal = coupon.minOrder !== undefined ? coupon.minOrder : (coupon.minOrderValue ?? 0);
  if (sub < minOrderVal) {
    set({ coupon: null });
    logAction(set, get, "coupon", `Coupon ${coupon.code} removed because subtotal ₹${sub} is below min order ₹${minOrderVal}`, { subtotal: sub, minOrder: minOrderVal });
  } else {
    // Recompute discountAmount and update it in state
    let discountAmount = 0;
    const discountPercent = coupon.discountPercent !== undefined ? coupon.discountPercent : (coupon.discountType === "percentage" ? coupon.discountValue : 0);
    const discountFlat = coupon.discountFlat !== undefined ? coupon.discountFlat : (coupon.discountType === "flat" ? coupon.discountValue : 0);

    if (discountPercent > 0) {
      discountAmount = (sub * discountPercent) / 100;
    } else if (discountFlat > 0) {
      discountAmount = discountFlat;
    }
    discountAmount = parseFloat(Math.min(discountAmount, sub).toFixed(2));
    if (coupon.discountAmount !== discountAmount) {
      set({
        coupon: {
          ...coupon,
          discountAmount
        }
      });
    }
  }
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

      discount: () => {
        const coupon = get().coupon;
        if (!coupon) return 0;
        const sub = get().subtotal();
        const minOrderVal = coupon.minOrder !== undefined ? coupon.minOrder : (coupon.minOrderValue ?? 0);
        if (sub < minOrderVal) return 0;
        let discountAmount = 0;
        const discountPercent = coupon.discountPercent !== undefined ? coupon.discountPercent : (coupon.discountType === "percentage" ? coupon.discountValue : 0);
        const discountFlat = coupon.discountFlat !== undefined ? coupon.discountFlat : (coupon.discountType === "flat" ? coupon.discountValue : 0);

        if (discountPercent > 0) {
          discountAmount = (sub * discountPercent) / 100;
        } else if (discountFlat > 0) {
          discountAmount = discountFlat;
        }
        return parseFloat(Math.min(discountAmount, sub).toFixed(2));
      },

      // delivery config — set once on mount from /api/settings
      freeShippingThreshold: 500,
      flatDeliveryCharge:    50,
      setDeliveryConfig: (threshold, charge) =>
        set({ freeShippingThreshold: threshold, flatDeliveryCharge: charge }),

      total: () => {
        const { subtotal, discount, freeShippingThreshold, flatDeliveryCharge } = get();
        const shipping = subtotal() >= freeShippingThreshold ? 0 : flatDeliveryCharge;
        return subtotal() - discount() + shipping;
      },

      shipping: () => {
        const { subtotal, freeShippingThreshold, flatDeliveryCharge } = get();
        return subtotal() >= freeShippingThreshold ? 0 : flatDeliveryCharge;
      },

      // ── mutations ──────────────────────────────────────────────────
      setItems: (items) => {
        const oldItems = get().items;
        set({ items });
        logAction(set, get, "sync", `Sync/Load Cart items: set to ${items.length} items`, {
          previousCount: oldItems.length,
          newCount: items.length,
          items: items.map(i => ({ name: i.productName, qty: i.quantity, price: i.price }))
        });
        checkCouponEligibility(set, get);
      },
      setCoupon: (coupon) => {
        if (!coupon) {
          set({ coupon: null });
          return;
        }
        // Normalize coupon object to support all layouts
        const normalizedCoupon = {
          ...coupon,
          discountType: coupon.discountPercent > 0 || coupon.discountType === "percentage" ? "percentage" : "flat",
          discountValue: coupon.discountPercent > 0 ? coupon.discountPercent : (coupon.discountFlat > 0 ? coupon.discountFlat : (coupon.discountValue ?? 0)),
          minOrder: coupon.minOrder !== undefined ? coupon.minOrder : (coupon.minOrderValue ?? 0),
          minOrderValue: coupon.minOrder !== undefined ? coupon.minOrder : (coupon.minOrderValue ?? 0),
          discountPercent: coupon.discountPercent !== undefined ? coupon.discountPercent : (coupon.discountType === "percentage" ? coupon.discountValue : 0),
          discountFlat: coupon.discountFlat !== undefined ? coupon.discountFlat : (coupon.discountType === "flat" ? coupon.discountValue : 0),
        };
        
        // Compute initial discountAmount
        const sub = get().subtotal();
        let discountAmount = 0;
        if (normalizedCoupon.discountPercent > 0) {
          discountAmount = (sub * normalizedCoupon.discountPercent) / 100;
        } else if (normalizedCoupon.discountFlat > 0) {
          discountAmount = normalizedCoupon.discountFlat;
        }
        normalizedCoupon.discountAmount = parseFloat(Math.min(discountAmount, sub).toFixed(2));

        set({ coupon: normalizedCoupon });
        logAction(set, get, "coupon", `Applied coupon: ${normalizedCoupon.code}`, {
          code: normalizedCoupon.code,
          discountType: normalizedCoupon.discountType,
          discountValue: normalizedCoupon.discountValue,
          discountAmount: normalizedCoupon.discountAmount
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
        checkCouponEligibility(set, get);
      },

      updateQtyLocal: (variantId, quantity) => {
        const existing = get().items.find((i) => i.variantId === variantId);
        if (!existing) return;
        const name = existing.productName || existing.name || "Unknown Product";

        const clamped = Math.max(1, Math.min(3, quantity));
        set({
          items: get().items.map((i) =>
            i.variantId === variantId ? { ...i, quantity: clamped } : i
          ),
        });
        logAction(set, get, "update", `Updated quantity of ${name} to ${clamped}`, {
          productId: existing.productId,
          variantId: variantId,
          productName: name,
          previousQty: existing.quantity,
          newQty: clamped,
          price: existing.price
        });
        checkCouponEligibility(set, get);
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
        checkCouponEligibility(set, get);
      },

      // Scales every cart row sharing this comboId together — never lets a
      // single member's quantity drift out of sync with the rest of the group.
      updateComboQtyLocal: (comboId, comboQty) => {
        const clamped = Math.max(1, comboQty);
        set({
          items: get().items.map((i) =>
            i.comboId === comboId && i.comboBaseQty
              ? { ...i, quantity: i.comboBaseQty * clamped }
              : i
          ),
        });
        logAction(set, get, "update", `Updated combo quantity to ${clamped}`, { comboId, newComboQty: clamped });
        checkCouponEligibility(set, get);
      },

      // Removes every cart row sharing this comboId in one go — a customer
      // must never end up with only part of a combo priced individually.
      removeComboLocal: (comboId) => {
        set({ items: get().items.filter((i) => i.comboId !== comboId) });
        logAction(set, get, "remove", `Removed combo from cart`, { comboId });
        checkCouponEligibility(set, get);
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

if (logoutListeners) {
  logoutListeners.push(() => {
    useCartStore.getState().clearCartLocal();
  });
}