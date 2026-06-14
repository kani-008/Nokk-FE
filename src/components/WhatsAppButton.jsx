import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { api } from '../services/api';

export default function WhatsAppButton() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api.getSettings().then(setSettings);
  }, []);

  const whatsappNum = settings?.whatsappNumber?.replace(/[^0-9]/g, '') || '918778784819';
  const shopName = settings?.websiteName || 'Namma Oor Karuvattu Kadai';
  const whatsappUrl = `https://wa.me/${whatsappNum}?text=Hi!%20I'm%20interested%20in%20ordering%20traditional%20dry%20fish%20from%20${encodeURIComponent(shopName)}.`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 bg-[#25D366] text-white p-3.5 rounded-full shadow-2xl hover:bg-[#20ba5a] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center border-2 border-white group"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-6 h-6 fill-white text-[#25D366]" />

      {/* Tooltip labels */}
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-semibold group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 ease-out">
        Order on WhatsApp
      </span>
    </a>
  );
}
