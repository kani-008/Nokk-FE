import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { useUIStore } from '../stores/uiStore';
import QuantityStepper from './QuantityStepper';
import CouponInput from './CouponInput';

export default function CartDrawer() {
  const navigate = useNavigate();
  const { isCartDrawerOpen, closeCartDrawer } = useUIStore();
  const { items, removeItem, updateQuantity, getCartTotals } = useCartStore();

  const { subtotal, deliveryCharge, discount, total } = getCartTotals();

  // Close drawer on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') closeCartDrawer();
    };
    if (isCartDrawerOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isCartDrawerOpen, closeCartDrawer]);

  const handleCheckoutRedirect = () => {
    closeCartDrawer();
    navigate('/checkout');
  };

  const handleCartRedirect = () => {
    closeCartDrawer();
    navigate('/cart');
  };

  if (!isCartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-inter">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeCartDrawer}
      />

      {/* Sliding panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-brand-cream border-l border-brand-sand/65 shadow-2xl flex flex-col h-full transform transition-all duration-300">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-brand-sand flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-ocean flex items-center gap-2 font-playfair">
              <ShoppingBag className="w-5 h-5 text-brand-primary" />
              Your Basket ({items.reduce((acc, i) => acc + i.quantity, 0)})
            </h2>
            <button
              onClick={closeCartDrawer}
              className="p-1 hover:bg-brand-ocean/10 rounded-full text-brand-dark/70 hover:text-brand-dark transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Cart items list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-4 bg-brand-sand/30 rounded-full mb-4">
                  <ShoppingBag className="w-12 h-12 text-brand-dark/40" />
                </div>
                <h3 className="font-playfair text-lg font-bold text-brand-ocean">Your cart is empty</h3>
                <p className="text-sm text-brand-dark/60 mt-1 max-w-xs">
                  Fill it with traditional, sun-dried dry fish and spicy pickles direct from coastal Tamil Nadu.
                </p>
                <button
                  onClick={() => {
                    closeCartDrawer();
                    navigate('/products');
                  }}
                  className="mt-6 bg-brand-primary text-brand-cream px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-secondary active:scale-95 transition-all shadow-sm"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 bg-white border border-brand-sand p-3 rounded-2xl shadow-sm relative group hover:border-brand-primary/20 transition-all"
                >
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-brand-sand/10 border border-brand-sand shrink-0">
                    <img src={item.image} alt={item.nameEn} className="w-full h-full object-cover" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col">
                    <h4 className="font-tiro-tamil text-sm text-brand-primary font-bold leading-tight">
                      {item.nameTa}
                    </h4>
                    <h5 className="font-playfair text-xs font-semibold text-brand-dark/80 leading-snug">
                      {item.nameEn}
                    </h5>
                    <span className="text-[10px] bg-brand-sand text-brand-ocean font-bold font-space px-2 py-0.5 rounded-full w-max mt-1">
                      {item.weight}
                    </span>

                    {/* Stepper + Price */}
                    <div className="flex items-center justify-between mt-3">
                      <QuantityStepper
                        quantity={item.quantity}
                        onChange={(q) => updateQuantity(item.id, q)}
                        size="sm"
                      />
                      <span className="font-space text-sm font-bold text-brand-ocean">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute top-2 right-2 p-1 hover:bg-rose-50 text-brand-dark/40 hover:text-rose-600 rounded transition-colors cursor-pointer"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Checkout Summaries */}
          {items.length > 0 && (
            <div className="border-t border-brand-sand p-6 bg-white space-y-4">
              {/* Coupon code input inside drawer */}
              <CouponInput />

              {/* Order Summary details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-brand-dark/70 font-medium">
                  <span>Subtotal</span>
                  <span className="font-space font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount</span>
                    <span className="font-space">- ₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-brand-dark/70 font-medium">
                  <span>Delivery Charge</span>
                  <span className="font-space font-semibold">
                    {deliveryCharge === 0 ? (
                      <span className="text-emerald-700 font-bold uppercase text-xs">Free</span>
                    ) : (
                      `₹${deliveryCharge.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="border-t border-brand-sand pt-3 flex justify-between text-base font-bold text-brand-ocean">
                  <span>Total Payable</span>
                  <span className="font-space text-lg text-brand-primary">₹{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={handleCheckoutRedirect}
                  className="w-full bg-brand-primary text-brand-cream py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-secondary active:scale-98 transition-all shadow-md cursor-pointer text-sm"
                >
                  Proceed to Checkout <ArrowRight className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={handleCartRedirect}
                  className="w-full border border-brand-ocean/30 text-brand-ocean py-3 rounded-xl font-bold hover:bg-brand-ocean/5 transition-all text-xs cursor-pointer"
                >
                  View Detail Basket
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
