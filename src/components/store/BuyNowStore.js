import { create } from "zustand";

export const useBuyNowStore = create((set) => ({
  item: null,
  setItem: (item) => set({ item }),
  clearItem: () => set({ item: null }),
}));
