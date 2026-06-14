import { create } from 'zustand';

export const useWishlistStore = create((set, get) => ({
  wishlistItems: (() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nok_wishlist');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  })(),

  toggleWishlist: (productId) => {
    const currentList = get().wishlistItems;
    let newList;
    
    if (currentList.includes(productId)) {
      newList = currentList.filter(id => id !== productId);
    } else {
      newList = [...currentList, productId];
    }

    localStorage.setItem('nok_wishlist', JSON.stringify(newList));
    set({ wishlistItems: newList });
  },

  isInWishlist: (productId) => {
    return get().wishlistItems.includes(productId);
  }
}));
