import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { Heart, Trash2, ArrowRight } from "lucide-react";
import SEO from "../components/seo/SEO.jsx";
import { useWishlistStore } from "../components/store/WishlistStore";
import { useAuthStore }     from "../components/store/AuthStore";
import { useHomeBestsellers } from "../hookqueries/useHome";
import API from "../ApiCall/Api";
import ProductCard from "../components/Product/ProductCard";

// ── Generic skeleton — mirrors ProductCard's own skeleton shape ──────────
function WishSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="aspect-square skeleton" />
      <div className="p-4.5 space-y-2.5">
        <div className="skeleton h-2 w-1/3" />
        <div className="skeleton h-3 w-4/5" />
        <div className="skeleton h-3 w-3/5" />
        <div className="flex justify-between mt-3">
          <div className="skeleton h-4.5 w-1/4" />
          <div className="skeleton h-8 w-8 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function WishlistRecommendations({ wishlistIds = [] }) {
  const { data: bestsellers = [] } = useHomeBestsellers();

  const wishSet = useMemo(() => new Set(wishlistIds), [wishlistIds]);
  const recommended = useMemo(
    () => bestsellers.filter((p) => !wishSet.has(p.id)).slice(0, 4),
    [bestsellers, wishSet]
  );

  if (!recommended.length) return null;

  return (
    <div className="mt-12 border-t border-sandal-100 pt-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display text-xl font-bold text-brand-900">You May Also Like</h2>
          <p className="font-body text-xs text-amber-500 font-semibold mt-0.5">Top-rated coastal favorites for you</p>
        </div>
        <Link to="/products" className="font-body text-xs font-bold text-amber-700 hover:text-brand-900 flex items-center gap-1">
          Explore All <ArrowRight size={13} />
        </Link>
      </div>
      <div className="product-grid">
        {recommended.map((p) => (
          <ProductCard key={p.id} product={p} />
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
        fetchedIdsRef.current = new Set(ordered);

        const map = {};
        for (const p of items) {
          map[p.id] = p;
        }
        setProductMap(map);
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
    if (isAuthenticated) return;
    if (ids.length === 0) return;

    const unmapped = ids.filter((id) => !fetchedIdsRef.current.has(id));
    if (unmapped.length === 0) return;

    let active = true;
    setLoading(true);

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
          }
          return next;
        });

        for (const id of unmapped) {
          fetchedIdsRef.current.add(id);
        }
      } catch (err) {
        console.error("Failed to fetch unmapped wishlist items:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchUnmapped();

    return () => {
      active = false;
    };
  }, [ids, isAuthenticated]);

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
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] md:min-h-[60vh] pt-12 pb-36 md:py-12 px-4 text-center">
        {seoBlock}
        <Heart size={56} className="text-amber-200 mb-4" />
        <h2 className="font-display text-2xl font-bold text-brand-900 mb-2">Your wishlist is empty</h2>
        <p className="font-body text-amber-600 text-sm mb-7 max-w-xs">
          Tap the heart on any product to save it here.
        </p>
        <Link to="/products" className="btn-lg btn-primary mb-12">
          Browse Products <ArrowRight size={16} />
        </Link>
        <WishlistRecommendations wishlistIds={ids} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {seoBlock}

      {/* header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold text-brand-900">
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
        <div className="product-grid">
          {Array.from({ length: Math.min(ids.length || 4, 8) }).map((_, i) => (
            <WishSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="product-grid">
          {displayProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

    </div>
  );
}