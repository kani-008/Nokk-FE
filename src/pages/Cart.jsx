import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowLeft, ArrowRight, Truck } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import QuantityStepper from '../components/QuantityStepper';
import CouponInput from '../components/CouponInput';
import Breadcrumb from '../components/Breadcrumb';

export default function Cart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, getCartTotals } = useCartStore();
  const { subtotal, deliveryCharge, discount, total } = getCartTotals();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const breadcrumbItems = [{ label: 'Shopping Cart', link: '/cart' }];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 pb-20 font-inter">
      <Breadcrumb items={breadcrumbItems} />

      <h1 className="font-tiro-tamil text-2xl md:text-3xl text-brand-primary font-bold border-b border-brand-sand pb-4 mb-8">
        உங்களது கூடை
      </h1>

      {items.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center py-20 bg-brand-cream/20 border border-brand-sand rounded-3xl text-center max-w-2xl mx-auto shadow-sm">
          <div className="p-5 bg-brand-sand/35 rounded-full mb-6 text-brand-primary">
            <ShoppingCart className="w-16 h-16" />
          </div>
          <h3 className="font-playfair text-xl font-bold text-brand-ocean">Your cart is empty</h3>
          <p className="text-sm text-brand-dark/60 mt-2 max-w-sm leading-relaxed">
            You haven't added any products to your basket yet. Savor the authentic taste of traditional coastal Tamil Nadu by adding our sun-dried fish or marine pickles!
          </p>
          <Link
            to="/products"
            className="mt-8 bg-brand-primary text-brand-cream px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-brand-secondary active:scale-95 transition-all shadow-md inline-flex items-center gap-2"
          >
            Browse All Products <ArrowRight className="w-4.5 h-4.5" />
          </Link>
        </div>
      ) : (
        // Cart content grid
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Line items column (Left) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Header info */}
            <div className="hidden md:grid grid-cols-12 text-xs font-bold text-brand-dark/45 uppercase tracking-wider px-6 pb-2">
              <span className="col-span-6">Product details</span>
              <span className="col-span-2 text-center">Unit Price</span>
              <span className="col-span-2 text-center">Quantity</span>
              <span className="col-span-2 text-right">Total</span>
            </div>

            {/* List */}
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-brand-sand p-4 md:p-6 rounded-2xl shadow-sm flex flex-col md:grid md:grid-cols-12 items-center gap-4 relative"
                >
                  {/* Product Info (col-span-6) */}
                  <div className="col-span-6 flex gap-4 w-full">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-brand-sand/10 border border-brand-sand shrink-0">
                      <img src={item.image} alt={item.nameEn} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h4 className="font-tiro-tamil text-base text-brand-primary font-bold leading-tight">
                        {item.nameTa}
                      </h4>
                      <h5 className="font-playfair text-sm font-semibold text-brand-dark/80 mt-0.5">
                        {item.nameEn}
                      </h5>
                      <span className="text-[10px] bg-brand-sand text-brand-ocean font-bold px-2.5 py-0.5 rounded-full w-max mt-1.5 font-space">
                        {item.weight}
                      </span>
                    </div>
                  </div>

                  {/* Unit price (col-span-2) */}
                  <div className="col-span-2 text-center hidden md:block font-space font-bold text-brand-dark/75">
                    ₹{item.price.toFixed(2)}
                  </div>

                  {/* Quantity stepper (col-span-2) */}
                  <div className="col-span-2 flex justify-center w-full md:w-auto">
                    <div className="flex items-center gap-2">
                      <span className="md:hidden text-xs text-brand-dark/50 font-bold mr-2">Quantity:</span>
                      <QuantityStepper
                        quantity={item.quantity}
                        onChange={(q) => updateQuantity(item.id, q)}
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Subtotal (col-span-2) */}
                  <div className="col-span-2 text-right font-space font-bold text-brand-ocean text-base w-full md:w-auto flex justify-between md:block pt-3 md:pt-0 border-t border-brand-sand/50 md:border-t-0">
                    <span className="md:hidden text-xs text-brand-dark/50 font-bold">Total:</span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>

                  {/* Delete button (absolute top/right on mobile, aligned on desktop) */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute top-4 right-4 md:static p-1.5 hover:bg-rose-50 text-brand-dark/35 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Back to shopping link */}
            <div className="pt-2">
              <Link
                to="/products"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:underline"
              >
                <ArrowLeft className="w-4 h-4" /> Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary sidebar (Right - col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Coupon widget */}
            <CouponInput />

            {/* Summary card */}
            <div className="bg-brand-cream/50 border border-brand-sand rounded-3xl p-6 shadow-sm space-y-5">
              <h3 className="font-playfair text-base font-bold text-brand-ocean border-b border-brand-sand pb-3.5">
                Order Summary
              </h3>

              <div className="space-y-3.5 text-xs font-semibold">
                <div className="flex justify-between text-brand-dark/70">
                  <span>Cart Subtotal</span>
                  <span className="font-space font-bold">₹{subtotal.toFixed(2)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Coupon Discount</span>
                    <span className="font-space font-bold">- ₹{discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-brand-dark/70">
                  <span>Estimated Shipping</span>
                  <span className="font-space font-bold">
                    {deliveryCharge === 0 ? (
                      <span className="text-emerald-700 uppercase font-bold text-[10px]">Free</span>
                    ) : (
                      `₹${deliveryCharge.toFixed(2)}`
                    )}
                  </span>
                </div>

                {deliveryCharge > 0 && (
                  <p className="text-[10px] text-brand-dark/45 font-medium leading-normal bg-brand-sand/30 p-2.5 rounded-lg border border-brand-sand/50">
                    💡 Add <strong>₹{(500 - subtotal).toFixed(2)}</strong> more to unlock <strong>FREE DELIVERY</strong>!
                  </p>
                )}

                <div className="border-t border-brand-sand pt-4 flex justify-between text-sm font-bold text-brand-ocean">
                  <span>Total Payable</span>
                  <span className="font-space text-lg text-brand-primary">₹{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Trigger */}
              <button
                onClick={handleCheckout}
                className="w-full bg-brand-primary text-brand-cream py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-secondary active:scale-98 transition-all shadow-md text-sm cursor-pointer"
              >
                Proceed to Checkout <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Delivery banner badge */}
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3.5 text-xs text-emerald-800">
              <Truck className="w-6 h-6 text-emerald-600 shrink-0" />
              <div className="font-medium">
                <p className="font-bold">Fast & Hygenic Shipping</p>
                <p className="opacity-85 text-[10.5px] mt-0.5">We vacuum-pack and ship dry fish smell-free across India. Delivery inside 3-5 working days.</p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
