import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Package, ShoppingBag, ArrowRight, Star, ChevronRight, ClipboardList
} from "lucide-react";
import { useMyOrders } from "../hookqueries/useOrders";
import OrderDetail from "../components/orders/OrderDetail";
import SEO from "../components/seo/SEO.jsx";

const rupee = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

// ── Status helpers ──────────────────────────────────────────────────────
const getStatusTitle = (status, date) => {
  const formatted = date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "";
  switch (status) {
    case "delivered":              return `Delivered on ${formatted}`;
    case "cancelled":              return `Cancelled on ${formatted}`;
    case "replacement_completed":  return "Replacement Completed";
    case "replacement_requested":  return "Replacement Requested";
    case "replacement_approved":   return "Replacement Approved";
    case "replacement_rejected":   return "Replacement Rejected";
    case "pending":                return `Ordered on ${formatted}`;
    case "confirmed":              return `Confirmed on ${formatted}`;
    case "processing":             return `Processing on ${formatted}`;
    case "shipped":                return `Shipped on ${formatted}`;
    case "out_for_delivery":       return "Out for Delivery";
    default:
      return String(status).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
};

// ── Order card ──────────────────────────────────────────────────────────
function OrderCard({ order, isSelected, onClick, onWriteReviewClick }) {
  const firstItem  = order.items?.[0] || {};
  const itemImg    = firstItem.imageUrl || firstItem.image || null;
  const itemName   = firstItem.productName || "Order";
  const hasMore    = order.items?.length > 1;
  const moreCount  = order.items?.length - 1;

  const statusTitle  = getStatusTitle(order.status, order.updatedAt || order.createdAt);
  const subtitleText = itemName + (hasMore ? ` (+${moreCount} more)` : "");
  const isDelivered  = order.status === "delivered";

  return (
    <div
      onClick={onClick}
      className={`card flex flex-col px-4 lg:px-5 py-4 cursor-pointer transition-colors ${
        isSelected
          ? "bg-amber-50 border-l-4 border-l-sandal-600 ring-1 ring-sandal-200"
          : "hover:bg-amber-50/50"
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3 min-w-0">
          {itemImg ? (
            <img
              src={itemImg}
              alt={itemName}
              className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl object-cover bg-amber-50 shrink-0 border border-amber-100"
            />
          ) : (
            <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-sandal-50 text-brand-850 flex items-center justify-center shrink-0 border border-sandal-100 text-xl font-bold">
              📦
            </div>
          )}
          <div className="min-w-0 flex-1">
            {/* Mobile */}
            <div className="block lg:hidden">
              <h3 className="font-body text-xs font-bold text-gray-900 leading-snug">{statusTitle}</h3>
              <p className="font-body text-[11px] text-gray-500 mt-1 line-clamp-1">{subtitleText}</p>
            </div>
            {/* Desktop */}
            <div className="hidden lg:block">
              <h3 className="font-body text-sm font-semibold text-brand-900 leading-snug line-clamp-1">{itemName}</h3>
              {hasMore && (
                <p className="font-body text-[10px] text-amber-500 font-medium mt-0.5">
                  +{moreCount} more item{moreCount > 1 ? "s" : ""}
                </p>
              )}
              <p className="font-body text-[10px] text-gray-400 mt-1">{fmtDate(order.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-2">
          <div className="text-right mr-1 hidden lg:block">
            <p className="font-num text-sm font-bold text-brand-900">{rupee(order.total)}</p>
            <p className="font-body text-[10px] text-amber-500 capitalize">{order.paymentMethod}</p>
          </div>
          <ChevronRight
            size={16}
            className={`transition-colors ${isSelected ? "text-sandal-600" : "text-amber-400"}`}
          />
        </div>
      </div>

      {isDelivered && firstItem.productId && !firstItem.isReviewed && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="border-t border-amber-100/30 pt-3 mt-3 flex flex-col items-center justify-center cursor-default"
        >
          <div className="flex gap-2.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={(e) => { e.stopPropagation(); onWriteReviewClick?.(firstItem, s); }}
                className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
                aria-label={`Rate ${s} star`}
              >
                <Star size={20} className="fill-amber-100 text-amber-200" />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onWriteReviewClick?.(firstItem, 0); }}
            className="font-body text-xs font-semibold text-sandal-700 hover:text-brand-800 mt-1.5 transition-colors cursor-pointer"
          >
            Rate this product
          </button>
        </div>
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

// ── Empty detail placeholder (desktop) ─────────────────────────────────
function DetailPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4 border border-amber-100">
        <ClipboardList size={28} className="text-amber-300" />
      </div>
      <p className="font-display text-base font-bold text-gray-700 mb-1">Select an order</p>
      <p className="font-body text-sm text-gray-400 max-w-xs">
        Click any order on the left to see its details here.
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// MY ORDERS PAGE
// ══════════════════════════════════════════════════════════════════════
export default function MyOrders() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: orders = [], isLoading: loading } = useMyOrders();

  const [selectedOrder, setSelectedOrder] = useState(null);

  const newOrderId = location.state?.newOrderId;

  const handleWriteReview = (item, rating, orderId) => {
    navigate("/my-orders/review", {
      state: { item: { ...item, orderId }, initialRating: rating },
    });
  };

  // ── Mobile: full-page swap ───────────────────────────────────────────
  // On mobile the detail takes over the whole page; on desktop it sits in the right panel.
  const isMobileDetail = selectedOrder !== null;

  return (
    <>
      <SEO
        title="My Orders | Namma Oor Karuvattu Kadai"
        description="View your order history at Namma Oor Karuvattu Kadai. Track active order statuses and request returns."
        url="https://nammaoorkaruvattukadai.com/my-orders"
        noindex={true}
      />
      {/* ── Mobile detail view (replaces list) ─────────────────────────── */}
      {isMobileDetail && (
        <div className="lg:hidden">
          <div className="page-wrap py-2">
            <OrderDetail
              order={selectedOrder}
              onBack={() => setSelectedOrder(null)}
              onStatusUpdate={(newStatus) =>
                setSelectedOrder((prev) => ({ ...prev, status: newStatus }))
              }
            />
          </div>
        </div>
      )}

      {/* ── Main layout (list always visible on desktop) ────────────────── */}
      <div className={`${isMobileDetail ? "hidden lg:flex" : "flex"} flex-col lg:flex-row lg:items-start gap-0 lg:gap-6 page-wrap py-2 lg:py-6`}>

        {/* LEFT: order list */}
        <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 flex flex-col gap-4">
          <h2 className="font-display text-2xl font-bold text-brand-900">My Orders</h2>

          {newOrderId && (
            <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <Package size={15} className="text-green-600" />
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-green-800">Order placed successfully!</p>
                <p className="font-body text-xs text-green-600">Order #{String(newOrderId).slice(0, 8).toUpperCase()} confirmed.</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <OrderSkeleton key={i} />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ShoppingBag size={48} className="text-amber-200 mb-4" />
              <h2 className="font-display text-xl font-bold text-brand-900 mb-2">No orders yet</h2>
              <p className="font-body text-amber-500 text-sm mb-6 max-w-xs">
                You haven't placed any orders yet.
              </p>
              <Link to="/products" className="btn-lg btn-primary">
                Browse Products <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  isSelected={selectedOrder?.id === o.id}
                  onClick={() => setSelectedOrder(o)}
                  onWriteReviewClick={(item, rating) => handleWriteReview(item, rating, o.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: detail panel (desktop only) */}
        <div className="hidden lg:block flex-1 min-w-0 border border-amber-100 rounded-2xl bg-surface shadow-sm overflow-y-auto">
          {selectedOrder ? (
            <div className="p-6">
              <OrderDetail
                order={selectedOrder}
                onBack={() => setSelectedOrder(null)}
                onStatusUpdate={(newStatus) =>
                  setSelectedOrder((prev) => ({ ...prev, status: newStatus }))
                }
              />
            </div>
          ) : (
            <DetailPlaceholder />
          )}
        </div>
      </div>
    </>
  );
}
