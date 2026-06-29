import { Tag, ChevronRight, Home, MapPin, ArrowLeft } from "lucide-react";

import comboImg from "../../assets/products/combo.jpg";
const PH = comboImg;

const rupee = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

// ── Single item row (read-only, matches Review.jsx's ReviewItem style) ──
function SummaryItem({ item }) {
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
        <p className="font-body text-xs text-amber-500 mt-0.5">
          {item.weight} · Qty {item.quantity}
        </p>
      </div>
      <span className="font-num text-sm font-semibold text-brand-900 shrink-0">
        {rupee(item.price * item.quantity)}
      </span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// OrderSummaryStep — the dedicated Order Summary step (step 2 of 3)
//
// Props:
//   address        {object}  — selected saved address
//   items          {array}   — checkout items
//   sub            {number}
//   disc           {number}
//   ship           {number}
//   tot            {number}
//   coupon         {object|null}
//   onBack         {fn}      — go back to address step
//   onContinue     {fn}      — advance to payment step
//   onChangeAddress {fn}     — open the address picker sheet
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
}) {
  const AddressIcon = address?.label?.toLowerCase() === "home" ? Home : MapPin;

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
                className="font-body text-sm font-semibold text-brand-700 hover:text-brand-900 shrink-0 transition-colors"
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
            <SummaryItem key={item.variantId} item={item} />
          ))}
        </div>

        {/* ── Price Details ────────────────────────────────────── */}
        <div className="card p-4 sm:p-5">
          <h3 className="font-body text-sm font-bold text-brand-900 mb-4">Price Details</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between font-body text-amber-700">
              <span>Subtotal</span>
              <span className="font-num">{rupee(sub)}</span>
            </div>

            <div className="flex justify-between font-body text-amber-700">
              <span>Delivery</span>
              <span className={`font-num ${ship === 0 ? "text-green-600 font-semibold" : ""}`}>
                {ship === 0 ? "FREE" : rupee(ship)}
              </span>
            </div>

            {disc > 0 && (
              <div className="flex justify-between font-body text-green-600">
                <span>Discount{coupon?.code ? ` (${coupon.code})` : ""}</span>
                <span className="font-num">−{rupee(disc)}</span>
              </div>
            )}

            <div className="flex justify-between font-body font-bold text-brand-900 text-base border-t border-amber-100 pt-3">
              <span>Total Amount</span>
              <span className="font-num">{rupee(tot)}</span>
            </div>
          </div>

          {/* Savings banner — only when a real discount is applied */}
          {disc > 0 && (
            <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
              <Tag size={14} className="text-green-600 shrink-0" />
              <p className="font-body text-xs font-semibold text-green-700">
                You'll save {rupee(disc)} on this order!
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
          <p className="font-body text-[10px] text-amber-500 font-semibold uppercase tracking-wide">Total</p>
          <p className="font-num text-lg font-bold text-brand-900 leading-tight">{rupee(tot)}</p>
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
