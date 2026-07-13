import { useState, useMemo, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import useViewportPageSize from "../../hookqueries/useViewportPageSize";
import {
  X, Eye, RotateCcw, Check, Ban, Loader2,
  Package, MapPin, CreditCard, Clock,
} from "lucide-react";
import {
  useAdminOrders,
  useAdminReplacements,
  useUpdateOrderStatus,
  useUpdateReplacementStatus
} from "../../hookqueries/useOrders";



import {
  AdminPage, StatusBadge, AdminButton, AdminCard,
} from "../../components/admin/AdminUI.jsx";
import TableFormat from "../../components/admin/TableFormat.jsx";
import Dropdown from "../../components/admin/Dropdown.jsx";
import IconButton from "../../components/admin/IconButton.jsx";
import TabToggle from "../../components/admin/TabToggle.jsx";
import OrderDetailModal from "../../components/admin/OrderDetailModal.jsx";

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
              filter === f.key ? "bg-surface text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
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
  const limit = useViewportPageSize(15, 25);
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
    const params = { page, limit };
    if (search)  params.search        = search;
    if (status)  params.status        = status;
    if (payment) params.paymentStatus = payment;
    return params;
  }, [search, status, payment, page, limit]);

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
    {
      key: "address", label: "Address", className: "hidden md:table-cell",
      render: (r) => {
        const ad = r.address || {};
        if (!ad.addressLine1 && !ad.city) return <span className="text-gray-400">—</span>;
        return (
          <div className="max-w-[250px] text-xs text-gray-500 font-body leading-normal break-words">
            <p className="text-gray-800 font-medium">
              {ad.addressLine1}
              {ad.addressLine2 ? `, ${ad.addressLine2}` : ""}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {ad.city}, {ad.state} - {ad.pincode}
            </p>
          </div>
        );
      }
    },
    { key: "total",   label: "Amount",  width: "100px", render: (r) => <span className="font-num text-sm font-bold text-gray-900">{rupee(r.total)}</span> },
    { key: "paymentMethod", label: "Payment", width: "80px", render: (r) => <span className="font-num text-xs uppercase text-gray-500">{r.paymentMethod || "—"}</span> },
    { key: "status",  label: "Status",  width: "160px", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "action", label: "Action", width: "80px",
      render: (r) => (
        <IconButton onClick={() => setSelected(r)} variant="brand" aria-label="View order">
          <Eye size={15} />
        </IconButton>
      ),
    },
  ];

  return (
    <AdminPage className="space-y-3">

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
        <TabToggle
          tabs={[
            { key: "orders",       label: "All Orders" },
            { key: "replacements", label: "Replacements", icon: RotateCcw },
          ]}
          active={tab}
          onChange={setTab}
          tabClassName="ord-tabs-fluid"
        />

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

            <div className="w-40 sm:w-44 shrink-0">
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

            <div className="w-40 sm:w-44 shrink-0">
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
            <OrderDetailModal order={selected} onClose={() => setSelected(null)} onStatusChange={handleStatusChange} />
          )}
        </>
      )}
    </AdminPage>
  );
}
