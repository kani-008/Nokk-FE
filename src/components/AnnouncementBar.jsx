import React from 'react';
import { PhoneCall } from 'lucide-react';

export default function AnnouncementBar() {
  return (
    <div className="bg-brand-ocean text-brand-cream py-1.5 px-4 text-xs overflow-hidden border-b border-brand-primary/20 relative z-30">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="hidden md:flex items-center gap-2 font-medium">
          <PhoneCall className="w-3.5 h-3.5 text-brand-secondary" />
          <span>WhatsApp Support: +91 94420 XXXXX</span>
        </div>
        
        {/* Scrolling marquee */}
        <div className="flex-1 overflow-hidden relative h-5 flex items-center">
          <div className="absolute whitespace-nowrap animate-marquee flex gap-12 font-semibold">
            <span>🔥 Seasonal Offer: Get 10% OFF on all Dry Fish variants! Use Coupon: <strong className="text-brand-secondary font-mono">KARUVADU10</strong></span>
            <span>📦 Sourced directly from Tuticorin & Rameswaram fishing villages!</span>
            <span>🚚 Free Shipping on orders above ₹500 across India!</span>
            <span>🌿 100% Traditional Sun-Dried Quality. No Chemical Preservatives.</span>
          </div>
        </div>

        <div className="hidden md:block font-medium">
          <span>தமிழ்நாட்டின் பாரம்பரிய சுவை!</span>
        </div>
      </div>
    </div>
  );
}
