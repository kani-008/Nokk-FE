import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Heart, Trash2, ArrowRight } from "lucide-react";
import SEO from "../components/seo/SEO.jsx";
import { useWishlistStore } from "../components/store/WishlistStore";
import { useAuthStore }     from "../components/store/AuthStore";
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

// ══════════════════════════════════════════════════════════════════════
// WISHLIST PAGE
// ══════════════════════════════════════════════════════════════════════
export default function Wishlist() {
  const { ids, setIds, clear } = useWishlistStore();
  const { token, isAuthenticated } = useAuthStore();

  // productMap: id → full product object (fetched once, kept until page unmounts)
  const [productMap, setProductMap] = useState({});
  const [loading, setLoading] = useState(false);
  // Track which IDs we've already fetched so we only ever make one call per set of ids
  const fetchedIdsRef = useRef(new Set());

  // ── On mount: if authenticated, sync ordered IDs from server ────────
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const load = async () => {
      try {
        const res = await API.get("/wishlist/get-wishlist");
        // Sorted by addedAt descending (most recently added first) — matches
        // the backend ORDER BY w.created_at DESC
        const ordered = (res.data.wishlist ?? []).map((i) => i.productId);
        // Server is authoritative: replace local store IDs outright so stale
        // guest-persisted IDs can never resurrect deleted items on reload.
        setIds(ordered);
      } catch (err) {
        console.error("loadFromServer failed:", err);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  // ── Fetch full product data for any IDs not yet in productMap ───────
  //
  // Notes on the /products/get-all?ids=... endpoint:
  //   • Public — no authentication required, safe to call here.
  //   • The server silently caps `limit` at 100 (Math.min(…, 100)), so
  //     `limit=999` is treated as 100. For a wishlist this is sufficient.
  //   • Response order is not guaranteed to match request order — we
  //     re-order below using the store's authoritative `ids` array.
  useEffect(() => {
    const needed = ids.filter((id) => !fetchedIdsRef.current.has(id));
    if (!needed.length) return;

    let active = true;
    const timer = setTimeout(() => {
      // Only show skeletons on the very first load (productMap is empty)
      if (active && Object.keys(productMap).length === 0) setLoading(true);
    }, 50);

    const fetch_ = async () => {
      try {
        const res = await API.get(
          `/products/get-all?ids=${needed.join(",")}&limit=100`
        );
        if (!active) return;
        const fetched = res.data.products || [];
        // Merge into existing map
        setProductMap((prev) => {
          const next = { ...prev };
          fetched.forEach((p) => { next[p.id] = p; });
          return next;
        });
        needed.forEach((id) => fetchedIdsRef.current.add(id));
      } catch (err) {
        console.error("Failed to load wishlist products:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetch_();

    return () => {
      active = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  // ── Reactively derive the display list from the live store ───────────
  // When ProductCard's heart-toggle removes an id from the store, this
  // list automatically shrinks — no separate onRemove callback needed.
  const displayProducts = ids
    .filter((id) => productMap[id])
    .map((id) => productMap[id]);

  // ── Clear all ────────────────────────────────────────────────────────
  const handleClearAll = async () => {
    clear();
    fetchedIdsRef.current = new Set();
    setProductMap({});
    if (token) {
      try {
        await API.delete("/wishlist/clear");
      } catch (err) {
        console.error("Failed to clear server wishlist:", err);
      }
    }
  };

  const seoBlock = (
    <SEO
      title="My Wishlist | Namma Oor Karuvattu Kadai"
      description="View your saved products at Namma Oor Karuvattu Kadai. Keep track of your favorite dry fish, pickles, and traditional seafood delicacies."
      url="https://nammaoorkaruvattukadai.com/wishlist"
    />
  );

  // ── Empty state ──────────────────────────────────────────────────────
  if (!ids.length && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] md:min-h-[60vh] pt-12 pb-36 md:py-12 px-4 text-center">
        {seoBlock}
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
      {seoBlock}

      {/* header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold text-brand-900">
          My Wishlist
          <span className="font-num text-base font-normal text-amber-500 ml-2">
            ({ids.length} {ids.length === 1 ? "item" : "items"})
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
          {Array.from({ length: Math.min(ids.length, 8) }).map((_, i) => (
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