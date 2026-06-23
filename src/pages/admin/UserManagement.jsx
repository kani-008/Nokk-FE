import { useState, useEffect, useRef } from "react";
import { UserX, UserCheck, Mail, Phone, X, AlertTriangle, Trash2, ChevronDown } from "lucide-react";
import { apiFetch, API_URL } from "../../ApiCall/Api.jsx";

const USER_BASE = `${API_URL}/users`;
const userApi = {
  all: (params = "", token) =>
    apiFetch(`${USER_BASE}/get-all?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  block: (id, token) =>
    apiFetch(`${USER_BASE}/toggle-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status: "blocked" }),
    }),

  unblock: (id, token) =>
    apiFetch(`${USER_BASE}/toggle-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status: "active" }),
    }),

  remove: (id, token) =>
    apiFetch(`${USER_BASE}/delete-user`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    }),
};
import { useAuthStore } from "../../components/store/AuthStore";
import {
  AdminPage, StatusBadge, AdminButton, SearchBar, AdminCard,
} from "../../components/admin/AdminUI.jsx";
import TableFormat from "../../components/admin/TableFormat.jsx";

import comboImg from "../../assets/products/combo.jpg";

const PH_AVATAR = comboImg;
const fmtDate   = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ── Custom Dropdown for Admin filters ─────────────────────────────────
function CustomDropdown({ value, onChange, options, placeholder, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between rounded-xl border-[1.5px] border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 outline-none transition-all duration-200 focus:border-sandal-400 focus:ring-2 focus:ring-sandal-400/15 cursor-pointer h-[34px] sm:h-[38px] sm:text-sm sm:px-4 sm:py-2"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 shrink-0 ml-1.5 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-30 animate-in fade-in slide-in-from-top-1 duration-150">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer hover:bg-sandal-50 hover:text-sandal-800 ${
                opt.value === value ? "bg-sandal-50/70 text-sandal-700 font-semibold" : "text-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── User detail modal ─────────────────────────────────────────────────
function UserModal({ user, onClose, onBlock, onUnblock, onDelete }) {
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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this user account? This action cannot be undone.")) return;
    setActing(true); setError("");
    try {
      await userApi.remove(user.id, token);
      onDelete(user.id);
      onClose();
    } catch (e) {
      setError(e.message || "Delete failed");
    } finally { setActing(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-modal-fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-modal-slide-up">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
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
            <div className="min-w-0 flex-1">
              <p className="font-body text-base font-bold text-gray-900 truncate">{user.fullName || user.name}</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <StatusBadge status={user.role || "customer"} />
                <StatusBadge status={user.status || "active"} />
              </div>
            </div>
          </div>

          {/* contact info */}
          <AdminCard>
            <p className="font-body text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-body text-sm text-gray-700 min-w-0">
                <Mail  size={14} className="text-gray-400 shrink-0" />
                <span className="truncate flex-1">{user.email || "—"}</span>
                {user.emailVerified && <span className="badge-green shrink-0">Verified</span>}
              </div>
              <div className="flex items-center gap-2 font-body text-sm text-gray-700 min-w-0">
                <Phone size={14} className="text-gray-400 shrink-0" />
                <span className="truncate flex-1">{user.phone || "—"}</span>
                {user.phoneVerified && <span className="badge-green shrink-0">Verified</span>}
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
              <span className="break-words flex-1">{error}</span>
            </div>
          )}

          {/* action */}
          {user.role !== "admin" && (
            <div className="flex gap-3 pt-2">
              <AdminButton
                variant={isBlocked ? "primary" : "outline"}
                onClick={handleToggle}
                disabled={acting}
                className="flex-1"
              >
                {isBlocked
                  ? <><UserCheck size={14} /> {acting ? "Unblocking…" : "Unblock"}</>
                  : <><UserX    size={14} /> {acting ? "Blocking…"   : "Block"}</>
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
  const { token } = useAuthStore();
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
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
    setError("");
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (roleFilter)      params.set("role",   roleFilter);
    if (status)          params.set("status", status);
    params.set("page", page); params.set("limit", 15);
    try {
      const res = await userApi.all(params.toString(), token);
      setUsers(res.users || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (e) {
      setError(e.message || "Failed to load users");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [debouncedSearch, roleFilter, status, page, token]);

  const patchStatus = (id, newStatus) =>
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: newStatus } : u));

  const COLS = [
    {
      key: "name", label: "Name",
      render: (r) => (
        <div className="flex items-center gap-3">
          {/* <img
            src={r.avatarUrl || PH_AVATAR} alt={r.fullName}
            className="w-9 h-9 rounded-full object-cover bg-amber-50 shrink-0 border border-amber-100"
            onError={(e) => { e.target.src = PH_AVATAR; }}
          /> */}
          <span className="font-body text-sm font-semibold text-gray-900">{r.fullName || r.name || "—"}</span>
        </div>
      ),
    },
    { key: "email",     label: "Email",   render: (r) => <span className="font-body text-sm text-gray-600">{r.email || "—"}</span> },
    { key: "phone",     label: "Phone",   render: (r) => <span className="font-num text-sm text-gray-600">{r.phone || "—"}</span> },
    { key: "role",      label: "Role",    render: (r) => <StatusBadge status={r.role || "customer"} /> },
    { key: "status",    label: "Status",  render: (r) => <StatusBadge status={r.status || "active"} /> },
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
    <AdminPage title="Users" sub="Manage customer accounts and permissions">

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Search name, email, phone…" className="w-[56%] sm:w-230" />

        <CustomDropdown
          value={roleFilter}
          onChange={(val) => { setRoleFilter(val); setPage(1); }}
          options={[
            { value: "", label: "All" },
            { value: "customer", label: "Customer" },
            { value: "admin", label: "Admin" },
          ]}
          placeholder="All"
          className="w-[20%] sm:w-36"
        />

        <CustomDropdown
          value={status}
          onChange={(val) => { setStatus(val); setPage(1); }}
          options={[
            { value: "", label: "All" },
            { value: "active", label: "Active" },
            { value: "blocked", label: "Blocked" },
          ]}
          placeholder="All"
          className="w-[20%] sm:w-36"
        />

        {(search || roleFilter || status) && (
          <button onClick={() => { setSearch(""); setRoleFilter(""); setStatus(""); setPage(1); }} className="flex items-center gap-1.5 font-body text-sm text-gray-500 hover:text-red-500 transition-colors">
            <X size={14} /> Clear
          </button>
        )}
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
          onBlock={(id) => patchStatus(id, "blocked")}
          onUnblock={(id) => patchStatus(id, "active")}
          onDelete={(id) => {
            setUsers((prev) => prev.filter((u) => u.id !== id));
            setSelected(null);
          }}
        />
      )}
    </AdminPage>
  );
}