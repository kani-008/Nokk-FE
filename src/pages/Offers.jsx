import { useState } from "react";
import { Copy, Check, Tag, Clock, ArrowRight } from "lucide-react";
import { Link }     from "react-router-dom";
import { useActiveOffers } from "../hooks/queries/useOffers";

function OfferCard({ offer }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (offer.code) {
      navigator.clipboard?.writeText(offer.code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
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

  return (
    <div className="page-wrap py-8">
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
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Tag size={48} className="text-amber-200 mb-4" />
          <h2 className="font-display text-xl font-bold text-brand-900 mb-2">No active offers</h2>
          <p className="font-body text-amber-500 text-sm mb-6 max-w-xs">
            Check back soon for exciting deals and seasonal discounts.
          </p>
          <Link to="/products" className="btn-lg btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {offers.map((o) => <OfferCard key={o.id} offer={o} />)}
        </div>
      )}
    </div>
  );
}