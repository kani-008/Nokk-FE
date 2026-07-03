import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Star, Trash2, ArrowRight } from "lucide-react";
import { useWishlistStore } from "../components/store/WishlistStore";
import { useCartStore }     from "../components/store/CartStore";
import { useAuthStore }     from "../components/store/AuthStore";
import API from "../ApiCall/Api";
import comboImg from "../assets/products/combo.jpg";

// ─── placeholder ──────────────────────────────────────────────────────
const PH = comboImg;

const rupee = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

// ── Skeleton card ──────────────────────────────────────────────────────
function WishSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="aspect-square skeleton" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-2 w-1/3" />
        <div className="skeleton h-3 w-4/5" />
        <div className="skeleton h-3 w-3/5" />
        <div className="flex justify-between mt-2">
          <div className="skeleton h-4 w-1/4" />
          <div className="skeleton h-8 w-8 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ── Product card for wishlist ──────────────────────────────────────────
function WishCard({ product, onRemove }) {
  const { addItem }   = useCartStore();
  const { token }     = useAuthStore();
  const { toggle }    = useWishlistStore();

  const price    = product.minPrice || 0;
  const compare  = product.minComparePrice > price ? product.minComparePrice : null;
  const disc     = compare ? Math.round(((compare - price) / compare) * 100) : 0;
  const image    = product.primaryImage || PH;
  const firstV   = product.variants?.[0];

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!firstV) return;

    const itemData = {
      variantId:    firstV.id,
      productId:    product.id,
      productName:  product.nameEn,
      nameTa:       product.nameTa,
      image,
      price:        firstV.price,
      comparePrice: firstV.comparePrice,
      weight:       firstV.weightLabel,
      quantity:     1
    };

    if (token) {
      try {
        const response = await API.post("/cart/add-item", {
          variantId: firstV.id,
          quantity: 1,
        });
        console.log(response.data);
        const serverItems = (response.data.cart?.items ?? []).map((i) => ({
          itemId:       i.itemId,
          variantId:    i.variantId,
          productId:    i.productId,
          productName:  i.nameEn ?? i.name,
          nameTa:       i.nameTa,
          image:        i.primaryImage,
          price:        i.price,
          comparePrice: i.comparePrice,
          weight:       i.weightLabel,
          quantity:     i.quantity,
        }));
        useCartStore.getState().setItems(serverItems);
      } catch (err) {
        console.error("addItem server sync failed:", err);
      }
    } else {
      addItem(itemData);
    }
  };

  const handleRemove = async (e) => {
    e.preventDefault();
    try {
      if (token) {
        await API.delete("/wishlist/remove-item", { data: { productId: product.id } });
      }
      toggle(product.id);
      onRemove(product.id);
    } catch (err) {
      console.error("Failed to remove item from wishlist:", err);
    }
  };

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="card-hover">
        {/* image */}
        <div className="relative aspect-square overflow-hidden bg-brand-50 rounded-t-md">
          <img
            src={image}
            alt={product.nameEn}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.src = PH; }}
          />
          {disc > 0 && (
            <span className="absolute top-2 left-2 badge-red">−{disc}%</span>
          )}
          {product.isBestseller && (
            <span className="absolute top-2 right-8 badge-amber">Best Seller</span>
          )}
          {/* remove from wishlist */}
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-white rounded-full w-7 h-7 flex items-center justify-center shadow hover:scale-110 transition-transform"
            aria-label="Remove from wishlist"
          >
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
          </button>
        </div>

        {/* info */}
        <div className="p-3">
          <p className="font-body text-[10px] text-amber-500 uppercase tracking-wider font-medium mb-0.5">
            {product.categoryName}
          </p>
          <h3 className="font-body text-sm font-semibold text-brand-900 leading-snug line-clamp-2 mb-0.5">
            {product.nameEn}
          </h3>
          {product.nameTa && (
            <p className="font-tamil text-[11px] text-amber-400 mb-2 line-clamp-1">{product.nameTa}</p>
          )}

          {/* stars */}
          {product.avgRating > 0 && (
            <div className="flex items-center gap-0.5 mb-2">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} size={10}
                  className={s <= Math.round(product.avgRating) ? "fill-amber-400 text-amber-400" : "text-amber-200"} />
              ))}
              <span className="font-num text-[10px] text-amber-500 ml-0.5">({product.reviewCount})</span>
            </div>
          )}

          {/* price + cart */}
          <div className="flex items-end justify-between gap-1">
            <div>
              <span className="font-num text-base font-bold text-brand-900">{rupee(price)}</span>
              {compare && (
                <span className="font-num text-xs text-amber-400 line-through ml-1.5">{rupee(compare)}</span>
              )}
              {firstV?.weightLabel && (
                <p className="font-body text-[10px] text-amber-500 mt-0.5">{firstV.weightLabel}</p>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              className="bg-brand-800 hover:bg-brand-900 text-white p-2 rounded-xl transition-colors shrink-0 active:scale-90"
              aria-label="Add to cart"
            >
              <ShoppingCart size={14} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ══════════════════════════════════════════════════════════════════════
// WISHLIST PAGE
// ══════════════════════════════════════════════════════════════════════
export default function Wishlist() {
  const { ids, clear } = useWishlistStore();
  const { token, isAuthenticated }             = useAuthStore();

  const [products, setProducts] = useState([]);   // fetched product details
  const [loading,  setLoading]  = useState(false);
  const [localIds, setLocalIds] = useState(ids);   // local mirror so removal is instant

  const productsRef = useRef(products);
  productsRef.current = products;

  // ── On mount: sync from server if logged in ───────────────────────
  useEffect(() => {
    if (isAuthenticated && token) {
      const load = async () => {
        try {
          const res = await API.get("/wishlist/get-wishlist");
          console.log(res.data);
          const serverIds = (res.data.wishlist ?? []).map((i) => i.productId);
          // Server is authoritative — replace local state outright so stale
          // persisted IDs can never resurrect a deleted item on reload.
          // Guest (not authenticated) falls through the outer `if` entirely,
          // so local-only Zustand store remains the source of truth for guests.
          useWishlistStore.getState().setIds(serverIds);
          setLocalIds(serverIds);
        } catch (err) {
          console.error("loadFromServer failed:", err);
        }
      };
      load();
    }
  }, [isAuthenticated, token]);

  // ── Fetch product details whenever localIds change ────────────────
  useEffect(() => {
    let active = true;

    // Check if all needed product details are already loaded
    const currentProductIds = productsRef.current.map((p) => p.id);
    const hasAllProducts = localIds.every((id) => currentProductIds.includes(id));

    if (hasAllProducts) {
      // If we already have the data, just filter the list locally (handles removals without API requests)
      const filtered = productsRef.current.filter((p) => localIds.includes(p.id));
      if (filtered.length !== productsRef.current.length) {
        setProducts(filtered);
      }
      return;
    }

    if (!localIds.length) {
      const timer = setTimeout(() => {
        if (active) setProducts([]);
      }, 0);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }

    // Only set loading to true (show skeletons) if we don't have any products loaded yet
    const timer = setTimeout(() => {
      if (active && productsRef.current.length === 0) setLoading(true);
    }, 50);

    const fetchProducts = async () => {
      try {
        // Fetch only the specific wishlisted product IDs
        const response = await API.get(`/products/get-all?ids=${localIds.join(",")}&limit=999`);
        console.log(response.data);
        if (!active) return;
        const allProducts = response.data.products || [];
        setProducts(allProducts);
      } catch (err) {
        console.error("Failed to load wishlist products:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProducts();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [localIds]);

  // ── Instant remove (update local mirror, store handles rest) ──────
  const handleRemove = (productId) => {
    setLocalIds((prev) => prev.filter((id) => id !== productId));
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // ── Clear all ─────────────────────────────────────────────────────
  const handleClearAll = async () => {
    clear();
    setLocalIds([]);
    setProducts([]);
    if (token) {
      try {
        await API.delete("/wishlist/clear");
      } catch (err) {
        console.error("Failed to clear server wishlist:", err);
      }
    }
  };

  // ── Empty state ───────────────────────────────────────────────────
  if (!localIds.length && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] md:min-h-[60vh] pt-12 pb-36 md:py-12 px-4 text-center">
        <Heart size={56} className="text-amber-200 mb-4" />
        <h2 className="font-display text-2xl font-bold text-brand-900 mb-2">Your wishlist is empty</h2>
        <p className="font-body text-amber-600 text-sm mb-7 max-w-xs">
          Tap the heart on any product to save it here.
        </p>
        <Link to="/products" className="btn-lg btn-primary">
          Browse Products <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold text-brand-900">
          My Wishlist
          <span className="font-num text-base font-normal text-amber-500 ml-2">
            ({localIds.length} {localIds.length === 1 ? "item" : "items"})
          </span>
        </h1>
        {localIds.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 font-body text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            <Trash2 size={14} /> Clear all
          </button>
        )}
      </div>

      {/* grid */}
      {loading ? (
        <div className="product-grid">
          {Array.from({ length: Math.min(localIds.length, 8) }).map((_, i) => (
            <WishSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <WishCard key={p.id} product={p} onRemove={handleRemove} />
          ))}
        </div>
      )}

    </div>
  );
}