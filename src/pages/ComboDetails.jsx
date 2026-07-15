import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronRight, ShoppingCart, Star, Truck, ShieldCheck,
  Share2, ChevronLeft, ChevronRight as ChevronR,
  AlertCircle, X
} from "lucide-react";
import { FaWhatsapp, FaTelegramPlane, FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa";
import SEO from "../components/seo/SEO.jsx";
import { buildBreadcrumbSchema } from "../utils/seo.js";
import { useComboDetail } from "../hookqueries/useCombos";
import { useSimilarProductsMulti } from "../hookqueries/useProducts";
import { useDeliverySettings } from "../hookqueries/useHome";
import API from "../ApiCall/Api";
import { useCartStore } from "../components/store/CartStore.jsx";
import { useAuthStore } from "../components/store/AuthStore.jsx";
import { useToast } from "../components/useToast";
import ProductReviews from "../components/Product/ProductReviews.jsx";
import ProductCard from "../components/Product/ProductCard.jsx";
import ImageGallery from "../components/Product/ImageGallery.jsx";

const rupee = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

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

export default function ComboDetails() {
  const { comboId } = useParams();
  const navigate = useNavigate();
  const { items } = useCartStore();
  const { token } = useAuthStore();
  const { setError, setSuccess, displayedError, displayedType, toastVisible } = useToast();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const { data: combo, isLoading } = useComboDetail(comboId);

  const productIds = (combo?.items || []).map(i => i.productId).join(",");
  const { data: similar = [] } = useSimilarProductsMulti(productIds);
  const { data: delivery } = useDeliverySettings();
  const threshold = delivery?.freeShippingThreshold || 499;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [comboId]);

  if (isLoading) return <DetailSkeleton />;
  if (!combo) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
        <h2 className="font-display text-xl font-bold text-brand-900 mb-2">Combo Not Found</h2>
        <p className="font-body text-sm text-amber-700 mb-5">This combo offer does not exist or has expired.</p>
        <Link to="/products" className="btn-md btn-primary">Back to Shop</Link>
      </div>
    );
  }

  const cartItem = items.find((i) => i.comboId === combo.id);
  const inCart = !!cartItem;
  const inStock = combo.inStock;

  const englishTitle = combo.items ? combo.items.map((it) => it.productName).join(" + ") : combo.name;

  const uniqueCategories = [];
  const seen = new Set();
  if (combo.items) {
    combo.items.forEach(it => {
      if (it.categoryName && !seen.has(it.categoryName)) {
        seen.add(it.categoryName);
        uniqueCategories.push({
          categoryName: it.categoryName,
          categorySlug: it.categorySlug
        });
      }
    });
  }

  const handleAddToCart = async () => {
    if (!token) {
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }
    try {
      const response = await API.post("/cart/add-item", {
        comboId: combo.id,
        quantity: 1,
      });
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
        comboId:      i.comboId,
        comboName:    i.comboName,
        comboImage:   i.comboImage,
        comboPrice:   i.comboPrice,
      }));
      useCartStore.getState().setItems(serverItems);
      setSuccess("Added combo pack to your cart!");
    } catch (err) {
      console.error("addComboItem server sync failed:", err);
    }
  };

  const handleCartClick = () => {
    if (inCart) {
      navigate("/cart");
    } else {
      handleAddToCart();
    }
  };

  const handleBuyNow = async () => {
    if (!token) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    try {
      const response = await API.post("/cart/add-item", {
        comboId: combo.id,
        quantity: 1,
      });
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
        comboId:      i.comboId,
        comboName:    i.comboName,
        comboImage:   i.comboImage,
        comboPrice:   i.comboPrice,
      }));
      useCartStore.getState().setItems(serverItems);
      navigate("/checkout");
    } catch (err) {
      console.error("buyNow combo server sync failed:", err);
    }
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    const shareTitle = combo.name;
    if (navigator.share) {
      navigator.share({ title: shareTitle, url: shareUrl })
        .catch((err) => {
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

  const handleSocialShare = (platform, customUrl, customMessage) => {
    window.open(customUrl, "_blank", "noopener,noreferrer");
    if (customMessage) setSuccess(customMessage);
    setShareModalOpen(false);
  };

  const handleInstagramShare = () => {
    const isMobile = isMobileDevice();
    if (isMobile) {
      window.location.href = "instagram://app";
      setTimeout(() => {
        window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      }, 600);
    } else {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href)
          .then(() => setSuccess("Link copied! Paste it into your Instagram Story or DM."))
          .catch(() => {});
      }
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    }
    setShareModalOpen(false);
  };

  const pageTitle = `${combo.name} — Namma Oor Karuvattu Kadai`;
  const pageDescription = combo.description || `Special combo pack: ${combo.name}. Save with combined pricing on sun-dried fish delicacies.`;

  const breadcrumbItems = useMemo(() => {
    if (!combo) return [];
    return [
      { name: "Home", item: "https://nammaoorkaruvattukadai.com/" },
      { name: "Products", item: "https://nammaoorkaruvattukadai.com/products" },
      { name: combo.name, item: `https://nammaoorkaruvattukadai.com/combos/${comboId}` }
    ];
  }, [combo, comboId]);

  const schemas = useMemo(() => [
    buildBreadcrumbSchema(breadcrumbItems)
  ], [breadcrumbItems]);

  const canonicalUrl = `https://nammaoorkaruvattukadai.com/combos/${comboId}`;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-6">
      <SEO
        title={pageTitle}
        description={pageDescription}
        image={combo.imageUrl || ""}
        url={canonicalUrl}
        type="product"
        schemas={schemas}
      />

      {/* Toast */}
      <div
        className={`fixed top-4 right-4 z-50 max-w-[calc(100vw-2rem)] sm:max-w-sm transition-all duration-300 ease-out ${toastVisible ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0 pointer-events-none"
          }`}
      >
        {displayedError && (
          <div
            className={`flex items-start gap-2.5 bg-surface border shadow-lg font-body text-sm rounded-xl px-4 py-3.5 ${displayedType === "success"
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

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 font-body text-xs text-amber-500 mb-6 flex-wrap">
        <Link to="/" className="hover:text-brand-700 transition-colors">Home</Link>
        <ChevronRight size={12} />
        <Link to="/products" className="hover:text-brand-700 transition-colors">Products</Link>
        {uniqueCategories.map((cat, idx) => (
          <span key={idx} className="flex items-center gap-1.5">
            <ChevronRight size={12} />
            <Link to={`/products?category=${cat.categorySlug}`} className="hover:text-brand-700 transition-colors">
              {cat.categoryName}
            </Link>
          </span>
        ))}
        <ChevronRight size={12} />
        <span className="text-brand-900 font-medium truncate max-w-[140px]">{englishTitle}</span>
      </nav>

      {/* Main Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 mb-12 pb-20 md:pb-0">

        {/* Left: Image Gallery */}
        <div className="max-w-xl w-full mx-auto md:sticky md:top-[104px] self-start">
          <ImageGallery
            images={
              combo.images && combo.images.length > 0
                ? combo.images.map((img) => ({ imageUrl: img.imageUrl, isPrimary: img.isPrimary }))
                : [{ imageUrl: combo.imageUrl, isPrimary: true }]
            }
            onShare={handleShare}
          />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            
            {/* Badges */}
            <div className="flex gap-2 flex-wrap">
              <span className="badge-amber">🏆 Combo</span>
              {uniqueCategories.map((cat, idx) => (
                <span key={idx} className="badge-green">{cat.categoryName}</span>
              ))}
              {!inStock && <span className="badge-red">Out of Stock</span>}
            </div>

            {/* Heading */}
            <div>
              <p className="font-body text-xs text-amber-500 uppercase tracking-wider font-medium mb-1">
                {uniqueCategories.map(c => c.categoryName.toUpperCase()).join(" • ") || "COMBO PACK"}
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900 leading-snug pdetails-title-fluid">
                {englishTitle}
              </h1>
            </div>

            {/* Rating */}
            {combo.avgRating > 0 && (
              <div className="flex items-center gap-2">
                <Stars rating={combo.avgRating} count={combo.reviewCount} />
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-num text-3xl font-extrabold text-brand-900 pdetails-price-fluid">{rupee(combo.comboPrice)}</span>
              {combo.individualTotal > combo.comboPrice && (
                <>
                  <span className="font-num text-lg text-amber-400 line-through">{rupee(combo.individualTotal)}</span>
                  <span className="badge-red text-sm px-3 py-1">−{Math.round(((combo.individualTotal - combo.comboPrice) / combo.individualTotal) * 100)}%</span>
                </>
              )}
            </div>
            {combo.individualTotal > combo.comboPrice && (
              <p className="font-body text-xs text-green-600 -mt-2">
                You save {rupee(combo.individualTotal - combo.comboPrice)} on this combo
              </p>
            )}

            {/* QTY selector (Pills) */}
            {combo.items?.length > 0 && (
              <div className="flex items-center gap-4 flex-wrap">
                <span className="field-label mb-0">QTY</span>
                <div className="flex flex-wrap gap-2">
                  {combo.items.map((item, idx) => (
                    <button
                      key={idx}
                      disabled
                      className="font-body text-sm px-4 py-2 rounded-xl border-2 border-brand-700 bg-brand-700 text-white font-semibold opacity-90 cursor-default"
                    >
                      {item.productName} ({item.weightLabel}) × {item.quantity}
                    </button>
                  ))}
                </div>
                <p className={`font-body text-xs font-semibold ${inStock ? "text-green-600" : "text-red-500"}`}>
                  {inStock ? "In Stock" : "Out of Stock"}
                </p>
              </div>
            )}

            {/* CTAs (desktop) */}
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
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-100">
              {[
                { icon: <Truck size={16} />, text: `Free above ₹${threshold}` },
                { icon: <ShieldCheck size={16} />, text: "100% Safe & Natural" },
              ].map((t) => (
                <div key={t.text} className="flex flex-col items-center gap-1 text-center">
                  <span className="text-brand-700">{t.icon}</span>
                  <span className="font-body text-[10px] text-amber-600 leading-tight">{t.text}</span>
                </div>
              ))}
            </div>

          </div>

          {/* Description Tabs */}
          <ComboProductsDescription items={combo.items} />

        </div>

      </div>

      {/* Similar products */}
      {similar.length > 0 && (
        <section className="mb-8">
          <h2 className="font-display text-xl font-bold text-brand-900 mb-4">Similar Products</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
            {similar.map((p) => (
              <div key={p.id} className="shrink-0" style={{ width: "200px" }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Product Reviews */}
      <ProductReviews product={combo} />

      {/* Mobile sticky bottom CTA bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-amber-100 px-4 py-2 flex items-center gap-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <button
          onClick={handleCartClick}
          disabled={!inStock}
          className="flex-1 min-w-0 py-3 px-3 rounded-xl btn-outline disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap font-semibold text-center"
        >
          {inCart ? "Go to Cart" : <><ShoppingCart size={14} className="inline mr-1" /> Add to Cart</>}
        </button>

        <button
          onClick={handleBuyNow}
          disabled={!inStock}
          className="flex-1 min-w-0 py-3 px-3 rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap font-semibold text-center"
        >
          Buy at {rupee(combo.comboPrice)}
        </button>
      </div>

      {/* Share Modal Fallback */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden border border-amber-100 flex flex-col p-6 relative">
            <button
              onClick={() => setShareModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-800 transition-colors"
              aria-label="Close share dialog"
            >
              <X size={18} />
            </button>

            <h3 className="font-display text-lg font-bold text-brand-900 mb-6">Share Combo</h3>

            <div className="grid grid-cols-5 gap-2 mb-6">
              {/* WhatsApp */}
              <button
                onClick={() => handleSocialShare(
                  "WhatsApp",
                  `https://wa.me/?text=${encodeURIComponent(combo.name + ' - ' + window.location.href)}`
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
                  `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(combo.name)}`
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
                  `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(combo.name)}`
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
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(window.location.href)
                      .then(() => setSuccess("Link copied!"))
                      .catch(() => {});
                  }
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

function ComboProductsDescription({ items }) {
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("description");

  if (!items || items.length === 0) return null;

  const currentItem = items[activeItemIndex];

  const tabs = [
    { key: "description", label: "Description", content: currentItem.description || "No description available." },
    { key: "howToUse", label: "How to Use", content: currentItem.howToUse },
    { key: "storage", label: "Storage Tips", content: currentItem.storageTips }
  ].filter(t => t.key === "description" || !!t.content?.trim());

  const currentTab = tabs.find(t => t.key === activeTab) || tabs[0];

  return (
    <div className="border border-sandal-100 rounded-2xl p-4 sm:p-5">
      {/* Product selector buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2.5 mb-5 border-b border-sandal-100/50 scrollbar-hide">
        {items.map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
              setActiveItemIndex(idx);
              setActiveTab("description");
            }}
            className={`shrink-0 font-body text-xs sm:text-sm font-bold px-4.5 py-2 rounded-xl border-2 transition-all cursor-pointer ${
              activeItemIndex === idx
                ? "border-brand-700 bg-brand-700 text-white"
                : "border-sandal-150 text-amber-800 bg-surface hover:border-sandal-300"
            }`}
          >
            {item.productName}
          </button>
        ))}
      </div>

      {/* ── Desktop View: Stacked sections (hidden on mobile) ── */}
      <div className="hidden md:block space-y-6">
        {tabs.map((t) => (
          <div key={t.key}>
            <h4 className="font-display text-sm sm:text-base font-bold text-brand-900 mb-2 border-b border-sandal-100 pb-2">
              {t.label}
            </h4>
            <p className="font-body text-sm text-gray-700 leading-relaxed whitespace-pre-line font-medium">
              {t.content}
            </p>
          </div>
        ))}
      </div>

      {/* ── Mobile View: Tabs layout (hidden on desktop) ── */}
      <div className="block md:hidden">
        {/* tab bar */}
        <div className="flex gap-1 overflow-x-auto border-b border-sandal-100 mb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`shrink-0 font-body text-xs sm:text-sm font-bold px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
                currentTab.key === t.key
                  ? "border-gray-800 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* tab content */}
        <div className="min-h-[80px]">
          <p className="font-body text-sm text-gray-700 leading-relaxed whitespace-pre-line font-medium">
            {currentTab.content}
          </p>
        </div>
      </div>
    </div>
  );
}
