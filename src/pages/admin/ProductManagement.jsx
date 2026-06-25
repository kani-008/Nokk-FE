import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Star, AlertTriangle } from "lucide-react";
import API from "../../ApiCall/Api.jsx";
import {
  AdminPage, AdminButton, SearchBar,
} from "../../components/admin/AdminUI.jsx";
import TableFormat from "../../components/admin/TableFormat.jsx";
import EditProduct from "../../components/admin/EditProduct.jsx";
import Dropdown from "../../components/admin/Dropdown.jsx";
import comboImg from "../../assets/products/combo.jpg";

const PH    = comboImg;
const rupee = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);

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
  const [products,        setProducts]        = useState([]);
  const [categories,      setCategories]      = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [catFilter,       setCatFilter]       = useState("");
  const [page,            setPage]            = useState(1);
  const [totalPages,      setTotalPages]      = useState(1);
  const [modal,           setModal]           = useState(null);
  const [pageError,       setPageError]       = useState("");
  const [deleteTarget,    setDeleteTarget]    = useState(null);
  const [deleting,        setDeleting]        = useState(false);

  // debounce the search input so we don't fire a request per keystroke
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await API.get("/categories/get-all");
        console.log(response.data);
        setCategories(response.data.categories || []);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const load = useCallback(async () => {
    setTimeout(() => {
      setLoading(true);
    }, 0);
    const p = new URLSearchParams();
    if (debouncedSearch) p.set("search",   debouncedSearch);
    if (catFilter)       p.set("category", catFilter);
    p.set("page", page); p.set("limit", 15);
    try {
      const response = await API.get(`/products/get-all?${p.toString()}`);
      console.log(response.data);
      const res = response.data;
      setProducts(res.products || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch {
      setPageError("Couldn't load products. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, catFilter, page]);

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await API.delete("/products/delete-product", {
        data: { id: deleteTarget.id }
      });
      console.log(response.data);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      setPageError(e.response?.data?.message || e.message || "Failed to delete product.");
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  };

  const handleSaved = (prod) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === prod.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = prod; return n; }
      return [prod, ...prev];
    });
  };

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
        <span className="flex items-center gap-1 font-num text-sm text-gray-700">
          <Star size={12} className="fill-amber-400 text-amber-400" /> {Number(r.avgRating).toFixed(1)} ({r.reviewCount})
        </span>
      ) : <span className="font-body text-xs text-gray-400">—</span>,
    },
    {
      key: "action", label: "Action", width: "80px",
      render: (r) => (
        <div className="flex gap-1">
          <button onClick={() => setModal(r)} className="p-1.5 text-gray-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors" aria-label={`Edit ${r.nameEn}`}><Pencil size={15} /></button>
          <button onClick={() => setDeleteTarget(r)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" aria-label={`Delete ${r.nameEn}`}><Trash2 size={15} /></button>
        </div>
      ),
    },
  ];

  return (
    <AdminPage title="Products" sub="Manage your product catalogue"
      action={<AdminButton onClick={() => setModal("new")}><Plus size={15} /> Add Product</AdminButton>}
    >
      {/* page-level error banner (replaces native alert) */}
      {pageError && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p className="flex-1">{pageError}</p>
          <button onClick={() => setPageError("")} className="shrink-0 hover:text-red-900" aria-label="Dismiss"><X size={15} /></button>
        </div>
      )}

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3 w-full">
        <div className="w-full sm:flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search products…" className="w-full" />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-36 shrink-0">
            <Dropdown
              value={catFilter}
              onChange={(v) => { setCatFilter(v); setPage(1); }}
              placeholder="All categories"
              options={[{ value: "", label: "All categories" }, ...categories.map((c) => ({ value: c.slug, label: c.nameEn }))]}
            />
          </div>
          {(search || catFilter) && (
            <button onClick={() => { setSearch(""); setCatFilter(""); setPage(1); }} className="flex items-center gap-1 font-body text-xs text-gray-500 hover:text-red-500 shrink-0 px-1">
              <X size={14} /> <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      <TableFormat columns={COLS} rows={products} loading={loading} emptyText="No products found." />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <AdminButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</AdminButton>
          <span className="font-body text-sm text-gray-600">Page {page} of {totalPages}</span>
          <AdminButton variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</AdminButton>
        </div>
      )}

      {modal !== null && (
        <EditProduct
          product={modal === "new" ? null : modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete product?"
        message={deleteTarget ? `"${deleteTarget.nameEn}" will be permanently removed. This can't be undone.` : ""}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </AdminPage>
  );
}