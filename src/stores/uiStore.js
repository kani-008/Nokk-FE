import { create } from 'zustand';

export const useUIStore = create((set) => ({
  isCartDrawerOpen: false,
  openCartDrawer: () => set({ isCartDrawerOpen: true }),
  closeCartDrawer: () => set({ isCartDrawerOpen: false }),
  toggleCartDrawer: () => set((state) => ({ isCartDrawerOpen: !state.isCartDrawerOpen })),
  
  isMobileFilterOpen: false,
  openMobileFilter: () => set({ isMobileFilterOpen: true }),
  closeMobileFilter: () => set({ isMobileFilterOpen: false })
}));
