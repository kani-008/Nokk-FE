import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '../stores/wishlistStore';
import { useCartStore } from '../stores/cartStore';
import { useToastStore } from '../stores/toastStore';
import { mockAPI } from '../data/mockData';
import PriceDisplay from '../components/PriceDisplay';
import Breadcrumb from '../components/Breadcrumb';

export default function Wishlist() {
  const navigate = useNavigate();
  const { wishlistItems, toggleWishlist } = useWishlistStore();
  const addItem = useCartStore(state => state.addItem);
  const addToast = useToastStore(state => state.addToast);

  const [wishlistProducts, setWishlistProducts] = useState([]);

  // Load products matching wishlist ids
  useEffect(() => {
    const allProducts = mockAPI.getProducts();
    const matched = allProducts.filter(p => wishlistItems.includes(p.id));
    setWishlistProducts(matched);
  }, [wishlistItems]);

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    const firstVariant = product.variants[0];
    if (!firstVariant) return;

    addItem(product, firstVariant.weight, firstVariant.price, 1);
    addToast(`Added ${product.nameEn} (${firstVariant.weight}) to cart!`, 'success');
  };

  const handleRemove = (productId, nameEn, e) => {
    e.preventDefault();
    toggleWishlist(productId);
    addToast(`Removed ${nameEn} from wishlist`, 'info');
  };

  const breadcrumbItems = [{ label: 'Wishlist', link: '/wishlist' }];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 pb-20 font-inter">
      <Breadcrumb items={breadcrumbItems} />

      <h1 className="font-tiro-tamil text-2xl md:text-3xl text-brand-primary font-bold border-b border-brand-sand pb-4 mb-8">
        விருப்பப் பட்டியல்
      </h1>

      {wishlistProducts.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center py-20 bg-brand-cream/20 border border-brand-sand rounded-3xl text-center max-w-2xl mx-auto shadow-sm">
          <div className="p-5 bg-brand-sand/35 rounded-full mb-6 text-brand-primary">
            <Heart className="w-16 h-16 text-brand-primary" />
          </div>
          <h3 className="font-playfair text-xl font-bold text-brand-ocean">Your Wishlist is Empty</h3>
          <p className="text-sm text-brand-dark/60 mt-2 max-w-sm leading-relaxed">
            You haven't saved any products to your wishlist yet. Explore our fresh village catch and press the heart icon to save them here!
          </p>
          <Link
            to="/products"
            className="mt-8 bg-brand-primary text-brand-cream px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-brand-secondary active:scale-95 transition-all shadow-md inline-flex items-center gap-2"
          >
            Explore Fresh Catch <ArrowRight className="w-4.5 h-4.5" />
          </Link>
        </div>
      ) : (
        // Wishlist Grid
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {wishlistProducts.map((p) => {
            const firstVariant = p.variants[0] || { price: 0, mrp: 0, weight: '250g' };
            const isOutOfStock = !p.inStock || firstVariant.stock === 0;

            return (
              <div
                key={p.id}
                className="group bg-brand-cream border border-brand-sand rounded-2xl overflow-hidden relative shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                {/* Image & overlay */}
                <Link to={`/products/${p.slug}`} className="block relative aspect-square shrink-0 overflow-hidden bg-brand-sand/20">
                  <img src={p.image} alt={p.nameEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350" />
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-brand-dark/70 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Out of Stock</span>
                    </div>
                  )}
                </Link>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <Link to={`/products/${p.slug}`} className="block">
                    <h4 className="font-tiro-tamil text-sm text-brand-primary font-bold line-clamp-1">{p.nameTa}</h4>
                    <h5 className="font-playfair text-xs font-semibold text-brand-dark/80 line-clamp-1 mt-0.5">{p.nameEn}</h5>
                  </Link>

                  <div className="flex items-center justify-between pt-1 font-space">
                    <PriceDisplay
                      price={firstVariant.price}
                      mrp={firstVariant.mrp}
                      size="sm"
                    />
                    <span className="text-[10px] bg-brand-sand px-2 py-0.5 rounded-full font-bold text-brand-ocean shrink-0">
                      {firstVariant.weight}
                    </span>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2 pt-2 border-t border-brand-sand/40">
                    <button
                      onClick={(e) => handleRemove(p.id, p.nameEn, e)}
                      className="p-2.5 border border-brand-sand hover:border-rose-200 text-brand-dark/45 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl transition-all cursor-pointer shadow-sm"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={(e) => handleAddToCart(p, e)}
                      disabled={isOutOfStock}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer bg-brand-ocean text-brand-cream hover:bg-brand-primary ${
                        isOutOfStock ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed shadow-none' : ''
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" /> Add to Cart
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
