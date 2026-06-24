import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      // ── state ──────────────────────────────────────────────────────
      // Array of productId strings
      ids: [],

      // ── read ───────────────────────────────────────────────────────
      isWishlisted: (productId) => get().ids.includes(productId),

      count: () => get().ids.length,

      // ── local mutators ─────────────────────────────────────────────
      setIds: (ids) => set({ ids }),

      addId: (productId) => {
        if (!get().ids.includes(productId)) {
          set({ ids: [...get().ids, productId] });
        }
      },

      removeId: (productId) => {
        set({ ids: get().ids.filter((id) => id !== productId) });
      },

      toggle: (productId) => {
        const already = get().ids.includes(productId);
        set({
          ids: already
            ? get().ids.filter((id) => id !== productId)
            : [...get().ids, productId],
        });
      },

      // ── clear (on logout) ──────────────────────────────────────────
      clear: () => set({ ids: [] }),
    }),
    {
      name: "nok-wishlist",
      partialize: (state) => ({ ids: state.ids }),
    }
  )
);