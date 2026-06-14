import React, { useState, useEffect } from 'react';
import { Settings, Save, Globe, Truck, Share2, AlertOctagon, HelpCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';

export default function SettingsPage() {
  const addToast = useToastStore(state => state.addToast);

  // Form parameters
  const [websiteName, setWebsiteName] = useState('');
  const [websiteNameTa, setWebsiteNameTa] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(500);
  const [flatDeliveryCharge, setFlatDeliveryCharge] = useState(50);
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    api.getSettings().then(s => {
      if (s) {
        setWebsiteName(s.websiteName);
        setWebsiteNameTa(s.websiteNameTa || '');
        setContactPhone(s.contactPhone);
        setContactEmail(s.contactEmail);
        setWhatsappNumber(s.whatsappNumber || '');
        setFreeShippingThreshold(s.freeShippingThreshold);
        setFlatDeliveryCharge(s.flatDeliveryCharge);
        setInstagramUrl(s.instagramUrl);
        setFacebookUrl(s.facebookUrl);
        setYoutubeUrl(s.youtubeUrl);
        setMaintenanceMode(s.maintenanceMode || false);
      }
    });
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    if (!websiteName || !contactPhone || !contactEmail) {
      addToast('Please fill in required settings parameters.', 'warning');
      return;
    }

    const payload = {
      websiteName,
      websiteNameTa,
      logo: '/assets/logo.png',
      contactPhone,
      contactEmail,
      whatsappNumber,
      freeShippingThreshold: parseInt(freeShippingThreshold) || 500,
      flatDeliveryCharge: parseInt(flatDeliveryCharge) || 50,
      instagramUrl,
      facebookUrl,
      youtubeUrl,
      maintenanceMode
    };

    api.saveSettings(payload).then(() => {
      addToast('Global settings updated successfully!', 'success');
    });
  };

  return (
    <div className="space-y-6 font-inter pb-10">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-brand-sand pb-4">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-brand-ocean">Global Settings</h1>
          <p className="text-xs text-brand-dark/50 font-medium mt-1">Configure metadata details, delivery logistics, and social media handles</p>
        </div>
      </div>

      {/* Main settings form */}
      <form onSubmit={handleSave} className="space-y-6 text-xs font-semibold max-w-4xl">
        
        {/* SECTION 1: Brand Info */}
        <div className="bg-white border border-brand-sand rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-brand-ocean border-b border-brand-sand pb-2.5 flex items-center gap-2">
            <Globe className="w-4.5 h-4.5 text-brand-primary" /> Brand Metadata
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label>Website Name (English) <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={websiteName}
                onChange={(e) => setWebsiteName(e.target.value)}
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium text-brand-dark"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label>Website Name (Tamil) <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={websiteNameTa}
                onChange={(e) => setWebsiteNameTa(e.target.value)}
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium text-brand-dark font-tiro-tamil"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label>Contact Phone <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium font-space text-brand-dark"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label>Contact Email <span className="text-rose-500">*</span></label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium text-brand-dark"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label>WhatsApp Support Number</label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+91 94420 XXXXX"
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium font-space text-brand-dark"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Shipping Charge Rules */}
        <div className="bg-white border border-brand-sand rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-brand-ocean border-b border-brand-sand pb-2.5 flex items-center gap-2">
            <Truck className="w-4.5 h-4.5 text-brand-primary" /> Delivery Logistics Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label>Free Shipping Threshold Amount (₹)</label>
              <input
                type="number"
                required
                min="0"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-space font-medium text-brand-dark"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label>Flat Delivery Shipping Charge (₹)</label>
              <input
                type="number"
                required
                min="0"
                value={flatDeliveryCharge}
                onChange={(e) => setFlatDeliveryCharge(e.target.value)}
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-space font-medium text-brand-dark"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Social Links */}
        <div className="bg-white border border-brand-sand rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-brand-ocean border-b border-brand-sand pb-2.5 flex items-center gap-2">
            <Share2 className="w-4.5 h-4.5 text-brand-primary" /> Social Channels Links
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label>Instagram URL</label>
              <input
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/nok"
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-brand-primary font-medium"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label>Facebook URL</label>
              <input
                type="url"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/nok"
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-brand-primary font-medium"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label>YouTube Channel URL</label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/nok"
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-brand-primary font-medium"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: Maintenance Mode */}
        <div className="bg-white border border-brand-sand rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-brand-ocean border-b border-brand-sand pb-2.5 flex items-center gap-2">
            <AlertOctagon className="w-4.5 h-4.5 text-rose-600 animate-pulse" /> Maintenance Settings
          </h3>

          <div className="flex items-start gap-3.5">
            <input
              type="checkbox"
              id="maintenance"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="accent-brand-primary w-5 h-5 rounded mt-0.5 shrink-0 cursor-pointer"
            />
            <div className="text-xs">
              <label htmlFor="maintenance" className="font-bold text-brand-ocean cursor-pointer">Activate Maintenance Mode</label>
              <p className="text-[11px] text-brand-dark/55 mt-0.5 font-medium leading-relaxed">
                Toggling this blocks all user storefront views with a friendly, branded "Under Scheduled Maintenance" splash card, locking order operations for system upgrades.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-brand-primary text-brand-cream py-3 px-8 rounded-xl font-bold flex items-center gap-1.5 hover:bg-brand-secondary active:scale-95 transition-all shadow-md text-xs cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Website Settings
          </button>
        </div>

      </form>
    </div>
  );
}
