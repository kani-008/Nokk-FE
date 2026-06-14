import React, { useState, useEffect } from 'react';
import { Image, Plus, Trash2, Edit2, CheckCircle2, XCircle, ArrowRight, Eye, Sparkles } from 'lucide-react';
import { mockAPI } from '../../data/mockData';
import { useToastStore } from '../../stores/toastStore';
import Modal from '../../components/Modal';

export default function Banners() {
  const addToast = useToastStore(state => state.addToast);

  const [banners, setBanners] = useState([]);
  
  // Modal Banner fields
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [link, setLink] = useState('/products');
  const [imageUrl, setImageUrl] = useState('/assets/banners/hero-banner.jpg');
  const [sortOrder, setSortOrder] = useState(1);
  const [active, setActive] = useState(true);

  const loadBanners = () => {
    setBanners(mockAPI.getBanners().sort((a, b) => a.sortOrder - b.sortOrder));
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setTitle('');
    setSubtitle('');
    setLink('/products');
    setImageUrl('/assets/banners/hero-banner.jpg');
    setSortOrder(banners.length + 1);
    setActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setSubtitle(banner.subtitle);
    setLink(banner.link);
    setImageUrl(banner.image);
    setSortOrder(banner.sortOrder);
    setActive(banner.active);
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!title || !imageUrl) {
      addToast('Please fill in required banner fields.', 'warning');
      return;
    }

    const payload = {
      id: editingBanner?.id,
      title,
      subtitle,
      image: imageUrl,
      link,
      sortOrder: parseInt(sortOrder) || 1,
      active
    };

    mockAPI.saveBanner(payload);
    addToast(editingBanner ? 'Banner updated successfully!' : 'New home banner published!', 'success');
    setIsModalOpen(false);
    loadBanners();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this banner from home slider?')) {
      mockAPI.deleteBanner(id);
      addToast('Banner removed.', 'info');
      loadBanners();
    }
  };

  const handleToggleActive = (banner) => {
    const payload = { ...banner, active: !banner.active };
    mockAPI.saveBanner(payload);
    addToast(`Banner slider visibility updated.`, 'info');
    loadBanners();
  };

  return (
    <div className="space-y-6 font-inter pb-10">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-brand-sand pb-4">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-brand-ocean">Home Banner Carousel</h1>
          <p className="text-xs text-brand-dark/50 font-medium mt-1">Configure active image slide prompts, links, and sort indices</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-brand-primary text-brand-cream py-2.5 px-4 rounded-xl text-xs font-bold hover:bg-brand-secondary active:scale-95 transition-all shadow flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" /> Add New Banner
        </button>
      </div>

      {/* Grid: Preview & manage banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="bg-white border border-brand-sand rounded-3xl overflow-hidden shadow-sm flex flex-col relative group hover:border-brand-primary/20 transition-all border-b-6 border-b-brand-sand"
          >
            {/* Banner preview strip */}
            <div className="h-36 sm:h-44 w-full relative bg-brand-ocean/10 overflow-hidden shrink-0">
              <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-brand-dark/65 flex flex-col justify-center px-6 text-brand-cream gap-1 select-none">
                <h4 className="font-tiro-tamil text-sm md:text-base font-bold text-brand-sand leading-snug line-clamp-1">{banner.title}</h4>
                <p className="text-[10px] text-brand-cream/80 leading-normal line-clamp-2 max-w-sm font-medium">{banner.subtitle}</p>
                <span className="bg-brand-secondary/20 text-brand-secondary border border-brand-secondary/35 text-[9px] font-bold font-mono px-2 py-0.5 rounded w-max mt-1">
                  SORT: {banner.sortOrder}
                </span>
              </div>
            </div>

            {/* Actions card footer */}
            <div className="p-4 flex items-center justify-between text-xs font-bold font-inter bg-brand-cream/15 border-t border-brand-sand/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(banner)}
                  className={`flex items-center gap-1 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border cursor-pointer ${
                    banner.active 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                      : 'bg-gray-50 text-gray-500 border-gray-200'
                  }`}
                >
                  {banner.active ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-gray-400" />}
                  {banner.active ? 'Visible' : 'Hidden'}
                </button>
                <span className="text-[10px] text-brand-dark/45">Target: <code className="bg-white border px-1 py-0.5 rounded">{banner.link}</code></span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(banner)}
                  className="p-2 border border-brand-sand hover:border-brand-ocean bg-white text-brand-ocean rounded-xl transition-all shadow-sm cursor-pointer"
                  title="Edit slide text"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="p-2 border border-brand-sand hover:border-rose-300 bg-white text-brand-dark/40 hover:text-rose-600 rounded-xl transition-all shadow-sm cursor-pointer"
                  title="Delete slide"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Banner Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBanner ? 'Edit Homepage Slide Banner' : 'Publish New Homepage Banner'}
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold">
          
          {/* Slide Title */}
          <div className="flex flex-col gap-1.5">
            <label>Slide Main Headline (Tamil or English) <span className="text-rose-500">*</span></label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 10% OFF on spicy Prawn pickles!"
              className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium"
            />
          </div>

          {/* Subtitle */}
          <div className="flex flex-col gap-1.5">
            <label>Slide Brief Subtitle</label>
            <textarea
              rows={2}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Additional details about village catch, coupon promo codes..."
              className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Link target */}
            <div className="flex flex-col gap-1.5">
              <label>Target Click Link Redirect</label>
              <input
                type="text"
                required
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="/products?category=pickles"
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-mono text-brand-dark/75"
              />
            </div>
            {/* Sort order */}
            <div className="flex flex-col gap-1.5">
              <label>Sort Slide Order</label>
              <input
                type="number"
                required
                min="1"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-space"
              />
            </div>
          </div>

          {/* Slide Photo Link */}
          <div className="flex flex-col gap-1.5">
            <label>Banner Image URL <span className="text-rose-500">*</span></label>
            <div className="flex items-center gap-4">
              <input
                type="text"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium"
              />
              <div className="w-12 h-10 rounded-lg border border-brand-sand overflow-hidden shrink-0 bg-brand-cream/35 flex items-center justify-center">
                <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
              </div>
            </div>
            {/* Drag simulation */}
            <div className="border-2 border-dashed border-brand-sand/80 bg-brand-cream/15 p-4 rounded-xl text-center text-brand-dark/45 mt-1 cursor-pointer hover:bg-brand-sand/10 transition-colors">
              <Image className="w-6 h-6 text-brand-primary mx-auto mb-1 opacity-70 animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-wider">Drag & drop or Click to simulate slide upload</p>
            </div>
          </div>

          {/* Active switch */}
          <label className="flex items-center gap-2 cursor-pointer font-bold pt-1.5">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="accent-brand-primary w-4.5 h-4.5 rounded"
            />
            <span>Make this banner visible in homepage slider immediately</span>
          </label>

          {/* Form Actions */}
          <div className="pt-4 flex justify-end gap-3 border-t border-brand-sand font-bold text-xs">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="border border-brand-sand px-5 py-2.5 rounded-xl hover:bg-brand-sand/15 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-brand-primary text-brand-cream px-6 py-2.5 rounded-xl hover:bg-brand-secondary active:scale-95 transition-all shadow cursor-pointer"
            >
              {editingBanner ? 'Save Banner Settings' : 'Publish Banner'}
            </button>
          </div>

        </form>
      </Modal>

    </div>
  );
}
