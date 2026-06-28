import { useState, useEffect } from "react";
import { Link, useLocation }   from "react-router-dom";
import {
  Package, ChevronDown, ChevronUp, ShoppingBag,
  MapPin, Clock, ArrowRight, X, RotateCcw, Loader2, Check,
} from "lucide-react";
import { useMyOrders, useCancelOrder, useRequestReplacement } from "../hooks/queries/useOrders";
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

// ── Order card ─────────────────────────────────────────────────────────
function OrderCard({ order }) {
  const { token }   = useAuthStore();
  const [open,      setOpen]      = useState(false);
  const [cancelled, setCancelled] = useState(order.status === "cancelled");
  const [status,    setStatus]    = useState(order.status);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [replacementRequested, setReplacementRequested] = useState(
    ["replacement_requested","replacement_approved","replacement_rejected","replacement_completed"].includes(order.status)
  );

  const canCancel  = ["pending","confirmed"].includes(status);
  const isDelivered = status === "delivered";
  const canRequestReplacement = isDelivered && !replacementRequested;
  const addr = order.address || {};

  const cancelOrderMutation = useCancelOrder();
  const cancelling = cancelOrderMutation.isPending;

  const handleCancel = async () => {
    if (!confirm("Cancel this order?")) return;
    try {
      await cancelOrderMutation.mutateAsync(order.id);
      setStatus("cancelled");
      setCancelled(true);
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Could not cancel order");
    }
  };

  return (
    <div className="card overflow-hidden">
      {/* header row */}
      <div
        className="flex items-center justify-between px-4 sm:px-5 py-4 cursor-pointer hover:bg-amber-50/50 transition-colors"
        onClick={() => setOpen((s) => !s)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
            <Package size={16} className="text-brand-700" />
          </div>
          <div className="min-w-0">
            <p className="font-num text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg inline-block mb-1">
              #{String(order.id).slice(0, 8).toUpperCase()}
            </p>
            <p className="font-body text-xs text-amber-500">{fmtDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-2">
          <div className="text-right hidden sm:block">
            <p className="font-num text-base font-bold text-brand-900">{rupee(order.total)}</p>
            <p className="font-body text-xs text-amber-500 capitalize">{order.paymentMethod}</p>
          </div>
          <StatusPill status={status} />
          {open ? <ChevronUp size={16} className="text-amber-400" /> : <ChevronDown size={16} className="text-amber-400" />}
        </div>
      </div>

      {/* expanded */}
      {open && (
        <div className="border-t border-amber-50 px-4 sm:px-5 py-4 space-y-5">

          {/* items */}
          <div className="space-y-3">
            {(order.items || []).map((item, i) => (
              <div key={i} className="flex gap-3 items-center">
                <img
                  src={item.imageUrl || item.image || PH} alt={item.productName}
                  className="w-12 h-12 rounded-xl object-cover bg-amber-50 shrink-0 border border-amber-100"
                  onError={(e) => { e.target.src = PH; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-brand-900 line-clamp-1">{item.productName}</p>
                  <p className="font-body text-xs text-amber-500">{item.weightLabel} · Qty {item.quantity}</p>
                </div>
                <span className="font-num text-sm font-semibold text-brand-900 shrink-0">{rupee(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* price breakdown */}
          <div className="bg-amber-50 rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex justify-between font-body text-amber-700">
              <span>Subtotal</span><span className="font-num">{rupee(order.subtotal)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between font-body text-green-600">
                <span>Discount</span><span className="font-num">−{rupee(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-body text-amber-700">
              <span>Delivery</span>
              <span className="font-num">{Number(order.deliveryCharge) === 0 ? "FREE" : rupee(order.deliveryCharge)}</span>
            </div>
            <div className="flex justify-between font-body font-bold text-brand-900 text-base border-t border-amber-100 pt-1.5">
              <span>Total</span><span className="font-num">{rupee(order.total)}</span>
            </div>
          </div>

          {/* address */}
          <div className="flex gap-2.5 items-start">
            <MapPin size={14} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="font-body text-xs text-amber-700 leading-relaxed">
              <span className="font-semibold">{order.customerName}</span><br />
              {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""},&nbsp;
              {addr.city}, {addr.state} – {addr.pincode}
            </p>
          </div>

          {/* tracking */}
          {order.trackingNumber && (
            <div className="flex gap-2.5 items-start">
              <Clock size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="font-body text-xs text-amber-700">
                {order.courierName && <span className="font-semibold">{order.courierName} · </span>}
                {order.trackingNumber}
                {order.trackingUrl && (
                  <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="ml-2 text-brand-700 hover:underline font-semibold">
                    Track
                  </a>
                )}
              </p>
            </div>
          )}

          {/* timeline */}
          {order.timeline?.length > 0 && (
            <div>
              <p className="font-body text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">Timeline</p>
              <div className="space-y-2">
                {order.timeline.map((t, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-body text-xs font-semibold text-brand-900 capitalize">{String(t.status).replace(/_/g, " ")}</p>
                      {t.note && <p className="font-body text-xs text-amber-500">{t.note}</p>}
                      <p className="font-body text-[10px] text-amber-400">{fmtDate(t.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* actions */}
          <div className="flex gap-2 flex-wrap border-t border-amber-50 pt-3">
            {canCancel && !cancelled && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="btn-sm btn-danger"
              >
                <X size={13} /> {cancelling ? "Cancelling…" : "Cancel Order"}
              </button>
            )}
            {canRequestReplacement && (
              <button onClick={() => setShowReplacementModal(true)} className="btn-sm btn-outline">
                <RotateCcw size={13} /> Request Replacement
              </button>
            )}
            {replacementRequested && (
              <span className="font-body text-xs text-amber-500 self-center flex items-center gap-1.5">
                <Check size={13} className="text-green-600" /> Replacement requested
              </span>
            )}
            <Link to="/products" className="btn-sm btn-ghost ml-auto">
              Buy Again <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {showReplacementModal && (
        <ReplacementModal
          orderId={order.id}
          onClose={() => setShowReplacementModal(false)}
          onSuccess={() => {
            setReplacementRequested(true);
            setStatus("replacement_requested");
            setShowReplacementModal(false);
          }}
        />
      )}
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
  const [filter,   setFilter]   = useState("all");

  const newOrderId = location.state?.newOrderId;

  const FILTERS = [
    { key: "all",      label: "All" },
    { key: "active",   label: "Active" },
    { key: "delivered",label: "Delivered" },
    { key: "cancelled",label: "Cancelled" },
  ];

  const filtered = orders.filter((o) => {
    if (filter === "all")       return true;
    if (filter === "active")    return !["delivered","cancelled","replacement_completed"].includes(o.status);
    if (filter === "delivered") return o.status === "delivered";
    if (filter === "cancelled") return ["cancelled","replacement_completed"].includes(o.status);
    return true;
  });

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
      <div className="flex gap-1 bg-amber-50 p-1 rounded-xl mb-5 w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`font-body text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors ${
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
          {filtered.map((o) => <OrderCard key={o.id} order={o} />)}
        </div>
      )}
    </div>
  );
}