import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import { api } from '../services/api';

export default function Footer() {
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.getSettings().then(setSettings);
    api.getCategories().then(setCategories);
  }, []);

  const instagramUrl = settings?.instagramUrl || 'https://instagram.com';
  const facebookUrl = settings?.facebookUrl || 'https://facebook.com';
  const youtubeUrl = settings?.youtubeUrl || 'https://youtube.com';
  const contactPhone = settings?.contactPhone || '+91 94420 XXXXX';
  const contactEmail = settings?.contactEmail || 'orders@nammaoor.com';
  const websiteNameTa = settings?.websiteNameTa || 'நம்ம ஊர் கருவாடு கடை';
  const websiteName = settings?.websiteName || 'Namma Oor Karuvattu Kadai';

  return (
    <footer className="bg-brand-ocean text-brand-cream border-t border-brand-primary/10 pt-16 pb-28 lg:pb-16 mt-auto">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Brand & Tagline */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-brand-primary text-brand-cream p-2 rounded-full shadow-md">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12,2A10,10,0,0,0,2,12a9.89,9.89,0,0,0,2.15,6.08L2.09,20.14a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l2.06-2.06A9.89,9.89,0,0,0,12,22a10,10,0,0,0,10-10C22,5.2,16.5,2,12,2Zm5,11H7a1,1,0,0,1,0-2H17a1,1,0,0,1,0,2Z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-tiro-tamil text-base font-bold leading-tight text-brand-secondary">
                  {websiteNameTa}
                </span>
                <span className="font-playfair text-[9px] font-bold tracking-wider text-brand-cream/80 uppercase">
                  {websiteName}
                </span>
              </div>
            </div>
            
            <p className="text-xs text-brand-cream/70 leading-relaxed max-w-sm">
              Bringing you authentic, hygienic, and premium sun-dried fish (karuvadu), spicy marine pickles, and home-ground masala blends sourced directly from Tamil Nadu's traditional fishing villages.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3.5 mt-2">
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-brand-primary/10 hover:bg-brand-secondary text-brand-cream rounded-full transition-all hover:scale-110" aria-label="Instagram">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </a>
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-brand-primary/10 hover:bg-brand-secondary text-brand-cream rounded-full transition-all hover:scale-110" aria-label="Facebook">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-brand-primary/10 hover:bg-brand-secondary text-brand-cream rounded-full transition-all hover:scale-110" aria-label="YouTube">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z"/>
                  <polygon points="10 15 15 12 10 9"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="flex flex-col gap-4">
            <h3 className="font-playfair text-sm font-bold text-brand-secondary uppercase tracking-wider">Quick Links</h3>
            <ul className="text-xs space-y-2.5 font-semibold text-brand-cream/75">
              <li><Link to="/" className="hover:text-brand-secondary transition-colors">Home Page</Link></li>
              <li><Link to="/products" className="hover:text-brand-secondary transition-colors">Shop Products</Link></li>
              <li><Link to="/offers" className="hover:text-brand-secondary transition-colors">Active Coupons</Link></li>
              <li><Link to="/wishlist" className="hover:text-brand-secondary transition-colors">Your Wishlist</Link></li>
              <li><Link to="/profile" className="hover:text-brand-secondary transition-colors">My Profile</Link></li>
            </ul>
          </div>

          {/* Categories links */}
          <div className="flex flex-col gap-4">
            <h3 className="font-playfair text-sm font-bold text-brand-secondary uppercase tracking-wider">Categories</h3>
            <ul className="text-xs space-y-2.5 font-semibold text-brand-cream/75">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link to={`/products?category=${c.slug}`} className="hover:text-brand-secondary transition-colors flex items-center justify-between">
                    <span>{c.nameEn} ({c.nameTa})</span>
                    <span className="text-[10px] text-brand-cream/40">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div className="flex flex-col gap-4">
            <h3 className="font-playfair text-sm font-bold text-brand-secondary uppercase tracking-wider">Contact Us</h3>
            <ul className="text-xs space-y-3 text-brand-cream/75 font-semibold">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4.5 h-4.5 text-brand-secondary shrink-0 mt-0.5" />
                <span>Kadaladi Coast, Ramanathapuram & Tuticorin, Tamil Nadu, India</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4.5 h-4.5 text-brand-secondary shrink-0" />
                <span>{contactPhone}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4.5 h-4.5 text-brand-secondary shrink-0" />
                <span>{contactEmail}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Separator & Copyright */}
        <div className="border-t border-brand-cream/10 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] font-medium text-brand-cream/55">
          <p>© {new Date().getFullYear()} Namma Oor Karuvattu Kadai. All Rights Reserved.</p>
          <p className="mt-2 sm:mt-0">Sourced Direct from Village Fishermen Communities 🌊</p>
        </div>
      </div>
    </footer>
  );
}
