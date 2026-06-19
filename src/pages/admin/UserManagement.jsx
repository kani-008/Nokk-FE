import { useState, useEffect } from "react";
import { UserX, UserCheck, Mail, Phone, X, AlertTriangle } from "lucide-react";
import { userApi }      from "../../ApiCall/Api.jsx";
import { useAuthStore } from "../../components/store/AuthStore";
import {
  AdminPage, DataTable, StatusBadge, AdminButton, SearchBar, AdminCard,
} from "../../components/admin/AdminUI.jsx";

import comboImg from "../../assets/products/combo.jpg";

const PH_AVATAR = comboImg;
const fmtDate   = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ── User detail drawer ─────────────────────────────────────────────────
function UserDrawer({ user, onClose, onBlock, onUnblock }) {
  const { token } = useAuthStore();
  const [acting, setActing] = useState(false);
  const [error,  setError]  = useState("");

  if (!user) return null;

  const isBlocked = user.status === "blocked";

  const handleToggle = async () => {
    setActing(true); setError("");
    try {
      if (isBlocked) {
        await userApi.unblock(user.id, token);
        onUnblock(user.id);
      } else {
        await userApi.block(user.id, token);
        onBlock(user.id);
      }
      onClose();
    } catch (e) {
      setError(e.message || "Action failed");
    } finally { setActing(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white shadow-2xl flex flex-col h-full">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-display text-base font-bold text-gray-900">User Details</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">

          {/* avatar + name */}
          <div className="flex items-center gap-4">
            <img
              src={user.avatarUrl || PH_AVATAR} alt={user.fullName}
              className="w-14 h-14 rounded-full object-cover bg-amber-50 border-2 border-amber-100"
              onError={(e) => { e.target.src = PH_AVATAR; }}
            />
            <div>
              <p className="font-body text-base font-bold text-gray-900">{user.fullName || user.name}</p>
              <StatusBadge status={user.role || "customer"} />
              <span className="ml-1.5"><StatusBadge status={user.status || "active"} /></span>
            </div>
          </div>

          {/* contact info */}
          <AdminCard>
            <p className="font-body text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-body text-sm text-gray-700">
                <Mail  size={14} className="text-gray-400 shrink-0" />
                <span>{user.email || "—"}</span>
                {user.emailVerified && <span className="badge-green ml-auto">Verified</span>}
              </div>
              <div className="flex items-center gap-2 font-body text-sm text-gray-700">
                <Phone size={14} className="text-gray-400 shrink-0" />
                <span>{user.phone || "—"}</span>
                {user.phoneVerified && <span className="badge-green ml-auto">Verified</span>}
              </div>
            </div>
          </AdminCard>

          {/* account info */}
          <AdminCard>
            <p className="font-body text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Account</p>
            <div className="space-y-1.5 text-sm font-body">
              <div className="flex justify-between text-gray-700">
                <span className="text-gray-400">Joined</span>
                <span>{fmtDate(user.createdAt)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span className="text-gray-400">Total Orders</span>
                <span className="font-num font-semibold">{user.orderCount ?? "—"}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span className="text-gray-400">Total Spent</span>
                <span className="font-num font-semibold">
                  {user.totalSpent
                    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(user.totalSpent)
                    : "—"}
                </span>
              </div>
            </div>
          </AdminCard>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 font-body text-xs rounded-xl px-3 py-2.5">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* action */}
          {user.role !== "admin" && (
            <AdminButton
              variant={isBlocked ? "primary" : "danger"}
              onClick={handleToggle}
              disabled={acting}
            >
              {isBlocked
                ? <><UserCheck size={14} /> {acting ? "Unblocking…" : "Unblock User"}</>
                : <><UserX    size={14} /> {acting ? "Blocking…"   : "Block User"}</>
              }
            </AdminButton>
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
  const { token } = useAuthStore();
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [status,     setStatus]     = useState("");
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected,   setSelected]   = useState(null);

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (roleFilter)      params.set("role",   roleFilter);
    if (status)          params.set("status", status);
    params.set("page", page); params.set("limit", 15);
    try {
      const res = await userApi.all(params.toString(), token);
      setUsers(res.users || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (_) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [debouncedSearch, roleFilter, status, page, token]);

  const patchStatus = (id, newStatus) =>
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: newStatus } : u));

  const COLS = [
    {
      key: "name", label: "User",
      render: (r) => (
        <div className="flex items-center gap-3">
          <img
            src={r.avatarUrl || PH_AVATAR} alt={r.fullName}
            className="w-9 h-9 rounded-full object-cover bg-amber-50 shrink-0 border border-amber-100"
            onError={(e) => { e.target.src = PH_AVATAR; }}
          />
          <div>
            <p className="font-body text-sm font-semibold text-gray-900">{r.fullName || r.name}</p>
            <p className="font-body text-xs text-gray-400">{r.email}</p>
          </div>
        </div>
      ),
    },
    { key: "phone",     label: "Phone",   render: (r) => <span className="font-num text-sm text-gray-600">{r.phone || "—"}</span> },
    { key: "role",      label: "Role",    render: (r) => <StatusBadge status={r.role || "customer"} /> },
    { key: "status",    label: "Status",  render: (r) => <StatusBadge status={r.status || "active"} /> },
    { key: "createdAt", label: "Joined",  render: (r) => <span className="font-body text-xs text-gray-400">{fmtDate(r.createdAt)}</span> },
    {
      key: "action", label: "", width: "60px",
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
    <AdminPage title="Users" sub="Manage customer accounts and permissions">

      <div className="flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search name, email, phone…" className="w-56" />

        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="field-input w-36">
          <option value="">All roles</option>
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </select>

        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="field-input w-36">
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>

        {(search || roleFilter || status) && (
          <button onClick={() => { setSearch(""); setRoleFilter(""); setStatus(""); setPage(1); }} className="flex items-center gap-1.5 font-body text-sm text-gray-500 hover:text-red-500">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      <DataTable columns={COLS} rows={users} loading={loading} emptyText="No users found." />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <AdminButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</AdminButton>
          <span className="font-body text-sm text-gray-600">Page {page} of {totalPages}</span>
          <AdminButton variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</AdminButton>
        </div>
      )}

      {selected && (
        <UserDrawer
          user={selected}
          onClose={() => setSelected(null)}
          onBlock={(id) => patchStatus(id, "blocked")}
          onUnblock={(id) => patchStatus(id, "active")}
        />
      )}
    </AdminPage>
  );
}