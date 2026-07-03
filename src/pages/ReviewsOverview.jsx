import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, MessageSquare, ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
import API from "../ApiCall/Api";
import comboImg from "../assets/products/combo.jpg";

const PH = comboImg;

// ── Skeleton card (matches Wishlist.jsx WishSkeleton) ──────────────────
function ReviewCardSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="aspect-square skeleton" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 w-4/5" />
        <div className="skeleton h-2 w-3/5" />
        <div className="flex items-center gap-1.5 mt-1">
          <div className="skeleton h-2 w-20" />
          <div className="skeleton h-2 w-10" />
        </div>
      </div>
    </div>
  );
}

// ── Star display ──────────────────────────────────────────────────────
function Stars({ rating, count }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          className={
            s <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-amber-100 text-amber-200"
          }
        />
      ))}
      <span className="font-num text-xs text-amber-600 ml-0.5">({count})</span>
    </div>
  );
}

// ── Single product card for reviews overview ──────────────────────────
function ReviewProductCard({ product }) {
  const image = product.primaryImage || PH;

  return (
    <Link
      to={`/reviews/${product.slug}`}
      className="card overflow-hidden group transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sandal-400"
    >
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-sandal-50 relative">
        <img
          src={image}
          alt={product.nameEn}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = PH; }}
        />
        {/* review count bubble */}
        <div className="absolute top-2 right-2 bg-white/90 rounded-xl px-2 py-0.5 flex items-center gap-1 shadow-sm">
          <MessageSquare size={11} className="text-sandal-600" />
          <span className="font-num text-[10px] font-bold text-sandal-700">
            {product.reviewCount}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <h3 className="font-body text-sm font-bold text-gray-900 leading-tight line-clamp-2">
          {product.nameEn}
        </h3>
        {product.nameTa && (
          <p className="font-tamil text-xs text-amber-500 leading-tight line-clamp-1">
            {product.nameTa}
          </p>
        )}
        <Stars rating={product.avgRating} count={product.reviewCount} />
      </div>
    </Link>
  );
}

// ── Main page ─────────────────────────────────────────────────────────
export default function ReviewsOverview() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");

  useEffect(() => {
    let active = true;

    const fetchProducts = async () => {
      if (!active) return;
      setLoading(true);
      try {
        // Fetch active products; we filter client-side for those with reviews
        const res = await API.get("/products/get-all?limit=200");
        if (!active) return;
        const all = res.data?.products || [];
        // Only show products that have at least one review
        setProducts(all.filter((p) => (p.reviewCount || 0) > 0));
      } catch (err) {
        console.error("ReviewsOverview: fetch failed", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProducts();
    return () => { active = false; };
  }, []);

  const filtered = search.trim()
    ? products.filter((p) =>
        p.nameEn?.toLowerCase().includes(search.toLowerCase()) ||
        p.nameTa?.includes(search)
      )
    : products;

  return (
    <>
      <Helmet>
        <title>Product Reviews — Namma Oor Karuvattu Kadai</title>
        <meta
          name="description"
          content="Browse customer ratings and reviews for all our products."
        />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-20">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-brand-900">
            Customer Reviews
          </h1>
          <p className="font-body text-sm text-amber-600 mt-1">
            Browse products and read what our customers say
          </p>
        </div>

        {/* Search */}
        {!loading && products.length > 0 && (
          <div className="mb-5 max-w-sm">
            <input
              type="search"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-sandal-200 bg-white font-body text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sandal-300"
            />
          </div>
        )}

        {/* Grid skeleton */}
        {loading && (
          <div className="product-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <ReviewCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state — no products with reviews */}
        {!loading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <MessageSquare size={52} className="text-amber-200 mb-4" />
            <h2 className="font-display text-xl font-bold text-brand-900 mb-2">
              No reviews yet
            </h2>
            <p className="font-body text-sm text-amber-600 mb-6 max-w-xs">
              Be the first to purchase a product and leave a review!
            </p>
            <Link to="/products" className="btn-lg btn-primary">
              Browse Products <ArrowRight size={15} />
            </Link>
          </div>
        )}

        {/* Empty search result */}
        {!loading && products.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-body text-sm text-gray-400 font-semibold">
              No products match &ldquo;{search}&rdquo;
            </p>
          </div>
        )}

        {/* Product grid */}
        {!loading && filtered.length > 0 && (
          <div className="product-grid">
            {filtered.map((p) => (
              <ReviewProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
