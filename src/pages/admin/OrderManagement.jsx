import { useState, useMemo, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  X, Eye, RotateCcw, Check, Ban, Loader2,
  Package, MapPin, CreditCard, Clock,
} from "lucide-react";
import {
  useAdminOrders,
  useAdminReplacements,
  useUpdateOrderStatus,
  useUpdateReplacementStatus
} from "../../hooks/queries/useOrders";


import comboImg from "../../assets/products/combo.jpg";
import {
  AdminPage, StatusBadge, AdminButton, AdminCard,
} from "../../components/admin/AdminUI.jsx";
import TableFormat from "../../components/admin/TableFormat.jsx";
import Dropdown from "../../components/admin/Dropdown.jsx";

const rupee = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const ALL_STATUSES = [
  "pending","confirmed","processing","shipped",
  "out_for_delivery","delivered","cancelled",
  "replacement_requested","replacement_approved",
  "replacement_rejected","replacement_completed",
];

const PAYMENT_STATUSES = ["pending", "paid"];

const MOBILE_FLUID_STYLES = `
  @media (max-width: 767.98px) {
    .ord-filter-fluid {
      padding-left: clamp(0.5rem, 2vw, 0.875rem) !important;
      padding-right: clamp(0.5rem, 2vw, 0.875rem) !important;
      padding-top: clamp(0.4rem, 1.4vw, 0.625rem) !important;
      padding-bottom: clamp(0.4rem, 1.4vw, 0.625rem) !important;
      font-size: clamp(0.656rem, 2.4vw, 0.875rem) !important;
      gap: clamp(0.2rem, 0.8vw, 0.5rem) !important;
    }
    .ord-clear-fluid {
      font-size: clamp(0.65rem, 2.4vw, 0.75rem);
      padding-left: clamp(0.1rem, 0.6vw, 0.25rem);
      padding-right: clamp(0.1rem, 0.6vw, 0.25rem);
      gap: clamp(0.1rem, 0.6vw, 0.25rem);
    }
    .ord-clear-fluid svg {
      width: clamp(10px, 2.6vw, 14px);
      height: clamp(10px, 2.6vw, 14px);
    }
    .ord-cluster-fluid {
      gap: clamp(0.25rem, 1.2vw, 0.75rem);
    }
    .ord-tabs-fluid {
      font-size: clamp(0.72rem, 2.6vw, 0.875rem) !important;
      padding-left: clamp(0.6rem, 2.4vw, 1rem) !important;
      padding-right: clamp(0.6rem, 2.4vw, 1rem) !important;
      padding-top: clamp(0.4rem, 1.4vw, 0.5rem) !important;
      padding-bottom: clamp(0.4rem, 1.4vw, 0.5rem) !important;
    }
    .ord-filter-fluid svg {
      width: clamp(10px, 2.4vw, 14px) !important;
      height: clamp(10px, 2.4vw, 14px) !important;
    }
    .ord-filter-fluid span {
      font-size: clamp(0.656rem, 2.4vw, 0.875rem) !important;
    }
    .ord-filter-fluid + ul li {
      padding-left: clamp(0.5rem, 2vw, 0.875rem) !important;
      padding-right: clamp(0.5rem, 2vw, 0.875rem) !important;
      padding-top: clamp(0.4rem, 1.4vw, 0.625rem) !important;
      padding-bottom: clamp(0.4rem, 1.4vw, 0.625rem) !important;
      font-size: clamp(0.656rem, 2.4vw, 0.875rem) !important;
      gap: clamp(0.2rem, 0.8vw, 0.5rem) !important;
    }
  }
  @media (min-width: 768px) and (max-width: 1023.98px) {
    .ord-filter-fluid {
      padding-left: clamp(0.875rem, 2vw, 1rem) !important;
      padding-right: clamp(0.875rem, 2vw, 1rem) !important;
      padding-top: clamp(0.625rem, 1vw, 0.75rem) !important;
      padding-bottom: clamp(0.625rem, 1vw, 0.75rem) !important;
      font-size: clamp(0.875rem, 1.2vw, 0.95rem) !important;
      gap: clamp(0.5rem, 1vw, 0.625rem) !important;
    }
    .ord-clear-fluid {
      font-size: clamp(0.75rem, 1vw, 0.85rem) !important;
      padding-left: clamp(0.25rem, 0.8vw, 0.375rem) !important;
      padding-right: clamp(0.25rem, 0.8vw, 0.375rem) !important;
      gap: clamp(0.25rem, 0.8vw, 0.375rem) !important;
    }
    .ord-clear-fluid svg {
      width: clamp(14px, 1.8vw, 16px) !important;
      height: clamp(14px, 1.8vw, 16px) !important;
    }
    .ord-cluster-fluid {
      gap: clamp(0.75rem, 1.5vw, 1rem) !important;
    }
    .ord-tabs-fluid {
      font-size: clamp(0.875rem, 1.2vw, 0.95rem) !important;
      padding-left: clamp(1rem, 2vw, 1.25rem) !important;
      padding-right: clamp(1rem, 2vw, 1.25rem) !important;
      padding-top: clamp(0.5rem, 1vw, 0.625rem) !important;
      padding-bottom: clamp(0.5rem, 1vw, 0.625rem) !important;
    }
    .ord-filter-fluid svg {
      width: clamp(14px, 1.8vw, 16px) !important;
      height: clamp(14px, 1.8vw, 16px) !important;
    }
    .ord-filter-fluid span {
      font-size: clamp(0.875rem, 1.2vw, 0.95rem) !important;
    }
    .ord-filter-fluid + ul li {
      padding-left: clamp(0.875rem, 2vw, 1rem) !important;
      padding-right: clamp(0.875rem, 2vw, 1rem) !important;
      padding-top: clamp(0.625rem, 1vw, 0.75rem) !important;
      padding-bottom: clamp(0.625rem, 1vw, 0.75rem) !important;
      font-size: clamp(0.875rem, 1.2vw, 0.95rem) !important;
      gap: clamp(0.5rem, 1vw, 0.625rem) !important;
    }
  }
  @media (min-width: 1024px) and (max-width: 1439.98px) {
    .ord-filter-fluid {
      padding-left: clamp(1rem, 1.5vw, 1.25rem) !important;
      padding-right: clamp(1rem, 1.5vw, 1.25rem) !important;
      padding-top: clamp(0.75rem, 0.8vw, 0.875rem) !important;
      padding-bottom: clamp(0.75rem, 0.8vw, 0.875rem) !important;
      font-size: clamp(0.95rem, 1vw, 1.05rem) !important;
      gap: clamp(0.625rem, 0.8vw, 0.75rem) !important;
    }
    .ord-clear-fluid {
      font-size: clamp(0.85rem, 0.8vw, 0.95rem) !important;
      padding-left: clamp(0.375rem, 0.6vw, 0.5rem) !important;
      padding-right: clamp(0.375rem, 0.6vw, 0.5rem) !important;
      gap: clamp(0.375rem, 0.6vw, 0.5rem) !important;
    }
    .ord-clear-fluid svg {
      width: clamp(16px, 1.4vw, 18px) !important;
      height: clamp(16px, 1.4vw, 18px) !important;
    }
    .ord-cluster-fluid {
      gap: clamp(1rem, 1.2vw, 1.25rem) !important;
    }
    .ord-tabs-fluid {
      font-size: clamp(0.95rem, 1vw, 1.05rem) !important;
      padding-left: clamp(1.25rem, 1.5vw, 1.5rem) !important;
      padding-right: clamp(1.25rem, 1.5vw, 1.5rem) !important;
      padding-top: clamp(0.625rem, 0.8vw, 0.75rem) !important;
      padding-bottom: clamp(0.625rem, 0.8vw, 0.75rem) !important;
    }
    .ord-filter-fluid svg {
      width: clamp(16px, 1.4vw, 18px) !important;
      height: clamp(16px, 1.4vw, 18px) !important;
    }
    .ord-filter-fluid span {
      font-size: clamp(0.95rem, 1vw, 1.05rem) !important;
    }
    .ord-filter-fluid + ul li {
      padding-left: clamp(1rem, 1.5vw, 1.25rem) !important;
      padding-right: clamp(1rem, 1.5vw, 1.25rem) !important;
      padding-top: clamp(0.75rem, 0.8vw, 0.875rem) !important;
      padding-bottom: clamp(0.75rem, 0.8vw, 0.875rem) !important;
      font-size: clamp(0.95rem, 1vw, 1.05rem) !important;
      gap: clamp(0.625rem, 0.8vw, 0.75rem) !important;
    }
  }
`;

// ── Order detail modal ────────────────────────────────────────────────
function OrderModal({ order, onClose, onStatusChange }) {
  const [newStatus, setNewStatus] = useState(order?.status || "");
  const [trackData, setTrackData] = useState({ courierName: order?.courierName || "", trackingNumber: order?.trackingNumber || "" });

  const updateStatusMutation = useUpdateOrderStatus();
  const saving = updateStatusMutation.isPending;

  if (!order) return null;

  const handleStatusSave = async () => {
    if (newStatus === order.status) return;
    try {
      await updateStatusMutation.mutateAsync({ id: order.id, status: newStatus, ...trackData });
      onStatusChange(order.id, newStatus);
      onClose();
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Failed to update status");
    }
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

// ── Replacements panel ────────────────────────────────────────────────
function ReplacementsPanel() {
  const [filter,  setFilter]  = useState("requested");
  const [busyIdState, setBusyIdState] = useState(null);

  const queryParams = useMemo(() => {
    return filter ? { status: filter } : {};
  }, [filter]);

  const { data: replacementsData, isLoading: loading } = useAdminReplacements(queryParams);
  const items = replacementsData?.replacements || [];

  const updateReplacementMutation = useUpdateReplacementStatus();
  const busyId = updateReplacementMutation.isPending ? busyIdState : null;

  const act = async (requestId, status) => {
    if (status === "completed" && !confirm("This will create a NEW zero-cost order with the same items and mark the original as replacement_completed. Continue?")) return;
    setBusyIdState(requestId);
    try {
      const res = await updateReplacementMutation.mutateAsync({ requestId, status });
      if (status === "completed" && res.newOrderId) {
        alert(`Replacement order ${res.newOrderId} created successfully.`);
      }
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Failed to update replacement request");
    } finally {
      setBusyIdState(null);
    }
  };

  const FILTERS = [
    { key: "requested", label: "Pending" },
    { key: "approved",  label: "Approved" },
    { key: "rejected",  label: "Rejected" },
    { key: "completed", label: "Completed" },
    { key: "",          label: "All" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-50 p-1 rounded-xl w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.key || "all"}
            onClick={() => setFilter(f.key)}
            className={`font-body text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors ${
              filter === f.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="font-body text-sm text-gray-400 text-center py-10">Loading…</p>
      ) : items.length === 0 ? (
        <p className="font-body text-sm text-gray-400 text-center py-10">No replacement requests found.</p>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <AdminCard key={r.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-body text-sm font-bold text-gray-900">Order #{String(r.order_id).slice(0, 8).toUpperCase()}</p>
                  <p className="font-body text-xs text-gray-500 mt-0.5">{r.customer_name} · {r.customer_phone}</p>
                  <p className="font-body text-xs text-gray-400 mt-0.5">{fmtDate(r.created_at)}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>

              <div className="mt-3 font-body text-sm space-y-1.5">
                <p className="text-gray-700"><span className="font-semibold text-gray-500">Reason:</span> {r.reason}</p>
                {r.details && <p className="text-gray-500 text-xs">{r.details}</p>}
                {r.new_order_id && (
                  <p className="text-green-700 text-xs font-semibold">
                    Replacement order created: #{String(r.new_order_id).slice(0, 8).toUpperCase()}
                  </p>
                )}
              </div>

              {r.status === "requested" && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <AdminButton size="sm" onClick={() => act(r.id, "approved")} disabled={busyId === r.id}>
                    {busyId === r.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Approve
                  </AdminButton>
                  <AdminButton size="sm" variant="outline" onClick={() => act(r.id, "rejected")} disabled={busyId === r.id}>
                    <Ban size={13} /> Reject
                  </AdminButton>
                </div>
              )}
              {r.status === "approved" && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <AdminButton size="sm" onClick={() => act(r.id, "completed")} disabled={busyId === r.id}>
                    {busyId === r.id ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Mark Item Received & Complete
                  </AdminButton>
                </div>
              )}
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ORDER MANAGEMENT PAGE
// ══════════════════════════════════════════════════════════════════════
export default function OrderManagement() {
  const [tab, setTab] = useState("orders");
  const [search,    setSearch]    = useState("");
  const [status,    setStatus]    = useState("");
  const [payment,   setPayment]   = useState("");
  const [page,      setPage]      = useState(1);
  const [selected,  setSelected]  = useState(null);

  const { registerSearch, unregisterSearch } = useOutletContext();

  useEffect(() => {
    if (tab !== "orders") { unregisterSearch(); return; }
    registerSearch({ placeholder: "Search order ID, customer…", value: search, onChange: setSearch });
    return () => unregisterSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tab]);

  const queryParams = useMemo(() => {
    const params = { page, limit: 15 };
    if (search)  params.search        = search;
    if (status)  params.status        = status;
    if (payment) params.paymentStatus = payment;
    return params;
  }, [search, status, payment, page]);

  const { data: ordersData, isLoading: loading } = useAdminOrders(queryParams);
  const orders = ordersData?.orders || [];
  const totalPages = ordersData?.pagination?.totalPages || 1;

  const handleStatusChange = () => {};

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
    <AdminPage className="space-y-3">
      <style>{MOBILE_FLUID_STYLES}</style>

      {/* Row 1 (mobile) / left side (desktop): top-level tabs — Orders / Replacements */}
      {/* Row 2 (mobile) / right side (desktop): Status -> Payment -> Clear filters,
          rendered inline in the same flex row as the tabs on desktop (justify-between),
          but stacked onto its own row below the tabs on mobile (flex-col -> sm:flex-row),
          exactly matching the Clear/Filter/Add-Product cluster pattern used on
          Products/Inventory. On mobile, dropdown width/padding/font-size shrink
          smoothly via clamp() instead of jumping at a breakpoint.
          `items-center` (not just `sm:items-center`) horizontally centers both
          rows as blocks on mobile — without it they default to stretch/left,
          since the tabs pill is `w-fit` and the cluster is `w-full justify-end`,
          neither of which centers the row itself within the page. */}
      <div className="flex flex-col items-center gap-2.5 sm:flex-row sm:items-center sm:justify-between w-full">
        <div className="flex gap-1 bg-gray-50 p-1 rounded-xl w-full sm:w-fit shrink-0">
          <button
            onClick={() => setTab("orders")}
            className={`ord-tabs-fluid flex-1 sm:flex-none font-body text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
              tab === "orders" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setTab("replacements")}
            className={`ord-tabs-fluid flex-1 sm:flex-none font-body text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              tab === "replacements" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <RotateCcw size={13} /> Replacements
          </button>
        </div>

        {tab === "orders" && (
          <div className="ord-cluster-fluid flex items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="ord-clear-fluid flex items-center gap-1.5 font-body text-sm text-gray-500 hover:text-red-500 transition-colors shrink-0 px-1"
              >
                <X size={14} /> Clear
              </button>
            )}

            <div className="flex-1 sm:w-40 sm:shrink-0">
              <Dropdown
                value={status}
                onChange={(v) => { setStatus(v); setPage(1); }}
                placeholder="All Statuses"
                options={[
                  { value: "", label: "All Statuses" },
                  ...ALL_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") })),
                ]}
                className="ord-filter-fluid"
                optionClassName="ord-filter-fluid"
              />
            </div>

            <div className="flex-1 sm:w-40 sm:shrink-0">
              <Dropdown
                value={payment}
                onChange={(v) => { setPayment(v); setPage(1); }}
                placeholder="All Payment Status"
                options={[
                  { value: "", label: "All Payment Status" },
                  ...PAYMENT_STATUSES.map((m) => ({ value: m, label: m.toUpperCase() })),
                ]}
                className="ord-filter-fluid"
                optionClassName="ord-filter-fluid"
              />
            </div>
          </div>
        )}
      </div>

      {tab === "replacements" ? (
        <ReplacementsPanel />
      ) : (
        <>
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
        </>
      )}
    </AdminPage>
  );
}