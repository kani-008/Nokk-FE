import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch, API_URL } from "../../ApiCall/Api";
import { useAuthStore } from "./AuthStore";

const WISHLIST_BASE = `${API_URL}/wishlist`;

const wishlistApi = {
  get: () =>
    apiFetch(`${WISHLIST_BASE}/get-wishlist`),
  add: (productId) =>
    apiFetch(`${WISHLIST_BASE}/add-item`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    }),
  remove: (productId) =>
    apiFetch(`${WISHLIST_BASE}/remove-item`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    }),
};

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
      toggle: async (productId) => {
        const already = get().ids.includes(productId);

        // Optimistic local update first — instant UI feedback
        set({
          ids: already
            ? get().ids.filter((id) => id !== productId)
            : [...get().ids, productId],
        });

        // Sync to server if logged in
        const token = useAuthStore.getState().token;
        if (token) {
          try {
            if (already) {
              await wishlistApi.remove(productId);
            } else {
              await wishlistApi.add(productId);
            }
          } catch (err) {
            console.error("wishlist toggle server sync failed:", err);
            // rollback on server failure
            set({
              ids: already
                ? [...get().ids, productId]   // re-add
                : get().ids.filter((id) => id !== productId), // re-remove
            });
            throw err;
          }
        }
      },

      // ── load FROM server after login ───────────────────────────────
      loadFromServer: async (token) => {
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
          const res = await apiFetch(`${WISHLIST_BASE}/get-wishlist`, { headers });
          // API shape: { success, wishlist: [{ productId, ... }] }
          const serverIds = (res.wishlist ?? []).map((i) => i.productId);
          const merged = Array.from(new Set([...get().ids, ...serverIds]));
          set({ ids: merged });
        } catch (err) {
          console.error("loadFromServer failed:", err);
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