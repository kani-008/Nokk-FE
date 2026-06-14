import React, { useState } from 'react';
import { useCartStore } from '../stores/cartStore';
import { Ticket, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function CouponInput() {
  const { appliedCoupon, couponError, applyCoupon, removeCoupon } = useCartStore();
  const [code, setCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    const success = applyCoupon(code.trim());
    if (success) {
      setCode('');
    }
  };

  return (
    <div className="bg-white border border-brand-sand rounded-2xl p-4 shadow-sm">
      <h3 className="text-sm font-bold text-brand-ocean flex items-center gap-2 mb-3">
        <Ticket className="w-4.5 h-4.5 text-brand-secondary" />
        Apply Coupon Code
      </h3>

      {appliedCoupon ? (
        // Applied state
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-bold font-mono tracking-wider bg-emerald-100 px-2 py-0.5 rounded text-emerald-900 w-max">
                {appliedCoupon.code}
              </span>
              <span className="text-[11px] font-medium mt-0.5">
                {appliedCoupon.description}
              </span>
            </div>
          </div>
          <button
            onClick={removeCoupon}
            className="p-1 hover:bg-emerald-100 rounded-full text-emerald-800 transition-colors"
            title="Remove Coupon"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        // Input state
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. KARUVADU10"
            className="flex-1 bg-brand-cream border border-brand-sand rounded-xl px-3 py-2 text-sm uppercase font-mono tracking-wider focus:outline-none focus:border-brand-primary placeholder-brand-dark/40"
          />
          <button
            type="submit"
            className="bg-brand-primary text-brand-cream px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-secondary active:scale-95 transition-all shadow-sm"
          >
            Apply
          </button>
        </form>
      )}

      {couponError && !appliedCoupon && (
        <div className="flex items-center gap-1.5 text-rose-600 text-xs mt-2 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{couponError}</span>
        </div>
      )}
    </div>
  );
}
