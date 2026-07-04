import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronRight, ArrowLeft, MessageSquare, Star } from "lucide-react";
import { Helmet } from "react-helmet-async";
import API from "../ApiCall/Api";
import {
  StarBadge,
  Lightbox,
  ReviewRow,
} from "../components/Product/ProductReviews.jsx";
const PH = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const PAGE_SIZE = 10;

// Helper to distribute total review counts realistically for progress bars
const getDistribution = (avg, count, reviews = []) => {
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const total = count || 0;

  if (reviews.length > 0) {
    reviews.forEach((r) => {
      const rInt = Math.min(5, Math.max(1, Math.round(r.rating)));
      dist[rInt]++;
    });

    const loggedCount = reviews.length;
    if (total > loggedCount) {
      const scale = total / loggedCount;
      Object.keys(dist).forEach((k) => {
        dist[k] = Math.round(dist[k] * scale);
      });
    }
  } else {
    const rating = avg || 5;
    if (rating >= 4.5) {
      dist[5] = Math.round(total * 0.75);
      dist[4] = Math.round(total * 0.18);
      dist[3] = Math.round(total * 0.05);
      dist[2] = Math.round(total * 0.01);
      dist[1] = Math.max(0, total - (dist[5] + dist[4] + dist[3] + dist[2]));
    } else if (rating >= 4.0) {
      dist[5] = Math.round(total * 0.55);
      dist[4] = Math.round(total * 0.30);
      dist[3] = Math.round(total * 0.10);
      dist[2] = Math.round(total * 0.03);
      dist[1] = Math.max(0, total - (dist[5] + dist[4] + dist[3] + dist[2]));
    } else {
      dist[5] = Math.round(total * 0.30);
      dist[4] = Math.round(total * 0.30);
      dist[3] = Math.round(total * 0.25);
      dist[2] = Math.round(total * 0.10);
      dist[1] = Math.max(0, total - (dist[5] + dist[4] + dist[3] + dist[2]));
    }
  }
  return dist;
};

// ── Skeleton for individual review rows ───────────────────────────────
function ReviewRowSkeleton() {
  return (
    <div className="border-b border-sandal-50/50 pb-4 last:border-b-0 animate-pulse">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-full skeleton shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton h-2.5 w-24" />
          <div className="skeleton h-2 w-16" />
        </div>
        <div className="skeleton h-2.5 w-16" />
      </div>
      <div className="space-y-1.5">
        <div className="skeleton h-2.5 w-4/5" />
        <div className="skeleton h-2.5 w-3/5" />
      </div>
    </div>
  );
}

// ── Product header skeleton ───────────────────────────────────────────
function HeaderSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="skeleton h-3 w-48 mb-4 rounded" />
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-xl skeleton shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-5 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
      </div>
    </div>
  );
}

// ── Stars display for header ──────────────────────────────────────────
function RatingSummary({ avgRating, reviewCount }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <StarBadge rating={avgRating} size={16} />
      <span className="font-num text-sm font-bold text-gray-700">
        {avgRating.toFixed(1)}
      </span>
      <span className="font-body text-xs text-gray-400">
        ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────
export default function ProductReviewsPage() {
  const { slug }   = useParams();
  const navigate   = useNavigate();

  const [product, setProduct]   = useState(null);
  const [reviews, setReviews]   = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [error, setError]       = useState(null);

  // Initial load (page 1)
  useEffect(() => {
    if (!slug) return;
    let active = true;

    const fetchPage = async () => {
      if (!active) return;
      setLoading(true);
      setReviews([]);
      setPage(1);
      setError(null);
      try {
        const res = await API.get(
          `/products/get-reviews?slug=${encodeURIComponent(slug)}&page=1&limit=${PAGE_SIZE}`
        );
        if (!active) return;
        if (!res.data.success) {
          setError("Product not found.");
          return;
        }
        setProduct(res.data.product);
        setReviews(res.data.reviews);
        setPagination(res.data.pagination);
      } catch (err) {
        if (active) setError("Failed to load reviews. Please try again.");
        console.error("ProductReviewsPage fetch error:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPage();
    return () => { active = false; };
  }, [slug]);

  // Load more (page N)
  const loadMore = useCallback(async () => {
    if (loadingMore || !pagination?.hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      const res = await API.get(
        `/products/get-reviews?slug=${encodeURIComponent(slug)}&page=${nextPage}&limit=${PAGE_SIZE}`
      );
      if (res.data.success) {
        setReviews((prev) => [...prev, ...res.data.reviews]);
        setPagination(res.data.pagination);
        setPage(nextPage);
      }
    } catch (err) {
      console.error("ProductReviewsPage loadMore error:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, pagination, page, slug]);

  // ── Error state ───────────────────────────────────────────────────
  if (!loading && error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="font-body text-sm text-red-500 font-semibold mb-4">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="btn-lg btn-primary"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Calculate rating distribution for progress bars
  const avgRating = product?.avgRating || 0;
  const reviewCount = product?.reviewCount || 0;
  const dist = product ? getDistribution(avgRating, reviewCount, reviews) : {};

  return (
    <>
      <Helmet>
        <title>
          {product ? `Reviews — ${product.nameEn}` : "Reviews"} | Namma Oor Karuvattu Kadai
        </title>
        <meta
          name="description"
          content={
            product
              ? `Customer reviews and ratings for ${product.nameEn}.`
              : "Product reviews"
          }
        />
      </Helmet>

      {/* Lightbox */}
      <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">

        {/* ── Loading state ────────────────────────────────────────── */}
        {loading && (
          <div className="max-w-2xl mx-auto">
            <HeaderSkeleton />
            <div className="border border-sandal-100 rounded-2xl p-4 sm:p-5 space-y-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <ReviewRowSkeleton key={i} />
              ))}
            </div>
          </div>
        )}

        {/* ── Loaded ───────────────────────────────────────────────── */}
        {!loading && product && (
          <>
            {/* Breadcrumb — exact styling from ProductDetails.jsx */}
            <nav className="flex items-center gap-1.5 font-body text-xs text-amber-500 mb-6 flex-wrap">
              <Link to="/" className="hover:text-brand-700 transition-colors">Home</Link>
              <ChevronRight size={12} />
              <Link to="/reviews" className="hover:text-brand-700 transition-colors">Reviews</Link>
              <ChevronRight size={12} />
              <Link
                to={`/products/${slug}`}
                className="hover:text-brand-700 transition-colors truncate max-w-[140px]"
              >
                {product.nameEn}
              </Link>
              <ChevronRight size={12} />
              <span className="text-brand-900 font-medium">Ratings &amp; Reviews</span>
            </nav>

            {/* Split layout grid: Left column overall rating / product summary, Right column reviews list */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              
              {/* LEFT COLUMN: Summary Card & Rating Breakdown */}
              <div className="lg:col-span-5 lg:sticky lg:top-[104px] self-start space-y-6">
                
                <div className="bg-white border border-sandal-100 rounded-2xl p-5 shadow-sm space-y-5">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => navigate(-1)}
                      className="p-1.5 hover:bg-sandal-100/50 rounded-lg transition-colors cursor-pointer text-gray-800 shrink-0"
                      aria-label="Back"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h1 className="font-display text-xl sm:text-2xl font-bold text-brand-900 leading-snug">
                        {product.nameEn}
                      </h1>
                      {product.nameTa && (
                        <p className="font-tamil text-amber-500 text-sm mt-0.5">{product.nameTa}</p>
                      )}
                      <div className="mt-2">
                        <RatingSummary
                          avgRating={product.avgRating}
                          reviewCount={product.reviewCount}
                        />
                      </div>
                    </div>
                    {product.primaryImage && (
                      <Link to={`/products/${slug}`} className="shrink-0">
                        <img
                          src={product.primaryImage}
                          alt={product.nameEn}
                          className="w-16 h-16 rounded-xl object-cover border border-sandal-100 shadow-sm hover:opacity-95 transition-opacity"
                          onError={(e) => { e.target.src = PH; }}
                        />
                      </Link>
                    )}
                  </div>

                  <hr className="border-sandal-100/50" />

                  {/* Rating Breakdown Bars */}
                  <div className="space-y-4">
                    <h3 className="font-display text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Rating Distribution
                    </h3>
                    
                    <div className="flex gap-6 items-center bg-sandal-100/5 p-4 rounded-xl border border-sandal-100/40">
                      {/* Big Score */}
                      <div className="text-center flex flex-col items-center justify-center shrink-0 pr-4 border-r border-sandal-100/60">
                        <div className="flex items-center gap-1.5 justify-center">
                          <span className="font-num text-3xl font-extrabold text-gray-900">{avgRating.toFixed(1)}</span>
                          <Star size={20} className="fill-sandal-600 text-sandal-600 mb-0.5" />
                        </div>
                        <p className="font-body text-[10px] text-gray-400 font-bold mt-1 leading-tight">
                          Average Rating
                        </p>
                      </div>

                      {/* Horizontal Bars */}
                      <div className="flex-1 space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = dist[star] || 0;
                          const percent = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-2 text-[11px] font-semibold text-gray-600">
                              <span className="w-4 flex items-center gap-0.5 justify-end">{star}★</span>
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    star >= 4 ? "bg-green-600" : star === 3 ? "bg-amber-500" : "bg-red-500"
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <span className="w-6 text-right font-num text-gray-400">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back Link */}
                <div className="text-center lg:text-left pl-2">
                  <Link
                    to={`/products/${slug}`}
                    className="font-body text-xs text-sandal-600 hover:text-sandal-800 transition-colors font-bold inline-flex items-center gap-1"
                  >
                    ← Back to product detail page
                  </Link>
                </div>
              </div>

              {/* RIGHT COLUMN: Reviews List */}
              <div className="lg:col-span-7 space-y-4">
                <div className="border border-sandal-100 bg-white rounded-2xl p-4 sm:p-6 space-y-6 shadow-sm">
                  <div className="border-b border-sandal-50/50 pb-3 flex items-center justify-between">
                    <h2 className="font-display text-sm sm:text-base font-bold text-gray-800 uppercase tracking-wide">
                      Customer Reviews ({reviewCount})
                    </h2>
                  </div>

                  {/* Zero reviews empty state */}
                  {reviews.length === 0 && (
                    <div className="flex flex-col items-center py-12 text-center">
                      <MessageSquare size={40} className="text-amber-200 mb-3" />
                      <p className="font-body text-sm text-gray-400 font-bold">
                        No reviews yet for this product.
                      </p>
                      <p className="font-body text-xs text-gray-400 mt-1">
                        Purchase it and be the first to share your experience!
                      </p>
                      <Link
                        to={`/products/${slug}`}
                        className="mt-5 btn-lg btn-primary text-xs"
                      >
                        View Product
                      </Link>
                    </div>
                  )}

                  {/* Reviews list */}
                  {reviews.length > 0 && (
                    <div className="space-y-5 divide-y divide-sandal-50/30">
                      {reviews.map((review, idx) => (
                        <div key={review.id} className={idx > 0 ? "pt-5" : ""}>
                          <ReviewRow
                            review={review}
                            onImageClick={(url) => setLightboxUrl(url)}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination — Load More */}
                  {pagination?.hasMore && (
                    <div className="pt-4 text-center">
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="btn-lg btn-secondary text-sm disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                      >
                        {loadingMore ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                            Loading…
                          </span>
                        ) : (
                          `Load more (${pagination.total - reviews.length} remaining)`
                        )}
                      </button>
                    </div>
                  )}

                  {/* All loaded notice */}
                  {!pagination?.hasMore && reviews.length > PAGE_SIZE && (
                    <p className="text-center font-body text-xs text-gray-400 font-bold pt-2">
                      All {reviews.length} reviews loaded
                    </p>
                  )}
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </>
  );
}
