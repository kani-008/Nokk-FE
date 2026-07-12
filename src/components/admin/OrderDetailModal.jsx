import { useState } from "react";
import { X, MapPin, CreditCard, Package, Clock } from "lucide-react";
import { useUpdateOrderStatus } from "../../hookqueries/useOrders";
import { AdminCard, StatusBadge, AdminButton } from "./AdminUI.jsx";
import Dropdown from "./Dropdown.jsx";
import IconButton from "./IconButton.jsx";

const rupee = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const ALL_STATUSES = [
  "pending", "confirmed", "processing", "shipped",
  "out_for_delivery", "delivered", "cancelled",
  "replacement_requested", "replacement_approved",
  "replacement_rejected", "replacement_completed",
];

export default function OrderDetailModal({ order, onClose, onStatusChange }) {
  const [newStatus, setNewStatus] = useState(order?.status || "");
  const [trackData, setTrackData] = useState({ courierName: order?.courierName || "", trackingNumber: order?.trackingNumber || "" });

  const updateOrderStatus = useUpdateOrderStatus();
  const saving = updateOrderStatus.isPending;

  if (!order) return null;

  const handleStatusSave = async () => {
    if (newStatus === order.status) return;
    try {
      await updateOrderStatus.mutateAsync({ id: order.id, status: newStatus, ...trackData });
      onStatusChange(order.id, newStatus);
      onClose();
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Failed to update status");
    }
  };

  const addr = order.address || {};
  const PH = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-modal-fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface admin-modal-bg rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-modal-slide-up">

        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <p className="font-body text-xs text-gray-400 mb-0.5">Order Details</p>
            <h3 className="font-display text-base font-bold text-gray-900">
              #{String(order.id).slice(0, 8).toUpperCase()}
            </h3>
          </div>
          <IconButton onClick={onClose} aria-label="Close"><X size={18} /></IconButton>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto flex-1">

          {/* status + update */}
          <AdminCard>
            <p className="font-body text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Update Status</p>
            <div className="flex gap-2 flex-wrap mb-3">
              <StatusBadge status={order.status} />
              <span className="font-body text-xs text-gray-400 self-center">→</span>
            </div>
            <Dropdown
              value={newStatus}
              onChange={setNewStatus}
              options={ALL_STATUSES.map((s) => ({
                value: s,
                label: s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              }))}
              className="mb-3"
            />

            {/* tracking fields (show when shipped/out_for_delivery) */}
            {["shipped", "out_for_delivery"].includes(newStatus) && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="field-label">Courier</label>
                  <input
                    type="text" placeholder="e.g. DTDC"
                    value={trackData.courierName}
                    onChange={(e) => setTrackData((t) => ({ ...t, courierName: e.target.value }))}
                    className="field-input"
                  />
                </div>
                <div>
                  <label className="field-label">Tracking No.</label>
                  <input
                    type="text" placeholder="AWB number"
                    value={trackData.trackingNumber}
                    onChange={(e) => setTrackData((t) => ({ ...t, trackingNumber: e.target.value }))}
                    className="field-input"
                  />
                </div>
              </div>
            )}

            <AdminButton onClick={handleStatusSave} disabled={saving || newStatus === order.status} size="sm">
              {saving ? "Saving…" : "Save Status"}
            </AdminButton>
          </AdminCard>

          {/* customer + address */}
          <AdminCard>
            <p className="font-body text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin size={13} /> Delivery Address
            </p>
            <p className="font-body text-sm font-semibold text-gray-900">{order.customerName}</p>
            <p className="font-body text-xs text-gray-500 mt-0.5">{order.customerPhone}</p>
            <p className="font-body text-xs text-gray-500 mt-1 leading-relaxed">
              {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""},&nbsp;
              {addr.city}, {addr.state} – {addr.pincode}
            </p>
          </AdminCard>

          {/* payment */}
          <AdminCard>
            <p className="font-body text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CreditCard size={13} /> Payment
            </p>
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-gray-700 capitalize">{order.paymentMethod?.toUpperCase()}</span>
              <StatusBadge status={order.paymentStatus || "pending"} />
            </div>
          </AdminCard>

          {/* items */}
          <AdminCard>
            <p className="font-body text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Package size={13} /> Items
            </p>
            <div className="space-y-3">
              {(order.items || []).map((item, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <img
                    src={item.imageUrl || item.image || PH} alt={item.productName}
                    className="w-10 h-10 rounded-xl object-cover bg-amber-50 shrink-0"
                    onError={(e) => { e.target.src = PH; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                    <p className="font-body text-xs text-gray-400">{item.weightLabel} · Qty {item.quantity}</p>
                  </div>
                  <span className="font-num text-sm font-semibold text-gray-900 shrink-0">{rupee(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </AdminCard>

          {/* totals */}
          <AdminCard>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between font-body text-gray-600">
                <span>Subtotal</span><span className="font-num">{rupee(order.subtotal)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between font-body text-green-600">
                  <span>Discount {order.couponApplied ? `(${order.couponApplied})` : ""}</span>
                  <span className="font-num">−{rupee(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-body text-gray-600">
                <span>Delivery</span>
                <span className="font-num">{Number(order.deliveryCharge) === 0 ? "FREE" : rupee(order.deliveryCharge)}</span>
              </div>
              <div className="flex justify-between font-body font-bold text-gray-900 text-base border-t border-gray-100 pt-2 mt-1">
                <span>Total</span><span className="font-num">{rupee(order.total)}</span>
              </div>
            </div>
          </AdminCard>

          {/* timeline */}
          {order.timeline?.length > 0 && (
            <AdminCard>
              <p className="font-body text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock size={13} /> Timeline
              </p>
              <div className="space-y-3">
                {order.timeline.map((t, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-700 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-body text-xs font-semibold text-gray-800 capitalize">{t.status?.replace(/_/g, " ")}</p>
                      {t.note && <p className="font-body text-xs text-gray-500">{t.note}</p>}
                      <p className="font-body text-[10px] text-gray-400 mt-0.5">{fmtDate(t.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AdminCard>
          )}
        </div>
      </div>
    </div>
  );
}
