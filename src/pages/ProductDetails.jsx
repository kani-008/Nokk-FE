import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronRight, ShoppingCart, Heart, Star,
  Truck, ShieldCheck,
  Share2, ChevronLeft, ChevronRight as ChevronR,
  AlertCircle, X,
} from "lucide-react";
import { FaWhatsapp, FaTelegramPlane, FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa";
import { useProductDetail, useProductList } from "../hooks/queries/useProducts";
import API from "../ApiCall/Api";
import { useCartStore } from "../components/store/CartStore.jsx";
import { useWishlistStore } from "../components/store/WishlistStore.jsx";
import { useAuthStore } from "../components/store/AuthStore.jsx";
import { useToast } from "../components/useToast";
import ProductDescription from "../components/Product/ProductDescription.jsx";
import ProductReviews from "../components/Product/ProductReviews.jsx";

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
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${i === active ? "bg-sandal-600 w-5" : "bg-gray-300 w-2"
                }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}



// ══════════════════════════════════════════════════════════════════════
// PRODUCT DETAILS PAGE
// ══════════════════════════════════════════════════════════════════════
export default function ProductDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem, items } = useCartStore();
  const { toggle, isWishlisted } = useWishlistStore();
  const { token } = useAuthStore();
  const { setError, setSuccess, displayedError, displayedType, toastVisible } = useToast();

  const { data: product, isLoading: productLoading, error: productError, refetch: refetchProduct } = useProductDetail(slug);
  const notFound = productError?.response?.status === 404;

  const categorySlug = product?.categorySlug;
  const { data: relatedData } = useProductList(
    { category: categorySlug, limit: 4 },
    { enabled: !!categorySlug }
  );

  const related = useMemo(() => {
    return (relatedData?.products || []).filter((p) => p.slug !== slug);
  }, [relatedData, slug]);

  const loading = productLoading;

  const [activeVariant, setActiveVariant] = useState(null);
  const [qty, setQty] = useState(1);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    if (product) {
      setActiveVariant(product.variants?.[0] || null);
    }
  }, [product]);

  const inCart = activeVariant ? items.some((item) => item.variantId === activeVariant.id) : false;

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
  const price = activeVariant?.price ?? product.minPrice ?? 0;
  const compare = (activeVariant?.comparePrice ?? product.minComparePrice) > price
    ? (activeVariant?.comparePrice ?? product.minComparePrice)
    : null;
  const disc = compare ? Math.round(((compare - price) / compare) * 100) : 0;
  const inStock = activeVariant?.inStock ?? product.inStock ?? false;

  const handleAddToCart = async () => {
    if (!activeVariant || !inStock) return;
    if (token) {
      try {
        const response = await API.post("/cart/add-item", {
          variantId: activeVariant.id,
          quantity: qty,
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
      useCartStore.getState().addItemLocal({
        variantId: activeVariant.id,
        productId: product.id,
        productName: product.nameEn,
        nameTa: product.nameTa,
        image: product.primaryImage,
        price: activeVariant.price,
        comparePrice: activeVariant.comparePrice,
        weight: activeVariant.weightLabel,
        quantity: qty,
      });
    }
  };

  const handleWishlist = async () => {
    try {
      if (wishlisted) {
        if (token) {
          await API.delete("/wishlist/remove-item", { data: { productId: product.id } });
        }
        useWishlistStore.getState().removeId(product.id);
      } else {
        if (token) {
          await API.post("/wishlist/add-item", { productId: product.id });
        }
        useWishlistStore.getState().addId(product.id);
      }
    } catch (err) {
      console.error("wishlist sync failed:", err);
    }
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

  const copyToClipboard = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setSuccess("Product link copied to clipboard!");
        })
        .catch(() => {
          fallbackCopyToClipboard(text);
        });
    } else {
      fallbackCopyToClipboard(text);
    }
  };

  const fallbackCopyToClipboard = (text) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) {
        setSuccess("Product link copied to clipboard!");
      } else {
        setError("Failed to copy link. Please copy it manually.");
      }
    } catch {
      setError("Failed to copy link. Please copy it manually.");
    }
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    const shareTitle = product.nameEn;
    if (navigator.share) {
      navigator.share({ title: shareTitle, url: shareUrl })
        .catch((err) => {
          // AbortError fires when the user just dismisses the native
          // share sheet — that's an intentional cancel, not a failure,
          // so don't force the fallback modal open in that case.
          if (err?.name !== "AbortError") {
            setShareModalOpen(true);
          }
        });
    } else {
      setShareModalOpen(true);
    }
  };

  const isMobileDevice = () =>
    window.innerWidth < 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // WhatsApp, Facebook, X and Telegram all expose a real "share with this
  // url/text" web intent that works the same way everywhere: on mobile it
  // deep-links straight into the installed app, on desktop it opens the
  // share web page. So a single window.open() is correct for both — no
  // need to branch on device or pre-copy the link first.
  const handleSocialShare = (platform, customUrl, customMessage) => {
    window.open(customUrl, "_blank", "noopener,noreferrer");
    if (customMessage) setSuccess(customMessage);
    setShareModalOpen(false);
  };

  // Instagram is different: it has no public web intent that accepts a
  // prefilled URL or caption (there's no "?text=" / "?url=" param it
  // understands), so the old code just opened a blank instagram.com
  // homepage with nothing actually shared. The only thing that really
  // works is copying the link first, then opening Instagram so the
  // person can paste it into their Story, DM, or bio.
  const handleInstagramShare = () => {
    const isMobile = isMobileDevice();

    if (isMobile) {
      // Try the app deep link first; if Instagram isn't installed the
      // browser just ignores it, so we follow up with the web fallback.
      window.location.href = "instagram://app";
      setTimeout(() => {
        window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      }, 600);
    } else {
      copyToClipboard(window.location.href);
      setSuccess("Link copied! Paste it into your Instagram Story or DM.");
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    }
    setShareModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

      {/* ── Toast (Red for Error, Green for Success) ── */}
      <div
        className={`fixed top-4 right-4 z-50 max-w-[calc(100vw-2rem)] sm:max-w-sm transition-all duration-300 ease-out ${toastVisible ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0 pointer-events-none"
          }`}
      >
        {displayedError && (
          <div
            className={`flex items-start gap-2.5 bg-white border shadow-lg font-body text-sm rounded-xl px-4 py-3.5 ${displayedType === "success"
              ? "border-green-200 shadow-green-900/5 text-green-700"
              : "border-red-200 shadow-red-900/5 text-red-700"
              }`}
          >
            {displayedType === "success" ? (
              <ShieldCheck size={17} className="shrink-0 mt-0.5 text-green-500" />
            ) : (
              <AlertCircle size={17} className="shrink-0 mt-0.5 text-red-500" />
            )}
            <p className="leading-snug">{displayedError}</p>
          </div>
        )}
      </div>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 font-body text-xs text-amber-500 mb-6 flex-wrap">
        <Link to="/" className="hover:text-brand-700 transition-colors">Home</Link>
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
        <div>
          <ImageGallery images={product.images} onShare={handleShare} />
        </div>

        {/* Right Column (Details + Description + Reviews) */}
        <div className="flex flex-col gap-6">
          {/* Details Card */}
          <div className="flex flex-col gap-4">

            {/* badges */}
            <div className="flex gap-2 flex-wrap">
              {product.isBestseller && <span className="badge-amber">🏆 Best Seller</span>}
              {product.isNew && <span className="badge-green">✨ New Arrival</span>}
              {!inStock && <span className="badge-red">Out of Stock</span>}
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
                      disabled={!v.inStock}
                      className={`font-body text-sm px-4 py-2 rounded-xl border-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${activeVariant?.id === v.id
                        ? "border-brand-700 bg-brand-700 text-white font-semibold"
                        : "border-amber-200 text-amber-800 hover:border-brand-600 bg-white"
                        }`}
                    >
                      {v.weightLabel}
                      {!v.inStock && <span className="ml-1 text-[10px]">(OOS)</span>}
                    </button>
                  ))}
                </div>
                {activeVariant && (
                  <p className={`font-body text-xs font-semibold ${activeVariant.inStock ? "text-green-600" : "text-red-500"}`}>
                    {activeVariant.inStock ? "In Stock" : "Out of Stock"}
                  </p>
                )}
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
                onClick={handleWishlist}
                className={`p-3.5 border-2 rounded-2xl transition-colors ${wishlisted
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
                { icon: <Truck size={16} />, text: "Free above ₹499" },
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
          <ProductReviews product={product} onSubmitReview={refetchProduct} />

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
                    <p className="font-num text-sm font-bold text-brand-800 mt-1">
                      {rupee(p.variants?.[0]?.price ?? p.minPrice ?? 0)}
                    </p>
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
          onClick={handleWishlist}
          className="shrink-0 p-1.5 transition-colors"
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

      {/* ── Share Modal Fallback ── */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-modal-fade-in animate-none">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden border border-amber-100 flex flex-col p-6 animate-modal-slide-up relative">
            <button
              onClick={() => setShareModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-800 transition-colors"
              aria-label="Close share dialog"
            >
              <X size={18} />
            </button>

            <h3 className="font-display text-lg font-bold text-brand-900 mb-6">Share Product</h3>

            <div className="grid grid-cols-5 gap-2 mb-6">
              {/* WhatsApp */}
              <button
                onClick={() => handleSocialShare(
                  "WhatsApp",
                  `https://wa.me/?text=${encodeURIComponent(product.nameEn + ' - ' + window.location.href)}`
                )}
                className="flex flex-col items-center gap-2 group cursor-pointer border-none bg-transparent text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm mx-auto">
                  <FaWhatsapp size={24} />
                </div>
                <span className="font-body text-[10px] sm:text-xs text-amber-900 group-hover:text-brand-900 truncate w-full">WhatsApp</span>
              </button>

              {/* Instagram */}
              <button
                onClick={handleInstagramShare}
                className="flex flex-col items-center gap-2 group cursor-pointer border-none bg-transparent text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm mx-auto">
                  <FaInstagram size={24} />
                </div>
                <span className="font-body text-[10px] sm:text-xs text-amber-900 group-hover:text-brand-900 truncate w-full">Instagram</span>
              </button>

              {/* Facebook */}
              <button
                onClick={() => handleSocialShare(
                  "Facebook",
                  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`
                )}
                className="flex flex-col items-center gap-2 group cursor-pointer border-none bg-transparent text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm mx-auto">
                  <FaFacebook size={24} />
                </div>
                <span className="font-body text-[10px] sm:text-xs text-amber-900 group-hover:text-brand-900 truncate w-full">Facebook</span>
              </button>

              {/* X */}
              <button
                onClick={() => handleSocialShare(
                  "X",
                  `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(product.nameEn)}`
                )}
                className="flex flex-col items-center gap-2 group cursor-pointer border-none bg-transparent text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-800 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm mx-auto">
                  <FaTwitter size={22} />
                </div>
                <span className="font-body text-[10px] sm:text-xs text-amber-900 group-hover:text-brand-900 truncate w-full">X</span>
              </button>

              {/* Telegram */}
              <button
                onClick={() => handleSocialShare(
                  "Telegram",
                  `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(product.nameEn)}`
                )}
                className="flex flex-col items-center gap-2 group cursor-pointer border-none bg-transparent text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm mx-auto">
                  <FaTelegramPlane size={24} />
                </div>
                <span className="font-body text-[10px] sm:text-xs text-amber-900 group-hover:text-brand-900 truncate w-full">Telegram</span>
              </button>
            </div>

            <div className="flex items-center gap-2 bg-sandal-50 p-2.5 rounded-xl border border-sandal-200">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="flex-1 bg-transparent border-none font-body text-xs text-amber-950 focus:outline-none select-all truncate"
              />
              <button
                onClick={() => {
                  copyToClipboard(window.location.href);
                  setShareModalOpen(false);
                }}
                className="btn-md py-1.5 px-3 bg-brand-700 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer shadow-sm"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}