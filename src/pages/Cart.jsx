import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, X, Loader2 } from "lucide-react";
import { useCartStore }    from "../components/store/CartStore";
import { useAuthStore }    from "../components/store/AuthStore";

// ─── placeholder until cloud URLs provided ────────────────────────────
const PH = "https://placehold.co/100x100/92400e/fef3c7?text=🐟";

const rupee = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

// ══════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ══════════════════════════════════════════════════════════════════════
function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <ShoppingBag size={56} className="text-amber-200 mb-4" />
      <h2 className="font-display text-2xl font-bold text-brand-900 mb-2">Your cart is empty</h2>
      <p className="font-body text-amber-600 text-sm mb-7 max-w-xs">
        Add some dry fish or pickles to get started!
      </p>
      <Link to="/products" className="btn-lg btn-primary">
        Browse Products <ArrowRight size={16} />
      </Link>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// COUPON INPUT
// ══════════════════════════════════════════════════════════════════════
function CouponBox({ coupon, onApply, onRemove }) {
  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const { token } = useAuthStore();

  const handleApply = async () => {
    if (!code.trim()) return;
    setError("");
    setLoading(true);
    try {
      await onApply(code.trim().toUpperCase(), token);
      setCode("");
    } catch (err) {
      setError(err.message || "Invalid coupon code");
    } finally {
      setLoading(false);
    }
  };

  // already applied
  if (coupon) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <Tag size={15} className="text-green-600" />
          <div>
            <p className="font-num text-sm font-bold text-green-800 tracking-wider">{coupon.code}</p>
            <p className="font-body text-xs text-green-600">
              {coupon.discountType === "percentage"
                ? `${coupon.discountValue}% off applied`
                : `₹${coupon.discountValue} off applied`}
            </p>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="text-green-600 hover:text-red-500 transition-colors p-1"
          aria-label="Remove coupon"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          placeholder="Enter coupon code"
          className="field-input flex-1 uppercase tracking-wider"
        />
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="btn-md btn-outline shrink-0"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : "Apply"}
        </button>
      </div>
      {error && <p className="font-body text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ORDER SUMMARY CARD
// ══════════════════════════════════════════════════════════════════════
function OrderSummary({ subtotal, discount, shipping, total, coupon, onApply, onRemove, onCheckout, loading }) {
  return (
    <div className="card p-5 sticky top-24">
      <h2 className="font-display text-base font-bold text-brand-900 mb-4">Order Summary</h2>

      {/* line items */}
      <div className="space-y-2.5 text-sm mb-4">
        <div className="flex justify-between font-body text-amber-800">
          <span>Subtotal</span>
          <span className="font-num">{rupee(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between font-body text-green-600">
            <span>Coupon ({coupon?.code})</span>
            <span className="font-num">−{rupee(discount)}</span>
          </div>
        )}

        <div className="flex justify-between font-body text-amber-800">
          <span>Delivery</span>
          <span className={`font-num ${shipping === 0 ? "text-green-600 font-semibold" : ""}`}>
            {shipping === 0 ? "FREE" : rupee(shipping)}
          </span>
        </div>

        {shipping > 0 && (
          <p className="font-body text-[11px] text-amber-500">
            Add {rupee(499 - subtotal)} more for free delivery
          </p>
        )}
      </div>

      {/* total */}
      <div className="border-t border-amber-100 pt-3 flex justify-between items-center mb-5">
        <span className="font-body text-base font-bold text-brand-900">Total</span>
        <span className="font-num text-lg font-extrabold text-brand-900">{rupee(total)}</span>
      </div>

      {/* coupon box */}
      <div className="mb-5">
        <p className="field-label mb-2">Coupon Code</p>
        <CouponBox coupon={coupon} onApply={onApply} onRemove={onRemove} />
      </div>

      {/* checkout CTA */}
      <button
        onClick={onCheckout}
        disabled={loading}
        className="btn-lg btn-primary w-full"
      >
        {loading
          ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
          : <>Proceed to Checkout <ArrowRight size={16} /></>
        }
      </button>

      <Link to="/products" className="font-body text-xs text-amber-500 hover:text-brand-700 text-center block mt-3 transition-colors">
        ← Continue Shopping
      </Link>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// CART ITEM ROW
// ══════════════════════════════════════════════════════════════════════
function CartItem({ item, onQty, onRemove }) {
  const disc = item.comparePrice > item.price
    ? Math.round(((item.comparePrice - item.price) / item.comparePrice) * 100)
    : 0;

  return (
    <div className="card p-4 flex gap-3 sm:gap-4">
      {/* image */}
      <Link to={`/products/${item.slug || ""}`} className="shrink-0">
        <img
          src={item.image || PH}
          alt={item.productName}
          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl bg-amber-50"
          onError={(e) => { e.target.src = PH; }}
        />
      </Link>

      {/* details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link to={`/products/${item.slug || ""}`}>
              <h3 className="font-body text-sm font-semibold text-brand-900 leading-snug line-clamp-2 hover:text-brand-700">
                {item.productName}
              </h3>
              {item.nameTa && (
                <p className="font-tamil text-[11px] text-amber-400 mt-0.5">{item.nameTa}</p>
              )}
            </Link>
            <p className="font-body text-xs text-amber-500 mt-1">{item.weight}</p>
          </div>
          {/* remove */}
          <button
            onClick={() => onRemove(item.variantId)}
            className="shrink-0 p-1.5 text-amber-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Remove item"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {/* price + qty */}
        <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
          <div>
            <span className="font-num text-base font-bold text-brand-900">{rupee(item.price)}</span>
            {item.comparePrice > item.price && (
              <>
                <span className="font-num text-xs text-amber-400 line-through ml-1.5">{rupee(item.comparePrice)}</span>
                <span className="badge-red ml-1.5">−{disc}%</span>
              </>
            )}
          </div>

          {/* qty stepper */}
          <div className="flex items-center border border-amber-200 rounded-xl overflow-hidden">
            <button
              onClick={() => onQty(item.variantId, item.quantity - 1)}
              className="px-3 py-1.5 text-brand-700 hover:bg-amber-50 transition-colors active:bg-amber-100"
              aria-label="Decrease quantity"
            >
              <Minus size={14} />
            </button>
            <span className="px-3 font-num text-sm font-semibold text-brand-900 min-w-[2rem] text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => onQty(item.variantId, item.quantity + 1)}
              className="px-3 py-1.5 text-brand-700 hover:bg-amber-50 transition-colors active:bg-amber-100"
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* line total */}
        <p className="font-body text-xs text-amber-500 mt-1.5 text-right">
          Line total: <span className="font-num font-semibold text-amber-700">{rupee(item.price * item.quantity)}</span>
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// CART PAGE
// ══════════════════════════════════════════════════════════════════════
export default function Cart() {
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // ── Read from CartStore ───────────────────────────────────────────
  const {
    items,
    coupon,
    updateQty,
    removeItem,
    validateCoupon,
    removeCoupon,
    subtotal,
    discount,
    shipping,
    total,
  } = useCartStore();

  const { isAuthenticated } = useAuthStore();

  // ── Computed values (call as functions) ───────────────────────────
  const sub  = subtotal();
  const disc = discount();
  const ship = shipping();
  const tot  = total();

  // ── Handlers ─────────────────────────────────────────────────────
  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    navigate("/checkout");
  };

  if (items.length === 0) return <EmptyCart />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* header */}
      <h1 className="font-display text-2xl font-bold text-brand-900 mb-6">
        My Cart
        <span className="font-num text-base font-normal text-amber-500 ml-2">
          ({items.reduce((n, i) => n + i.quantity, 0)} items)
        </span>
      </h1>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Cart items list ───────────────────────────────────── */}
        <div className="flex-1 space-y-3">
          {items.map((item) => (
            <CartItem
              key={item.variantId}
              item={item}
              onQty={updateQty}
              onRemove={removeItem}
            />
          ))}

          {/* Mobile summary (only on small screens) */}
          <div className="lg:hidden">
            <OrderSummary
              subtotal={sub}
              discount={disc}
              shipping={ship}
              total={tot}
              coupon={coupon}
              onApply={validateCoupon}
              onRemove={removeCoupon}
              onCheckout={handleCheckout}
              loading={checkoutLoading}
            />
          </div>
        </div>

        {/* ── Sticky summary (desktop only) ────────────────────── */}
        <div className="hidden lg:block w-80 shrink-0">
          <OrderSummary
            subtotal={sub}
            discount={disc}
            shipping={ship}
            total={tot}
            coupon={coupon}
            onApply={validateCoupon}
            onRemove={removeCoupon}
            onCheckout={handleCheckout}
            loading={checkoutLoading}
          />
        </div>

      </div>
    </div>
  );
}