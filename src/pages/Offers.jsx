import { useState } from "react";
import { Copy, Check, Tag, Clock, ArrowRight, Package, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useActiveOffers } from "../hookqueries/useOffers";
import { useActiveCombos } from "../hookqueries/useCombos";
import { useCartStore } from "../components/store/CartStore";
import { useAuthStore } from "../components/store/AuthStore";
import API from "../ApiCall/Api.jsx";
import SEO from "../components/seo/SEO.jsx";

const rupee = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const mapServerItems = (raw = []) =>
  raw.map((i) => ({
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
    slug:         i.slug,
    inStock:      i.inStock,
    comboId:      i.comboId,
    comboName:    i.comboName,
    comboImage:   i.comboImage,
    comboPrice:   i.comboPrice,
  }));

function ComboCard({ combo }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [adding, setAdding] = useState(false);

  const handleAddCombo = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/offers" } });
      return;
    }
    setAdding(true);
    try {
      const res = await API.post("/cart/add-item", { comboId: combo.id, quantity: 1 });
      useCartStore.getState().setItems(mapServerItems(res.data.cart?.items));
    } catch (err) {
      console.error("Failed to add combo to cart:", err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="card overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="relative h-36 bg-gradient-to-br from-brand-900 to-brand-700 overflow-hidden">
        {combo.imageUrl ? (
          <img src={combo.imageUrl} alt={combo.name} className="w-full h-full object-cover opacity-30" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={40} className="text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 flex flex-col items-start justify-end p-5">
          <h3 className="font-display text-white text-lg font-bold leading-snug">{combo.name}</h3>
        </div>
        {combo.savings > 0 && (
          <div className="absolute top-3 right-3 bg-amber-400 text-amber-900 font-num text-xs font-bold px-3 py-1 rounded-full">
            Save {rupee(combo.savings)}
          </div>
        )}
      </div>

      <div className="px-4 py-3 space-y-1.5">
        {(combo.items || []).map((i) => (
          <p key={i.variantId} className="font-body text-xs text-amber-600">
            {i.productName} {i.weightLabel} × {i.quantity}
          </p>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-amber-50">
        <div>
          <span className="font-num text-lg font-extrabold text-brand-900">{rupee(combo.comboPrice)}</span>
          {combo.individualTotal > combo.comboPrice && (
            <span className="font-num text-xs text-amber-400 line-through ml-1.5">{rupee(combo.individualTotal)}</span>
          )}
        </div>
        <button
          onClick={handleAddCombo}
          disabled={adding}
          className="flex items-center gap-1.5 font-body text-xs font-semibold text-white bg-sandal-500 hover:bg-sandal-600 rounded-xl px-3.5 py-2 transition-colors disabled:opacity-60"
        >
          <ShoppingCart size={13} /> {adding ? "Adding…" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

// Fallback for mobile browsers that don't support navigator.clipboard (HTTP or older WebKit)
function fallbackCopy(text, onDone) {
  const el = document.createElement("textarea");
  el.value = text;
  el.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
  document.body.appendChild(el);
  el.focus();
  el.select();
  try { document.execCommand("copy"); onDone(); } catch (_) {}
  document.body.removeChild(el);
}

function OfferCard({ offer }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!offer.code) return;
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(offer.code).then(done).catch(() => fallbackCopy(offer.code, done));
    } else {
      fallbackCopy(offer.code, done);
    }
  };

  const isPercentage = offer.discountValue <= 100;
  const badgeLabel   = isPercentage ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`;

  const endDate = offer.endDate
    ? new Date(offer.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  return (
    <div className="card overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* image section */}
      <div className="relative h-36 bg-gradient-to-br from-brand-900 to-brand-700 overflow-hidden">
        {offer.imageUrl && (
          <img
            src={offer.imageUrl} alt={offer.name}
            className="w-full h-full object-cover opacity-20"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        )}
        <div className="absolute inset-0 flex flex-col items-start justify-end p-5">
          <span className="font-num text-amber-300 text-xs font-bold uppercase tracking-widest mb-1">
            {badgeLabel}
          </span>
          <h3 className="font-display text-white text-lg font-bold leading-snug">{offer.name}</h3>
          {offer.description && (
            <p className="font-body text-amber-200 text-xs mt-1 line-clamp-2">{offer.description}</p>
          )}
        </div>
        {/* badge */}
        <div className="absolute top-3 right-3 bg-amber-400 text-amber-900 font-num text-xs font-bold px-3 py-1 rounded-full">
          {badgeLabel}
        </div>
      </div>

      {/* coupon row */}
      {offer.code && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-50">
          <div className="flex items-center gap-2">
            <Tag size={13} className="text-amber-400" />
            <span className="font-num text-sm font-bold text-brand-900 tracking-widest">{offer.code}</span>
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 font-body text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              copied
                ? "bg-green-50 text-green-600"
                : "bg-amber-50 text-brand-700 hover:bg-amber-100"
            }`}
          >
            {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
      )}

      {/* meta row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex flex-col gap-0.5">
          {offer.minOrderValue > 0 && (
            <p className="font-body text-xs text-amber-500">
              Min. order: <span className="font-num font-semibold">
                ₹{Number(offer.minOrderValue).toLocaleString("en-IN")}
              </span>
            </p>
          )}
          {endDate && (
            <p className="font-body text-xs text-amber-400 flex items-center gap-1">
              <Clock size={10} /> Valid till {endDate}
            </p>
          )}
        </div>
        <Link to="/products" className="font-body text-xs text-brand-700 font-semibold flex items-center gap-1 hover:underline">
          Shop Now <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}

function OfferSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="h-36 skeleton" />
      <div className="px-4 py-3 space-y-2">
        <div className="skeleton h-4 w-1/3" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
export default function Offers() {
  const { data: offers = [], isLoading: loading } = useActiveOffers();
  const { data: combos = [], isLoading: combosLoading } = useActiveCombos();

  return (
    <div className="page-wrap py-8">
      <SEO
        title="Offers & Deals | Namma Oor Karuvattu Kadai"
        description="Explore exclusive discounts, coupons, and combo deals on premium sun-dried fish and traditional pickles at Namma Oor Karuvattu Kadai."
        url="https://nammaoorkaruvattukadai.com/offers"
      />
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-brand-900">Offers & Deals</h1>
        <p className="font-body text-amber-500 text-sm mt-1">
          Exclusive discounts on premium dry fish & pickles
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <OfferSkeleton key={i} />)}
        </div>
      ) : offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Tag size={48} className="text-amber-200 mb-4" />
          <h2 className="font-display text-xl font-bold text-brand-900 mb-2">No active offers</h2>
          <p className="font-body text-amber-500 text-sm mb-2 max-w-xs">
            Check back soon for exciting deals and seasonal discounts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {offers.map((o) => <OfferCard key={o.id} offer={o} />)}
        </div>
      )}

      <div className="mt-12 mb-7">
        <h2 className="font-display text-2xl font-bold text-brand-900">Combos</h2>
        <p className="font-body text-amber-500 text-sm mt-1">
          Bundled favorites, priced together for extra savings
        </p>
      </div>

      {combosLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <OfferSkeleton key={i} />)}
        </div>
      ) : combos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package size={48} className="text-amber-200 mb-4" />
          <h2 className="font-display text-xl font-bold text-brand-900 mb-2">No combos yet</h2>
          <p className="font-body text-amber-500 text-sm mb-6 max-w-xs">
            Check back soon for bundled deals.
          </p>
          <Link to="/products" className="btn-lg btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {combos.map((c) => <ComboCard key={c.id} combo={c} />)}
        </div>
      )}
    </div>
  );
}