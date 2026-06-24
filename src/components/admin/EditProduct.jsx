import { useState, useRef } from "react";
import { Plus, X, Loader2, Upload, Image as ImageIcon } from "lucide-react";
import API from "../../ApiCall/Api.jsx";
import { AdminButton } from "./AdminUI.jsx";
import Toggle from "./Toggle.jsx";

const EMPTY = {
  nameEn: "", nameTa: "", slug: "", description: "", howToUse: "", storageTips: "",
  categoryId: "", isBestseller: false, isNew: false, isActive: true,
};

const V_EMPTY = { weightGrams: "", weightLabel: "", price: "", comparePrice: "", stockQty: "" };

// stable client-side id for variant rows (React keys must not be the
// array index when rows can be added/removed, or inputs bind to the
// wrong row after a delete)
const uid = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `v_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const newVariant = () => ({ ...V_EMPTY, _uid: uid() });

const slugify = (val) =>
  val.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

// ── Variant row ─────────────────────────────────────────────────────────
// Mobile fix: the old version was a single `grid-cols-5` row, which
// crushed five fields into unreadable slivers on phone widths. Below
// `sm`, each field stacks two-per-row in its own labelled block; from
// `sm` up it collapses back into one compact row, matching desktop.
function VariantRow({ v, idx, canRemove, onChange, onRemove }) {
  const set = (k, val) => onChange(idx, k, val);
  return (
    <div className="border border-gray-100 rounded-xl p-3 sm:border-0 sm:p-0">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:items-end">
        <div>
          <label className="field-label text-[10px]">Weight (g)</label>
          <input type="number" value={v.weightGrams} onChange={(e) => set("weightGrams", e.target.value)} placeholder="250" className="field-input" />
        </div>
        <div>
          <label className="field-label text-[10px]">Label</label>
          <input value={v.weightLabel} onChange={(e) => set("weightLabel", e.target.value)} placeholder="250g" className="field-input" />
        </div>
        <div>
          <label className="field-label text-[10px]">Price ₹</label>
          <input type="number" value={v.price} onChange={(e) => set("price", e.target.value)} placeholder="299" className="field-input" />
        </div>
        <div>
          <label className="field-label text-[10px]">MRP ₹</label>
          <input type="number" value={v.comparePrice} onChange={(e) => set("comparePrice", e.target.value)} placeholder="399" className="field-input" />
        </div>
        {/* Stock + remove span both mobile columns so the remove button
            never gets squeezed into its own tiny third row */}
        <div className="col-span-2 sm:col-span-1 flex items-end gap-1">
          <div className="flex-1">
            <label className="field-label text-[10px]">Stock</label>
            <input type="number" value={v.stockQty} onChange={(e) => set("stockQty", e.target.value)} placeholder="50" className="field-input" />
          </div>
          <button
            type="button"
            onClick={() => onRemove(idx)}
            disabled={!canRemove}
            title={canRemove ? "Remove variant" : "At least one variant is required"}
            className="mb-0.5 p-2.5 text-red-400 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            aria-label="Remove variant"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// EDIT / ADD PRODUCT
// ══════════════════════════════════════════════════════════════════════
// Handles both flows: pass `product={null}` (or omit it) to add a new
// product, or pass an existing product row to edit it.
export default function EditProduct({ product, categories, onClose, onSaved }) {
  const isEdit    = !!product?.id;

  // Resolve categoryId robustly: the product row from the list endpoint
  // may only carry categoryName/categorySlug, not categoryId — without
  // this fallback the category dropdown renders blank when editing.
  const resolvedCatId =
    product?.categoryId
    || categories.find((c) => c.slug === product?.categorySlug || c.nameEn === product?.categoryName)?.id
    || "";

  const [form, setForm] = useState(
    product ? { ...EMPTY, ...product, categoryId: resolvedCatId } : { ...EMPTY }
  );
  const [variants, setVariants] = useState(
    product?.variants?.length ? product.variants.map((v) => ({ ...v, _uid: v.id ?? uid() })) : [newVariant()]
  );
  const [imageUrl,   setImageUrl]   = useState(product?.images?.[0]?.imageUrl || product?.primaryImage || "");
  const [imgUpload,  setImgUpload]  = useState(null); // null | "uploading" | "done" | "error"
  const [imgError,   setImgError]   = useState("");
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const imgInputRef = useRef(null);

  const setF    = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setV    = (i, k, v) => setVariants((arr) => arr.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)));
  const addV    = () => setVariants((arr) => [...arr, newVariant()]);
  const removeV = (i) => setVariants((arr) => (arr.length > 1 ? arr.filter((_, idx) => idx !== i) : arr));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgUpload("uploading");
    setImgError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await API.post("/upload/product", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log(response.data);
      setImageUrl(response.data.url);
      setImgUpload("done");
    } catch (err) {
      setImgError(err.message || "Image upload failed");
      setImgUpload("error");
    }
    e.target.value = "";
  };

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
      const cleanVariants = variants.map(({ _uid, ...rest }) => rest);

      if (isEdit) {
        // ── Variant diff ─────────────────────────────────────────────
        const originalIds = new Set((product.variants || []).map((v) => v.id));
        const currentIds  = new Set(cleanVariants.filter((v) => v.id).map((v) => v.id));

        // deleted
        for (const orig of (product.variants || [])) {
          if (!currentIds.has(orig.id)) {
            await API.delete("/products/delete-variant", { data: { productId: product.id, variantId: orig.id } });
          }
        }
        // new
        for (const v of cleanVariants) {
          if (!v.id) {
            await API.post("/products/add-variant", {
              productId: product.id,
              weightGrams: Number(v.weightGrams) || 0,
              weightLabel: v.weightLabel,
              price: v.price,
              comparePrice: v.comparePrice || null,
              stockQty: Number(v.stockQty) || 0,
            });
          }
        }
        // updated
        for (const v of cleanVariants) {
          if (v.id && originalIds.has(v.id)) {
            await API.put("/products/update-variant", {
              productId: product.id,
              variantId: v.id,
              weightGrams: Number(v.weightGrams) || 0,
              weightLabel: v.weightLabel,
              price: v.price,
              comparePrice: v.comparePrice || null,
              stockQty: Number(v.stockQty) || 0,
            });
          }
        }

        // ── Image update ─────────────────────────────────────────────
        const originalImage = product?.images?.[0]?.imageUrl || product?.primaryImage || "";
        if (imageUrl && imageUrl !== originalImage) {
          await API.post("/products/add-image", {
            productId: product.id,
            imageUrl,
            isPrimary: true,
            sortOrder: 0,
          });
        }

        // ── Core fields ───────────────────────────────────────────────
        const response = await API.put("/products/update-product", { id: product.id, ...form });
        console.log(response.data);
        onSaved(response.data.product || { ...form, id: product.id });
      } else {
        const payload = { ...form, variants: cleanVariants, images: imageUrl ? [{ imageUrl, isPrimary: true }] : [] };
        const response = await API.post("/products/create-product", payload);
        console.log(response.data);
        onSaved(response.data.product || { ...payload });
      }

      onClose();
    } catch (e) {
      setError(e.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    // Mobile fix: was `items-start justify-end` with a flush right-hand
    // panel at all sizes. Now it's a bottom sheet on mobile (full width,
    // rounded top, slides from the bottom edge) and the original
    // right-hand drawer from `sm` up — matching how the rest of the app's
    // mobile sheets behave instead of reusing the desktop drawer verbatim.
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-modal-fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={saving ? undefined : onClose} />

      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-modal-slide-up">

        {/* header — sticky, safe-area aware */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-display text-base font-bold text-gray-900">
            {isEdit ? "Edit Product" : "Add Product"}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <form id="edit-product-form" onSubmit={handleSubmit} className="space-y-5">

            {/* image upload */}
            <div>
              <label className="field-label">Product Image</label>

              {/* preview box */}
              <div className="w-full h-40 rounded-2xl overflow-hidden bg-gray-50 border border-gray-200 mb-3 flex items-center justify-center">
                {imgUpload === "uploading" ? (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Loader2 size={24} className="animate-spin" />
                    <p className="font-body text-xs">Uploading…</p>
                  </div>
                ) : imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-300">
                    <ImageIcon size={28} />
                    <p className="font-body text-xs">Preview appears here</p>
                  </div>
                )}
              </div>

              {/* upload button */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => imgInputRef.current?.click()}
                  disabled={imgUpload === "uploading"}
                  className={`inline-flex items-center gap-2 font-body text-sm font-semibold px-4 py-2 rounded-xl border transition-colors disabled:opacity-50 ${
                    imgUpload === "done"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100"
                  }`}
                >
                  <Upload size={14} />
                  {imgUpload === "done" ? "Uploaded ✓" : imgUpload === "uploading" ? "Uploading…" : "Upload Image"}
                </button>
                <span className="font-body text-xs text-gray-400">JPEG · PNG · WebP · max 5 MB</span>
                <input
                  ref={imgInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {imgError && (
                <p className="font-body text-xs text-red-500 mt-1.5">{imgError}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label">Product Name (EN) *</label>
                <input value={form.nameEn} onChange={(e) => handleNameChange(e.target.value)} placeholder="Nethili Karuvadu" className="field-input" />
              </div>
              <div>
                <label className="field-label">Tamil Name</label>
                <input value={form.nameTa || ""} onChange={(e) => setF("nameTa", e.target.value)} placeholder="நெத்திலி கருவாடு" className="field-input" />
              </div>
              <div>
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

            {/* ── Description, How to Use, Storage Tips ── */}
            <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <div>
                <label className="field-label">Description</label>
                <textarea value={form.description || ""} onChange={(e) => setF("description", e.target.value)} rows={3} placeholder="Product description…" className="field-input resize-none" />
              </div>
              <div>
                <label className="field-label">How to Use</label>
                <textarea value={form.howToUse || ""} onChange={(e) => setF("howToUse", e.target.value)} rows={2} placeholder="Rinse, soak for 10 min before cooking…" className="field-input resize-none" />
              </div>
              <div>
                <label className="field-label">Storage Tips</label>
                <textarea value={form.storageTips || ""} onChange={(e) => setF("storageTips", e.target.value)} rows={2} placeholder="Store in an airtight container, refrigerate after opening…" className="field-input resize-none" />
              </div>
            </div>

            {/* toggles — whole control is one button so the label text is
                clickable too, and they wrap cleanly on narrow screens */}
            <div className="flex flex-wrap gap-x-5 gap-y-3">
              {[
                { key: "isBestseller", label: "Best Seller" },
                { key: "isNew",        label: "New Arrival" },
                { key: "isActive",     label: "Active" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                  <Toggle checked={form[key]} onChange={() => setF(key, !form[key])} />
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
              <div className="space-y-3 sm:space-y-2">
                {variants.map((v, i) => (
                  <VariantRow key={v._uid} v={v} idx={i} canRemove={variants.length > 1} onChange={setV} onRemove={removeV} />
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* footer — sticky so Save/Cancel are always reachable, even on a
            long form, instead of requiring a scroll to the very bottom */}
        <div className="flex justify-end gap-3 px-5 sm:px-6 py-4 border-t border-gray-100 shrink-0 bg-white">
          <AdminButton variant="outline" onClick={onClose} type="button" disabled={saving}>
            Cancel
          </AdminButton>
          <AdminButton type="submit" form="edit-product-form" disabled={saving}>
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : isEdit ? "Update Product" : "Add Product"}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}