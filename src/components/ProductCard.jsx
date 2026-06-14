import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { useWishlistStore } from '../stores/wishlistStore';
import { useToastStore } from '../stores/toastStore';
import PriceDisplay from './PriceDisplay';

export default function ProductCard({ product }) {
  const addItem = useCartStore(state => state.addItem);
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const addToast = useToastStore(state => state.addToast);

  // Default to first variant
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const activeVariant = product.variants[selectedVariantIndex] || { weight: '250g', price: 0, mrp: 0, stock: 0 };
  
  const isWishlisted = isInWishlist(product.id);
  const isOutOfStock = !product.inStock || activeVariant.stock === 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    
    addItem(product, activeVariant.weight, activeVariant.price, 1);
    addToast(`Added ${product.nameEn} (${activeVariant.weight}) to cart!`, 'success');
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
    addToast(
      isWishlisted ? `Removed ${product.nameEn} from wishlist` : `Added ${product.nameEn} to wishlist!`,
      'info'
    );
  };

  return (
    <div className="group bg-brand-cream border border-brand-sand/50 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative border-b-4 border-b-brand-sand">
      {/* Badges Overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        {product.isBestseller && (
          <span className="bg-brand-primary text-brand-cream text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow">
            Bestseller
          </span>
        )}
        {product.isNew && (
          <span className="bg-brand-secondary text-brand-cream text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow">
            New
          </span>
        )}
        {product.discountPercent > 0 && (
          <span className="bg-emerald-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow">
            {product.discountPercent}% OFF
          </span>
        )}
      </div>

      {/* Wishlist Heart Icon */}
      <button
        onClick={handleWishlistToggle}
        className="absolute top-3 right-3 z-10 p-2 bg-white/85 backdrop-blur-sm rounded-full shadow-md text-brand-dark/60 hover:text-rose-600 active:scale-90 transition-all duration-300 cursor-pointer"
        aria-label="Add to wishlist"
      >
        <Heart className={`w-4 h-4 transition-transform ${isWishlisted ? 'fill-rose-600 text-rose-600 scale-110' : 'text-brand-dark/60'}`} />
      </button>

      {/* Product Image Link */}
      <Link to={`/products/${product.slug}`} className="block relative overflow-hidden aspect-square bg-brand-sand/30">
        <img
          src={product.image}
          alt={product.nameEn}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-brand-dark/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Title */}
        <Link to={`/products/${product.slug}`} className="block mb-2 group-hover:text-brand-primary transition-colors flex-1">
          <h4 className="font-tiro-tamil text-base md:text-lg text-brand-primary leading-tight font-medium mb-1">
            {product.nameTa}
          </h4>
          <h3 className="font-playfair text-sm md:text-base font-semibold text-brand-dark/85 leading-snug">
            {product.nameEn}
          </h3>
        </Link>

        {/* Variant weight selector pills */}
        <div className="flex flex-wrap gap-1 mb-3">
          {product.variants.map((v, i) => (
            <button
              key={v.weight}
              type="button"
              onClick={() => setSelectedVariantIndex(i)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                selectedVariantIndex === i
                  ? 'bg-brand-ocean text-white border-brand-ocean'
                  : 'bg-white text-brand-dark/75 border-brand-sand hover:border-brand-ocean/40'
              }`}
            >
              {v.weight}
            </button>
          ))}
        </div>

        {/* Pricing & Stock Details */}
        <div className="flex items-center justify-between border-t border-brand-sand/50 pt-3">
          <div className="flex flex-col">
            <PriceDisplay
              price={activeVariant.price}
              mrp={activeVariant.mrp}
              discountPercent={product.discountPercent}
              size="sm"
            />
            {activeVariant.stock > 0 && activeVariant.stock < 10 && (
              <span className="text-[10px] text-rose-600 font-bold mt-0.5">
                Only {activeVariant.stock} left!
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
              isOutOfStock
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-brand-primary border-brand-primary text-brand-cream hover:bg-brand-secondary hover:border-brand-secondary active:scale-95 cursor-pointer shadow-sm hover:shadow'
            }`}
            aria-label="Add to cart"
          >
            <ShoppingBag className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
