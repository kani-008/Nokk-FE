import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, ShoppingCart, Star, ShieldCheck, Truck, AlertCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useComboDetail } from "../hookqueries/useCombos";
import { useCartStore } from "../components/store/CartStore.jsx";
import { useAuthStore } from "../components/store/AuthStore.jsx";
import { useToast } from "../components/useToast";
import ProductReviews from "../components/Product/ProductReviews.jsx";

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
  const { addItem, items } = useCartStore();
  const { token } = useAuthStore();
  const { setSuccess, displayedError, displayedType, toastVisible } = useToast();

  const { data: combo, isLoading } = useComboDetail(comboId);

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

  const englishTitle = combo.items ? combo.items.map((it) => `${it.quantity} × ${it.productName}`).join(" + ") : combo.name;
  const tamilTitle = combo.items ? combo.items.map((it) => `${it.quantity} × ${it.productNameTa || it.productName}`).join(" + ") : "";

  let totalWeight = 0;
  if (combo.items) {
    try {
      totalWeight = combo.items.reduce((sum, it) => {
        const match = it.weightLabel.match(/(\d+)/);
        return sum + (match ? parseInt(match[1]) * it.quantity : 0);
      }, 0);
    } catch {
      totalWeight = 0;
    }
  }
  const weightStr = totalWeight > 0 ? `${totalWeight}g` : "Combo Pack";

  const handleAddToCart = () => {
    if (!token) {
      navigate("/login");
      return;
    }
    addItem({
      comboId: combo.id,
      name: combo.name,
      price: combo.comboPrice,
      imageUrl: combo.imageUrl || null,
      quantity: 1,
      isCombo: true
    });
    setSuccess("Added combo pack to your cart!");
  };

  const handleBuyNow = () => {
    if (!token) {
      navigate("/login");
      return;
    }
    addItem({
      comboId: combo.id,
      name: combo.name,
      price: combo.comboPrice,
      imageUrl: combo.imageUrl || null,
      quantity: 1,
      isCombo: true
    });
    navigate("/cart");
  };

  const pageTitle = `${combo.name} — sun-dried fish combo pack`;
  const pageDescription = combo.description || `Special combo pack: ${combo.name}. Save with combined pricing on sun-dried fish delicacies.`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={combo.imageUrl || ""} />
        <meta property="og:type" content="product" />
      </Helmet>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 font-body text-[11px] lg:text-xs text-amber-700 mb-6 bg-amber-50/50 px-3 py-2 rounded-xl border border-amber-100/50 w-fit">
        <Link to="/" className="hover:text-brand-900 transition-colors font-medium">Home</Link>
        <ChevronRight size={12} className="text-amber-400" />
        <Link to="/products?category=combos" className="hover:text-brand-900 transition-colors font-medium">Combos</Link>
        <ChevronRight size={12} className="text-amber-400" />
        <span className="text-brand-900 font-semibold truncate max-w-[150px] lg:max-w-xs">{englishTitle}</span>
      </nav>

      {/* Main product detail container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 mb-16">
        
        {/* Left: Combo Image */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-sandal-100 select-none">
            {combo.imageUrl ? (
              <img
                src={combo.imageUrl}
                alt={combo.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-sandal-50 text-sandal-400">
                <span className="text-6xl mb-2">📦</span>
                <span className="text-xs uppercase font-extrabold tracking-wider font-body">No Combo Image</span>
              </div>
            )}
            
            {combo.savings > 0 && (
              <span className="absolute top-4 left-4 bg-rose-600 text-white font-body text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-md animate-bounce">
                Save ₹{combo.savings}
              </span>
            )}
          </div>
        </div>

        {/* Right: Details & Buying options */}
        <div className="flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <p className="font-body text-xs text-amber-500 uppercase tracking-wider font-medium mb-1">
                Dry Fish
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900 leading-snug pdetails-title-fluid">
                {englishTitle}
              </h1>
              {tamilTitle && (
                <p className="font-tamil text-amber-500 mt-1">{tamilTitle}</p>
              )}
            </div>

            {/* Ratings and Reviews Summary */}
            {combo.avgRating > 0 && (
              <div className="flex items-center gap-2">
                <Stars rating={combo.avgRating} count={combo.reviewCount} />
              </div>
            )}

            {/* Price section */}
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

            {/* QTY selector */}
            <div className="flex items-center gap-4 flex-wrap pt-2">
              <span className="field-label mb-0">QTY</span>
              <div className="flex flex-wrap gap-2">
                <button className="font-body text-sm px-4 py-2 rounded-xl border-2 border-brand-700 bg-brand-700 text-white font-semibold">
                  {weightStr}
                </button>
              </div>
              <p className="font-body text-xs font-semibold text-green-600">
                In Stock
              </p>
            </div>

            {/* Combo Description */}
            {combo.description && (
              <div className="space-y-2 pt-4 border-t border-sandal-100/30">
                <h3 className="font-display text-xs font-extrabold text-amber-800 uppercase tracking-widest">
                  About this Combo Pack
                </h3>
                <p className="font-body text-sm text-gray-600 leading-relaxed font-medium">
                  {combo.description}
                </p>
              </div>
            )}
          </div>

          {/* Cart Buttons & Trust features */}
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
              {inCart ? (
                <Link
                  to="/cart"
                  className="flex-1 btn-lg btn-secondary flex items-center justify-center gap-2 shadow-md cursor-pointer hover:scale-[1.01]"
                >
                  <ShoppingCart size={18} />
                  <span>Go to Cart</span>
                </Link>
              ) : (
                <>
                  <button
                    disabled={!inStock}
                    onClick={handleAddToCart}
                    className="flex-1 btn-lg btn-outline flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:hover:scale-100 transition-all active:scale-[0.99] border-brand-800 text-brand-900 font-bold hover:bg-brand-50"
                  >
                    <ShoppingCart size={18} />
                    <span>Add to Cart</span>
                  </button>
                  <button
                    disabled={!inStock}
                    onClick={handleBuyNow}
                    className="flex-1 btn-lg btn-primary flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:hover:scale-100 transition-all active:scale-[0.99] font-bold shadow-md"
                  >
                    Buy Now
                  </button>
                </>
              )}
            </div>

            {/* Quality and Delivery Badges */}
            <div className="grid grid-cols-2 gap-4 border-t border-sandal-100/50 pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sandal-50 text-brand-800 flex items-center justify-center border border-sandal-100">
                  <Truck size={18} />
                </div>
                <div>
                  <h4 className="font-body text-xs font-bold text-gray-800 leading-tight">Fast Delivery</h4>
                  <p className="font-body text-[10px] text-gray-400 mt-0.5">Dispatched in 24 hours</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sandal-50 text-brand-800 flex items-center justify-center border border-sandal-100">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="font-body text-xs font-bold text-gray-800 leading-tight">100% Secure</h4>
                  <p className="font-body text-[10px] text-gray-400 mt-0.5">UPI, Cards, and Net Banking</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Component Products Detailed Descriptions */}
      <div className="mb-12">
        <ComboProductsDescription items={combo.items} />
      </div>

      {/* Product Reviews section */}
      <div className="border-t border-sandal-100/50 pt-10">
        <ProductReviews product={combo} />
      </div>

      {/* Toast Alert */}
      {toastVisible && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl font-body text-sm font-semibold border bg-white animate-fade-in">
          <span className={displayedType === "success" ? "text-green-600" : "text-red-600"}>
            {displayedType === "success" ? "✓" : "⚠️"}
          </span>
          <span className="text-gray-800">{displayedError}</span>
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
                : "border-sandal-150 text-amber-800 bg-white hover:border-sandal-300"
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
