import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Flame, ShieldCheck, Heart, Truck, Sparkles, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';
 
export default function Home() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
 
  useEffect(() => {
    api.getBanners().then(data => setBanners(data.filter(b => b.active)));
    api.getCategories().then(setCategories);
    api.getProducts().then(data => setFeaturedProducts(data.slice(0, 6)));
  }, []);

  // Auto-play banner carousel
  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  const handleNextBanner = () => {
    setActiveBannerIndex((prev) => (prev + 1) % banners.length);
  };

  const handlePrevBanner = () => {
    setActiveBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <div className="flex flex-col gap-12 pb-16 font-inter">
      {/* 1. Hero Section */}
      <section className="relative bg-brand-ocean text-brand-cream overflow-hidden py-20 lg:py-28 palm-leaf-pattern">
        {/* Dark subtle cover mask */}
        <div className="absolute inset-0 bg-brand-ocean/85 z-0" />
        
        <div className="max-w-7xl mx-auto px-4 lg:px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Free Shipping Badge */}
            <span className="inline-flex items-center gap-1.5 bg-brand-secondary/15 text-brand-secondary border border-brand-secondary/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              <Truck className="w-3.5 h-3.5" /> Free Shipping above ₹500
            </span>
            
            {/* Main Headline */}
            <h1 className="font-tiro-tamil text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-brand-sand drop-shadow-sm">
              நம்ம ஊர் கருவாடு கடை
            </h1>
            
            <p className="font-playfair text-xl sm:text-2xl font-semibold text-brand-cream/90 italic">
              "Sun-dried. Village-fresh. Delivered to your door."
            </p>
            
            <p className="text-sm md:text-base text-brand-cream/75 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Savor the taste of authentic coastal Tamil Nadu. Handpicked, clean, salted, and 100% naturally dried fish items, packed and shipped with love from traditional fishing communities directly to your dining table.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => navigate('/products')}
                className="w-full sm:w-auto bg-brand-primary text-brand-cream px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-brand-secondary active:scale-95 shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Shop Now <ArrowRight className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => navigate('/products')}
                className="w-full sm:w-auto border-2 border-brand-sand text-brand-sand px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-brand-sand/15 active:scale-95 transition-all cursor-pointer"
              >
                View All Products
              </button>
            </div>
          </div>

          {/* Sourced dry fish highlight picture */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-2xl overflow-hidden shadow-2xl border-4 border-brand-sand/35 rotate-2 hover:rotate-0 transition-transform duration-500 bg-white">
              <img
                src="/assets/products/nethili.jpg"
                alt="Village sun dried karuvadu"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&q=80&w=800";
                }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-center">
                <span className="text-brand-secondary text-xs uppercase font-bold tracking-wider">Traditional Coastal Drying</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Admin Managed Banners Carousel */}
      {banners.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 lg:px-6 w-full -mt-6">
          <div className="relative h-44 sm:h-64 rounded-3xl overflow-hidden border border-brand-sand shadow-lg group">
            {/* Banner Slide */}
            <div className="w-full h-full relative">
              <img
                src={banners[activeBannerIndex].image}
                alt={banners[activeBannerIndex].title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=1200";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/80 via-brand-dark/45 to-transparent flex flex-col justify-center px-8 md:px-16 text-brand-cream gap-2">
                <h3 className="text-xl sm:text-3xl font-bold font-tiro-tamil text-brand-sand leading-snug">
                  {banners[activeBannerIndex].title}
                </h3>
                <p className="text-xs sm:text-base text-brand-cream/80 max-w-md line-clamp-2">
                  {banners[activeBannerIndex].subtitle}
                </p>
                <Link
                  to={banners[activeBannerIndex].link}
                  className="bg-brand-secondary text-brand-cream text-xs font-bold px-4 py-2 rounded-lg w-max mt-2 hover:bg-brand-primary transition-colors shadow"
                >
                  Explore Offer →
                </Link>
              </div>
            </div>

            {/* Slider arrows */}
            <button
              onClick={handlePrevBanner}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-brand-cream/20 hover:bg-brand-cream/40 rounded-full text-brand-cream opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextBanner}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-brand-cream/20 hover:bg-brand-cream/40 rounded-full text-brand-cream opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveBannerIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    activeBannerIndex === i ? 'bg-brand-secondary w-6' : 'bg-brand-cream/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. Category Showcase */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 w-full py-2">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="font-tiro-tamil text-2xl md:text-3xl text-brand-primary font-bold">
              வகைகள்
            </h2>
            <p className="font-playfair text-xs md:text-sm text-brand-ocean font-bold mt-1">
              Browse by traditional categories
            </p>
          </div>
          <Link to="/products" className="text-xs md:text-sm font-bold text-brand-secondary hover:text-brand-primary flex items-center gap-1.5 hover:underline">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Categories scrollable container */}
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar md:grid md:grid-cols-5 md:overflow-visible">
          {categories.map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      </section>

      {/* 4. Coupon Promo Banner Strip */}
      <section className="bg-brand-secondary text-brand-cream py-4 shadow-md w-full border-y-2 border-brand-primary/10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 font-space">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-cream/15 rounded-lg">
              <Flame className="w-6 h-6 text-brand-cream animate-bounce" />
            </div>
            <div>
              <p className="text-base font-bold tracking-wide">SPECIAL FESTIVAL COUPON HIGHLIGHT</p>
              <p className="text-xs text-brand-cream/80">Get flat 10% discount on orders above ₹500</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="border-2 border-dashed border-brand-cream text-brand-cream font-mono font-bold tracking-wider px-4 py-1.5 rounded-lg text-sm bg-brand-dark/10">
              KARUVADU10
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText('KARUVADU10');
                alert('Coupon code copied!');
              }}
              className="bg-brand-cream text-brand-secondary hover:bg-brand-sand px-4 py-1.5 rounded-lg text-xs font-bold shadow transition-transform active:scale-95 cursor-pointer"
            >
              Copy Code
            </button>
          </div>
        </div>
      </section>

      {/* 5. Featured Products Showcase */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-tiro-tamil text-2xl md:text-3xl text-brand-primary font-bold">
              சிறப்பு தயாரிப்புகள்
            </h2>
            <p className="font-playfair text-xs md:text-sm text-brand-ocean font-bold mt-1">
              Top selling village dried favorites
            </p>
          </div>
          <Link to="/products" className="text-xs md:text-sm font-bold text-brand-secondary hover:text-brand-primary flex items-center gap-1.5 hover:underline">
            See More Products <ArrowRight className="w-4.5 h-4.5" />
          </Link>
        </div>

        {/* 6-grid responsive list */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {featuredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* 6. Why Choose Us (Trust Tiles) */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 w-full py-4">
        <div className="bg-brand-sand/40 border border-brand-sand rounded-3xl p-8 md:p-12">
          <div className="text-center max-w-lg mx-auto mb-10">
            <h2 className="font-tiro-tamil text-2xl md:text-3xl text-brand-primary font-bold">
              ஏன் நம்ம ஊர் கருவாடு?
            </h2>
            <p className="font-playfair text-xs md:text-sm text-brand-ocean font-bold mt-1">
              Why dry fish lovers trust our village kadai
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Tile 1 */}
            <div className="flex flex-col items-center text-center p-4 bg-white/70 rounded-2xl shadow-sm border border-white">
              <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-playfair font-bold text-brand-ocean text-base">Sun-Dried Quality</h3>
              <p className="text-xs text-brand-dark/70 mt-2 leading-relaxed">
                Traditional solar drying on woven nets & palm mats inside clean coastal wind sheds. Sourced fresh.
              </p>
            </div>

            {/* Tile 2 */}
            <div className="flex flex-col items-center text-center p-4 bg-white/70 rounded-2xl shadow-sm border border-white">
              <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-playfair font-bold text-brand-ocean text-base">No Preservatives</h3>
              <p className="text-xs text-brand-dark/70 mt-2 leading-relaxed">
                Zero coloring, zero chemical inputs, and zero toxic preservatives. Pure salt & coastal winds only.
              </p>
            </div>

            {/* Tile 3 */}
            <div className="flex flex-col items-center text-center p-4 bg-white/70 rounded-2xl shadow-sm border border-white">
              <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary mb-4">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-playfair font-bold text-brand-ocean text-base">Direct from Fishermen</h3>
              <p className="text-xs text-brand-dark/70 mt-2 leading-relaxed">
                Sourced straight from marine cooperative units in Rameswaram, Tuticorin & Cuddalore. Fair trade prices.
              </p>
            </div>

            {/* Tile 4 */}
            <div className="flex flex-col items-center text-center p-4 bg-white/70 rounded-2xl shadow-sm border border-white">
              <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary mb-4">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-playfair font-bold text-brand-ocean text-base">Fast Delivery</h3>
              <p className="text-xs text-brand-dark/70 mt-2 leading-relaxed">
                Hygienically vacuum-sealed inside smell-proof foils and delivered to your doorstep within 3-5 days.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Testimonials */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 w-full">
        <div className="text-center max-w-lg mx-auto mb-10">
          <h2 className="font-tiro-tamil text-2xl md:text-3xl text-brand-primary font-bold">
            வாடிக்கையாளர் கருத்துக்கள்
          </h2>
          <p className="font-playfair text-xs md:text-sm text-brand-ocean font-bold mt-1">
            Read reviews from seafood lovers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-brand-cream border border-brand-sand p-6 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center text-amber-500 gap-0.5 mb-3.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-brand-dark/80 leading-relaxed italic">
                "The Nethili Karuvadu was exceptionally clean! Usually when buying elsewhere there is a lot of sand, but these dried fish were completely clean, washed, and dried. Highly recommend!"
              </p>
            </div>
            <div className="mt-5 border-t border-brand-sand pt-4">
              <h4 className="font-playfair font-bold text-xs text-brand-ocean">Karunakaran R</h4>
              <p className="text-[10px] text-brand-dark/50">Madurai, Tamil Nadu</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-brand-cream border border-brand-sand p-6 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center text-amber-500 gap-0.5 mb-3.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-brand-dark/80 leading-relaxed italic">
                "I ordered the Karuvadu Thokku and Sura Karuvadu. The pickle is extremely spicy, pure gingelly oil flavour, and has plenty of shredded dry fish chunks. Excellent combo for curd rice!"
              </p>
            </div>
            <div className="mt-5 border-t border-brand-sand pt-4">
              <h4 className="font-playfair font-bold text-xs text-brand-ocean">Meenakshi Sundaram</h4>
              <p className="text-[10px] text-brand-dark/50">Chennai, Tamil Nadu</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-brand-cream border border-brand-sand p-6 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center text-amber-500 gap-0.5 mb-3.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-brand-dark/80 leading-relaxed italic">
                "Superb fast delivery. The vacuum packaging is extremely good and holds the smell perfectly inside. Sura Karuvadu puttu turned out exactly like my grandmother's recipe."
              </p>
            </div>
            <div className="mt-5 border-t border-brand-sand pt-4">
              <h4 className="font-playfair font-bold text-xs text-brand-ocean">Anbarasan M</h4>
              <p className="text-[10px] text-brand-dark/50">Tuticorin, Tamil Nadu</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
