import { useState } from "react";
import { Tag, ChevronRight, Home, MapPin, ArrowLeft, Truck, Minus, Plus, BadgePercent, ChevronDown } from "lucide-react";
import CouponBox from "./CouponBox";

import comboImg from "../../assets/products/combo.jpg";
const PH = comboImg;

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
        className="w-12 h-12 rounded-xl object-cover bg-brand-50 shrink-0"
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
            <div className="flex items-center border border-amber-200 rounded-lg overflow-hidden bg-white shrink-0">
              <button
                type="button"
                onClick={() => onUpdateQty(item.variantId, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="px-2 py-0.5 text-brand-700 hover:bg-amber-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Decrease quantity"
              >
                <Minus size={11} />
              </button>
              <span className="px-1.5 font-num text-xs font-semibold text-brand-900 min-w-[1.25rem] text-center">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQty(item.variantId, item.quantity + 1)}
                disabled={item.quantity >= 3}
                className="px-2 py-0.5 text-brand-700 hover:bg-amber-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Increase quantity"
              >
                <Plus size={11} />
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
      {/* ── Scrollable page content ────────────────────────────── */}
      {/* pb-28 reserves space so the fixed bottom bar doesn't overlap content on mobile */}
      <div className="space-y-4 lg:space-y-5 pb-28 lg:pb-0">

        {/* ── Deliver to ──────────────────────────────────────── */}
        {address && (
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
                        className={`transition-transform duration-200 ${
                          couponOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {!couponOpen && !coupon && (
                      <span className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-amber-50 text-amber-650 border border-amber-200">
                        <Tag size={9} /> Got code?
                      </span>
                    )}
                  </span>
                  <span className="font-num text-green-600">−{rupee(totalMrp - sub)}</span>
                </div>
                {/* Collapsible Coupon Box directly below Product Discount */}
                <div
                  className={`transition-all duration-300 overflow-hidden ${
                    couponOpen ? "max-h-40 opacity-100 py-1.5" : "max-h-0 opacity-0"
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
                      className={`transition-transform duration-200 ${
                        couponOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <span className="text-xs text-amber-400">Optional</span>
                </div>
                {/* Collapsible Coupon Box directly below Apply Coupon */}
                <div
                  className={`transition-all duration-300 overflow-hidden ${
                    couponOpen ? "max-h-40 opacity-100 py-1.5" : "max-h-0 opacity-0"
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

          {/* Savings banner styled like the mockup (light green background, rounded border, centered, py-1.5 / py-[6px]) */}
          {totalSavings > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2 bg-[#e6f9f2] border border-[#bfead9] rounded-xl py-[6px] px-3">
              <BadgePercent size={18} className="text-[#10b981] fill-white shrink-0" />
              <p className="font-body text-xs sm:text-sm font-semibold text-[#0a5c43]">
                You'll save <span className="font-bold">{rupee(totalSavings)}</span> on this order!
              </p>
            </div>
          )}
        </div>

        {/* ── Desktop inline action row ────────────────────────── */}
        <div className="hidden lg:flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="btn-md btn-outline flex items-center gap-1"
          >
            <ArrowLeft size={15} /> Back
          </button>
          <button
            onClick={onContinue}
            className="btn-lg btn-primary flex items-center gap-2"
          >
            Continue to Payment <ChevronRight size={16} />
          </button>
        </div>

      </div>

      {/* ── Mobile fixed bottom bar ───────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-amber-100 px-4 py-3 flex items-center justify-between gap-4 safe-bottom">
        <div>
          {/* <p className="font-body text-[10px] text-amber-500 font-semibold uppercase tracking-wide">Total</p> */}
          {totalSavings > 0 && (
            <p className="font-num text-xs text-amber-400 line-through leading-none">{rupee(totalMrp + ship)}</p>
          )}
          <p className="font-num text-lg font-bold text-brand-900 leading-tight">{rupee(tot)}</p>
          {/* {totalSavings > 0 && (
            <p className="font-body text-[10px] text-green-600 font-bold mt-0.5">Saved {rupee(totalSavings)}</p>
          )} */}
        </div>
        <button
          onClick={onContinue}
          className="btn-lg btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2"
        >
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </>
  );
}
