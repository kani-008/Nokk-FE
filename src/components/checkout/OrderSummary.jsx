import { Truck } from "lucide-react";

// ─── placeholder ──────────────────────────────────────────────────────
const PH = "https://placehold.co/80x80/92400e/fef3c7?text=🐟";

const rupee = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

// ══════════════════════════════════════════════════════════════════════
// OrderSummary — sticky sidebar
//
// Props:
//   items    {array}   — cart items
//   sub      {number}  — subtotal
//   disc     {number}  — coupon discount amount
//   ship     {number}  — shipping charge (0 = free)
//   tot      {number}  — total
//   coupon   {object}  — { code } or null
// ══════════════════════════════════════════════════════════════════════
export default function OrderSummary({ items, sub, disc, ship, tot, coupon }) {
  return (
    <div className="card p-5 sticky top-24">
      <h2 className="font-display text-base font-bold text-brand-900 mb-4">Order Summary</h2>

      {/* mini items list */}
      <div className="space-y-2 mb-4 max-h-44 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.variantId} className="flex gap-2.5 items-center">
            <img
              src={item.image || PH}
              alt={item.productName}
              className="w-9 h-9 rounded-lg object-cover bg-brand-50 shrink-0"
              onError={(e) => { e.target.src = PH; }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-body text-xs font-medium text-brand-900 truncate">
                {item.productName}
              </p>
              <p className="font-body text-[10px] text-amber-500">
                {item.weight} · ×{item.quantity}
              </p>
            </div>
            <span className="font-num text-xs font-semibold text-brand-900 shrink-0">
              {rupee(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* price breakdown */}
      <div className="border-t border-amber-100 pt-3 space-y-2 text-sm">
        <div className="flex justify-between font-body text-amber-700">
          <span>Subtotal</span>
          <span className="font-num">{rupee(sub)}</span>
        </div>

        {disc > 0 && (
          <div className="flex justify-between font-body text-green-600">
            <span>Coupon {coupon?.code ? `(${coupon.code})` : ""}</span>
            <span className="font-num">−{rupee(disc)}</span>
          </div>
        )}

        <div className="flex justify-between font-body text-amber-700">
          <span>Delivery</span>
          <span className={`font-num ${ship === 0 ? "text-green-600 font-semibold" : ""}`}>
            {ship === 0 ? "FREE" : rupee(ship)}
          </span>
        </div>

        {/* total */}
        <div className="flex justify-between font-body font-bold text-brand-900 text-base border-t border-amber-100 pt-2">
          <span>Total</span>
          <span className="font-num">{rupee(tot)}</span>
        </div>
      </div>

      {/* delivery estimate */}
      <div className="mt-4 flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2.5">
        <Truck size={14} className="text-brand-700 shrink-0" />
        <p className="font-body text-xs text-amber-700">
          Estimated delivery:{" "}
          <span className="font-semibold text-brand-800">3–5 business days</span>
        </p>
      </div>
    </div>
  );
}