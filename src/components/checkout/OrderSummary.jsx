import { useState } from "react";
import { Link } from "react-router-dom";
import { Tag, ChevronRight, Home, MapPin, ArrowLeft, Lock, Truck, Minus, Plus, BadgePercent, ChevronDown } from "lucide-react";
import CouponBox from "./CouponBox";
import StepBar from "./StepBar";

const PH = "";

const rupee = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

// ── Single item row (with quantity selector up to 3) ──
function SummaryItem({ item, onUpdateQty }) {
  return (
    <div className="flex gap-3 items-center py-3 border-b border-amber-50 last:border-0">
      <img
        src={item.image || PH}
        alt={item.productName}
        className="w-26 h-26 rounded-xl object-cover bg-brand-50 shrink-0"
        onError={(e) => { e.target.src = PH; }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm font-medium text-brand-900 line-clamp-1">
          {item.productName}
        </p>
        {item.nameTa && (
          <p className="font-tamil text-[11px] text-amber-400 mt-0.5">{item.nameTa}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5">
          <span className="font-body text-xs text-amber-500">{item.weight}</span>

          {onUpdateQty && (
            <div className="flex items-center border border-amber-200 rounded-xl overflow-hidden bg-surface shrink-0">
              <button
                type="button"
                onClick={() => onUpdateQty(item.variantId, item.quantity - 1)}
                className="px-[clamp(0.5rem,2vw,0.75rem)] py-[clamp(0.25rem,1vw,0.375rem)] text-brand-700 hover:bg-amber-50 transition-colors active:bg-amber-100"
                aria-label="Decrease quantity"
              >
                <Minus size="clamp(12px,1.5vw,16px)" />
              </button>
              <span className="px-[clamp(0.5rem,2vw,0.75rem)] font-num text-[clamp(0.75rem,1.5vw,0.875rem)] font-semibold text-brand-900 min-w-[clamp(1.5rem,3vw,2rem)] text-center">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQty(item.variantId, item.quantity + 1)}
                className="px-[clamp(0.5rem,2vw,0.75rem)] py-[clamp(0.25rem,1vw,0.375rem)] text-brand-700 hover:bg-amber-50 transition-colors active:bg-amber-100"
                aria-label="Increase quantity"
              >
                <Plus size="clamp(12px,1.5vw,16px)" />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <span className="font-num text-sm font-semibold text-brand-900 block">
          {rupee(item.price * item.quantity)}
        </span>
        {(item.comparePrice ? Number(item.comparePrice) : Number(item.price)) > item.price && (
          <span className="font-num text-xs text-amber-400 line-through">
            {rupee((item.comparePrice ? Number(item.comparePrice) : Number(item.price)) * item.quantity)}
          </span>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// OrderSummaryStep — the dedicated Order Summary step (step 2 of 3)
// ══════════════════════════════════════════════════════════════════════
export default function OrderSummaryStep({
  address,
  items,
  sub,
  disc,
  ship,
  tot,
  coupon,
  onBack,
  onContinue,
  onChangeAddress,
  onUpdateQty,
}) {
  const AddressIcon = address?.label?.toLowerCase() === "home" ? Home : MapPin;
  const [couponOpen, setCouponOpen] = useState(!!coupon);

  // Compute total original MRP price (sum of mrp * quantity for all items)
  const totalMrp = items.reduce((sum, item) => {
    const mrp = item.comparePrice ? Number(item.comparePrice) : Number(item.price);
    return sum + mrp * item.quantity;
  }, 0);

  // Total savings = discount on product page (MRP - selling price) + coupon discount
  const totalSavings = (totalMrp - sub) + disc;

  return (
    <>
      {/* Mobile-only Header (Step 2 of 3 / Order Summary / 100% Secure) */}
      <div className="md:hidden flex items-center justify-between gap-4 mb-4 pt-1">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 text-brand-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="font-body text-[10px] text-amber-500 font-semibold leading-none">
              Step 2 of 3
            </p>
            <h2 className="font-display text-lg font-bold text-brand-900 mt-0.5">
              Order Summary
            </h2>
          </div>
        </div>
      </div>

      {/* ── Scrollable page content ────────────────────────────── */}
      {/* pb-28 reserves space so the fixed bottom bar doesn't overlap content on mobile   */}
      {/* lg+: flex row — left col (address + items) / right col (Price Details, sticky)  */}
      <div className="md:flex md:items-start md:gap-6 pb-28 md:pb-0">

        {/* ── LEFT COLUMN ─────────────────────────────────────── */}
        <div className="space-y-4 md:space-y-5 md:flex-1 md:min-w-0">

          {/* Step bar inside the left column */}
          <div className="card p-4 sm:p-5 max-w-7xl mx-auto w-full hidden md:block">
            <StepBar current="summary" />
          </div>

          {/* ── Deliver to ──────────────────────────────────────── */}
          {address ? (
            <div className="card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <AddressIcon size={16} className="text-brand-700 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-body text-[10px] font-semibold text-amber-500 uppercase tracking-wide mb-1">
                      Deliver to
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-body text-sm font-bold text-brand-900">{address.name}</p>
                      {address.label && (
                        <span className="inline-block font-body text-[10px] font-bold text-brand-700 bg-brand-100 rounded px-1.5 py-0.5 uppercase tracking-wide">
                          {address.label}
                        </span>
                      )}
                    </div>
                    <p className="font-body text-xs text-amber-600 mt-1 leading-relaxed">
                      {address.addressLine1}
                      {address.addressLine2 ? `, ${address.addressLine2}` : ""},&nbsp;
                      {address.taluk && address.taluk !== "NA" ? `${address.taluk}, ` : ""}
                      {address.city}, {address.state} – {address.pincode}
                    </p>
                    <p className="font-body text-xs text-amber-500 mt-0.5">{address.phone}</p>
                  </div>
                </div>
                <button
                  onClick={onChangeAddress}
                  className="btn-sm btn-outline shrink-0"
                >
                  Change
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-4 sm:p-5 border-red-205 bg-red-50/20 text-center">
              <p className="font-body text-sm text-red-600 font-semibold mb-2">No delivery address selected</p>
              <button
                onClick={onChangeAddress}
                className="btn-sm btn-primary inline-flex items-center gap-1 cursor-pointer mx-auto"
              >
                <Plus size={14} /> Add or Select Address
              </button>
            </div>
          )}

          {/* ── Items ───────────────────────────────────────────── */}
          <div className="card p-4 sm:p-5">
            <p className="font-body text-sm font-bold text-brand-900 mb-1">
              {items.length} {items.length === 1 ? "Item" : "Items"}
            </p>
            {items.map((item) => (
              <SummaryItem key={item.variantId} item={item} onUpdateQty={onUpdateQty} />
            ))}
          </div>

          {/* ── Delivery estimate ────────────────────────────────── */}
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl">
            <Truck size={16} className="text-amber-500 shrink-0" />
            <p className="font-body text-sm text-amber-700">
              Estimated delivery: <span className="font-semibold">3–5 business days</span>
            </p>
          </div>

          {/* ── Desktop inline action row (inside left col so it sits below items) ── */}
          {/* <div className="hidden md:flex items-center justify-between gap-4">
            <button
              onClick={onBack}
              className="btn-md btn-outline flex items-center gap-1"
            >
              <ArrowLeft size={15} /> Back
            </button>
          </div> */}

        </div>{/* ── END LEFT COLUMN ──────────────────────────────── */}

        {/* ── RIGHT COLUMN — Price Details (sticky on desktop) ─── */}
        <div className="mt-4 md:mt-0 md:w-96 md:shrink-0">
          <div className="md:sticky md:top-[88px] space-y-4">

            {/* ── Price Details ────────────────────────────────────── */}
            <div className="card p-4 sm:p-5">
              <h3 className="font-body text-sm font-bold text-brand-900 mb-4">Price Details</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between font-body text-amber-700">
                  <span>MRP</span>
                  <span className="font-num">{rupee(totalMrp)}</span>
                </div>

                {totalMrp > sub ? (
                  <>
                    <div className="flex justify-between font-body ">
                      <span className="flex items-center gap-1">
                        Discount
                        <button
                          type="button"
                          onClick={() => setCouponOpen(!couponOpen)}
                          className="p-0.5 hover:bg-green-50 rounded transition-colors cursor-pointer text-green-600"
                          aria-label="Toggle coupon entry"
                        >
                          <ChevronDown
                            size={14}
                            className={`transition-transform duration-200 ${couponOpen ? "rotate-180" : ""
                              }`}
                          />
                        </button>
                        {!couponOpen && !coupon && (
                          <span className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-amber-50 text-amber-650 border border-amber-200">
                            <Tag size={9} /> Apply Coupon
                          </span>
                        )}
                      </span>
                      <span className="font-num text-green-600">−{rupee(totalMrp - sub)}</span>
                    </div>
                    {/* Collapsible Coupon Box directly below Product Discount */}
                    <div
                      className={`transition-all duration-300 overflow-hidden ${couponOpen ? "max-h-40 opacity-100 py-1.5" : "max-h-0 opacity-0"
                        }`}
                    >
                      <CouponBox />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between font-body text-amber-700">
                      <button
                        type="button"
                        onClick={() => setCouponOpen(!couponOpen)}
                        className="flex items-center gap-1 font-body text-sm font-semibold text-amber-500 hover:text-brand-700 transition-colors cursor-pointer"
                      >
                        Apply Coupon
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${couponOpen ? "rotate-180" : ""
                            }`}
                        />
                      </button>
                      <span className="text-xs text-amber-400">Optional</span>
                    </div>
                    {/* Collapsible Coupon Box directly below Apply Coupon */}
                    <div
                      className={`transition-all duration-300 overflow-hidden ${couponOpen ? "max-h-40 opacity-100 py-1.5" : "max-h-0 opacity-0"
                        }`}
                    >
                      <CouponBox />
                    </div>
                  </>
                )}

                {disc > 0 && (
                  <div className="flex justify-between font-body text-green-600">
                    <span>Coupon Discount{coupon?.code ? ` (${coupon.code})` : ""}</span>
                    <span className="font-num">−{rupee(disc)}</span>
                  </div>
                )}

                <div className="flex justify-between font-body text-amber-700">
                  <span>Delivery Charges</span>
                  <span className={`font-num ${ship === 0 ? "text-green-600 font-semibold" : ""}`}>
                    {ship === 0 ? "FREE" : rupee(ship)}
                  </span>
                </div>

                <div className="flex justify-between font-body font-bold text-brand-900 text-base border-t border-amber-100 pt-3">
                  <span>Total Amount</span>
                  <span className="font-num">{rupee(tot)}</span>
                </div>
              </div>

              {/* Savings banner */}
              {totalSavings > 0 && (
                <div className="mt-4 flex items-center justify-center gap-2 bg-[#e6f9f2] border border-[#bfead9] rounded-xl py-[6px] px-3">
                  <BadgePercent size={18} className="text-[#10b981] fill-white shrink-0" />
                  <p className="font-body text-xs sm:text-sm font-semibold text-[#0a5c43]">
                    You'll save <span className="font-bold">{rupee(totalSavings)}</span> on this order!
                  </p>
                </div>
              )}
            </div>

            {/* Mobile-only T&C disclaimer below Price Details card, hidden on desktop */}
            <div className="md:hidden mt-3 text-center px-4">
              <p className="font-body text-[10px] text-amber-600/90 leading-normal">
                By continuing with the order, you confirm that you agree to Namma Oor Karuvattu Kadai's{" "}
                <Link to="/terms-of-use" className="underline hover:text-brand-700 font-semibold">Terms of Use</Link> and{" "}
                <Link to="/privacy-policy" className="underline hover:text-brand-700 font-semibold">Privacy Policy</Link>.
              </p>
            </div>

            {/* ── Continue Action Box (hidden on mobile, visible on desktop/tablet md+) ── */}
            <div className="hidden md:flex items-center justify-between bg-surface border border-amber-100 rounded-2xl p-4 shadow-sm">
              <div>
                {totalSavings > 0 && (
                  <p className="font-num text-xs text-amber-400 line-through leading-none mb-1">
                    {rupee(totalMrp + ship)}
                  </p>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="font-num text-lg font-extrabold text-brand-900 leading-none">
                    {rupee(tot)}
                  </span>
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-gray-300 flex items-center justify-center text-[9px] text-gray-400 font-semibold cursor-help"
                    title="Inclusive of all taxes & shipping"
                  >
                    i
                  </span>
                </div>
              </div>
              <button
                onClick={onContinue}
                disabled={!address}
                className="btn-md btn-primary px-6 py-2.5 shadow-sm"
              >
                Continue
              </button>
            </div>

          </div>
        </div>{/* ── END RIGHT COLUMN ─────────────────────────────── */}

      </div>

      {/* ── Disclaimer T&C footer below columns (hidden on mobile, shown on desktop) ── */}
      <div className="hidden md:block mt-8 text-center border-amber-100 pt-4">
        <p className="font-body text-[12px] text-amber-500 leading-relaxed max-w-3xl mx-auto">
          By continuing with the order, you confirm that you agree to Namma Oor Karuvattu Kadai's{" "}
          <Link to="/terms-of-use" className="underline hover:text-brand-700">Terms of Use</Link> and{" "}
          <Link to="/privacy-policy" className="underline hover:text-brand-700">Privacy Policy</Link>.
        </p>
      </div>

      {/* ── Mobile fixed bottom bar ───────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-surface border-t border-amber-100 px-4 py-3 safe-bottom flex items-center justify-between gap-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div>
          {totalSavings > 0 && (
            <p className="font-num text-xs text-amber-400 line-through leading-none">{rupee(totalMrp + ship)}</p>
          )}
          <p className="font-num text-lg font-bold text-brand-900 leading-tight">{rupee(tot)}</p>
        </div>
        <button
          onClick={onContinue}
          disabled={!address}
          className="btn-lg btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </>
  );
}
