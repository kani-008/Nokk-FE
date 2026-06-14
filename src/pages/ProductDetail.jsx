import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Truck, Check, AlertCircle, FileText, Sparkles, BookOpen } from 'lucide-react';
import { api } from '../services/api';
import { useCartStore } from '../stores/cartStore';
import { useWishlistStore } from '../stores/wishlistStore';
import { useToastStore } from '../stores/toastStore';
import ImageGallery from '../components/ImageGallery';
import StarRating from '../components/StarRating';
import PriceDisplay from '../components/PriceDisplay';
import QuantityStepper from '../components/QuantityStepper';
import Breadcrumb from '../components/Breadcrumb';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  const addItem = useCartStore(state => state.addItem);
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const addToast = useToastStore(state => state.addToast);

  useEffect(() => {
    api.getProductBySlug(slug).then(loadedProduct => {
      if (loadedProduct) {
        setProduct(loadedProduct);
        setSelectedVariantIndex(0);
        setQuantity(1);
      } else {
        // 404
        navigate('/products');
      }
    });
  }, [slug, navigate]);

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
      </div>
    );
  }

  const activeVariant = product.variants[selectedVariantIndex] || { weight: '250g', price: 0, mrp: 0, stock: 0 };
  const isWishlisted = isInWishlist(product.id);
  const isOutOfStock = !product.inStock || activeVariant.stock === 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, activeVariant.weight, activeVariant.price, quantity);
    addToast(`Added ${quantity}x ${product.nameEn} (${activeVariant.weight}) to cart!`, 'success');
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem(product, activeVariant.weight, activeVariant.price, quantity);
    navigate('/checkout');
  };

  const handleWishlistToggle = () => {
    toggleWishlist(product.id);
    addToast(
      isWishlisted ? `Removed ${product.nameEn} from wishlist` : `Added ${product.nameEn} to wishlist!`,
      'info'
    );
  };

  const getDeliveryEstimate = () => {
    const today = new Date();
    // estimate + 4 days
    const estDate = new Date();
    estDate.setDate(today.getDate() + 4);
    return estDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
  };

  const breadcrumbItems = [
    { label: 'Products', link: '/products' },
    { label: product.nameEn, link: `/products/${product.slug}` }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 pb-20 font-inter">
      <Breadcrumb items={breadcrumbItems} />

      {/* Main product showcase grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 mt-4">
        {/* Left Side: Images */}
        <div className="md:col-span-6 lg:col-span-5">
          <ImageGallery images={product.images || [product.image]} />
        </div>

        {/* Right Side: Info Panel */}
        <div className="md:col-span-6 lg:col-span-7 space-y-6">
          
          {/* Titles & Ratings */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap gap-2">
              {product.isBestseller && (
                <span className="bg-brand-primary text-brand-cream text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow-sm">
                  Bestseller
                </span>
              )}
              {product.isNew && (
                <span className="bg-brand-secondary text-brand-cream text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow-sm">
                  New
                </span>
              )}
              {product.discountPercent > 0 && (
                <span className="bg-emerald-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow-sm">
                  Save {product.discountPercent}%
                </span>
              )}
            </div>
            
            <h1 className="font-tiro-tamil text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-primary leading-tight font-medium">
              {product.nameTa}
            </h1>
            <h2 className="font-playfair text-xl sm:text-2xl font-bold text-brand-dark/90 leading-snug">
              {product.nameEn}
            </h2>
            
            {/* Custom import resolution for StarRating */}
            <div className="pt-1.5">
              <StarRating rating={product.rating} reviewsCount={product.reviewsCount} />
            </div>
          </div>

          {/* Pricing display */}
          <div className="bg-brand-cream border border-brand-sand/70 p-4 rounded-2xl flex items-center justify-between shadow-inner">
            <div>
              <p className="text-[10px] text-brand-dark/45 font-bold uppercase tracking-wider mb-0.5">Price & Value</p>
              <PriceDisplay
                price={activeVariant.price}
                mrp={activeVariant.mrp}
                discountPercent={product.discountPercent}
                size="lg"
              />
            </div>
            {product.discountPercent > 0 && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1">
                You Save ₹{(activeVariant.mrp - activeVariant.price).toFixed(2)}!
              </span>
            )}
          </div>

          {/* Weight selector pills */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs font-bold text-brand-dark/65">
              <span>Choose Weight Variant</span>
              <span className="text-brand-ocean font-space font-medium">{activeVariant.weight} variant selected</span>
            </div>
            <div className="flex gap-2">
              {product.variants.map((v, i) => (
                <button
                  key={v.weight}
                  type="button"
                  onClick={() => {
                    setSelectedVariantIndex(i);
                    setQuantity(1);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all min-w-[76px] cursor-pointer ${
                    selectedVariantIndex === i
                      ? 'bg-brand-ocean text-brand-cream border-brand-ocean shadow-md scale-98'
                      : 'bg-white text-brand-dark/80 border-brand-sand hover:border-brand-ocean/30'
                  }`}
                >
                  <span className="text-xs font-bold font-space">{v.weight}</span>
                  <span className="text-[10px] opacity-85 font-medium mt-0.5 font-space">₹{v.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stepper, Cart Buttons & Buy Now */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-brand-dark/65">Quantity</span>
                <QuantityStepper
                  quantity={quantity}
                  onChange={setQuantity}
                  max={activeVariant.stock}
                />
              </div>

              <div className="flex-1 flex gap-2 pt-5">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex-1 bg-brand-primary text-brand-cream py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-secondary active:scale-95 shadow-md transition-all cursor-pointer text-sm ${
                    isOutOfStock ? 'bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed shadow-none hover:bg-gray-200' : ''
                  }`}
                >
                  <ShoppingBag className="w-5 h-5" />
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </button>

                <button
                  onClick={handleWishlistToggle}
                  className={`p-3 border rounded-xl flex items-center justify-center transition-all cursor-pointer hover:bg-rose-50 ${
                    isWishlisted ? 'border-rose-300 text-rose-600 bg-rose-50/50' : 'border-brand-sand text-brand-dark/60'
                  }`}
                  aria-label="Add to wishlist"
                >
                  <Heart className={`w-5.5 h-5.5 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Direct Buy Now */}
            {!isOutOfStock && (
              <button
                onClick={handleBuyNow}
                className="w-full bg-brand-ocean text-brand-cream font-bold py-3.5 px-4 rounded-xl hover:bg-brand-secondary active:scale-98 transition-all shadow text-sm cursor-pointer"
              >
                Buy It Now (Direct Checkout)
              </button>
            )}
          </div>

          {/* Trust information */}
          <div className="border-t border-brand-sand pt-5 space-y-3">
            {/* Stock status indicator */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              {isOutOfStock ? (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="text-rose-600 uppercase tracking-wide">Sold Out in this weight</span>
                </>
              ) : activeVariant.stock < 10 ? (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                  <span className="text-amber-700 uppercase tracking-wide font-bold">Only {activeVariant.stock} units left! Hurry up!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-emerald-700 uppercase tracking-wide">In stock - Sourced & Ready to pack</span>
                </>
              )}
            </div>

            {/* Delivery estimates */}
            <div className="flex items-center gap-2 text-xs text-brand-dark/70 font-semibold">
              <Truck className="w-4.5 h-4.5 text-brand-secondary shrink-0" />
              <span>Delivery estimate: Get it by <strong className="text-brand-ocean">{getDeliveryEstimate()}</strong></span>
            </div>

            {/* Offer Coupon highlight */}
            {product.discountPercent === 0 && (
              <div className="bg-brand-secondary/5 border border-brand-secondary/25 p-3.5 rounded-xl flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-brand-secondary shrink-0 mt-0.5" />
                <p className="text-xs text-brand-dark/80 leading-relaxed font-semibold">
                  Get 10% extra discount on this item! Use code <strong className="text-brand-primary font-mono bg-brand-secondary/15 px-1.5 py-0.5 rounded">KARUVADU10</strong> at checkout.
                </p>
              </div>
            )}
          </div>
          
        </div>
      </div>

      {/* Tabs section below */}
      <section className="mt-16 border-t border-brand-sand pt-10">
        {/* Tabs Headers */}
        <div className="flex border-b border-brand-sand gap-6 overflow-x-auto no-scrollbar pb-0.5">
          {[
            { id: 'description', label: 'Description', icon: FileText },
            { id: 'howtouse', label: 'How to Use', icon: BookOpen },
            { id: 'storage', label: 'Storage & Care', icon: ShieldCheck },
            { id: 'reviews', label: `Customer Reviews (${product.reviewsCount})`, icon: Star }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 pb-3.5 font-playfair font-bold text-sm md:text-base border-b-2 shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-brand-dark/50 hover:text-brand-ocean'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-primary' : 'text-brand-dark/40'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tabs contents */}
        <div className="py-6 max-w-4xl leading-relaxed text-sm md:text-base text-brand-dark/80 font-medium">
          {activeTab === 'description' && (
            <div className="space-y-4">
              <p>{product.description}</p>
              <ul className="list-disc pl-5 space-y-2 text-xs md:text-sm text-brand-dark/75 font-inter">
                <li>Premium sun-dried, traditional preparation.</li>
                <li>100% clean, washed with sea-water and perfectly dried.</li>
                <li>Comes in vacuum smell-proof thick foil zip lock.</li>
                <li>Directly supports coastal Tamil Nadu fishing families.</li>
              </ul>
            </div>
          )}

          {activeTab === 'howtouse' && (
            <p className="whitespace-pre-line">{product.howToUse}</p>
          )}

          {activeTab === 'storage' && (
            <p className="whitespace-pre-line">{product.storageTips}</p>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* Sample Review 1 */}
              <div className="border-b border-brand-sand pb-5">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-playfair font-bold text-sm text-brand-ocean">Anbarasan Selvam</h4>
                    <p className="text-[10px] text-brand-dark/45">Verified Customer • June 12, 2026</p>
                  </div>
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-brand-dark/75 mt-2.5">
                  Excellent dry fish! The packaging kept the smell completely locked in. I cooked it inside tamarind gravy, the taste was exceptionally good and extremely traditional. Sura puttu is next!
                </p>
              </div>

              {/* Sample Review 2 */}
              <div className="border-b border-brand-sand pb-5">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-playfair font-bold text-sm text-brand-ocean">Meera Krishnan</h4>
                    <p className="text-[10px] text-brand-dark/45">Verified Customer • June 05, 2026</p>
                  </div>
                  <div className="flex text-amber-500">
                    {[...Array(4)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                    <Star className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                </div>
                <p className="text-xs text-brand-dark/75 mt-2.5">
                  Clean anchovies, very small amount of salt, which is great. Cooking is easy after a quick rinse in warm water. Delivery took 3 days to Bangalore. Perfect.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
