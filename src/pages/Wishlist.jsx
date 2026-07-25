import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Heart, Trash2, ArrowRight } from "lucide-react";
import SEO from "../components/seo/SEO.jsx";
import { useWishlistStore } from "../components/store/WishlistStore";
import { useAuthStore }     from "../components/store/AuthStore";
import { useHomeBestsellers, useHomeNewArrivals } from "../hookqueries/useHome";
import API from "../ApiCall/Api";
import ProductCard from "../components/Product/ProductCard";

// ── Product skeleton — mirrors ProductCard's layout identically ──────────
function WishSkeleton() {
  return (
    <div className="card-hover overflow-hidden animate-pulse">
      <div className="aspect-square skeleton rounded-t-md" />
      <div className="p-4.5 space-y-2">
        <div className="skeleton h-2 w-1/3" />
        <div className="skeleton h-3 w-4/5" />
        <div className="skeleton h-3 w-3/5" />
        <div className="skeleton h-2.5 w-2/5" />
        <div className="flex items-center gap-1 mt-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-2.5 w-2.5 rounded-sm" />
          ))}
          <div className="skeleton h-2.5 w-8 rounded ml-0.5" />
        </div>
      </div>
      <div className="px-4.5 pb-4.5 pt-3 flex items-center justify-between gap-2 border-t border-gray-100 mt-1">
        <div className="skeleton h-4.5 w-1/4" />
        <div className="skeleton h-8 w-8 rounded-xl" />
      </div>
    </div>
  );
}

function WishlistRecommendations({ wishlistIds = [], onRegisterProducts }) {
  const { data: bestsellers = [] } = useHomeBestsellers();
  const { data: newest = [] } = useHomeNewArrivals();

  const allProducts = useMemo(() => {
    const map = new Map();
    [...bestsellers, ...newest].forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  }, [bestsellers, newest]);

  useEffect(() => {
    if (allProducts.length && onRegisterProducts) {
      onRegisterProducts(allProducts);
    }
  }, [allProducts, onRegisterProducts]);

  const wishSet = useMemo(() => new Set(wishlistIds), [wishlistIds]);
  const recommended = useMemo(
    () => allProducts.filter((p) => !wishSet.has(p.id)).slice(0, 10),
    [allProducts, wishSet]
  );

  if (!recommended.length) return null;

  return (
    <div className="mt-3 sm:mt-5 border-t border-sandal-100/80 pt-3.5 sm:pt-5">
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div>
          <h2 className="font-display text-base sm:text-lg font-bold text-brand-900 leading-tight">You May Also Like</h2>
          <p className="font-body text-[11px] sm:text-xs text-amber-500 font-semibold mt-0.5">Top-rated coastal favorites for you</p>
        </div>
        <Link to="/products" className="font-body text-xs font-bold text-amber-700 hover:text-brand-900 flex items-center gap-1 shrink-0">
          Explore All <ArrowRight size={13} />
        </Link>
      </div>

      <div className="flex md:grid md:grid-cols-4 gap-3.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {recommended.map((p) => (
          <div key={p.id} className="shrink-0 w-[210px] sm:w-[230px] md:w-auto snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// WISHLIST PAGE
// ══════════════════════════════════════════════════════════════════════
export default function Wishlist() {
  const { ids, setIds, clear } = useWishlistStore();
  const { token, isAuthenticated } = useAuthStore();

  const [productMap, setProductMap] = useState({});
  const [loading, setLoading] = useState(false);
  const fetchedIdsRef = useRef(new Set());

  const handleRegisterProducts = useCallback((products) => {
    setProductMap((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const p of products) {
        if (!next[p.id]) {
          next[p.id] = p;
          fetchedIdsRef.current.add(p.id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    let active = true;
    const timer = setTimeout(() => {
      if (active && Object.keys(productMap).length === 0) setLoading(true);
    }, 50);

    const load = async () => {
      try {
        const res = await API.get("/wishlist/get-wishlist");
        if (!active) return;
        const items = res.data.wishlist ?? [];
        const ordered = items.map((p) => p.id);
        setIds(ordered);

        setProductMap((prev) => {
          const next = { ...prev };
          for (const p of items) {
            next[p.id] = p;
            fetchedIdsRef.current.add(p.id);
          }
          return next;
        });
      } catch (err) {
        console.error("Wishlist load error:", err);
      } finally {
        if (active) setLoading(false);
        clearTimeout(timer);
      }
    };

    load();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isAuthenticated, token]);

  useEffect(() => {
    const unmapped = ids.filter((id) => !fetchedIdsRef.current.has(id) || !productMap[id]);
    if (unmapped.length === 0) return;

    let active = true;

    const fetchUnmapped = async () => {
      try {
        const res = await API.get("/products/get-all", {
          params: { ids: unmapped.join(","), limit: unmapped.length },
        });
        if (!active) return;
        const fetchedList = res.data.products || [];

        setProductMap((prev) => {
          const next = { ...prev };
          for (const p of fetchedList) {
            next[p.id] = p;
            fetchedIdsRef.current.add(p.id);
          }
          return next;
        });
      } catch (err) {
        console.error("Failed to fetch unmapped wishlist items:", err);
      }
    };

    fetchUnmapped();

    return () => {
      active = false;
    };
  }, [ids, productMap]);

  const displayProducts = ids.map((id) => productMap[id]).filter(Boolean);

  const handleClearAll = async () => {
    clear();
    setProductMap({});
    fetchedIdsRef.current.clear();
    if (isAuthenticated && token) {
      try {
        await API.delete("/wishlist/clear");
      } catch (err) {
        console.error("Failed to clear wishlist on server:", err);
      }
    }
  };

  const seoBlock = (
    <SEO
      title="My Wishlist | Namma Oor Karuvattu Kadai"
      description="View your saved products at Namma Oor Karuvattu Kadai. Keep track of your favorite dry fish, pickles, and traditional seafood delicacies."
      url="https://nammaoorkaruvattukadai.com/wishlist"
      noindex={true}
    />
  );

  if (!loading && displayProducts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-4">
        {seoBlock}
        <div className="flex flex-col items-center justify-center py-3 sm:py-6 px-4 text-center max-w-md mx-auto">
          <div className="w-11 h-11 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-2">
            <Heart size={22} />
          </div>
          <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-1">
            Your wishlist is empty
          </h2>
          <p className="font-body text-amber-600 text-xs mb-3 max-w-xs leading-snug">
            Tap the heart on any product to save it here.
          </p>
          <Link to="/products" className="btn-sm btn-primary inline-flex items-center gap-1.5">
            Browse Products <ArrowRight size={14} />
          </Link>
        </div>

        <WishlistRecommendations wishlistIds={ids} onRegisterProducts={handleRegisterProducts} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {seoBlock}

      {/* header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-brand-900">
          My Wishlist
          <span className="font-num text-base font-normal text-amber-500 ml-2">
            ({displayProducts.length} {displayProducts.length === 1 ? "item" : "items"})
          </span>
        </h1>
        {ids.length > 0 && (
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
        <div className="flex md:grid md:grid-cols-4 gap-3.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Array.from({ length: Math.min(ids.length || 4, 8) }).map((_, i) => (
            <div key={i} className="shrink-0 w-[210px] sm:w-[230px] md:w-auto snap-start">
              <WishSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex md:grid md:grid-cols-4 gap-3.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {displayProducts.map((p) => (
            <div key={p.id} className="shrink-0 w-[210px] sm:w-[230px] md:w-auto snap-start">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}

      <WishlistRecommendations wishlistIds={ids} onRegisterProducts={handleRegisterProducts} />
    </div>
  );
}