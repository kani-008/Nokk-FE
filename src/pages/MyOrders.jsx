import { useState, useEffect } from "react";
import { Link, useLocation }   from "react-router-dom";
import {
  Package, ChevronDown, ChevronUp, ShoppingBag,
  MapPin, Clock, ArrowRight, X, RotateCcw, Loader2, Check, Star,
  ArrowLeft, ChevronRight
} from "lucide-react";
import { useMyOrders, useCancelOrder, useRequestReplacement } from "../hookqueries/useOrders";
import { useAddReview } from "../hookqueries/useProducts";
import { useAuthStore } from "../components/store/AuthStore.jsx";
import comboImg from "../assets/products/combo.jpg";

const PH = comboImg;

const rupee = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

// ── Status pill ────────────────────────────────────────────────────────
const STATUS_STYLE = {
  pending:               "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed:             "bg-blue-50 text-blue-700 border-blue-200",
  processing:            "bg-indigo-50 text-indigo-700 border-indigo-200",
  shipped:               "bg-purple-50 text-purple-700 border-purple-200",
  out_for_delivery:      "bg-orange-50 text-orange-700 border-orange-200",
  delivered:             "bg-green-50 text-green-700 border-green-200",
  cancelled:             "bg-red-50 text-red-600 border-red-200",
  replacement_requested: "bg-pink-50 text-pink-700 border-pink-200",
  replacement_approved:  "bg-blue-50 text-blue-700 border-blue-200",
  replacement_rejected:  "bg-red-50 text-red-600 border-red-200",
  replacement_completed: "bg-teal-50 text-teal-700 border-teal-200",
};
function StatusPill({ status }) {
  const cls = STATUS_STYLE[status] ?? "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center font-num text-[11px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${cls}`}>
      {String(status).replace(/_/g, " ")}
    </span>
  );
}

// ── Replacement request modal ────────────────────────────────────────────
const REPLACEMENT_REASONS = [
  "Item damaged on arrival",
  "Wrong item delivered",
  "Quality not as expected",
  "Missing item(s) in package",
  "Other",
];

function ReplacementModal({ orderId, onClose, onSuccess }) {
  const [reason, setReason]   = useState("");
  const [details, setDetails] = useState("");
  const [error, setError]     = useState("");

  const requestReplacementMutation = useRequestReplacement();
  const submitting = requestReplacementMutation.isPending;

  const handleSubmit = async () => {
    if (!reason) { setError("Please select a reason."); return; }
    setError("");
    try {
      await requestReplacementMutation.mutateAsync({ id: orderId, reason, details: details.trim() || undefined });
      onSuccess();
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Could not submit replacement request");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-brand-900">Request Replacement</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>

        <div>
          <label className="font-body text-xs font-semibold text-amber-700 mb-1.5 block">Reason</label>
          <div className="space-y-1.5">
            {REPLACEMENT_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => { setReason(r); setError(""); }}
                className={`w-full text-left font-body text-sm px-3 py-2 rounded-xl border transition-colors ${
                  reason === r ? "border-brand-700 bg-brand-50 text-brand-900 font-semibold" : "border-amber-100 text-amber-700 hover:bg-amber-50"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-body text-xs font-semibold text-amber-700 mb-1.5 block">Additional details (optional)</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            placeholder="Tell us more so we can help faster…"
            className="field-input resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 font-body text-xs rounded-xl px-3 py-2.5">
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={submitting} className="btn-md btn-primary w-full">
          {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : "Submit Request"}
        </button>
      </div>
    </div>
  );
}

// ── Write review modal ─────────────────────────────────────────────────
function ReviewModal({ item, onClose, onReviewed }) {
  const [form, setForm] = useState({ rating: 5, title: "", comment: "" });
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const addReviewMutation = useAddReview();
  const loading = addReviewMutation.isPending;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.comment.trim()) { setError("Please write your review comment"); return; }
    setError("");
    try {
      await addReviewMutation.mutateAsync({ productId: item.productId, ...form });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to submit review");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-brand-900">Write a Review</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>

        <p className="font-body text-sm text-amber-700 font-semibold line-clamp-1">{item.productName}</p>

        {done ? (
          <div className="py-6 text-center">
            <p className="font-body text-sm text-green-700 font-bold flex items-center justify-center gap-2">
              <Check size={16} /> Review submitted — thank you!
            </p>
            <button onClick={() => { onReviewed?.(); onClose(); }} className="btn-md btn-primary mt-4 w-full">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label">Your Rating</label>
              <div className="flex gap-1.5 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, rating: s }))}
                    className="cursor-pointer transition-transform active:scale-90"
                  >
                    <Star
                      size={24}
                      className={s <= form.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-300"}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="field-label">Review Title (optional)</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Summarize your review…"
                className="field-input"
              />
            </div>

            <div>
              <label className="field-label">Your Review</label>
              <textarea
                value={form.comment}
                onChange={(e) => { setForm((f) => ({ ...f, comment: e.target.value })); setError(""); }}
                placeholder="Share your experience with this product…"
                rows={3}
                className="field-input resize-none"
              />
              {error && <p className="font-body text-xs text-red-500 mt-1">{error}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-md btn-primary w-full">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : "Submit Review"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Order card ─────────────────────────────────────────────────────────
function OrderCard({ order, onClick }) {
  const firstItem = order.items?.[0] || {};
  const itemImg = firstItem.imageUrl || firstItem.image || PH;
  const itemName = firstItem.productName || "Order";
  const hasMore = order.items?.length > 1;
  const moreCount = order.items?.length - 1;

  return (
    <div
      onClick={onClick}
      className="card flex items-center justify-between px-4 sm:px-5 py-4 cursor-pointer hover:bg-amber-50/50 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={itemImg}
          alt={itemName}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover bg-amber-50 shrink-0 border border-amber-100"
          onError={(e) => { e.target.src = PH; }}
        />
        <div className="min-w-0">
          <h3 className="font-body text-xs sm:text-sm font-semibold text-brand-900 leading-snug line-clamp-1">
            {itemName}
          </h3>
          {hasMore && (
            <p className="font-body text-[10px] text-amber-500 font-medium mt-0.5">
              + {moreCount} more item{moreCount > 1 ? "s" : ""}
            </p>
          )}
          <p className="font-body text-[10px] sm:text-xs text-gray-400 mt-1">{fmtDate(order.createdAt)}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-2">
        <div className="text-right mr-1">
          <p className="font-num text-sm sm:text-base font-bold text-brand-900">{rupee(order.total)}</p>
          <p className="font-body text-[10px] sm:text-xs text-amber-500 capitalize">{order.paymentMethod}</p>
        </div>
        <ChevronRight size={16} className="text-amber-400" />
      </div>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────
function OrderSkeleton() {
  return (
    <div className="card p-4 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex gap-3 items-center">
          <div className="w-9 h-9 skeleton rounded-xl" />
          <div className="space-y-1.5">
            <div className="skeleton h-4 w-24 rounded-lg" />
            <div className="skeleton h-3 w-32" />
          </div>
        </div>
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// MY ORDERS PAGE
// ══════════════════════════════════════════════════════════════════════
export default function MyOrders() {
  const { token }  = useAuthStore();
  const location   = useLocation();
  const { data: orders = [], isLoading: loading } = useMyOrders();
  const cancelOrderMutation = useCancelOrder();
  const [filter,   setFilter]   = useState("all");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [replacementRequested, setReplacementRequested] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewedProductIds, setReviewedProductIds] = useState(new Set());

  const newOrderId = location.state?.newOrderId;

  const FILTERS = [
    { key: "all",      label: "All" },
    { key: "active",   label: "Active" },
    { key: "delivered",label: "Delivered" },
    { key: "cancelled",label: "Cancelled" },
  ];

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setReplacementRequested(
      ["replacement_requested","replacement_approved","replacement_rejected","replacement_completed"].includes(order.status)
    );
  };

  const filtered = orders.filter((o) => {
    if (filter === "all")       return true;
    if (filter === "active")    return !["delivered","cancelled","replacement_completed"].includes(o.status);
    if (filter === "delivered") return o.status === "delivered";
    if (filter === "cancelled") return ["cancelled","replacement_completed"].includes(o.status);
    return true;
  });

  if (selectedOrder) {
    const order = selectedOrder;
    const addr = order.address || {};
    const status = order.status;
    const isDelivered = status === "delivered";

    // 24 hours replacement limit from delivery
    const deliveryEvent = order.timeline?.find((t) => t.status === "delivered");
    const deliveryTime = deliveryEvent
      ? new Date(deliveryEvent.createdAt)
      : (status === "delivered" ? new Date(order.updatedAt || order.createdAt) : null);
    const isWithin24Hours = deliveryTime
      ? (new Date() - deliveryTime) < 24 * 60 * 60 * 1000
      : false;

    const canRequestReplacement = isDelivered && !replacementRequested;
    const canCancel = ["pending", "confirmed"].includes(status);

    const handleCancelOrder = async () => {
      setCancelError("");
      try {
        await cancelOrderMutation.mutateAsync(order.id);
        setSelectedOrder((prev) => ({ ...prev, status: "cancelled" }));
      } catch (e) {
        setCancelError(e.response?.data?.message || "Failed to cancel order");
      }
    };

    return (
      <div className="page-wrap pt-2 space-y-5">
        {/* header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center  -ml-2">
            <button
              onClick={() => setSelectedOrder(null)}
              className="p-1.5  hover:bg-sandal-100/50 rounded-lg text-gray-800 transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900">Order Details</h2>
          </div>
          <a
            href="https://wa.me/919999999999?text=Hello,%20I%20need%20help%20with%20my%20order."
            target="_blank"
            rel="noreferrer"
            className="btn-sm btn-outline flex items-center gap-1.5"
          >
            Help
          </a>
        </div>

        {/* product card & details */}
        <div className="card p-4 sm:p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-amber-100/30 pb-3">
            <p className="font-body text-xs font-semibold text-amber-800 uppercase tracking-wider">Product Details</p>
            <p className="font-num text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">
              Order ID: #{String(order.id).toUpperCase()}
            </p>
          </div>
          <div className="space-y-4">
            {(order.items || []).map((item, i) => (
              <div key={i} className="flex gap-3 items-start border-b border-amber-100/30 pb-3 last:border-none last:pb-0">
                <img
                  src={item.imageUrl || item.image || PH} alt={item.productName}
                  className="w-12 h-12 rounded-xl object-cover bg-amber-50 shrink-0 border border-amber-100"
                  onError={(e) => { e.target.src = PH; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-bold text-brand-900 line-clamp-1">{item.productName}</p>
                  <p className="font-body text-xs text-amber-500 mt-0.5">{item.weightLabel}</p>
                  <p className="font-body text-xs text-amber-700 font-medium mt-1.5">
                    Qty: <span className="font-semibold text-brand-900">{item.quantity}</span> &middot; Price: <span className="font-semibold text-brand-900">{rupee(item.price)}</span>
                  </p>
                </div>
                <span className="font-num text-sm font-semibold text-brand-900 shrink-0">{rupee(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Track status */}
        {(order.trackingNumber || order.courierName || order.timeline?.length > 0) && (
          <div className="card p-4 sm:p-5 space-y-4">
            <p className="font-body text-xs font-semibold text-amber-800 uppercase tracking-wider border-b border-amber-100/30 pb-3">Track Status</p>
            
            {order.trackingNumber && (
              <div className="flex gap-2.5 items-start bg-amber-50/50 rounded-xl p-3 border border-amber-100/30">
                <Clock size={15} className="text-amber-500 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-800">
                  <p className="font-semibold">Tracking Information</p>
                  <p className="mt-1">
                    {order.courierName && <span className="font-bold">{order.courierName}</span>}
                    {order.courierName && " - "}
                    <span className="font-mono">{order.trackingNumber}</span>
                  </p>
                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-brand-700 hover:underline font-semibold"
                    >
                      Track Shipment <ArrowRight size={12} />
                    </a>
                  )}
                </div>
              </div>
            )}

            {order.timeline?.length > 0 && (
              <div className="pl-1.5">
                <ol className="relative border-l border-brand-200 ml-2 pl-4 space-y-5">
                  {order.timeline.map((t, i) => {
                    const isLatest = i === order.timeline.length - 1;
                    return (
                      <li key={i} className="relative">
                        <span className={`absolute -left-[25px] top-0.5 flex items-center justify-center rounded-full w-4 h-4 transition-all
                          ${isLatest ? "bg-brand-700 ring-2 ring-brand-100" : "bg-brand-500"}`}
                        >
                          <Check size={9} className="text-white" strokeWidth={3} />
                        </span>
                        <div className="min-w-0">
                          <p className="font-body text-xs sm:text-sm font-bold text-brand-900 capitalize leading-snug">
                            {String(t.status).replace(/_/g, " ")}
                          </p>
                          {t.note && <p className="font-body text-xs text-amber-500 mt-0.5">{t.note}</p>}
                          <p className="font-body text-[10px] text-gray-400 mt-1">{fmtDate(t.createdAt)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </div>
        )}

        {isDelivered && (
          <div className="card p-4 sm:p-5 space-y-4">
            <p className="font-body text-xs font-semibold text-amber-800 uppercase tracking-wider border-b border-amber-100/30 pb-3">Rate Your Experience</p>
            <div className="space-y-4">
              {(order.items || []).map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                  <span className="font-body font-medium text-brand-900 line-clamp-1">{item.productName}</span>
                  {reviewedProductIds.has(item.productId) ? (
                    <span className="font-body text-xs text-green-600 font-semibold flex items-center gap-1 shrink-0">
                      <Check size={11} /> Reviewed
                    </span>
                  ) : (
                    <button
                      onClick={() => setReviewItem(item)}
                      className="font-body text-xs text-white bg-sandal-600 hover:bg-sandal-700 font-semibold py-1.5 px-3 rounded-lg shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Star size={11} className="fill-amber-300 text-amber-300" /> Write Review
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delivery address */}
        <div className="card p-4 sm:p-5 space-y-3">
          <p className="font-body text-xs font-semibold text-amber-800 uppercase tracking-wider border-b border-amber-100/30 pb-3">Delivery Address</p>
          <div>
            <p className="font-body text-sm font-bold text-brand-900">{order.customerName}</p>
            {order.customerPhone && (
              <p className="font-body text-xs text-amber-700 font-semibold mt-0.5">{order.customerPhone}</p>
            )}
            <p className="font-body text-xs text-amber-600 mt-2 leading-relaxed">
              {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""},&nbsp;
              {addr.city}, {addr.state} – {addr.pincode}
            </p>
          </div>
        </div>

        {/* Price details */}
        <div className="card p-4 sm:p-5 space-y-3">
          <p className="font-body text-xs font-semibold text-amber-800 uppercase tracking-wider border-b border-amber-100/30 pb-3">Price Details</p>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between font-body text-amber-700">
              <span>Subtotal</span><span className="font-num font-semibold">{rupee(order.subtotal)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between font-body text-green-600">
                <span>Discount</span><span className="font-num font-semibold">−{rupee(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-body text-amber-700">
              <span>Delivery</span>
              <span className="font-num font-semibold">{Number(order.deliveryCharge) === 0 ? "FREE" : rupee(order.deliveryCharge)}</span>
            </div>
            <div className="flex justify-between font-body font-bold text-brand-900 text-base border-t border-amber-100 pt-2.5">
              <span>Total Amount</span><span className="font-num font-bold">{rupee(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Cancel order */}
        {canCancel && (
          <div className="pt-2">
            {cancelError && (
              <p className="font-body text-xs text-red-600 mb-2 text-center">{cancelError}</p>
            )}
            <button
              onClick={handleCancelOrder}
              disabled={cancelOrderMutation.isPending}
              className="btn-md w-full flex items-center justify-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-60 rounded-xl"
            >
              {cancelOrderMutation.isPending
                ? <><Loader2 size={14} className="animate-spin" /> Cancelling…</>
                : <><X size={14} /> Cancel Order</>
              }
            </button>
          </div>
        )}

        {/* actions (replacement request) */}
        {(canRequestReplacement || replacementRequested) && (
          <div className="pt-2">
            {canRequestReplacement && (
              <button
                onClick={() => setShowReplacementModal(true)}
                disabled={!isWithin24Hours}
                className={`btn-md flex items-center gap-1.5 w-full justify-center sm:w-auto ${
                  isWithin24Hours
                    ? "btn-outline cursor-pointer"
                    : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                }`}
                title={!isWithin24Hours ? "Replacement requests are only allowed within 24 hours of delivery" : ""}
              >
                <RotateCcw size={13} /> Request Replacement {!isWithin24Hours && "(Expired)"}
              </button>
            )}
            {replacementRequested && (
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex items-center justify-center text-xs text-amber-800 font-semibold gap-1.5">
                <Check size={14} className="text-green-600" /> Replacement requested
              </div>
            )}
          </div>
        )}

        {showReplacementModal && (
          <ReplacementModal
            orderId={order.id}
            onClose={() => setShowReplacementModal(false)}
            onSuccess={() => {
              setReplacementRequested(true);
              // Optimistically update selected order status locally
              setSelectedOrder((prev) => ({ ...prev, status: "replacement_requested" }));
              setShowReplacementModal(false);
            }}
          />
        )}

        {reviewItem && (
          <ReviewModal
            item={reviewItem}
            onClose={() => setReviewItem(null)}
            onReviewed={() => setReviewedProductIds((prev) => new Set([...prev, reviewItem.productId]))}
          />
        )}
      </div>
    );
  }

  return (
    <div className="page-wrap py-8">
      <h1 className="font-display text-2xl font-bold text-brand-900 mb-6">My Orders</h1>

      {/* success banner for new order */}
      {newOrderId && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-3.5 mb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <Package size={15} className="text-green-600" />
          </div>
          <div>
            <p className="font-body text-sm font-semibold text-green-800">Order placed successfully!</p>
            <p className="font-body text-xs text-green-600">Order #{String(newOrderId).slice(0, 8).toUpperCase()} confirmed.</p>
          </div>
        </div>
      )}

      {/* filter tabs */}
      <div className="hidden sm:flex gap-1 bg-amber-50 p-1 rounded-xl mb-5 w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`font-body text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer ${
              filter === f.key ? "bg-white text-brand-900 shadow-sm" : "text-amber-600 hover:text-brand-800"
            }`}
          >
            {f.label}
            {f.key !== "all" && (
              <span className="ml-1 font-num">
                ({orders.filter((o) => {
                  if (f.key === "active")    return !["delivered","cancelled","replacement_completed"].includes(o.status);
                  if (f.key === "delivered") return o.status === "delivered";
                  if (f.key === "cancelled") return ["cancelled","replacement_completed"].includes(o.status);
                  return false;
                }).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <OrderSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingBag size={48} className="text-amber-200 mb-4" />
          <h2 className="font-display text-xl font-bold text-brand-900 mb-2">No orders yet</h2>
          <p className="font-body text-amber-500 text-sm mb-6 max-w-xs">
            {filter === "all" ? "You haven't placed any orders yet." : `No ${filter} orders.`}
          </p>
          <Link to="/products" className="btn-lg btn-primary">Browse Products <ArrowRight size={16} /></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => <OrderCard key={o.id} order={o} onClick={() => handleSelectOrder(o)} />)}
        </div>
      )}
    </div>
  );
}