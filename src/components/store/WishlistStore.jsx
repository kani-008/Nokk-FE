import { create } from "zustand";
import { persist } from "zustand/middleware";
import { wishlistApi } from "../../ApiCall/Api";

/*
  Wishlist stores product IDs locally so the heart icon works
  instantly without a network call.

  When the user is logged in the toggle is also sent to the server
  so the wishlist persists across devices.
*/

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      // ── state ──────────────────────────────────────────────────────
      // Array of productId strings
      ids: [],

      // ── read ───────────────────────────────────────────────────────
      isWishlisted: (productId) => get().ids.includes(productId),

      count: () => get().ids.length,

      // ── toggle — optimistic local update + optional server sync ────
      toggle: async (productId, token = null) => {
        const already = get().ids.includes(productId);

        // Optimistic local update first — instant UI feedback
        set({
          ids: already
            ? get().ids.filter((id) => id !== productId)
            : [...get().ids, productId],
        });

        // Sync to server if logged in
        if (token) {
          try {
            if (already) {
              // remove
              await wishlistApi.remove(productId, token);
            } else {
              // add — API POST /api/wishlist { productId }
              await wishlistApi.toggle({ productId }, token);
            }
          } catch {
            // rollback on server failure
            set({
              ids: already
                ? [...get().ids, productId]   // re-add
                : get().ids.filter((id) => id !== productId), // re-remove
            });
          }
        }
      },

      // ── load FROM server after login ───────────────────────────────
      // Merges server list with local — union so nothing is lost
      loadFromServer: async (token) => {
        try {
          const res = await wishlistApi.get(token);
          // API shape: { success, wishlist: { items[]: { productId, product{...} } } }
          const serverIds = (res.wishlist?.items ?? []).map((i) => i.productId);
          if (!serverIds.length) return;

          const merged = Array.from(new Set([...get().ids, ...serverIds]));
          set({ ids: merged });
        } catch {
          // stay with local ids on error
        }
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