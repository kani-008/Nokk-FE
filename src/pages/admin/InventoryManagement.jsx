import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, PackageX, RefreshCw, CheckCircle } from "lucide-react";
import API from "../../ApiCall/Api.jsx";
import { useAuthStore } from "../../components/store/AuthStore";
import { AdminPage, AdminButton, SearchBar, AdminCard, } from "../../components/admin/AdminUI.jsx";
import TableFormat from "../../components/admin/TableFormat.jsx";
import Toggle from "../../components/admin/Toggle.jsx";

const rupee = (n) =>
  new Intl.NumberFormat("en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }
  ).format(Number(n) || 0);

import comboImg from "../../assets/products/combo.jpg";

const PH = comboImg;

// ── Inline stock edit cell ─────────────────────────────────────────────
function StockEditCell({ item, onSave }) {
  const [saving, setSaving] = useState(false);

  const handleToggle = async () => {
    const nextInStock = !(item.stockQty > 0);
    setSaving(true);
    try {
      await API.put("/inventory/update-stock", {
        variantId: item.variantId,
        inStock: nextInStock,
      });
      onSave(item.variantId, nextInStock ? 1 : 0);
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Failed to update stock");
    } finally {
      setSaving(false);
    }
  };

  const isInStock = item.stockQty > 0;

  return (
    <div className="flex items-center gap-1.5">
      <Toggle checked={isInStock} onChange={handleToggle} disabled={saving} />
      <span className={`font-body text-xs font-semibold select-none ${isInStock ? "text-green-600" : "text-red-500"}`}>
        {isInStock ? "In Stock" : "OOS"}
      </span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// INVENTORY MANAGEMENT PAGE
// ══════════════════════════════════════════════════════════════════════
export default function InventoryManagement() {
  const { token } = useAuthStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | out
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    setTimeout(() => {
      showRefresh ? setRefreshing(true) : setLoading(true);
    }, 0);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filter === "out") params.set("outOfStock", "true");
    params.set("page", page); params.set("limit", 20);
    try {
      const response = await API.get(`/inventory/get-inventory?${params.toString()}`);
      console.log(response.data);
      setItems(response.data.inventory || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, filter, page, token]);

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  const patchStock = (variantId, newQty) =>
    setItems((prev) => prev.map((i) => i.variantId === variantId ? { ...i, stockQty: newQty } : i));

  // summary stats
  const outOfStock = items.filter((i) => i.stockQty === 0).length;
  const inStock = items.filter((i) => i.stockQty > 0).length;
  const totalValue = items.reduce((s, i) => s + i.price * i.stockQty, 0);

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
            <p className="font-body text-sm font-semibold text-gray-900 line-clamp-1">
              {r.productName}</p>
            <p className="font-body text-xs text-gray-400">{r.categoryName}</p>
          </div>
        </div>
      ),
    },
    {
      key: "weightLabel", label: "Variant", render: (r) =>
        <span className="font-num text-sm text-gray-700">{r.weightLabel}</span>
    },
    {
      key: "sku", label: "SKU",
      render: (r) => <span className="font-num text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">{r.sku || "—"}</span>,
    },
    {
      key: "price", label: "Price", render: (r) =>
        <span className="font-num text-sm font-semibold text-gray-900">{rupee(r.price)}</span>
    },
    {
      key: "stockQty", label: "Stock",
      render: (r) => <StockEditCell item={r} onSave={patchStock} />,
    },
    {
      key: "value", label: "Stock Value",
      render: (r) =>
        <span className="font-num text-sm text-gray-600">{rupee(r.price * r.stockQty)}</span>,
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
          <div className="p-2 rounded-xl bg-green-50"><CheckCircle size={16} className="text-green-500" /></div>
          <div>
            <p className="font-num text-xl font-bold text-gray-900 leading-none">{inStock}</p>
            <p className="font-body text-xs text-gray-500 mt-0.5">In Stock</p>
          </div>
        </AdminCard>
        <AdminCard className="flex items-center gap-3 py-3.5">
          <div className="p-2 rounded-xl bg-red-50"><PackageX size={16} className="text-red-500" /></div>
          <div>
            <p className="font-num text-xl font-bold text-gray-900 leading-none">{outOfStock}</p>
            <p className="font-body text-xs text-gray-500 mt-0.5">Out of Stock</p>
          </div>
        </AdminCard>
        <AdminCard className="flex items-center gap-3 py-3.5 sm:col-span-2">
          <div className="p-2 rounded-xl bg-green-50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <p className="font-num text-xl font-bold text-gray-900 leading-none">{rupee(totalValue)}</p>
            <p className="font-body text-xs text-gray-500 mt-0.5">Total Stock Value (shown page)</p>
          </div>
        </AdminCard>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3 w-full">
        <div className="w-full sm:w-[600px]">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search product, SKU…" className="w-full" />
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-auto sm:flex-1">
          {[
            { key: "all", label: "All" },
            { key: "out", label: "Out of Stock" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPage(1); }}
              className={`font-body text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-lg transition-colors flex-1 text-center whitespace-nowrap ${filter === f.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
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