import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Eye, Loader2, Star } from "lucide-react";
import { productApi, categoryApi } from "../../ApiCall/Api.jsx";
import { useAuthStore }            from "../../components/store/AuthStore";
import {
  AdminPage, DataTable, StatusBadge, AdminButton, SearchBar, AdminCard,
} from "../../components/admin/AdminUI.jsx";

const PH     = "https://placehold.co/48x48/92400e/fef3c7?text=🐟";
const rupee  = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);
const EMPTY  = { nameEn:"", nameTa:"", slug:"", description:"", howToUse:"", storageTips:"", categoryId:"", isBestseller:false, isNew:false, isActive:true };
const V_EMPTY = { weightGrams:"", weightLabel:"", price:"", comparePrice:"", stockQty:"" };

// ── Variant row ────────────────────────────────────────────────────────
function VariantRow({ v, idx, onChange, onRemove }) {
  const set = (k, val) => onChange(idx, k, val);
  return (
    <div className="grid grid-cols-5 gap-2 items-end">
      <div><label className="field-label text-[10px]">Weight (g)</label><input type="number" value={v.weightGrams} onChange={(e) => set("weightGrams", e.target.value)} placeholder="250" className="field-input" /></div>
      <div><label className="field-label text-[10px]">Label</label><input value={v.weightLabel} onChange={(e) => set("weightLabel", e.target.value)} placeholder="250g" className="field-input" /></div>
      <div><label className="field-label text-[10px]">Price ₹</label><input type="number" value={v.price} onChange={(e) => set("price", e.target.value)} placeholder="299" className="field-input" /></div>
      <div><label className="field-label text-[10px]">MRP ₹</label><input type="number" value={v.comparePrice} onChange={(e) => set("comparePrice", e.target.value)} placeholder="399" className="field-input" /></div>
      <div className="flex items-end gap-1">
        <div className="flex-1"><label className="field-label text-[10px]">Stock</label><input type="number" value={v.stockQty} onChange={(e) => set("stockQty", e.target.value)} placeholder="50" className="field-input" /></div>
        <button type="button" onClick={() => onRemove(idx)} className="mb-0.5 p-2 text-red-400 hover:bg-red-50 rounded-lg"><X size={14} /></button>
      </div>
    </div>
  );
}

// ── Product form modal ─────────────────────────────────────────────────
function ProductModal({ product, categories, onClose, onSaved }) {
  const { token } = useAuthStore();
  const isEdit    = !!product?.id;
  const [form,     setForm]     = useState(product ? { ...product } : { ...EMPTY });
  const [variants, setVariants] = useState(product?.variants?.map((v) => ({ ...v })) || [{ ...V_EMPTY }]);
  const [imageUrl, setImageUrl] = useState(product?.images?.[0]?.imageUrl || "");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const setF    = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setV    = (i, k, v) => setVariants((arr) => arr.map((x, idx) => idx === i ? { ...x, [k]: v } : x));
  const addV    = () => setVariants((arr) => [...arr, { ...V_EMPTY }]);
  const removeV = (i) => setVariants((arr) => arr.filter((_, idx) => idx !== i));

  // auto-generate slug from nameEn
  const handleNameChange = (val) => {
    setF("nameEn", val);
    if (!isEdit) setF("slug", val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nameEn.trim())    { setError("Product name required"); return; }
    if (!form.categoryId)       { setError("Category required"); return; }
    if (!variants.length)       { setError("At least one variant required"); return; }
    if (variants.some((v) => !v.price)) { setError("All variants need a price"); return; }

    setSaving(true); setError("");
    try {
      const payload = { ...form, variants, images: imageUrl ? [{ imageUrl, isPrimary: true }] : [] };
      let res;
      if (isEdit) res = await productApi.update(product.id, payload, token);
      else        res = await productApi.create(payload, token);
      onSaved(res.product || payload);
      onClose();
    } catch (e) { setError(e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="font-display text-base font-bold text-gray-900">{isEdit ? "Edit Product" : "Add Product"}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
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

            {/* toggles */}
            <div className="flex flex-wrap gap-4">
              {[
                { key: "isBestseller", label: "Best Seller" },
                { key: "isNew",        label: "New Arrival" },
                { key: "isActive",     label: "Active"      },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setF(key, !form[key])} className={`w-9 h-5 rounded-full relative transition-colors ${form[key] ? "bg-brand-700" : "bg-gray-300"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${form[key] ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                  <span className="font-body text-sm text-gray-700">{label}</span>
                </label>
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
                  <VariantRow key={i} v={v} idx={i} onChange={setV} onRemove={removeV} />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <AdminButton variant="outline" onClick={onClose} type="button">Cancel</AdminButton>
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
  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [catFilter,   setCatFilter]   = useState("");
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [modal,       setModal]       = useState(null);

  useEffect(() => { categoryApi.list().then((r) => setCategories(r.categories || [])).catch(() => {}); }, []);

  const load = async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search)    p.set("search",   search);
    if (catFilter) p.set("category", catFilter);
    p.set("page", page); p.set("limit", 15);
    try {
      const res = await productApi.list(p.toString());
      setProducts(res.products || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (_) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, catFilter, page]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try { await productApi.remove(id, token); setProducts((prev) => prev.filter((p) => p.id !== id)); }
    catch (e) { alert(e.message || "Failed"); }
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
      render: (r) => (
        <div>
          <p className="font-num text-sm font-bold text-gray-900">{rupee(r.minPrice)}</p>
          {r.variants?.length > 1 && <p className="font-num text-[10px] text-gray-400">{r.variants.length} variants</p>}
        </div>
      ),
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
          <button onClick={() => setModal(r)} className="p-1.5 text-gray-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"><Pencil size={15} /></button>
          <button onClick={() => handleDelete(r.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
        </div>
      ),
    },
  ];

  return (
    <AdminPage title="Products" sub="Manage your product catalogue"
      action={<AdminButton onClick={() => setModal("new")}><Plus size={15} /> Add Product</AdminButton>}
    >
      <div className="flex flex-wrap gap-3">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search products…" className="w-56" />
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
    </AdminPage>
  );
}