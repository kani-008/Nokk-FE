import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Calendar, DollarSign, Check, Copy, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useToastStore } from '../stores/toastStore';
import Breadcrumb from '../components/Breadcrumb';

export default function Offers() {
  const navigate = useNavigate();
  const addToast = useToastStore(state => state.addToast);
  const [coupons, setCoupons] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    api.getCoupons().then(setCoupons);
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    addToast(`Coupon "${code}" copied to clipboard!`, 'success');
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const breadcrumbItems = [{ label: 'Active Offers', link: '/offers' }];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 pb-20 font-inter">
      <Breadcrumb items={breadcrumbItems} />

      <h1 className="font-tiro-tamil text-2xl md:text-3xl text-brand-primary font-bold border-b border-brand-sand pb-4 mb-8">
        ஆஃபர்கள் & சலுகைகள்
      </h1>

      <div className="text-center max-w-lg mx-auto mb-12 space-y-2">
        <h2 className="font-playfair text-xl md:text-2xl font-bold text-brand-ocean">Exclusive Village Coupons</h2>
        <p className="text-xs text-brand-dark/65 font-medium leading-relaxed">
          Unlock premium discounts on your favorite traditional dry fish and spicy pickles. Simply copy a code below and apply it inside your cart or at checkout!
        </p>
      </div>

      {/* Coupons grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {coupons.map((c) => {
          const isCopied = copiedCode === c.code;

          return (
            <div
              key={c.code}
              className="bg-brand-cream border border-brand-sand/70 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden border-b-6 border-b-brand-sand"
            >
              {/* Ticket border circle cuts */}
              <div className="absolute top-1/2 -left-3.5 w-7 h-7 bg-[#FFF8EE] rounded-full border-r border-brand-sand/65 -translate-y-1/2" />
              <div className="absolute top-1/2 -right-3.5 w-7 h-7 bg-[#FFF8EE] rounded-full border-l border-brand-sand/65 -translate-y-1/2" />

              <div className="space-y-4">
                {/* Header icon + Discount */}
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div className="text-right font-space">
                    <span className="text-2xl font-bold text-brand-primary">
                      {c.discountPercent > 0 ? `${c.discountPercent}%` : `₹${c.discountFlat}`}
                    </span>
                    <span className="text-[10px] text-brand-dark/45 font-bold uppercase tracking-wider block mt-0.5">Discount</span>
                  </div>
                </div>

                {/* Title & info */}
                <div className="space-y-2">
                  <h3 className="font-playfair text-base font-bold text-brand-ocean">{c.description}</h3>
                  <div className="space-y-1 text-xs text-brand-dark/65 font-medium">
                    <p className="flex justify-between"><span>Min Order:</span> <strong className="text-brand-dark font-space">₹{c.minOrder}</strong></p>
                    <p className="flex justify-between"><span>Usage Limit:</span> <strong className="text-brand-dark">Single use</strong></p>
                  </div>
                </div>
              </div>

              {/* Action and coupon code */}
              <div className="mt-6 pt-4 border-t border-dashed border-brand-sand flex items-center justify-between gap-4 relative">
                <div className="bg-white border border-brand-sand rounded-xl px-3.5 py-1.5 text-xs font-mono font-bold tracking-wider text-brand-ocean select-all shadow-inner">
                  {c.code}
                </div>

                <button
                  onClick={() => handleCopyCode(c.code)}
                  className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer ${
                    isCopied
                      ? 'bg-emerald-600 text-white shadow-none scale-95'
                      : 'bg-brand-primary text-brand-cream hover:bg-brand-secondary active:scale-95'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Code
                    </>
                  )}
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Redirect footer CTA */}
      <div className="mt-14 text-center">
        <button
          onClick={() => navigate('/products')}
          className="bg-brand-ocean text-brand-cream font-bold py-3.5 px-8 rounded-xl hover:bg-brand-primary active:scale-98 transition-all shadow-md text-sm flex items-center gap-2 mx-auto cursor-pointer"
        >
          Explore Seafood Store <ArrowRight className="w-4.5 h-4.5 text-brand-secondary" />
        </button>
      </div>

    </div>
  );
}
