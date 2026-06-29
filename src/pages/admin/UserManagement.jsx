import { useState, useEffect, useMemo, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import useViewportPageSize from "../../hooks/useViewportPageSize";
import { UserX, UserCheck, Mail, Phone, X, AlertTriangle, Trash2 } from "lucide-react";
import { useUserList, useToggleUserStatus, useDeleteUser, useUserDetails } from "../../hooks/queries/useUsers";
import {
  AdminPage, StatusBadge, AdminButton, AdminCard,
} from "../../components/admin/AdminUI.jsx";
import TableFormat from "../../components/admin/TableFormat.jsx";
import Dropdown from "../../components/admin/Dropdown.jsx";
import IconButton from "../../components/admin/IconButton.jsx";



const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ── User detail modal ─────────────────────────────────────────────────
function UserModal({ user, onClose, onBlock, onUnblock, onDelete }) {
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const { data: detail, isLoading: loadingDetail } = useUserDetails(user.id);
  const toggleStatusMutation = useToggleUserStatus();
  const deleteUserMutation   = useDeleteUser();


  if (!user) return null;

  const isBlocked = user.status === "blocked";

  const handleToggle = async () => {
    setActing(true); setError("");
    try {
      const newStatus = isBlocked ? "active" : "blocked";
      await toggleStatusMutation.mutateAsync({ id: user.id, status: newStatus });
      if (isBlocked) onUnblock?.(user.id);
      else           onBlock?.(user.id);
      onClose();
    } catch (e) {
      setError(e.message || "Action failed");
    } finally { setActing(false); }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this user account? This action cannot be undone.")) return;
    setActing(true); setError("");
    try {
      await deleteUserMutation.mutateAsync(user.id);
      onDelete?.(user.id);
      onClose();
    } catch (e) {
      setError(e.message || "Delete failed");
    } finally { setActing(false); }
  };

  if (loadingDetail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-modal-fade-in">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 flex flex-col items-center justify-center min-h-[300px] animate-modal-slide-up">
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-body text-gray-500">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-modal-fade-in">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 flex flex-col min-h-[250px] animate-modal-slide-up">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
            <h3 className="font-display text-base font-bold text-gray-900">Error</h3>
            <IconButton onClick={onClose} aria-label="Close"><X size={18} /></IconButton>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
            <AlertTriangle className="text-red-500 mb-2" size={32} />
            <p className="text-sm font-body text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentUser = detail?.user || user;
  const addresses = detail?.addresses || [];
  const stats = detail?.stats || { totalOrders: 0, totalSpent: 0, delivered: 0, cancelled: 0 };
  const orders = detail?.orders || [];
  const replacementRequests = detail?.replacementRequests || [];
  const hasReplacements = replacementRequests.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-modal-fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-modal-slide-up">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-display text-base font-bold text-gray-900">User Details</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Close"><X size={18} /></button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-gray-100 px-5 bg-gray-50/50 shrink-0">
          {[
            { key: "overview", label: "Overview" },
            { key: "orders", label: `Orders (${orders.length})` },
            ...(hasReplacements ? [{ key: "replacements", label: `Replacements (${replacementRequests.length})` }] : [])
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-xs sm:text-sm font-medium font-body border-b-2 -mb-[2px] transition-all cursor-pointer ${activeTab === tab.key
                  ? "border-amber-500 text-amber-950 font-bold"
                  : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">

          {activeTab === "overview" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* avatar + name */}
              <div className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-body text-base font-bold text-gray-900 truncate">{currentUser.fullName || currentUser.name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <StatusBadge status={currentUser.role || "customer"} />
                    <StatusBadge status={currentUser.status || "active"} />
                  </div>
                </div>
              </div>

              {/* contact info */}
              <AdminCard>
                <p className="font-body text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-body text-sm text-gray-700 min-w-0">
                    <Mail size={14} className="text-gray-400 shrink-0" />
                    <span className="truncate flex-1">{currentUser.email || "—"}</span>
                    {currentUser.emailVerified && <span className="badge-green shrink-0">Verified</span>}
                  </div>
                  <div className="flex items-center gap-2 font-body text-sm text-gray-700 min-w-0">
                    <Phone size={14} className="text-gray-400 shrink-0" />
                    <span className="truncate flex-1">{currentUser.phone || "—"}</span>
                    {currentUser.phoneVerified && <span className="badge-green shrink-0">Verified</span>}
                  </div>
                </div>
              </AdminCard>

              {/* account info stats */}
              <AdminCard>
                <p className="font-body text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Account Activity</p>
                <div className="grid grid-cols-2 gap-4 mb-3 border-b border-gray-50 pb-3">
                  <div className="text-center p-2 bg-gray-50 rounded-xl">
                    <span className="block font-num text-lg font-bold text-gray-900">{stats.delivered}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Delivered</span>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-xl">
                    <span className="block font-num text-lg font-bold text-gray-900">{stats.cancelled}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Cancelled</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm font-body">
                  <div className="flex justify-between text-gray-700">
                    <span className="text-gray-400">Joined</span>
                    <span>{fmtDate(currentUser.createdAt)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span className="text-gray-400">Total Orders</span>
                    <span className="font-num font-semibold">{stats.totalOrders}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span className="text-gray-400">Total Spent</span>
                    <span className="font-num font-semibold">
                      {stats.totalSpent
                        ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(stats.totalSpent)
                        : "—"}
                    </span>
                  </div>
                </div>
              </AdminCard>

              {/* Saved Addresses */}
              <AdminCard>
                <p className="font-body text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Saved Addresses</p>
                {addresses.length > 0 ? (
                  <div className="space-y-2">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="text-xs border border-gray-100 p-2.5 rounded-xl bg-gray-50/40">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-amber-950">{addr.label || "Address"}</span>
                          {addr.is_default && <span className="inline-flex items-center text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-md border border-green-200">Default</span>}
                        </div>
                        <p className="text-gray-700 font-medium">{addr.full_name} · {addr.phone}</p>
                        <p className="text-gray-500 mt-0.5 leading-relaxed">
                          {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ""}, {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">No saved addresses found.</p>
                )}
              </AdminCard>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <AdminCard className="p-0 overflow-hidden">
                {orders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-body text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Order ID</th>
                          <th className="px-4 py-2.5 text-left font-body text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-2.5 text-left font-body text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-2.5 text-left font-body text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Payment</th>
                          <th className="px-4 py-2.5 text-left font-body text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => (
                          <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-semibold text-gray-900 font-body">#{o.id}</td>
                            <td className="px-4 py-3 text-xs text-gray-500 font-body">{fmtDate(o.created_at)}</td>
                            <td className="px-4 py-3 font-semibold text-gray-950 font-num">
                              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(o.total)}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600 font-body uppercase">{o.payment_method}</td>
                            <td className="px-4 py-3 align-middle"><StatusBadge status={o.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-12 font-body">No orders found for this user.</p>
                )}
              </AdminCard>
            </div>
          )}

          {activeTab === "replacements" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {replacementRequests.map((rep) => (
                <AdminCard key={rep.id} className="border-pink-100 bg-pink-50/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-semibold text-gray-900 font-body text-sm">Order #{rep.order_id}</span>
                      <p className="text-xs text-gray-400 mt-0.5">{fmtDate(rep.created_at)}</p>
                    </div>
                    <StatusBadge status={rep.status} />
                  </div>
                  <div className="mt-3 text-xs sm:text-sm font-body space-y-2">
                    <p className="text-gray-700 leading-relaxed"><span className="font-bold text-gray-600">Reason:</span> {rep.reason}</p>
                    {rep.details && <p className="text-gray-500 leading-relaxed"><span className="font-bold text-gray-600">Details:</span> {rep.details}</p>}
                    {rep.admin_notes && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl mt-2 leading-relaxed">
                        <span className="font-bold text-amber-800">Admin Notes:</span> {rep.admin_notes}
                      </div>
                    )}
                    {rep.new_order_id && (
                      <p className="text-green-700 leading-relaxed">
                        <span className="font-bold">Replacement order created:</span> #{rep.new_order_id}
                      </p>
                    )}
                  </div>
                </AdminCard>
              ))}
            </div>
          )}

          {/* Action buttons */}
          {currentUser.role !== "admin" && (
            <div className="flex gap-3 pt-4 border-t border-gray-100 shrink-0">
              <AdminButton
                variant={isBlocked ? "primary" : "outline"}
                onClick={handleToggle}
                disabled={acting}
                className="flex-1"
              >
                {isBlocked
                  ? <><UserCheck size={14} /> {acting ? "Unblocking…" : "Unblock"}</>
                  : <><UserX size={14} /> {acting ? "Blocking…" : "Block"}</>
                }
              </AdminButton>

              <AdminButton
                variant="danger"
                onClick={handleDelete}
                disabled={acting}
                className="flex-1"
              >
                <Trash2 size={14} /> {acting ? "Deleting…" : "Delete"}
              </AdminButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// USER MANAGEMENT PAGE
// ══════════════════════════════════════════════════════════════════════
export default function UserManagement() {
  const limit = useViewportPageSize(15, 25);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const { registerSearch, unregisterSearch } = useOutletContext();

  // plug into top-bar search (same pattern as OrderManagement)
  useEffect(() => {
    registerSearch({ placeholder: "Search name, email, phone…", value: search, onChange: setSearch });
    return () => unregisterSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // debounce search → query
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const queryParams = useMemo(() => {
    const p = { page, limit };
    if (debouncedSearch) p.search = debouncedSearch;
    if (roleFilter)      p.role   = roleFilter;
    if (status)          p.status = status;
    return p;
  }, [debouncedSearch, roleFilter, status, page, limit]);

  const { data: userData, isLoading: loading, error: queryError } = useUserList(queryParams);
  const users      = userData?.users || [];
  const totalPages = userData?.pagination?.totalPages || 1;
  const error      = queryError?.message || "";




  const COLS = [
    {
      key: "name", label: "Name",
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="font-body text-sm font-semibold text-gray-900">{r.fullName || r.name || "—"}</span>
        </div>
      ),
    },
    { key: "email", label: "Email", className: "hidden md:table-cell", render: (r) => <span className="font-body text-sm text-gray-600">{r.email || "—"}</span> },
    { key: "phone", label: "Phone", render: (r) => <span className="font-num text-sm text-gray-600">{r.phone || "—"}</span> },
    { key: "role", label: "Role", render: (r) => <StatusBadge status={r.role || "customer"} /> },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status || "active"} /> },
    {
      key: "action", label: "Action", width: "60px",
      render: (r) => (
        <button
          onClick={() => setSelected(r)}
          className="font-body text-xs text-brand-700 hover:underline font-medium"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <AdminPage className="space-y-3">

      {/* Filter cluster — matches OrderManagement pattern */}
      <div className="um-cluster-fluid flex items-center justify-end gap-3 w-full">
        {(search || roleFilter || status) && (
          <button
            onClick={() => { setSearch(""); setRoleFilter(""); setStatus(""); setPage(1); }}
            className="um-clear-fluid flex items-center gap-1.5 font-body text-sm text-gray-500 hover:text-red-500 transition-colors shrink-0 px-1"
          >
            <X size={14} /> Clear
          </button>
        )}

        <div className="w-40 sm:w-44 shrink-0">
          <Dropdown
            value={roleFilter}
            onChange={(val) => { setRoleFilter(val); setPage(1); }}
            options={[
              { value: "", label: "All Roles" },
              { value: "customer", label: "Customer" },
              { value: "admin", label: "Admin" },
            ]}
            placeholder="All Roles"
            className="um-filter-fluid"
            optionClassName="um-filter-fluid"
          />
        </div>

        <div className="w-40 sm:w-44 shrink-0">
          <Dropdown
            value={status}
            onChange={(val) => { setStatus(val); setPage(1); }}
            options={[
              { value: "", label: "All Statuses" },
              { value: "active", label: "Active" },
              { value: "blocked", label: "Blocked" },
            ]}
            placeholder="All Statuses"
            className="um-filter-fluid"
            optionClassName="um-filter-fluid"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <TableFormat columns={COLS} rows={users} loading={loading} emptyText="No users found." />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <AdminButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</AdminButton>
          <span className="font-body text-sm text-gray-600">Page {page} of {totalPages}</span>
          <AdminButton variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</AdminButton>
        </div>
      )}

      {selected && (
        <UserModal
          user={selected}
          onClose={() => setSelected(null)}
          onBlock={() => {}}
          onUnblock={() => {}}
          onDelete={() => setSelected(null)}
        />
      )}
    </AdminPage>
  );
}