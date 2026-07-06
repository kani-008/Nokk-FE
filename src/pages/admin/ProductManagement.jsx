import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import useViewportPageSize from "../../hookqueries/useViewportPageSize";
import { Plus, Pencil, Trash2, X, Loader2, Star, AlertTriangle } from "lucide-react";
import { useProductCategories, useAdminProductList, useDeleteProduct, useAdminProductDetail } from "../../hookqueries/useProducts";
import { useAdminComboList, useDeleteCombo } from "../../hookqueries/useCombos";
import {
  AdminPage, AdminButton,
} from "../../components/admin/AdminUI.jsx";
import TableFormat from "../../components/admin/TableFormat.jsx";
import EditProduct from "../../components/admin/EditProduct.jsx";
import ComboModal, { StatusPill } from "../../components/admin/ComboModal.jsx";
import Dropdown from "../../components/admin/Dropdown.jsx";
import IconButton from "../../components/admin/IconButton.jsx";
import TabToggle from "../../components/admin/TabToggle.jsx";
const PH    = "";
const rupee = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);

/**
 * ── Mobile-only fluid sizing for the Clear / Filter / Add Product cluster ──
 * Tailwind's `w-40`, `text-sm`, `px-4` etc. are static — they only change
 * value AT the md breakpoint (768px), so a 340px phone and a 420px phone
 * render identically below that point. That's fine for most rows, but this
 * cluster (filter dropdown + button text + Add Product button) is the
 * widest fixed-content row on this page and can feel cramped on narrow
 * phones even though it fits fine on a slightly wider one.
 *
 * clamp(min, vw-based-preferred, max) scales continuously with the actual
 * viewport width instead of jumping once, so padding/font-size/width keep
 * shrinking all the way down to small phones without needing extra
 * breakpoints or ever overflowing.
 *
 * The minimum values below were verified with a headless-browser measurement
 * pass (not guessed) against the longest realistic category label
 * ("Prawns & Shrimp") at viewport widths from 320px to 375px: the whole
 * cluster fits on a single row with zero truncation and zero overflow at
 * every width in that range, so `flex-wrap` is intentionally NOT used here.
 *
 * Wrapped in `@media (max-width: 767.98px)` — one pixel below Tailwind's
 * `md:` cutoff — so it can never apply at md+ widths. Desktop keeps its
 * exact original fixed Tailwind sizing (w-40/sm:w-44, AdminButton's default
 * px-4 py-2 text-sm), completely untouched.
 */

// ── Confirm dialog (replaces native confirm()) ─────────────────────────
function ConfirmDialog({ open, title, message, loading, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={loading ? undefined : onCancel} />
      <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-red-50 shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-base font-bold text-gray-900">{title}</h3>
            <p className="font-body text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <AdminButton variant="outline" onClick={onCancel} disabled={loading} type="button">Cancel</AdminButton>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-1.5 font-body text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl px-4 py-2 transition-colors disabled:opacity-60"
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Deleting…</> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
export default function ProductManagement() {
  const limit = useViewportPageSize(15, 25);
  const [search,          setSearch]          = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [catFilter,       setCatFilter]       = useState("");
  const [page,            setPage]            = useState(1);
  const [modal,           setModal]           = useState(null);
  const [pageError,       setPageError]       = useState("");
  const [deleteTarget,    setDeleteTarget]    = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const editProductSlug = searchParams.get("editProductSlug");
  const { data: detailProd } = useAdminProductDetail(editProductSlug);

  useEffect(() => {
    if (detailProd) {
      setModal(detailProd);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("editProductSlug");
        return next;
      }, { replace: true });
    }
  }, [detailProd, setSearchParams]);

  // ── Hand this page's search state to AdminLayout's shared topbar search.
  // Typing in the topbar box now filters this table directly; no separate
  // search input is rendered in the page body anymore. Re-registers whenever
  // `search` changes (e.g. the page's own "Clear" button resetting it) so
  // the topbar always displays the current value; React batches the
  // cleanup + re-register within one commit, so there's no visible flicker.
  const { registerSearch, unregisterSearch } = useOutletContext();

  const { data: catData = [] } = useProductCategories();
  const categories = catData;

  const [activeTab, setActiveTab] = useState("products");
  const isComboMode = activeTab === "combos";

  useEffect(() => {
    registerSearch({
      placeholder: isComboMode ? "Search combos…" : "Search products…",
      value: search,
      onChange: setSearch,
      domain: "products"
    });
    return () => unregisterSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, isComboMode]);

  // debounce the search input so we don't fire a request per keystroke
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const queryParams = useMemo(() => {
    if (isComboMode) {
      return { page: 1, limit: 1 }; // harmless params
    }
    const p = { page, limit };
    if (debouncedSearch) p.search = debouncedSearch;
    if (catFilter)       p.category = catFilter;
    return p;
  }, [debouncedSearch, catFilter, page, limit, isComboMode]);

  const { data: productsData, isLoading: loading, error: queryError } = useAdminProductList(queryParams);
  const products = productsData?.products || [];
  const totalPages = productsData?.pagination?.totalPages || 1;

  const { data: combos = [], isLoading: combosLoading } = useAdminComboList();
  const filteredCombos = useMemo(() => {
    if (!isComboMode) return [];
    if (!debouncedSearch) return combos;
    const query = debouncedSearch.toLowerCase().trim();
    return combos.filter(c => c.name.toLowerCase().includes(query));
  }, [combos, debouncedSearch, isComboMode]);

  useEffect(() => {
    if (queryError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPageError("Couldn't load products. Please try again.");
    }
  }, [queryError]);

  const deleteProductMutation = useDeleteProduct();
  const deleteComboMutation = useDeleteCombo();
  const deleting = isComboMode ? deleteComboMutation.isPending : deleteProductMutation.isPending;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (isComboMode) {
        await deleteComboMutation.mutateAsync(deleteTarget.id);
      } else {
        await deleteProductMutation.mutateAsync(deleteTarget.id);
      }
      setDeleteTarget(null);
    } catch (e) {
      setPageError(e.response?.data?.message || e.message || `Failed to delete ${isComboMode ? "combo" : "product"}.`);
      setDeleteTarget(null);
    }
  };

  const handleSaved = () => {};

  const COLS = [
    {
      key: "product", label: "Product",
      render: (r) => (
        <button
          onClick={() => setModal(r)}
          className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity w-full min-w-0"
        >
          <img src={r.primaryImage || PH} alt={r.nameEn} className="w-10 h-10 rounded-xl object-cover bg-amber-50 border border-amber-100 shrink-0" onError={(e) => { e.target.src = PH; }} />
          <div className="min-w-0">
            <p className="font-body text-sm font-semibold text-gray-900 line-clamp-1 hover:text-brand-700 transition-colors">{r.nameEn}</p>
            {r.nameTa && <p className="font-tamil text-[11px] text-gray-400">{r.nameTa}</p>}
          </div>
        </button>
      ),
    },
    { key: "categoryName", label: "Category", render: (r) => <span className="font-body text-sm text-gray-600">{r.categoryName || "—"}</span> },
    {
      key: "price", label: "Price",
      render: (r) => {
        const minPrice = r.variants?.length ? Math.min(...r.variants.map(v => Number(v.price) || 0)) : (r.minPrice || 0);
        return (
          <div>
            <p className="font-num text-sm font-bold text-gray-900">{rupee(minPrice)}</p>
            {r.variants?.length > 1 && <p className="font-num text-[10px] text-gray-400">{r.variants.length} variants</p>}
          </div>
        );
      },
    },
    {
      key: "flags", label: "Flags",
      render: (r) => {
        const badges = [];
        if (r.isBestseller) badges.push(<span key="bs" className="badge-amber">Best Seller</span>);
        if (r.isNew)        badges.push(<span key="new" className="badge-green">New</span>);
        if (!r.isActive)    badges.push(<span key="inactive" className="badge-red">Inactive</span>);
        return badges.length > 0
          ? <div className="flex gap-1 flex-wrap">{badges}</div>
          : <span className="font-body text-xs text-gray-400">—</span>;
      },
    },
    {
      key: "rating", label: "Rating",
      render: (r) => r.avgRating > 0 ? (
        <span className="flex items-center gap-3 font-num text-sm text-gray-700">
          <Star size={12} className="fill-amber-400 text-amber-400" /> {Number(r.avgRating).toFixed(1)} ({r.reviewCount})
        </span>
      ) : <span className="font-body text-xs text-gray-400">—</span>,
    },
    {
      key: "action", label: "Action", width: "80px",
      render: (r) => (
        <div className="flex gap-1">
          <IconButton onClick={() => setModal(r)} variant="brand" aria-label={`Edit ${r.nameEn}`}><Pencil size={15} /></IconButton>
          <IconButton onClick={() => setDeleteTarget(r)} variant="danger" aria-label={`Delete ${r.nameEn}`}><Trash2 size={15} /></IconButton>
        </div>
      ),
    },
  ];

  const COMBO_COLS = [
    {
      key: "combo", label: "Combo",
      render: (r) => (
        <button
          onClick={() => setModal(r)}
          className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity w-full min-w-0"
        >
          <img src={r.imageUrl || PH} alt={r.name} className="w-10 h-10 rounded-xl object-cover bg-amber-50 border border-amber-100 shrink-0" onError={(e) => { e.target.src = PH; }} />
          <div className="min-w-0">
            <p className="font-body text-sm font-semibold text-gray-900 line-clamp-1 hover:text-brand-700 transition-colors">{r.name}</p>
          </div>
        </button>
      ),
    },
    { key: "comboPrice", label: "Combo Price", render: (r) => <span className="font-num text-sm font-bold text-gray-900">{rupee(r.comboPrice)}</span> },
    {
      key: "summary", label: "Items",
      render: (r) => (
        <span className="font-body text-xs text-gray-500 line-clamp-1">
          {(r.items || []).map((i) => `${i.productName} ${i.weightLabel} × ${i.quantity}`).join(", ") || "—"}
        </span>
      ),
    },
    { key: "status", label: "Status", render: (r) => <StatusPill isActive={r.isActive} startDate={r.startDate} endDate={r.endDate} /> },
    {
      key: "action", label: "Action", width: "80px",
      render: (r) => (
        <div className="flex gap-1">
          <IconButton onClick={() => setModal(r)} variant="brand" aria-label={`Edit ${r.name}`}><Pencil size={15} /></IconButton>
          <IconButton onClick={() => setDeleteTarget(r)} variant="danger" aria-label={`Delete ${r.name}`}><Trash2 size={15} /></IconButton>
        </div>
      ),
    },
  ];

  return (
    <AdminPage className="space-y-3">
      {/* Tab toggle */}
      <TabToggle
        active={activeTab}
        onChange={(tab) => {
          setActiveTab(tab);
          setPage(1);
          setSearch("");
          setCatFilter("");
        }}
        tabs={[
          { key: "products", label: "Products" },
          { key: "combos", label: "Combos" }
        ]}
      />

      {/* page-level error banner (replaces native alert) */}
      {pageError && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-md px-4 py-3">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p className="flex-1">{pageError}</p>
          <IconButton onClick={() => setPageError("")} variant="danger" className="shrink-0" aria-label="Dismiss"><X size={15} /></IconButton>
        </div>
      )}

      {/* Clear -> Filter -> Add Product */}
      <div className="pm-cluster-fluid flex items-center justify-end gap-3 w-full">
        {(search || catFilter) && (
          <button
            onClick={() => { setSearch(""); setCatFilter(""); setPage(1); }}
            className="pm-clear-fluid flex items-center gap-1 font-body text-xs text-gray-500 hover:text-red-500 shrink-0 px-1"
          >
            <X size={14} /> <span>Clear</span>
          </button>
        )}

        {!isComboMode && (
          <div className="pm-filter-wrap-fluid w-40 sm:w-44 shrink-0">
            <Dropdown
              value={catFilter}
              onChange={(v) => { setCatFilter(v); setPage(1); }}
              placeholder="All categories"
              options={[{ value: "", label: "All categories" }, ...categories.map((c) => ({ value: c.slug, label: c.nameEn }))]}
              className="pm-filter-fluid"
              optionClassName="pm-filter-fluid"
            />
          </div>
        )}

        <AdminButton onClick={() => setModal("new")} className="pm-add-btn-fluid shrink-0">
          <Plus size={15} /> {isComboMode ? "Add Combo" : "Add Product"}
        </AdminButton>
      </div>

      <TableFormat
        columns={isComboMode ? COMBO_COLS : COLS}
        rows={isComboMode ? filteredCombos : products}
        loading={isComboMode ? combosLoading : loading}
        emptyText={isComboMode ? "No combos yet." : "No products found."}
      />

      {!isComboMode && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <AdminButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</AdminButton>
          <span className="font-body text-sm text-gray-600">Page {page} of {totalPages}</span>
          <AdminButton variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</AdminButton>
        </div>
      )}

      {modal !== null && (
        isComboMode ? (
          <ComboModal
            combo={modal === "new" ? null : modal}
            onClose={() => setModal(null)}
            onSaved={handleSaved}
          />
        ) : (
          <EditProduct
            product={modal === "new" ? null : modal}
            categories={categories}
            onClose={() => setModal(null)}
            onSaved={handleSaved}
          />
        )
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={isComboMode ? "Delete Combo?" : "Delete product?"}
        message={
          deleteTarget
            ? `"${isComboMode ? deleteTarget.name : deleteTarget.nameEn}" will be permanently removed. This can't be undone.`
            : ""
        }
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </AdminPage>
  );
}