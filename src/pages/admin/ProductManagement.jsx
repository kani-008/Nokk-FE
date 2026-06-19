import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Star, AlertTriangle } from "lucide-react";
import { productApi, categoryApi } from "../../ApiCall/Api.jsx";
import { useAuthStore }            from "../../components/store/AuthStore";
import {
  AdminPage, DataTable, StatusBadge, AdminButton, SearchBar,
} from "../../components/admin/AdminUI.jsx";

import comboImg from "../../assets/products/combo.jpg";

const PH     = comboImg;
const rupee  = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);
const EMPTY  = { nameEn:"", nameTa:"", slug:"", description:"", howToUse:"", storageTips:"", categoryId:"", isBestseller:false, isNew:false, isActive:true };
const V_EMPTY = { weightGrams:"", weightLabel:"", price:"", comparePrice:"", stockQty:"" };

// stable client-side id for variant rows (React keys must not be the array
// index when rows can be added/removed, or inputs bind to the wrong row)
const uid = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `v_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const newVariant = () => ({ ...V_EMPTY, _uid: uid() });

// ── Confirm dialog (replaces native confirm()) ─────────────────────────
function ConfirmDialog({ open, title, message, confirmLabel = "Delete", loading, onCancel, onConfirm }) {
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
            {loading ? <><Loader2 size={14} className="animate-spin" /> Deleting…</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Variant row ────────────────────────────────────────────────────────
function VariantRow({ v, idx, canRemove, onChange, onRemove }) {
  const set = (k, val) => onChange(idx, k, val);
  return (
    <div className="grid grid-cols-5 gap-2 items-end">
      <div><label className="field-label text-[10px]">Weight (g)</label><input type="number" value={v.weightGrams} onChange={(e) => set("weightGrams", e.target.value)} placeholder="250" className="field-input" /></div>
      <div><label className="field-label text-[10px]">Label</label><input value={v.weightLabel} onChange={(e) => set("weightLabel", e.target.value)} placeholder="250g" className="field-input" /></div>
      <div><label className="field-label text-[10px]">Price ₹</label><input type="number" value={v.price} onChange={(e) => set("price", e.target.value)} placeholder="299" className="field-input" /></div>
      <div><label className="field-label text-[10px]">MRP ₹</label><input type="number" value={v.comparePrice} onChange={(e) => set("comparePrice", e.target.value)} placeholder="399" className="field-input" /></div>
      <div className="flex items-end gap-1">
        <div className="flex-1"><label className="field-label text-[10px]">Stock</label><input type="number" value={v.stockQty} onChange={(e) => set("stockQty", e.target.value)} placeholder="50" className="field-input" /></div>
        <button
          type="button"
          onClick={() => onRemove(idx)}
          disabled={!canRemove}
          title={canRemove ? "Remove variant" : "At least one variant is required"}
          className="mb-0.5 p-2 text-red-400 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Product form modal ─────────────────────────────────────────────────
function ProductModal({ product, categories, onClose, onSaved }) {
  const { token } = useAuthStore();
  const isEdit    = !!product?.id;

  // Resolve categoryId robustly: the product row from the list endpoint
  // may only carry categoryName/categorySlug, not categoryId — without
  // this, the category dropdown would render blank when editing.
  const resolvedCatId =
    product?.categoryId
    || categories.find((c) => c.slug === product?.categorySlug || c.nameEn === product?.categoryName)?.id
    || "";

  const [form,     setForm]     = useState(product ? { ...EMPTY, ...product, categoryId: resolvedCatId } : { ...EMPTY });
  const [variants, setVariants] = useState(
    product?.variants?.length ? product.variants.map((v) => ({ ...v, _uid: v.id ?? uid() })) : [newVariant()]
  );
  const [imageUrl, setImageUrl] = useState(product?.images?.[0]?.imageUrl || "");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const setF    = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setV    = (i, k, v) => setVariants((arr) => arr.map((x, idx) => idx === i ? { ...x, [k]: v } : x));
  const addV    = () => setVariants((arr) => [...arr, newVariant()]);
  const removeV = (i) => setVariants((arr) => arr.length > 1 ? arr.filter((_, idx) => idx !== i) : arr);

  // auto-generate slug from nameEn (collapse repeats, trim stray hyphens)
  const slugify = (val) =>
    val.toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const handleNameChange = (val) => {
    setF("nameEn", val);
    if (!isEdit) setF("slug", slugify(val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nameEn.trim())            { setError("Product name is required"); return; }
    if (!form.slug?.trim())             { setError("Slug is required"); return; }
    if (!form.categoryId)               { setError("Category is required"); return; }
    if (!variants.length)               { setError("At least one variant is required"); return; }
    if (variants.some((v) => !v.price)) { setError("Every variant needs a price"); return; }

    setSaving(true); setError("");
    try {
      // strip the client-only _uid before sending to the API
      const cleanVariants = variants.map(({ _uid, ...rest }) => rest);
      const payload = { ...form, variants: cleanVariants, images: imageUrl ? [{ imageUrl, isPrimary: true }] : [] };
      let res;
      if (isEdit) res = await productApi.update(product.id, payload, token);
      else        res = await productApi.create(payload, token);
      onSaved(res.product || { ...payload, id: product?.id });
      onClose();
    } catch (e) { setError(e.message || "Failed to save product"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={saving ? undefined : onClose} />
      <div className="relative bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="font-display text-base font-bold text-gray-900">{isEdit ? "Edit Product" : "Add Product"}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5 flex-1">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-3">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* image preview */}
            <div>
              <label className="field-label">Primary Image URL</label>
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" className="field-input mb-2" />
              {imageUrl && (
                <img src={imageUrl} alt="preview" className="h-24 w-24 rounded-xl object-cover border border-amber-100" onError={(e) => { e.target.style.display = "none"; }} />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="field-label">Product Name (EN) *</label>
                <input value={form.nameEn} onChange={(e) => handleNameChange(e.target.value)} placeholder="Nethili Karuvadu" className="field-input" />
              </div>
              <div>
                <label className="field-label">Tamil Name</label>
                <input value={form.nameTa || ""} onChange={(e) => setF("nameTa", e.target.value)} placeholder="நெத்திலி கருவாடு" className="field-input" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="field-label">Slug *</label>
                <input value={form.slug || ""} onChange={(e) => setF("slug", e.target.value)} placeholder="nethili-karuvadu" className="field-input" />
              </div>
              <div>
                <label className="field-label">Category *</label>
                <select value={form.categoryId || ""} onChange={(e) => setF("categoryId", e.target.value)} className="field-input">
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="field-label">Description</label>
              <textarea value={form.description || ""} onChange={(e) => setF("description", e.target.value)} rows={3} placeholder="Product description…" className="field-input resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">How to Use</label>
                <textarea value={form.howToUse || ""} onChange={(e) => setF("howToUse", e.target.value)} rows={2} placeholder="Cooking tips…" className="field-input resize-none" />
              </div>
              <div>
                <label className="field-label">Storage Tips</label>
                <textarea value={form.storageTips || ""} onChange={(e) => setF("storageTips", e.target.value)} rows={2} placeholder="Store in airtight…" className="field-input resize-none" />
              </div>
            </div>

            {/* toggles — whole control is one button so the label text is clickable too */}
            <div className="flex flex-wrap gap-4">
              {[
                { key: "isBestseller", label: "Best Seller" },
                { key: "isNew",        label: "New Arrival" },
                { key: "isActive",     label: "Active"      },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setF(key, !form[key])}
                  aria-pressed={!!form[key]}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span className={`w-9 h-5 rounded-full relative transition-colors ${form[key] ? "bg-brand-700" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${form[key] ? "translate-x-4" : "translate-x-0.5"}`} />
                  </span>
                  <span className="font-body text-sm text-gray-700">{label}</span>
                </button>
              ))}
            </div>

            {/* variants */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="field-label mb-0">Variants *</label>
                <button type="button" onClick={addV} className="font-body text-xs text-brand-700 hover:underline font-semibold flex items-center gap-1">
                  <Plus size={12} /> Add Variant
                </button>
              </div>
              <div className="space-y-2">
                {variants.map((v, i) => (
                  <VariantRow key={v._uid} v={v} idx={i} canRemove={variants.length > 1} onChange={setV} onRemove={removeV} />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <AdminButton variant="outline" onClick={onClose} type="button" disabled={saving}>Cancel</AdminButton>
              <AdminButton type="submit" disabled={saving}>
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : isEdit ? "Update Product" : "Add Product"}
              </AdminButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
export default function ProductManagement() {
  const { token }   = useAuthStore();
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

  useEffect(() => { categoryApi.list().then((r) => setCategories(r.categories || [])).catch(() => {}); }, []);

  // debounce the search input so we don't fire a request per keystroke
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (debouncedSearch) p.set("search",   debouncedSearch);
    if (catFilter)       p.set("category", catFilter);
    p.set("page", page); p.set("limit", 15);
    try {
      const res = await productApi.list(p.toString());
      setProducts(res.products || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (_) {
      setPageError("Couldn't load products. Please try again.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [debouncedSearch, catFilter, page]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await productApi.remove(deleteTarget.id, token);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      setPageError(e.message || "Failed to delete product.");
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
        <div className="flex items-center gap-3">
          <img src={r.primaryImage || PH} alt={r.nameEn} className="w-10 h-10 rounded-xl object-cover bg-amber-50 border border-amber-100 shrink-0" onError={(e) => { e.target.src = PH; }} />
          <div>
            <p className="font-body text-sm font-semibold text-gray-900 line-clamp-1">{r.nameEn}</p>
            {r.nameTa && <p className="font-tamil text-[11px] text-gray-400">{r.nameTa}</p>}
          </div>
        </div>
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
      render: (r) => (
        <div className="flex gap-1 flex-wrap">
          {r.isBestseller && <span className="badge-amber">Best Seller</span>}
          {r.isNew        && <span className="badge-green">New</span>}
          {!r.isActive    && <span className="badge-red">Inactive</span>}
        </div>
      ),
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
      key: "action", label: "", width: "80px",
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

      <div className="flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search products…" className="w-56" />
        <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }} className="field-input w-44">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.nameEn}</option>)}
        </select>
        {(search || catFilter) && (
          <button onClick={() => { setSearch(""); setCatFilter(""); setPage(1); }} className="flex items-center gap-1.5 font-body text-sm text-gray-500 hover:text-red-500">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      <DataTable columns={COLS} rows={products} loading={loading} emptyText="No products found." />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <AdminButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</AdminButton>
          <span className="font-body text-sm text-gray-600">Page {page} of {totalPages}</span>
          <AdminButton variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</AdminButton>
        </div>
      )}

      {modal !== null && (
        <ProductModal
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