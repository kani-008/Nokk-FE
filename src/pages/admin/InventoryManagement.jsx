import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { PackageX, RefreshCw, CheckCircle } from "lucide-react";
import { useInventoryList, useUpdateStock } from "../../hooks/queries/useInventory";
import { AdminPage, AdminButton, AdminCard } from "../../components/admin/AdminUI.jsx";
import TableFormat from "../../components/admin/TableFormat.jsx";
import Toggle from "../../components/admin/Toggle.jsx";
import Dropdown from "../../components/admin/Dropdown.jsx";

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

/**
 * ── Mobile-only fluid sizing for the Refresh / Filter cluster ──
 * Same approach and same verified minimum values as ProductManagement.jsx's
 * Clear/Filter/Add Product cluster (see that file for the full rationale):
 * Tailwind's static utilities only change value AT the md breakpoint, so
 * clamp() is used instead to shrink padding/font-size/width continuously
 * down to small phones without ever truncating the filter label or wrapping
 * to a second line. Verified with a headless-browser measurement pass
 * against "Out of Stock" (the longer of the two filter options) from 320px
 * to 375px viewport width — this row has fewer items than Products' row, so
 * the same minimums carry plenty of margin here.
 *
 * Wrapped in `@media (max-width: 767.98px)` so it never applies at md+
 * widths; desktop keeps its exact original fixed Tailwind sizing untouched.
 */
const MOBILE_FLUID_STYLES = `
  @media (max-width: 767.98px) {
    .inv-filter-wrap-fluid {
      width: clamp(9.5rem, 30vw, 10.5rem) !important;
    }
    .inv-filter-fluid {
      padding-left: clamp(0.6rem, 2.6vw, 0.875rem) !important;
      padding-right: clamp(0.6rem, 2.6vw, 0.875rem) !important;
      padding-top: clamp(0.45rem, 1.6vw, 0.625rem) !important;
      padding-bottom: clamp(0.45rem, 1.6vw, 0.625rem) !important;
      font-size: clamp(0.75rem, 2.8vw, 0.875rem) !important;
      gap: clamp(0.3rem, 1vw, 0.5rem) !important;
    }
    .inv-filter-fluid span.truncate {
      overflow: visible !important;
      text-overflow: unset !important;
      white-space: nowrap !important;
    }
    .inv-refresh-fluid {
      font-size: clamp(0.7rem, 2.6vw, 0.875rem) !important;
      gap: clamp(0.2rem, 1vw, 0.375rem) !important;
    }
    .inv-refresh-fluid svg {
      width: clamp(12px, 2.8vw, 14px);
      height: clamp(12px, 2.8vw, 14px);
    }
    .inv-cluster-fluid {
      gap: clamp(0.3rem, 1.4vw, 0.75rem);
    }
    .inv-stats-fluid {
      gap: clamp(0.4rem, 1.8vw, 1rem) !important;
    }
  }
`;

// ── Inline stock edit cell ─────────────────────────────────────────────
function StockEditCell({ item, queryParams }) {
  const updateStockMutation = useUpdateStock(queryParams);
  const saving = updateStockMutation.isPending;

  const handleToggle = async () => {
    const nextInStock = !(item.stockQty > 0);
    try {
      await updateStockMutation.mutateAsync({ variantId: item.variantId, inStock: nextInStock });
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Failed to update stock");
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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | out
  const [page, setPage] = useState(1);

  // ── Hand this page's search state to AdminLayout's shared topbar search,
  // same pattern as ProductManagement.jsx. No separate search input is
  // rendered in the page body anymore.
  const { registerSearch, unregisterSearch } = useOutletContext();

  useEffect(() => {
    registerSearch({ placeholder: "Search product, SKU…", value: search, onChange: setSearch });
    return () => unregisterSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const queryParams = useMemo(() => {
    const p = { page, limit: 20 };
    if (search) p.search = search;
    if (filter === "out") p.outOfStock = "true";
    if (filter === "in") p.inStock = "true";
    return p;
  }, [search, filter, page]);

  const { data, isLoading: loading, isFetching, refetch } = useInventoryList(queryParams);
  const items = data?.inventory || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const refreshing = isFetching && !loading;

  // summary stats
  const outOfStock = items.filter((i) => i.stockQty === 0).length;
  const inStock    = items.filter((i) => i.stockQty > 0).length;
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
          <div className="min-w-0">
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
      render: (r) => <StockEditCell item={r} queryParams={queryParams} />,
    },
    {
      key: "value", label: "Stock Value",
      render: (r) =>
        <span className="font-num text-sm text-gray-600">{rupee(r.price * r.stockQty)}</span>,
    },
  ];

  return (
    <AdminPage className="space-y-3">
      <style>{MOBILE_FLUID_STYLES}</style>

      {/* summary cards — row 1 */}
      <div className="inv-stats-fluid grid grid-cols-2 sm:grid-cols-4 gap-4">
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
        <AdminCard className="flex items-center gap-3 py-3.5 col-span-2 sm:col-span-2">
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

      {/* Refresh -> Filter — single cluster, right-aligned, above the table,
          always on one line. Search now lives in the topbar (see
          AdminLayout, same pattern as ProductManagement.jsx). On mobile, the
          filter dropdown and Refresh button shrink smoothly via clamp()
          instead of jumping at a breakpoint or wrapping. Desktop sizing is
          untouched. */}
      <div className="inv-cluster-fluid flex items-center justify-end gap-3 w-full">
        <button
          onClick={() => refetch()}
          disabled={refreshing}
          className="inv-refresh-fluid flex items-center gap-1.5 font-body text-sm text-gray-500 hover:text-gray-800 transition-colors shrink-0 disabled:opacity-60"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>

        <div className="inv-filter-wrap-fluid w-40 sm:w-44 shrink-0">
          <Dropdown
            value={filter}
            onChange={(v) => { setFilter(v); setPage(1); }}
            placeholder="All"
            options={[
              { value: "all", label: "All" },
              { value: "out", label: "Out of Stock" },
              { value: "in", label: "In Stock" },
            ]}
            className="inv-filter-fluid"
          />
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