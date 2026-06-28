import { Fragment, useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { PackageX, RefreshCw, CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useInventoryList, useUpdateStock, useBulkUpdateStock } from "../../hooks/queries/useInventory";
import { AdminPage, AdminButton, AdminCard } from "../../components/admin/AdminUI.jsx";
import Toggle from "../../components/admin/Toggle.jsx";
import Dropdown from "../../components/admin/Dropdown.jsx";

const rupee = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

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

// ── Inline stock toggle cell ───────────────────────────────────────────
function StockEditCell({ item, queryParams, disabled }) {
  const updateStockMutation = useUpdateStock(queryParams);
  const saving = updateStockMutation.isPending || disabled;

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

// ── Product-level stock status badge ──────────────────────────────────
function StatusBadge({ variants }) {
  const inCount = variants.filter((v) => v.stockQty > 0).length;
  const total = variants.length;

  if (inCount === 0)
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-body bg-red-50 text-red-600 whitespace-nowrap">
        Out of Stock
      </span>
    );
  if (inCount === total)
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-body bg-green-50 text-green-600 whitespace-nowrap">
        In Stock
      </span>
    );
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-body bg-amber-50 text-amber-600 whitespace-nowrap">
      Partial ({inCount}/{total})
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════
// INVENTORY MANAGEMENT PAGE
// ══════════════════════════════════════════════════════════════════════
export default function InventoryManagement() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | out | in
  const [page, setPage] = useState(1);
  const [expandedKey, setExpandedKey] = useState(null);

  const { registerSearch, unregisterSearch } = useOutletContext();

  useEffect(() => {
    registerSearch({ placeholder: "Search product…", value: search, onChange: setSearch });
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

  const bulkUpdateStockMutation = useBulkUpdateStock(queryParams);
  const bulkSaving = bulkUpdateStockMutation.isPending;

  const handleParentToggle = async (product) => {
    const inCount = product.variants.filter((v) => v.stockQty > 0).length;
    const total = product.variants.length;
    const nextInStock = inCount < total; // toggles everything to in stock if partial or OOS

    const updates = product.variants.map((v) => ({
      variantId: v.variantId,
      inStock: nextInStock,
    }));

    try {
      await bulkUpdateStockMutation.mutateAsync({ updates });
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Failed to update stock");
    }
  };

  const { data, isLoading: loading, isFetching, refetch } = useInventoryList(queryParams);
  const items = useMemo(() => data?.inventory || [], [data?.inventory]);
  const totalPages = data?.pagination?.totalPages || 1;
  const refreshing = isFetching && !loading;

  // Group flat variant rows by product
  const products = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const key = item.productId ?? item.nameEn;
      if (!map.has(key)) {
        map.set(key, {
          key,
          nameEn: item.nameEn,
          categoryName: item.categoryName,
          primaryImage: item.primaryImage,
          variants: [],
        });
      }
      map.get(key).variants.push(item);
    });
    const list = Array.from(map.values());
    // Sort products alphabetically by nameEn to prevent shifting
    list.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
    
    // Sort variants within each product by weightGrams
    list.forEach((p) => {
      p.variants.sort((a, b) => (a.weightGrams || 0) - (b.weightGrams || 0));
    });

    return list;
  }, [items]);

  const toggleExpand = (key) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  // Summary stats (variant-level)
  const outOfStock = items.filter((i) => i.stockQty === 0).length;
  const inStock    = items.filter((i) => i.stockQty > 0).length;
  const totalValue = items.reduce((s, i) => s + i.price * i.stockQty, 0);

  return (
    <AdminPage className="space-y-3">

      {/* Refresh + Filter cluster */}
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
              { value: "all",  label: "All" },
              { value: "out", label: "Out of Stock" },
              { value: "in",  label: "In Stock" },
            ]}
            className="inv-filter-fluid"
            optionClassName="inv-filter-fluid"
          />
        </div>
      </div>

      {/* Summary cards */}
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

      {/* Master-detail expandable table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 px-4 py-3.5 border-b border-gray-50 last:border-0">
                  {[1, 2, 3, 4, 5].map((c) => (
                    <div key={c} className="h-4 skeleton rounded flex-1" />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              {/* Parent-level header */}
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="w-10 px-4 py-3" />
                  <th className="px-4 py-3 text-left font-body text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left font-body text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Variants
                  </th>
                  <th className="px-4 py-3 text-left font-body text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Total Value
                  </th>
                  <th className="px-4 py-3 text-left font-body text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="font-body text-center py-16 text-gray-400 text-sm">
                      No inventory items found.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const isOpen = expandedKey === product.key;
                    const totalProductValue = product.variants.reduce(
                      (s, v) => s + v.price * v.stockQty,
                      0
                    );
                    return (
                      <Fragment key={product.key}>
                        {/* ── Parent row ── */}
                        <tr
                          className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors duration-100 cursor-pointer select-none"
                          onClick={() => toggleExpand(product.key)}
                        >
                          <td className="px-4 py-3 align-middle text-gray-400">
                            {isOpen
                              ? <ChevronDown size={15} className="text-gray-500" />
                              : <ChevronRight size={15} />}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.primaryImage || PH}
                                alt={product.nameEn}
                                className="w-10 h-10 rounded-xl object-cover bg-amber-50 shrink-0 border border-amber-100"
                                onError={(e) => { e.target.src = PH; }}
                              />
                              <div className="min-w-0">
                                <p className="font-body text-sm font-semibold text-gray-900 line-clamp-1">
                                  {product.nameEn}
                                </p>
                                <p className="font-body text-xs text-gray-400">{product.categoryName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <span className="font-body text-sm text-gray-500">
                              {product.variants.length}{" "}
                              {product.variants.length === 1 ? "variant" : "variants"}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <span className="font-num text-sm font-semibold text-gray-900">
                              {rupee(totalProductValue)}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="flex items-center gap-3.5" onClick={(e) => e.stopPropagation()}>
                              <Toggle
                                checked={product.variants.filter((v) => v.stockQty > 0).length === product.variants.length}
                                onChange={() => handleParentToggle(product)}
                                disabled={bulkSaving}
                              />
                              <StatusBadge variants={product.variants} />
                            </div>
                          </td>
                        </tr>

                        {/* ── Expanded variant detail section ── */}
                        {isOpen && (
                          <tr className={products[products.length - 1].key !== product.key ? "border-b border-gray-100" : ""}>
                            <td colSpan={5} className="p-0">
                              <div className="bg-gray-50/60 animate-expand">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-100">
                                      <th className="w-10" />
                                      <th className="px-4 py-2.5 text-left font-body text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                        Variant
                                      </th>
                                      <th className="px-4 py-2.5 text-left font-body text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                        Price
                                      </th>
                                      <th className="px-4 py-2.5 text-left font-body text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                        Stock
                                      </th>
                                      <th className="px-4 py-2.5 text-left font-body text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                        Stock Value
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {product.variants.map((variant) => (
                                      <tr
                                        key={variant.variantId}
                                        className="border-b border-gray-100 last:border-0 hover:bg-white/60 transition-colors"
                                      >
                                        <td className="w-10 pl-4">
                                          <div className="w-px h-8 bg-gray-200 mx-auto" />
                                        </td>
                                        <td className="px-4 py-3 align-middle">
                                          <span className="font-num text-sm text-gray-700">
                                            {variant.weightLabel}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 align-middle">
                                          <span className="font-num text-sm font-semibold text-gray-900">
                                            {rupee(variant.price)}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 align-middle">
                                          <StockEditCell item={variant} queryParams={queryParams} disabled={bulkSaving} />
                                        </td>
                                        <td className="px-4 py-3 align-middle">
                                          <span className="font-num text-sm text-gray-600">
                                            {rupee(variant.price * variant.stockQty)}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <AdminButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </AdminButton>
          <span className="font-body text-sm text-gray-600">Page {page} of {totalPages}</span>
          <AdminButton variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </AdminButton>
        </div>
      )}
    </AdminPage>
  );
}
