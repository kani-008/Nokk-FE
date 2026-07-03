import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronRight, ArrowLeft, MessageSquare } from "lucide-react";
import { Helmet } from "react-helmet-async";
import API from "../ApiCall/Api";
import {
  StarBadge,
  Lightbox,
  ReviewRow,
} from "../components/Product/ProductReviews.jsx";
import comboImg from "../assets/products/combo.jpg";

const PH = comboImg;
const PAGE_SIZE = 10;

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

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-20">

        {/* ── Loading state ────────────────────────────────────────── */}
        {loading && (
          <>
            <HeaderSkeleton />
            <div className="border border-sandal-100 rounded-2xl p-4 sm:p-5 space-y-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <ReviewRowSkeleton key={i} />
              ))}
            </div>
          </>
        )}

        {/* ── Loaded ───────────────────────────────────────────────── */}
        {!loading && product && (
          <>
            {/* Breadcrumb — exact styling from ProductDetails.jsx */}
            <nav className="flex items-center gap-1.5 font-body text-xs text-amber-500 mb-4 flex-wrap">
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

            {/* Back arrow + product name — styled like profile.jsx back navigation */}
            <div className="flex items-start gap-3 mb-5">
              <button
                onClick={() => navigate(-1)}
                className="p-1 hover:bg-sandal-100/50 rounded-lg transition-colors cursor-pointer text-gray-800 shrink-0 mt-0.5"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900 leading-snug pdetails-title-fluid">
                  {product.nameEn}
                </h1>
                {product.nameTa && (
                  <p className="font-tamil text-amber-500 mt-0.5">{product.nameTa}</p>
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
                    className="w-14 h-14 rounded-xl object-cover border border-sandal-100 shadow-sm"
                    onError={(e) => { e.target.src = PH; }}
                  />
                </Link>
              )}
            </div>

            {/* ── Reviews section ─────────────────────────────────── */}
            <div className="border border-sandal-100 rounded-2xl p-4 sm:p-5 space-y-6">
              <h2 className="font-display text-sm sm:text-base font-bold text-gray-800 uppercase tracking-wide">
                Ratings &amp; Reviews
              </h2>

              {/* Zero reviews empty state */}
              {reviews.length === 0 && (
                <div className="flex flex-col items-center py-10 text-center">
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

              {/* Reviews list — uses the exact same ReviewRow from ProductReviews.jsx */}
              {reviews.length > 0 && (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewRow
                      key={review.id}
                      review={review}
                      onImageClick={(url) => setLightboxUrl(url)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination — Load More */}
              {pagination?.hasMore && (
                <div className="pt-2 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="btn-lg btn-secondary text-sm disabled:opacity-50"
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
                <p className="text-center font-body text-xs text-gray-400 font-bold pt-1">
                  All {reviews.length} reviews loaded
                </p>
              )}
            </div>

            {/* Link back to product detail */}
            <div className="mt-4 text-center">
              <Link
                to={`/products/${slug}`}
                className="font-body text-sm text-sandal-600 hover:text-sandal-800 transition-colors font-semibold"
              >
                ← View product details
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
