import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock, ArrowRight, X, RotateCcw, Loader2, Check, Star, ArrowLeft, FileDown
} from "lucide-react";
import { useRequestReplacement } from "../../hookqueries/useOrders";
import comboImg from "../../assets/products/combo.jpg";
import ReviewPage from "./ReviewPage";
import { downloadInvoice } from "./InvoiceDownload";

export { ReviewPage as ReviewModal };

const PH = comboImg;

const rupee = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

// ── Status pill styling ──────────────────────────────────────────────────
const REPLACEMENT_REASONS = [
  "Item damaged on arrival",
  "Wrong item delivered",
  "Quality not as expected",
  "Missing item(s) in package",
  "Other",
];

// ── Replacement request modal ────────────────────────────────────────────
function ReplacementModal({ orderId, onClose, onSuccess }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");

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



// ── Review Card Subcomponent ───────────────────────────────────────────
function ReviewCard({ item, onWriteReviewClick }) {
  const [localRating, setLocalRating] = useState(0);

  const handleRateClick = (clickedRating) => {
    setLocalRating(clickedRating);
  };

  return (
    <div className="card p-4 sm:p-5 flex flex-col items-center justify-center space-y-3.5">
      <div className="flex flex-col items-center justify-center w-full">
        <p className="font-body text-xs sm:text-sm font-semibold text-brand-900 mb-2.5 text-center line-clamp-1">
          Rate the product: <span className="text-amber-800">{item.productName}</span>
        </p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleRateClick(s)}
              className="cursor-pointer transition-transform hover:scale-110 active:scale-95 animate-none"
              aria-label={`Rate ${s} star`}
            >
              <Star
                size={24}
                className={s <= localRating ? "fill-amber-400 text-amber-400" : "fill-amber-100 text-amber-200"}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onWriteReviewClick(localRating)}
          className="font-body text-xs font-semibold text-sandal-700 hover:text-brand-800 mt-2.5 transition-colors cursor-pointer"
        >
          {localRating > 0 ? "Write a Review" : "Rate this product"}
        </button>
      </div>
    </div>
  );
}





export default function OrderDetail({ order, onBack, onStatusUpdate }) {
  const navigate = useNavigate();
  const addr = order.address || {};
  const status = order.status;
  const isDelivered = status === "delivered";

  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const replacementRequested = ["replacement_requested","replacement_approved","replacement_rejected","replacement_completed"].includes(order.status);

  // 24 hours replacement limit from delivery
  const deliveryEvent = order.timeline?.find((t) => t.status === "delivered");
  const deliveryTime = deliveryEvent
    ? new Date(deliveryEvent.createdAt)
    : (status === "delivered" ? new Date(order.updatedAt || order.createdAt) : null);
  const isWithin24Hours = deliveryTime
    ? (new Date() - deliveryTime) < 24 * 60 * 60 * 1000
    : false;

  const canRequestReplacement = isDelivered && !replacementRequested;

  return (
    <div className="page-wrap py-2 space-y-2">
      {/* header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className=" hover:bg-sandal-100/50 rounded-lg text-gray-800 transition-colors cursor-pointer"
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

      {isDelivered && (order.items || []).filter(item => !item.isReviewed).length > 0 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold text-brand-900">Rate your experience</h3>
          <div className="space-y-4">
            {(order.items || []).filter(item => !item.isReviewed).map((item, i) => (
              <ReviewCard
                key={item.productId || i}
                item={item}
                onWriteReviewClick={(rating) => navigate("/my-orders/review", { state: { item: { ...item, orderId: order.id }, initialRating: rating } })}
              />
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
            {addr.taluk && addr.taluk.trim() && addr.taluk.trim().toUpperCase() !== "NA" ? `${addr.taluk.trim()}, ` : ""}
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

      {/* Payment details & Invoice (only if completed/delivered) */}
      {isDelivered && (
        <div className="card p-4 sm:p-5 space-y-3.5">
          <p className="font-body text-xs font-semibold text-amber-800 uppercase tracking-wider border-b border-amber-100/30 pb-3">
            Payment & Invoice
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
            <div className="font-body text-amber-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <span>Paid via <strong className="capitalize text-brand-900">{String(order.paymentMethod).replace(/_/g, " ")}</strong></span>
            </div>
            <button
              onClick={() => downloadInvoice(order)}
              className="btn-xs border border-sandal-300 bg-sandal-50 text-sandal-800 hover:bg-sandal-100 flex items-center gap-1.5 justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer font-semibold"
            >
              <FileDown size={14} /> Download Invoice
            </button>
          </div>
        </div>
      )}

      {/* actions (replacement request) */}
      {(canRequestReplacement || replacementRequested) && (
        <div className="pt-2">
          {canRequestReplacement && (
            <button
              onClick={() => setShowReplacementModal(true)}
              disabled={!isWithin24Hours}
              className={`btn-md flex items-center gap-1.5 w-full justify-center sm:w-auto cursor-pointer ${
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
            onStatusUpdate("replacement_requested");
            setShowReplacementModal(false);
          }}
        />
      )}

    </div>
  );
}
