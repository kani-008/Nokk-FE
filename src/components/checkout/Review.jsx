import { MapPin, CreditCard, Truck, ArrowLeft, Loader2 } from "lucide-react";
import { PAYMENT_METHODS } from "./Payment";

// ─── placeholder ──────────────────────────────────────────────────────
const PH = "https://placehold.co/80x80/92400e/fef3c7?text=🐟";

const rupee = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

// ── Single order item row ──────────────────────────────────────────────
function ReviewItem({ item }) {
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
        <p className="font-body text-xs text-amber-500">
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
// ReviewStep
//
// Props:
//   address     {object}  — active delivery address
//   payMethod   {string}  — selected payment method key
//   items       {array}   — cart items
//   total       {number}  — final total to display in CTA
//   placing     {boolean} — loading state
//   error       {string}  — api error message
//   onBack      {fn}      — go back to payment
//   onChangeAddress {fn}  — jump back to address step
//   onChangePayment {fn}  — jump back to payment step
//   onPlaceOrder    {fn}  — submit order
// ══════════════════════════════════════════════════════════════════════
export default function Review({
  address,
  payMethod,
  items,
  total,
  placing,
  error,
  onBack,
  onChangeAddress,
  onChangePayment,
  onPlaceOrder,
}) {
  const payLabel = PAYMENT_METHODS.find((m) => m.key === payMethod)?.label ?? payMethod;

  return (
    <div className="space-y-4">

      {/* ── Delivery address summary ─────────────────────────────── */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-body text-sm font-bold text-brand-900 flex items-center gap-2">
            <MapPin size={15} className="text-brand-600" /> Delivering to
          </h3>
          <button
            onClick={onChangeAddress}
            className="font-body text-xs text-brand-700 hover:underline"
          >
            Change
          </button>
        </div>

        {address && (
          <div>
            <p className="font-body text-sm font-semibold text-brand-900">{address.name}</p>
            <p className="font-body text-xs text-amber-600 mt-0.5 leading-relaxed">
              {address.addressLine1}
              {address.addressLine2 ? `, ${address.addressLine2}` : ""},&nbsp;
              {address.city}, {address.state} – {address.pincode}
            </p>
            <p className="font-body text-xs text-amber-500 mt-0.5">{address.phone}</p>
          </div>
        )}
      </div>

      {/* ── Payment method summary ───────────────────────────────── */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-body text-sm font-bold text-brand-900 flex items-center gap-2">
            <CreditCard size={15} className="text-brand-600" /> Payment
          </h3>
          <button
            onClick={onChangePayment}
            className="font-body text-xs text-brand-700 hover:underline"
          >
            Change
          </button>
        </div>
        <p className="font-body text-sm text-amber-700">{payLabel}</p>
      </div>

      {/* ── Items list ───────────────────────────────────────────── */}
      <div className="card p-4 sm:p-5">
        <h3 className="font-body text-sm font-bold text-brand-900 mb-3 flex items-center gap-2">
          <Truck size={15} className="text-brand-600" />
          {items.length} {items.length === 1 ? "Item" : "Items"}
        </h3>
        {items.map((item) => (
          <ReviewItem key={item.variantId} item={item} />
        ))}
      </div>

      {/* ── Error banner ─────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* ── Actions ──────────────────────────────────────────────── */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={onBack} className="btn-md btn-outline">
          <ArrowLeft size={15} /> Back
        </button>
        <button
          onClick={onPlaceOrder}
          disabled={placing}
          className="btn-lg btn-primary flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {placing ? (
            <><Loader2 size={16} className="animate-spin" /> Placing order…</>
          ) : (
            `Place Order · ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(total)}`
          )}
        </button>
      </div>
    </div>
  );
}