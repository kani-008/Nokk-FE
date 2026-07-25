import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useRecentlyViewedStore = create(
  persist(
    (set, get) => ({
      // Array of recently viewed product objects
      items: [],

      // Add a product object to recently viewed (most recent first, max 10)
      addRecentlyViewed: (product) => {
        if (!product || !product.id) return;
        const current = get().items || [];
        // remove existing entry of same product if present
        const filtered = current.filter((p) => p.id !== product.id);
        // prepend product and keep up to 10 items
        const updated = [product, ...filtered].slice(0, 10);
        set({ items: updated });
      },

      clearRecentlyViewed: () => set({ items: [] }),
    }),
    {
      name: "nammaoor_recently_viewed",
    }
  )
);
