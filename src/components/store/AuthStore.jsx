import { create } from "zustand";
import { persist } from "zustand/middleware";

/*
  Auth store — keeps user + token in localStorage via persist.

  After login:
    1. call login(user, token) → sets auth state
    2. call cartStore.loadFromServer(token)     — sync server cart
    3. call wishlistStore.loadFromServer(token) — sync server wishlist
  These are called from the Login / Register pages so the stores
  stay decoupled (no circular imports).

  On logout:
    1. call logout() → clears auth state
    2. call cartStore.clearCart()      — wipe local cart
    3. call wishlistStore.clear()      — wipe local wishlist
  Again called from the header / logout handler.
*/

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ── state ──────────────────────────────────────────────────────
      user:            null,
      token:           null,
      refreshToken:    null,
      isAuthenticated: false,

      // ── derived ────────────────────────────────────────────────────
      isAdmin: () => get().user?.role === "admin",

      // ── actions ────────────────────────────────────────────────────
      login: (user, accessToken, refreshToken) =>
        set({ user, token: accessToken, refreshToken, isAuthenticated: true }),

      logout: () =>
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false }),

      setAccessToken: (accessToken) =>
        set({ token: accessToken }),

      updateUser: (updates) =>
        set({ user: { ...get().user, ...updates } }),
    }),
    {
      name: "nok-auth",
      partialize: (state) => ({
        user:            state.user,
        token:           state.token,
        refreshToken:    state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);