import { useState, useEffect } from "react";
import {
  AlertTriangle, PackageX, Save, X, RefreshCw,
} from "lucide-react";
import { apiFetch, API_URL } from "../../ApiCall/Api.jsx";
import { useAuthStore } from "../../components/store/AuthStore";

const INVENTORY_BASE = `${API_URL}/inventory`;
const inventoryApi = {
  list: (params = "", token) =>
    apiFetch(`${INVENTORY_BASE}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  update: (variantId, data, token) =>
    apiFetch(`${INVENTORY_BASE}/${variantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),
};
import {
  AdminPage, StatusBadge, AdminButton, SearchBar, AdminCard, StatCard,
} from "../../components/admin/AdminUI.jsx";
import TableFormat from "../../components/admin/TableFormat.jsx";

const rupee = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);

import comboImg from "../../assets/products/combo.jpg";

const PH = comboImg;

function stockBadge(qty) {
  if (qty === 0)  return <span className="badge-red">Out of stock</span>;
  if (qty <= 5)   return <span className="badge-orange">Low · {qty}</span>;
  if (qty <= 20)  return <span className="badge-amber">{qty} units</span>;
  return <span className="badge-green">{qty} units</span>;
}

// ── Inline stock edit cell ─────────────────────────────────────────────
function StockEditCell({ item, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val,     setVal]     = useState(item.stockQty);
  const [saving,  setSaving]  = useState(false);
  const { token } = useAuthStore();

  const handleSave = async () => {
    const num = Number(val);
    if (isNaN(num) || num < 0) return;
    setSaving(true);
    try {
      await inventoryApi.update(item.variantId, { stockQty: num }, token);
      onSave(item.variantId, num);
      setEditing(false);
    } catch (e) { alert(e.message || "Failed"); }
    finally { setSaving(false); }
  };

  const handleCancel = () => { setVal(item.stockQty); setEditing(false); };

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        {stockBadge(item.stockQty)}
        <button
          onClick={() => setEditing(true)}
          className="font-body text-xs text-brand-700 hover:underline ml-1"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={0}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-20 border border-amber-200 rounded-lg px-2 py-1 text-sm font-num focus:outline-none focus:ring-2 focus:ring-amber-400/30"
        autoFocus
        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
      >
        <Save size={13} />
      </button>
      <button
        onClick={handleCancel}
        className="p-1.5 bg-gray-50 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// INVENTORY MANAGEMENT PAGE
// ══════════════════════════════════════════════════════════════════════
export default function InventoryManagement() {
  const { token } = useAuthStore();
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("all"); // all | low | out
  const [page,      setPage]      = useState(1);
  const [totalPages,setTotalPages]= useState(1);
  const [refreshing,setRefreshing]= useState(false);

  const load = async (showRefresh = false) => {
    showRefresh ? setRefreshing(true) : setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filter === "low") params.set("lowStock", "true");
    if (filter === "out") params.set("outOfStock", "true");
    params.set("page", page); params.set("limit", 20);
    try {
      const res = await inventoryApi.list(params.toString(), token);
      setItems(res.inventory || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (_) {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, [search, filter, page, token]);

  const patchStock = (variantId, newQty) =>
    setItems((prev) => prev.map((i) => i.variantId === variantId ? { ...i, stockQty: newQty } : i));

  // summary stats
  const outOfStock  = items.filter((i) => i.stockQty === 0).length;
  const lowStock    = items.filter((i) => i.stockQty > 0 && i.stockQty <= 5).length;
  const totalValue  = items.reduce((s, i) => s + i.price * i.stockQty, 0);

  const COLS = [
    {
      key: "product", label: "Product",
      render: (r) => (
        <div className="flex items-center gap-3">
          <img
            src={r.primaryImage || PH} alt={r.productName}
            className="w-10 h-10 rounded-xl object-cover bg-amber-50 shrink-0 border border-amber-100"
            onError={(e) => { e.target.src = PH; }}
          />
          <div>
            <p className="font-body text-sm font-semibold text-gray-900 line-clamp-1">{r.productName}</p>
            <p className="font-body text-xs text-gray-400">{r.categoryName}</p>
          </div>
        </div>
      ),
    },
    { key: "weightLabel", label: "Variant",  render: (r) => <span className="font-num text-sm text-gray-700">{r.weightLabel}</span> },
    {
      key: "sku", label: "SKU",
      render: (r) => <span className="font-num text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">{r.sku || "—"}</span>,
    },
    { key: "price",  label: "Price",  render: (r) => <span className="font-num text-sm font-semibold text-gray-900">{rupee(r.price)}</span> },
    {
      key: "stockQty", label: "Stock",
      render: (r) => <StockEditCell item={r} onSave={patchStock} />,
    },
    {
      key: "value", label: "Stock Value",
      render: (r) => <span className="font-num text-sm text-gray-600">{rupee(r.price * r.stockQty)}</span>,
    },
  ];

  return (
    <AdminPage
      title="Inventory"
      sub="Track stock levels and update quantities"
      action={
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 font-body text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      }
    >

      {/* summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminCard className="flex items-center gap-3 py-3.5">
          <div className="p-2 rounded-xl bg-red-50"><PackageX size={16} className="text-red-500" /></div>
          <div>
            <p className="font-num text-xl font-bold text-gray-900 leading-none">{outOfStock}</p>
            <p className="font-body text-xs text-gray-500 mt-0.5">Out of Stock</p>
          </div>
        </AdminCard>
        <AdminCard className="flex items-center gap-3 py-3.5">
          <div className="p-2 rounded-xl bg-orange-50"><AlertTriangle size={16} className="text-orange-500" /></div>
          <div>
            <p className="font-num text-xl font-bold text-gray-900 leading-none">{lowStock}</p>
            <p className="font-body text-xs text-gray-500 mt-0.5">Low Stock (≤5)</p>
          </div>
        </AdminCard>
        <AdminCard className="flex items-center gap-3 py-3.5 sm:col-span-2">
          <div className="p-2 rounded-xl bg-green-50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div>
            <p className="font-num text-xl font-bold text-gray-900 leading-none">{rupee(totalValue)}</p>
            <p className="font-body text-xs text-gray-500 mt-0.5">Total Stock Value (shown page)</p>
          </div>
        </AdminCard>
      </div>

      {/* filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search product, SKU…" className="w-56" />

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {[
            { key: "all", label: "All" },
            { key: "low", label: "Low Stock" },
            { key: "out", label: "Out of Stock" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPage(1); }}
              className={`font-body text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                filter === f.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <TableFormat columns={COLS} rows={items} loading={loading} emptyText="No inventory items found." />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <AdminButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</AdminButton>
          <span className="font-body text-sm text-gray-600">Page {page} of {totalPages}</span>
          <AdminButton variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</AdminButton>
        </div>
      )}
    </AdminPage>
  );
}