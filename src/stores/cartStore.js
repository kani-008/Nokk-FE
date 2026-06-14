import { create } from 'zustand';
import { mockAPI } from '../data/mockData';

export const useCartStore = create((set, get) => ({
  items: (() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nok_cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  })(),
  appliedCoupon: (() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nok_applied_coupon');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  })(),
  couponError: null,

  addItem: (product, weight, price, quantity = 1) => {
    const items = [...get().items];
    const existingIndex = items.findIndex(
      item => item.productId === product.id && item.weight === weight
    );

    if (existingIndex > -1) {
      items[existingIndex].quantity += quantity;
    } else {
      items.push({
        id: `cart-${product.id}-${weight}-${Date.now()}`,
        productId: product.id,
        nameEn: product.nameEn,
        nameTa: product.nameTa,
        weight,
        price,
        quantity,
        image: product.image,
        slug: product.slug
      });
    }

    localStorage.setItem('nok_cart', JSON.stringify(items));
    set({ items });
  },

  removeItem: (itemId) => {
    const items = get().items.filter(item => item.id !== itemId);
    localStorage.setItem('nok_cart', JSON.stringify(items));
    set({ items });
    
    // Validate coupon applicability after removal
    get().revalidateCoupon();
  },

  updateQuantity: (itemId, quantity) => {
    if (quantity < 1) return;
    const items = get().items.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    );
    localStorage.setItem('nok_cart', JSON.stringify(items));
    set({ items });

    // Validate coupon applicability after quantity update
    get().revalidateCoupon();
  },

  clearCart: () => {
    localStorage.removeItem('nok_cart');
    localStorage.removeItem('nok_applied_coupon');
    set({ items: [], appliedCoupon: null, couponError: null });
  },

  applyCoupon: (code) => {
    const coupons = mockAPI.getCoupons();
    const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());

    if (!coupon) {
      set({ couponError: 'Invalid Coupon Code' });
      return false;
    }

    const subtotal = get().getCartSubtotal();
    if (subtotal < coupon.minOrder) {
      set({ couponError: `Minimum order of ₹${coupon.minOrder} required for this coupon` });
      return false;
    }

    localStorage.setItem('nok_applied_coupon', JSON.stringify(coupon));
    set({ appliedCoupon: coupon, couponError: null });
    return true;
  },

  removeCoupon: () => {
    localStorage.removeItem('nok_applied_coupon');
    set({ appliedCoupon: null, couponError: null });
  },

  revalidateCoupon: () => {
    const coupon = get().appliedCoupon;
    if (!coupon) return;

    const subtotal = get().getCartSubtotal();
    if (subtotal < coupon.minOrder) {
      // Auto-remove coupon since order value dropped below threshold
      get().removeCoupon();
    }
  },

  getCartSubtotal: () => {
    return get().items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  },

  getCartTotals: () => {
    const items = get().items;
    const coupon = get().appliedCoupon;
    const settings = mockAPI.getSettings();

    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    let discount = 0;
    if (coupon) {
      if (coupon.discountPercent > 0) {
        discount = Math.round((subtotal * coupon.discountPercent) / 100);
      } else if (coupon.discountFlat > 0) {
        discount = Math.min(coupon.discountFlat, subtotal);
      }
    }

    // Free delivery if subtotal after discount (or before? Let's check prompt: "Free Shipping above ₹500")
    // Usually based on subtotal.
    const freeShippingThreshold = settings.freeShippingThreshold || 500;
    const flatDeliveryCharge = settings.flatDeliveryCharge || 50;

    let deliveryCharge = subtotal >= freeShippingThreshold || (coupon && coupon.freeShipping) ? 0 : flatDeliveryCharge;
    if (subtotal === 0) deliveryCharge = 0;

    const total = Math.max(0, subtotal + deliveryCharge - discount);

    return {
      subtotal,
      deliveryCharge,
      discount,
      total
    };
  }
}));
