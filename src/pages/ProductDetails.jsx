import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronRight, ShoppingCart, Heart, Star,
  Minus, Plus, Truck, ShieldCheck, RefreshCcw,
  Share2, ChevronLeft, ChevronRight as ChevronR,
} from "lucide-react";
import { productApi }       from "../ApiCall/Api.jsx";
import { useCartStore }     from "../components/store/CartStore.jsx";
import { useWishlistStore } from "../components/store/WishlistStore.jsx";
import { useAuthStore }     from "../components/store/AuthStore.jsx";
import ProductDescription   from "../components/Product/ProductDescription.jsx";
import ProductReviews       from "../components/Product/ProductReviews.jsx";

import comboImg from "../assets/products/combo.jpg";

// ─── placeholder ──────────────────────────────────────────────────────
const PH = comboImg;

const rupee = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

// ── Detail skeleton ────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
      <div className="skeleton h-3 w-48 mb-6 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="aspect-square skeleton rounded-2xl" />
        <div className="space-y-4">
          <div className="skeleton h-3 w-1/4 rounded" />
          <div className="skeleton h-6 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/2 rounded" />
          <div className="skeleton h-8 w-1/3 rounded" />
          <div className="skeleton h-10 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ── Star rating display ────────────────────────────────────────────────
function Stars({ rating, count, size = 14 }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-amber-100 text-amber-200"}
        />
      ))}
      {count !== undefined && (
        <span className="font-num text-sm text-amber-500 ml-1">({count} reviews)</span>
      )}
    </div>
  );
}

// ── Image gallery ──────────────────────────────────────────────────────
function ImageGallery({ images, onShare }) {
  const [active, setActive] = useState(0);
  const scrollRef = useRef(null);
  
  const list = images?.length ? images : [{ imageUrl: PH, isPrimary: true }];
  // Replicate primary image if only 1 exists, to demonstrate swipe transition & dots
  const showList = list.length === 1 ? [list[0], list[0], list[0]] : list;

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth === 0) return;
    const index = Math.round(scrollLeft / clientWidth);
    if (index !== active) {
      setActive(index);
    }
  };

  const scrollToImage = (index) => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;
    scrollRef.current.scrollTo({
      left: index * clientWidth,
      behavior: "smooth"
    });
    setActive(index);
  };

  const prev = () => {
    const nextIdx = (active - 1 + showList.length) % showList.length;
    scrollToImage(nextIdx);
  };

  const next = () => {
    const nextIdx = (active + 1) % showList.length;
    scrollToImage(nextIdx);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* main image viewer */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-sandal-100 group select-none">
        
        {/* Horizontal scroll snap container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full w-full"
          style={{ scrollBehavior: "auto" }}
        >
          {showList.map((img, i) => (
            <div key={i} className="w-full h-full shrink-0 snap-center relative">
              <img
                src={img.imageUrl || PH}
                alt={`Product view ${i + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = PH; }}
              />
            </div>
          ))}
        </div>

        {/* share button — top-right of the image */}
        <button
          onClick={onShare}
          aria-label="Share product"
          className="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all z-10 cursor-pointer"
        >
          <Share2 size={16} className="text-gray-800" />
        </button>

        {showList.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
            >
              <ChevronR size={16} />
            </button>
          </>
        )}
      </div>

      {/* Dots navigation */}
      {showList.length > 1 && (
        <div className="flex justify-center gap-1.5 py-1">
          {showList.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToImage(i)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                i === active ? "bg-sandal-600 w-5" : "bg-gray-300 w-2"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Review card ────────────────────────────────────────────────────────
function ReviewCard({ review }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-700 text-white flex items-center justify-center font-num text-xs font-bold shrink-0">
            {review.userName?.[0] ?? "U"}
          </div>
          <div>
            <p className="font-body text-sm font-semibold text-brand-900 leading-none">{review.userName ?? "Customer"}</p>
            {review.isVerified && (
              <span className="font-body text-[10px] text-green-600 font-medium">✓ Verified Purchase</span>
            )}
          </div>
        </div>
        <Stars rating={review.rating} size={12} />
      </div>
      {review.title && (
        <p className="font-body text-sm font-semibold text-brand-800 mb-1">{review.title}</p>
      )}
      <p className="font-body text-sm text-amber-700 leading-relaxed">{review.comment}</p>
      <p className="font-body text-[11px] text-amber-400 mt-2">
        {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
      </p>
    </div>
  );
}

// ── Write review form ──────────────────────────────────────────────────
function ReviewForm({ productId, onSubmit }) {
  const { isAuthenticated, token } = useAuthStore();
  const [form,    setForm]    = useState({ rating: 5, title: "", comment: "" });
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState("");

  if (!isAuthenticated) {
    return (
      <div className="card p-5 text-center">
        <p className="font-body text-sm text-amber-700 mb-3">
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">Sign in</Link>
          {" "}to write a review
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="card p-5 text-center">
        <p className="font-body text-sm text-green-700 font-medium">✓ Review submitted — thank you!</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.comment.trim()) { setError("Please write your review"); return; }
    setLoading(true);
    try {
      await productApi.addReview(productId, form, token);
      setDone(true);
      onSubmit?.();
    } catch (err) {
      setError(err.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4">
      <h4 className="font-body text-sm font-bold text-brand-900">Write a Review</h4>

      {/* star picker */}
      <div>
        <label className="field-label">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setForm((f) => ({ ...f, rating: s }))}
            >
              <Star
                size={22}
                className={s <= form.rating ? "fill-amber-400 text-amber-400" : "fill-amber-100 text-amber-200"}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="field-label">Title (optional)</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Summarise your experience"
          className="field-input"
        />
      </div>

      <div>
        <label className="field-label">Review</label>
        <textarea
          value={form.comment}
          onChange={(e) => { setForm((f) => ({ ...f, comment: e.target.value })); setError(""); }}
          placeholder="Share your thoughts about this product…"
          rows={3}
          className="field-input resize-none"
        />
        {error && <p className="font-body text-xs text-red-500 mt-1">{error}</p>}
      </div>

      <button type="submit" disabled={loading} className="btn-md btn-primary">
        {loading ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}

// ══════════════════════════════════════════════════════════════════════
// PRODUCT DETAILS PAGE
// ══════════════════════════════════════════════════════════════════════
export default function ProductDetails() {
  const { slug }     = useParams();
  const navigate     = useNavigate();
  const { addItem, items }  = useCartStore();
  const { toggle, isWishlisted } = useWishlistStore();
  const { token }    = useAuthStore();

  const [product,    setProduct]    = useState(null);
  const [related,    setRelated]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);
  const [activeVariant, setActiveVariant] = useState(null);
  const [qty,        setQty]        = useState(1);
  const [addedMsg,   setAddedMsg]   = useState(false);

  const inCart = activeVariant ? items.some((item) => item.variantId === activeVariant.id) : false;

  const fetchProduct = () => {
    setLoading(true);
    productApi.bySlug(slug)
      .then((r) => {
        setProduct(r.product);
        setActiveVariant(r.product.variants?.[0] || null);
        // fetch related
        if (r.product.categorySlug) {
          productApi.list(`category=${r.product.categorySlug}&limit=4`)
            .then((rr) => setRelated((rr.products || []).filter((p) => p.slug !== slug)));
        }
      })
      .catch((err) => {
        if (err.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProduct(); }, [slug]);

  if (loading) return <DetailSkeleton />;
  if (notFound) return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <span className="text-5xl mb-4">🐟</span>
      <h2 className="font-display text-2xl font-bold text-brand-900 mb-2">Product not found</h2>
      <p className="font-body text-amber-600 text-sm mb-6">It may have been removed or the link is incorrect.</p>
      <button onClick={() => navigate("/products")} className="btn-lg btn-primary">Browse All Products</button>
    </div>
  );
  if (!product) return null;

  const wishlisted = isWishlisted(product.id);
  const price      = activeVariant?.price ?? product.minPrice ?? 0;
  const compare    = (activeVariant?.comparePrice ?? product.minComparePrice) > price
    ? (activeVariant?.comparePrice ?? product.minComparePrice)
    : null;
  const disc       = compare ? Math.round(((compare - price) / compare) * 100) : 0;
  const inStock    = (activeVariant?.stockQty ?? product.totalStock ?? 0) > 0;

  const handleAddToCart = () => {
    if (!activeVariant || !inStock) return;
    addItem({
      variantId:    activeVariant.id,
      productId:    product.id,
      productName:  product.nameEn,
      nameTa:       product.nameTa,
      image:        product.primaryImage,
      price:        activeVariant.price,
      comparePrice: activeVariant.comparePrice,
      weight:       activeVariant.weightLabel,
      quantity:     qty,
    });
    setAddedMsg(true);
    setTimeout(() => setAddedMsg(false), 2500);
  };

  const handleCartClick = () => {
    if (inCart) {
      navigate("/cart");
    } else {
      handleAddToCart();
    }
  };

  const handleBuyNow = () => {
    if (!inCart) {
      handleAddToCart();
    }
    navigate("/cart");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.nameEn, url: window.location.href })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert("Product link copied to clipboard!"))
        .catch(() => alert("Failed to copy link."));
    }
  };



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 font-body text-xs text-amber-500 mb-6 flex-wrap">
        <Link to="/"        className="hover:text-brand-700 transition-colors">Home</Link>
        <ChevronRight size={12} />
        <Link to="/products" className="hover:text-brand-700 transition-colors">Products</Link>
        {product.categoryName && (
          <>
            <ChevronRight size={12} />
            <Link to={`/products?category=${product.categorySlug}`} className="hover:text-brand-700 transition-colors">
              {product.categoryName}
            </Link>
          </>
        )}
        <ChevronRight size={12} />
        <span className="text-brand-900 font-medium truncate max-w-[140px]">{product.nameEn}</span>
      </nav>

      {/* ── Main product section ──────────────────────────────────── */}
      {/* extra bottom padding on mobile so content isn't hidden behind the sticky CTA bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-12 pb-20 md:pb-0">

        {/* Gallery — sticky on desktop */}
        <div className="md:sticky md:top-24 h-fit">
          <ImageGallery images={product.images} onShare={handleShare} />
        </div>

        {/* Right Column (Details + Description + Reviews) */}
        <div className="flex flex-col gap-6">
          {/* Details Card */}
          <div className="flex flex-col gap-4">

            {/* badges */}
            <div className="flex gap-2 flex-wrap">
              {product.isBestseller && <span className="badge-amber">🏆 Best Seller</span>}
              {product.isNew        && <span className="badge-green">✨ New Arrival</span>}
              {!inStock             && <span className="badge-red">Out of Stock</span>}
            </div>

            {/* name */}
            <div>
              <p className="font-body text-xs text-amber-500 uppercase tracking-wider font-medium mb-1">
                {product.categoryName}
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900 leading-snug">
                {product.nameEn}
              </h1>
              {product.nameTa && (
                <p className="font-tamil text-amber-500 mt-1">{product.nameTa}</p>
              )}
            </div>

            {/* rating */}
            {product.avgRating > 0 && (
              <div className="flex items-center gap-2">
                <Stars rating={product.avgRating} count={product.reviewCount} />
              </div>
            )}

            {/* price */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-num text-3xl font-extrabold text-brand-900">{rupee(price)}</span>
              {compare && (
                <>
                  <span className="font-num text-lg text-amber-400 line-through">{rupee(compare)}</span>
                  <span className="badge-red text-sm px-3 py-1">−{disc}%</span>
                </>
              )}
            </div>
            {compare && (
              <p className="font-body text-xs text-green-600 -mt-2">
                You save {rupee(compare - price)} on this item
              </p>
            )}

            {/* QTY variant picker */}
            {product.variants?.length > 0 && (
              <div className="flex items-center gap-4 flex-wrap">
                <span className="field-label mb-0">QTY</span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => { setActiveVariant(v); setQty(1); }}
                      disabled={v.stockQty === 0}
                      className={`font-body text-sm px-4 py-2 rounded-xl border-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        activeVariant?.id === v.id
                          ? "border-brand-700 bg-brand-700 text-white font-semibold"
                          : "border-amber-200 text-amber-800 hover:border-brand-600 bg-white"
                      }`}
                    >
                      {v.weightLabel}
                      {v.stockQty === 0 && <span className="ml-1 text-[10px]">(OOS)</span>}
                    </button>
                  ))}
                </div>
                {/* {activeVariant && (
                  <p className="font-body text-xs text-amber-500">
                    {activeVariant.stockQty} left
                  </p>
                )} */}
              </div>
            )}

            {/* ── CTAs — desktop only; mobile uses the fixed bottom bar ── */}
            <div className="hidden md:flex gap-3">
              <button
                onClick={handleCartClick}
                disabled={!inStock}
                className="flex-1 min-w-0 btn-lg btn-primary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {inCart ? "Go to Cart" : <><ShoppingCart size={18} /> Add to Cart</>}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!inStock}
                className="flex-1 min-w-0 btn-lg btn-outline disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Buy Now
              </button>
              <button
                onClick={() => toggle(product.id, token)}
                className={`p-3.5 border-2 rounded-2xl transition-colors ${
                  wishlisted
                    ? "border-rose-300 bg-rose-50 text-rose-500"
                    : "border-amber-200 text-amber-400 hover:border-rose-300 hover:text-rose-400"
                }`}
                aria-label="Toggle wishlist"
              >
                <Heart size={20} className={wishlisted ? "fill-rose-500" : ""} />
              </button>
            </div>

            {/* trust badges */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-100">
              {[
                { icon: <Truck size={16} />,       text: "Free above ₹499" },
                { icon: <ShieldCheck size={16} />, text: "100% Safe & Natural" },
                // { icon: <RefreshCcw size={16} />,  text: "7-Day Returns" },
              ].map((t) => (
                <div key={t.text} className="flex flex-col items-center gap-1 text-center">
                  <span className="text-brand-700">{t.icon}</span>
                  <span className="font-body text-[10px] text-amber-600 leading-tight">{t.text}</span>
                </div>
              ))}
            </div>

          </div>

          {/* Product Description Tabs */}
          <ProductDescription product={product} />

          {/* Product Reviews with Flipkart-Style breakdown */}
          <ProductReviews product={product} onSubmitReview={fetchProduct} />

        </div>
      </div>

      {/* ── Related products ──────────────────────────────────────── */}
      {related.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold text-brand-900 mb-5">You May Also Like</h2>
          <div className="product-grid">
            {related.map((p) => (
              <Link key={p.id} to={`/products/${p.slug}`} className="group block">
                <div className="card-hover">
                  <div className="aspect-square overflow-hidden rounded-t-2xl bg-brand-50">
                    <img
                      src={p.primaryImage || PH}
                      alt={p.nameEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = PH; }}
                    />
                  </div>
                  <div className="p-3">
                    <p className="font-body text-sm font-semibold text-brand-900 line-clamp-2">{p.nameEn}</p>
                    <p className="font-num text-sm font-bold text-brand-800 mt-1">{rupee(p.minPrice)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Mobile sticky bottom CTA bar ─────────────────────────────
          Fixed to the viewport bottom, mobile only (hidden md:up).
          Compact height, tight padding, single-line button labels.
          Wishlist is a borderless heart (no box) at a slightly larger size.
          Add to Cart flips to "Go to Cart" after the item is added. */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-amber-100 px-4 py-2 flex items-center gap-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <button
          onClick={() => toggle(product.id, token)}
          className="shrink-0 p=1.5 transition-colors"
          aria-label="Toggle wishlist"
        >
          <Heart
            size={24}
            className={wishlisted ? "fill-rose-500 text-rose-500" : "fill-none text-amber-400"}
          />
        </button>

        <button
          onClick={handleCartClick}
          disabled={!inStock}
          className="flex-1 min-w-0  py-3 px-3 rounded-xl btn-outline disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {inCart ? "Go to Cart" : <><ShoppingCart size={14} /> Add to Cart</>}
        </button>

        <button
          onClick={handleBuyNow}
          disabled={!inStock}
          className="flex-1 min-w-0  py-3 px-3 rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          Buy at {rupee(price)}
        </button>
      </div>

    </div>
  );
}