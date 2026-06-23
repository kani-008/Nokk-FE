import { useState, useEffect, useRef } from "react";
import {
  Filter, ChevronDown, X, Eye, ExternalLink,
  Package, MapPin, CreditCard, Clock,
} from "lucide-react";
import { apiFetch, API_URL } from "../../ApiCall/Api.jsx";
import { useAuthStore } from "../../components/store/AuthStore.jsx";

const ORDER_BASE = `${API_URL}/orders`;
const orderApi = {
  all: (params = "", token) =>
    apiFetch(`${ORDER_BASE}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  updateStatus: (id, data, token) =>
    apiFetch(`${ORDER_BASE}/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),
};
import comboImg from "../../assets/products/combo.jpg";
import {
  AdminPage, StatusBadge, AdminButton, SearchBar, AdminCard,
} from "../../components/admin/AdminUI.jsx";
import TableFormat from "../../components/admin/TableFormat.jsx";

const rupee = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const ALL_STATUSES = [
  "pending","confirmed","processing","shipped",
  "out_for_delivery","delivered","cancelled",
  "return_requested","returned","refunded",
];

const PAYMENT_METHODS = ["cod", "upi", "card"];

// ── Order detail modal ────────────────────────────────────────────────
function OrderModal({ order, onClose, onStatusChange }) {
  const { token } = useAuthStore();
  const [newStatus, setNewStatus] = useState(order?.status || "");
  const [saving,    setSaving]    = useState(false);
  const [trackData, setTrackData] = useState({ courierName: order?.courierName || "", trackingNumber: order?.trackingNumber || "" });

  if (!order) return null;

  const handleStatusSave = async () => {
    if (newStatus === order.status) return;
    setSaving(true);
    try {
      await orderApi.updateStatus(order.id, { status: newStatus, ...trackData }, token);
      onStatusChange(order.id, newStatus);
      onClose();
    } catch (e) {
      alert(e.message || "Failed to update status");
    } finally { setSaving(false); }
  };

  const addr = order.address || {};
  const PH = comboImg;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-modal-fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-modal-slide-up">

        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <p className="font-body text-xs text-gray-400 mb-0.5">Order Details</p>
            <h3 className="font-display text-base font-bold text-gray-900">
              #{String(order.id).slice(0, 8).toUpperCase()}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto flex-1">

          {/* status + update */}
          <AdminCard>
            <p className="font-body text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Update Status</p>
            <div className="flex gap-2 flex-wrap mb-3">
              <StatusBadge status={order.status} />
              <span className="font-body text-xs text-gray-400 self-center">→</span>
            </div>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="field-input mb-3"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>

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

// ══════════════════════════════════════════════════════════════════════
// ORDER MANAGEMENT PAGE
// ══════════════════════════════════════════════════════════════════════
export default function OrderManagement() {
  const { token } = useAuthStore();
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [status,    setStatus]    = useState("");
  const [payment,   setPayment]   = useState("");
  const [page,      setPage]      = useState(1);
  const [totalPages,setTotalPages]= useState(1);
  const [selected,  setSelected]  = useState(null);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)  params.set("search",        search);
    if (status)  params.set("status",        status);
    if (payment) params.set("paymentMethod", payment);
    params.set("page", page);
    params.set("limit", 15);
    try {
      const res = await orderApi.all(params.toString(), token);
      setOrders(res.orders || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (_) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, status, payment, page, token]);

  const handleStatusChange = (id, newStatus) => {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: newStatus } : o));
  };

  const clearFilters = () => { setSearch(""); setStatus(""); setPayment(""); setPage(1); };
  const hasFilters = search || status || payment;

  const COLS = [
    {
      key: "id", label: "Order", width: "140px",
      render: (r) => (
        <div>
          <span className="font-num text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg block w-fit">
            #{String(r.id).slice(0, 8).toUpperCase()}
          </span>
          <span className="font-body text-[10px] text-gray-400 mt-0.5 block">{fmtDate(r.createdAt)}</span>
        </div>
      ),
    },
    {
      key: "customerName", label: "Customer",
      render: (r) => (
        <div>
          <p className="font-body text-sm font-medium text-gray-900">{r.customerName || r.user?.name || "—"}</p>
          <p className="font-body text-xs text-gray-400">{r.customerPhone || r.user?.phone || ""}</p>
        </div>
      ),
    },
    { key: "total",   label: "Amount",  width: "100px", render: (r) => <span className="font-num text-sm font-bold text-gray-900">{rupee(r.total)}</span> },
    { key: "paymentMethod", label: "Payment", width: "80px", render: (r) => <span className="font-num text-xs uppercase text-gray-500">{r.paymentMethod || "—"}</span> },
    { key: "status",  label: "Status",  width: "160px", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "action", label: "", width: "60px",
      render: (r) => (
        <button
          onClick={() => setSelected(r)}
          className="p-1.5 text-gray-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
        >
          <Eye size={15} />
        </button>
      ),
    },
  ];

  return (
    <AdminPage title="Orders" sub="Manage and track all customer orders">

      {/* filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search order ID, customer…" className="w-56" />

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="field-input w-44"
        >
          <option value="">All statuses</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>

        <select
          value={payment}
          onChange={(e) => { setPayment(e.target.value); setPage(1); }}
          className="field-input w-36"
        >
          <option value="">All payment</option>
          {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}
        </select>

        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1.5 font-body text-sm text-gray-500 hover:text-red-500 transition-colors">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      <TableFormat columns={COLS} rows={orders} loading={loading} emptyText="No orders found." />

      {/* pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <AdminButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</AdminButton>
          <span className="font-body text-sm text-gray-600">Page {page} of {totalPages}</span>
          <AdminButton variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</AdminButton>
        </div>
      )}

      {/* detail modal */}
      {selected && (
        <OrderModal order={selected} onClose={() => setSelected(null)} onStatusChange={handleStatusChange} />
      )}
    </AdminPage>
  );
}