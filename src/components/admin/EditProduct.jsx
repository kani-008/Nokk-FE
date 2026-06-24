import { useState, useRef } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import API from "../../ApiCall/Api.jsx";
import { AdminButton } from "./AdminUI.jsx";
import Toggle from "./Toggle.jsx";
import Dropdown from "./Dropdown.jsx";

const EMPTY = {
  nameEn: "", nameTa: "", slug: "", description: "", howToUse: "", storageTips: "",
  categoryId: "", isBestseller: false, isNew: false, isActive: true,
};

const V_EMPTY = { weightGrams: "", weightLabel: "", price: "", comparePrice: "", stockQty: "", inStock: true };

const WEIGHT_OPTIONS = [
  { value: "100g", label: "100g", grams: 100 },
  { value: "250g", label: "250g", grams: 250 },
  { value: "500g", label: "500g", grams: 500 },
  { value: "1kg",  label: "1kg",  grams: 1000 },
];

// Auto-pricing: the variant with the smallest weightGrams (that has a
// price filled in) is the "base unit". Every other variant's price and
// MRP are prefilled as (otherWeight / baseWeight) * basePrice, rounded
// to the nearest rupee. Once an admin manually edits a row's price or
// MRP by hand, that field is marked "touched" and the auto-calc stops
// overwriting it — it only ever pre-fills, never fights a manual edit.
function computeAutoPricedVariants(variants) {
  const withWeight = variants.filter((v) => Number(v.weightGrams) > 0 && Number(v.price) > 0);
  if (withWeight.length === 0) return variants;

  const base = withWeight.reduce((min, v) =>
    Number(v.weightGrams) < Number(min.weightGrams) ? v : min
  );
  const baseWeight = Number(base.weightGrams);
  const basePrice = Number(base.price);
  const baseCompare = Number(base.comparePrice) || null;

  return variants.map((v) => {
    if (v._uid === base._uid) return v; // base row drives the calc, never overwritten by it
    const w = Number(v.weightGrams);
    if (!w || w === baseWeight) return v;

    const scale = w / baseWeight;
    const next = { ...v };
    if (!v._priceTouched) {
      next.price = String(Math.round(basePrice * scale));
    }
    if (!v._comparePriceTouched && baseCompare) {
      next.comparePrice = String(Math.round(baseCompare * scale));
    }
    return next;
  });
}

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
function VariantRow({ v, idx, canRemove, isBase, onChange, onRemove, variants = [] }) {
  const set = (k, val) => onChange(idx, k, val);
  const priceAutoFilled = !isBase && !v._priceTouched && v.price;

  // Filter out options already selected by OTHER variants
  const filteredOptions = WEIGHT_OPTIONS.filter((opt) => {
    const isUsedByOther = variants.some((otherV, otherIdx) => {
      if (otherIdx === idx) return false;
      return otherV.weightLabel === opt.value;
    });
    return !isUsedByOther;
  });

  // Ensure current selected label is in the options list so it displays properly
  const selectedLabel = v.weightLabel || "";
  const displayOptions = [...filteredOptions];
  if (selectedLabel && !displayOptions.some((o) => o.value === selectedLabel)) {
    const originalOpt = WEIGHT_OPTIONS.find((o) => o.value === selectedLabel);
    if (originalOpt) {
      displayOptions.push(originalOpt);
    } else {
      displayOptions.push({ value: selectedLabel, label: selectedLabel, grams: Number(v.weightGrams) || 0 });
    }
    displayOptions.sort((a, b) => a.grams - b.grams);
  }

  const handleWeightChange = (newVal) => {
    const opt = WEIGHT_OPTIONS.find((o) => o.value === newVal) || { value: newVal, label: newVal, grams: 0 };
    onChange(idx, "weightLabel", opt.value);
    onChange(idx, "weightGrams", opt.grams);
  };

  return (
    <div className={`border rounded-xl p-3 sm:border-0 sm:p-0 ${isBase ? "border-sandal-200 bg-sandal-50/30 sm:bg-transparent sm:border-transparent" : "border-gray-100"}`}>
      {isBase && (
        <p className="font-body text-[10px] font-bold text-sandal-700 mb-1.5 sm:hidden">Base unit — sets the per-gram rate</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:items-end">
        <div>
          <label className="field-label text-[10px]">
            Weight {isBase && <span className="text-sandal-600">· base</span>}
          </label>
          <Dropdown
            value={v.weightLabel || ""}
            onChange={handleWeightChange}
            placeholder="Select weight"
            options={displayOptions}
            direction="up"
          />
        </div>
        <div>
          <label className="field-label text-[10px]">
            Price ₹ {priceAutoFilled && <span className="text-gray-400 font-normal">(auto)</span>}
          </label>
          <input
            type="number"
            value={v.price}
            onChange={(e) => set("price", e.target.value)}
            placeholder="299"
            className="field-input no-spinner"
          />
        </div>
        <div>
          <label className="field-label text-[10px]">MRP ₹</label>
          <input
            type="number"
            value={v.comparePrice}
            onChange={(e) => set("comparePrice", e.target.value)}
            placeholder="399"
            className="field-input no-spinner"
          />
        </div>
        {/* Stock + remove span both mobile columns so the remove button
            never gets squeezed into its own tiny third row */}
        <div className="col-span-2 sm:col-span-1 flex items-end gap-1">
          <div className="flex-1 flex flex-col items-start pb-1">
            <span className="field-label text-[10px] mb-2 block">Status</span>
            <div className="flex items-center gap-1.5 h-[34px] sm:h-[38px]">
              <Toggle
                checked={v.inStock !== undefined ? v.inStock : true}
                onChange={() => {
                  const currentVal = v.inStock !== undefined ? v.inStock : true;
                  set("inStock", !currentVal);
                }}
              />
              <span className={`font-body text-xs font-semibold select-none ${(v.inStock !== undefined ? v.inStock : true) ? "text-green-600" : "text-red-500"}`}>
                {(v.inStock !== undefined ? v.inStock : true) ? "In Stock" : "out of stock"}
              </span>
            </div>
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
  const isEdit = !!product?.id;

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
  // ── Images ────────────────────────────────────────────────────────────
  // savedImages: images that already exist in the DB (have an `id`).
  //   Removing one calls /delete-image immediately — it's a real file.
  // staged: newly picked files NOT yet uploaded anywhere. Just objects
  //   { file, previewUrl } held in memory. Nothing touches Supabase
  //   until Save is clicked — so "wrong file" or "closed the form
  //   without saving" never leaves an orphaned file in storage.
  const MAX_IMAGES = 5;
  const [savedImages, setSavedImages] = useState(
    (product?.images || []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  );
  const [staged, setStaged] = useState([]); // [{ _uid, file, previewUrl }]
  const [imgError, setImgError] = useState("");
  const [removingImg, setRemovingImg] = useState(null); // id of saved image currently being deleted
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const imgInputRef = useRef(null);
  const uploadedUrlsRef = useRef([]); // tracks files uploaded to Supabase Storage (for new products)
  const uploadedDbImagesRef = useRef([]); // tracks database image records added during the edit save session

  const totalImageCount = savedImages.length + staged.length;

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setV = (i, k, val) => setVariants((arr) => {
    const next = arr.map((x, idx) => {
      if (idx !== i) return x;
      const updated = { ...x, [k]: val };
      // Direct edits to price/comparePrice "lock" that field so the
      // auto-calc below stops overwriting it for this row.
      if (k === "price") updated._priceTouched = true;
      if (k === "comparePrice") updated._comparePriceTouched = true;
      return updated;
    });
    return computeAutoPricedVariants(next);
  });
  const addV = () => setVariants((arr) => computeAutoPricedVariants([...arr, newVariant()]));
  const removeV = (i) => setVariants((arr) => (arr.length > 1 ? computeAutoPricedVariants(arr.filter((_, idx) => idx !== i)) : arr));

  // Pick one or more files — just stage them as local previews.
  // No network call here, so a wrong pick costs nothing to undo.
  const handlePickFiles = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-picking the same file later
    if (!files.length) return;

    setImgError("");

    if (totalImageCount + files.length > MAX_IMAGES) {
      setImgError(`You can have at most ${MAX_IMAGES} images per product (currently ${totalImageCount}).`);
      return;
    }
    const tooBig = files.find((f) => f.size > 5 * 1024 * 1024);
    if (tooBig) {
      setImgError(`"${tooBig.name}" is over 5 MB.`);
      return;
    }

    const newStaged = files.map((file) => ({
      _uid: uid(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setStaged((arr) => [...arr, ...newStaged]);
  };

  // Remove a staged (not-yet-uploaded) file — purely local, nothing to
  // clean up on Supabase since it was never sent there.
  const removeStaged = (_uid) => {
    setStaged((arr) => {
      const target = arr.find((s) => s._uid === _uid);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return arr.filter((s) => s._uid !== _uid);
    });
  };

  // Remove an already-saved image — this IS a real file in Supabase,
  // so delete it immediately rather than waiting for Save.
  const removeSaved = async (img) => {
    if (!isEdit) return;
    setRemovingImg(img.id);
    setImgError("");
    try {
      await API.delete("/products/delete-image", { data: { productId: product.id, imageId: img.id } });
      setSavedImages((arr) => arr.filter((i) => i.id !== img.id));
    } catch (err) {
      setImgError(err.response?.data?.message || err.message || "Failed to remove image");
    } finally {
      setRemovingImg(null);
    }
  };

  const handleNameChange = (val) => {
    setF("nameEn", val);
    if (!isEdit) setF("slug", slugify(val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nameEn.trim()) { setError("Product name is required"); return; }
    if (!form.slug?.trim()) { setError("Slug is required"); return; }
    if (!form.categoryId) { setError("Category is required"); return; }
    if (!variants.length) { setError("At least one variant is required"); return; }
    if (variants.some((v) => !v.price)) { setError("Every variant needs a price"); return; }

    setSaving(true); setError("");
    try {
      const cleanVariants = variants.map(({ _uid, _priceTouched, _comparePriceTouched, ...rest }) => {
        const computedInStock = rest.inStock !== undefined ? rest.inStock : true;
        return {
          ...rest,
          inStock: computedInStock
        };
      });

      if (isEdit) {
        // ── Variant diff ─────────────────────────────────────────────
        const originalIds = new Set((product.variants || []).map((v) => v.id));
        const currentIds = new Set(cleanVariants.filter((v) => v.id).map((v) => v.id));

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
              inStock: v.inStock,
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
              inStock: v.inStock,
            });
          }
        }

        // ── New images: upload any staged files now via bulk endpoint ──
        if (staged.length > 0) {
          const body = new FormData();
          body.append("productId", product.id);
          staged.forEach((s) => body.append("imageFiles", s.file));
          const addImgsRes = await API.post("/products/add-images", body, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          if (addImgsRes.data.images) {
            uploadedDbImagesRef.current = [...uploadedDbImagesRef.current, ...addImgsRes.data.images];
          }
        }

        // ── Core fields ───────────────────────────────────────────────
        const { variants: _v, images: _i, ...coreForm } = form;
        const response = await API.put("/products/update-product", { id: product.id, ...coreForm });
        uploadedDbImagesRef.current = []; // save succeeded, clear tracked images
        console.log(response.data);
        onSaved(response.data.product || { ...form, id: product.id });
      } else {
        // New product: upload any staged files first in parallel
        const uploadPromises = staged.map(async (s) => {
          const body = new FormData();
          body.append("file", s.file);
          body.append("slug", form.slug.trim());
          const up = await API.post("/upload/product", body, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          return up.data.url;
        });
        const urls = await Promise.all(uploadPromises);
        uploadedUrlsRef.current = [...uploadedUrlsRef.current, ...urls];

        const uploadedImages = urls.map((url, idx) => ({
          imageUrl: url,
          isPrimary: idx === 0
        }));
        const payload = { ...form, variants: cleanVariants, images: uploadedImages };
        const response = await API.post("/products/create-product", payload);
        uploadedUrlsRef.current = []; // save succeeded, clear tracked URLs
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

  const handleClose = async () => {
    // Staged files were never uploaded anywhere, so there's nothing to
    // clean up on Supabase. Just release the local blob: preview URLs.
    staged.forEach((s) => URL.revokeObjectURL(s.previewUrl));

    // Cleanup files from Supabase if they were uploaded but user canceled (failed save)
    try {
      if (uploadedUrlsRef.current.length > 0) {
        await Promise.all(
          uploadedUrlsRef.current.map((url) =>
            API.delete("/upload/delete-file", { data: { url } }).catch((err) =>
              console.error("[Cleanup] Failed to delete file:", url, err)
            )
          )
        );
        uploadedUrlsRef.current = [];
      }

      if (uploadedDbImagesRef.current.length > 0) {
        await Promise.all(
          uploadedDbImagesRef.current.map((img) =>
            API.delete("/products/delete-image", { data: { productId: product.id, imageId: img.id } }).catch((err) =>
              console.error("[Cleanup] Failed to delete DB image record:", img.id, err)
            )
          )
        );
        uploadedDbImagesRef.current = [];
      }
    } catch (err) {
      console.error("[Cleanup] Error during cancellation cleanup:", err);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-modal-fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={saving ? undefined : handleClose} />

      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-modal-slide-up">

        {/* header — sticky, safe-area aware */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-display text-base font-bold text-gray-900">
            {isEdit ? "Edit Product" : "Add Product"}
          </h3>
          <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Close">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label">Product Name (EN) *</label>
                <input value={form.nameEn} onChange={(e) => handleNameChange(e.target.value)} placeholder="Nethili Karuvadu" className="field-input" />
              </div>
              <div>
                <label className="field-label">Tamil Name</label>
                <input value={form.nameTa || ""} onChange={(e) => setF("nameTa", e.target.value)} placeholder="நெத்திலி கருவாடு" className="field-input font-tamil" lang="ta" />
              </div>
              <div>
                <label className="field-label">Slug *</label>
                <input value={form.slug || ""} onChange={(e) => setF("slug", e.target.value)} placeholder="nethili-karuvadu" className="field-input" />
              </div>
              <div>
                <label className="field-label">Category *</label>
                <Dropdown
                  value={form.categoryId || ""}
                  onChange={(v) => setF("categoryId", v)}
                  placeholder="Select category"
                  options={categories.map((c) => ({ value: c.id, label: c.nameEn }))}
                />
              </div>
            </div>
            {/* image upload — up to 5 images, staged locally until Save */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="field-label mb-0">Product Images</label>
                <span className="font-body text-xs text-gray-400">{totalImageCount}/{MAX_IMAGES}</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                {/* already-saved images — removing calls the API immediately */}
                {savedImages.map((img) => (
                  <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-200 group">
                    <img src={img.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                    {img.isPrimary && (
                      <span className="absolute bottom-1 left-1 font-body text-[9px] font-bold bg-brand-600 text-white px-1.5 py-0.5 rounded-md">Primary</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeSaved(img)}
                      disabled={removingImg === img.id}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-500 text-white rounded-full transition-colors disabled:opacity-50"
                      aria-label="Remove image"
                    >
                      {removingImg === img.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                    </button>
                  </div>
                ))}

                {/* newly staged images — not uploaded yet, removing is free */}
                {staged.map((s) => (
                  <div key={s._uid} className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-dashed border-brand-300 group">
                    <img src={s.previewUrl} alt="" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 font-body text-[9px] font-bold bg-gray-700 text-white px-1.5 py-0.5 rounded-md">New</span>
                    <button
                      type="button"
                      onClick={() => removeStaged(s._uid)}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-500 text-white rounded-full transition-colors"
                      aria-label="Remove image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {/* add-more tile */}
                {totalImageCount < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => imgInputRef.current?.click()}
                    disabled={!form.slug?.trim()}
                    title={!form.slug?.trim() ? "Enter a product name first" : undefined}
                    className="aspect-square rounded-xl border border-dashed border-gray-300 hover:border-brand-400 hover:bg-brand-50/40 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus size={18} />
                    <span className="font-body text-[10px] font-semibold">Add</span>
                  </button>
                )}
              </div>

              <input
                ref={imgInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePickFiles}
              />

              <p className="font-body text-xs text-gray-400">JPEG · PNG · WebP · max 5 MB each · up to {MAX_IMAGES} images</p>
              {!form.slug?.trim() && (
                <p className="font-body text-xs text-gray-400 mt-1">Enter a product name above to enable image upload.</p>
              )}
              {imgError && (
                <p className="font-body text-xs text-red-500 mt-1.5">{imgError}</p>
              )}
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
                { key: "isNew", label: "New Arrival" },
                { key: "isActive", label: "Active" },
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
              {variants.length > 1 && (
                <p className="font-body text-[11px] text-gray-400 mb-2">
                  The lightest weight sets the per-gram rate — other variants' prices prefill from it, and you can still edit any of them by hand.
                </p>
              )}
              <div className="space-y-3 sm:space-y-2">
                {variants.map((v, i) => {
                  const baseUid = (() => {
                    const withWeight = variants.filter((x) => Number(x.weightGrams) > 0 && Number(x.price) > 0);
                    if (!withWeight.length) return null;
                    return withWeight.reduce((min, x) => Number(x.weightGrams) < Number(min.weightGrams) ? x : min)._uid;
                  })();
                  return (
                    <VariantRow key={v._uid} v={v} idx={i} canRemove={variants.length > 1} isBase={v._uid === baseUid} onChange={setV} onRemove={removeV} variants={variants} />
                  );
                })}
              </div>
            </div>
          </form>
        </div>
        {/* footer — sticky so Save/Cancel are always reachable, even on a
            long form, instead of requiring a scroll to the very bottom */}
        <div className="flex justify-end gap-3 px-5 sm:px-6 py-4 border-t border-gray-100 shrink-0 bg-white">
          <AdminButton variant="outline" onClick={handleClose} type="button" disabled={saving}>
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