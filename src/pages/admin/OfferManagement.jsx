import { useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2, AlertTriangle, Image as ImageIcon } from "lucide-react";
import {
  useAdminOfferList,
  useCreateOffer,
  useUpdateOffer,
  useDeleteOffer
} from "../../hookqueries/useOffers";
import { useProductCategories, useAdminProductList } from "../../hookqueries/useProducts";
import {
  AdminPage, AdminButton,
} from "../../components/admin/AdminUI.jsx";
import DataTable from "../../components/admin/TableFormat.jsx";
import Toggle from "../../components/admin/Toggle.jsx";
import Dropdown from "../../components/admin/Dropdown.jsx";
import IconButton from "../../components/admin/IconButton.jsx";
import { StatusPill } from "../../components/admin/ComboModal.jsx";

const OFFER_EMPTY = { title: "", description: "", imageUrl: "", imageFile: null, offerType: "percentage", value: "", minOrderValue: "", isActive: true, startDate: "", endDate: "", appliesTo: "all", productId: "", categoryId: "" };

// ── Confirm dialog ──────────────────────────────────────────────────────
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
// OFFER MODAL
// ══════════════════════════════════════════════════════════════════════
function OfferModal({ offer, categories, products, onClose, onSaved }) {
  const isEdit = !!offer?.id;
  const [form, setForm] = useState(offer ? { ...offer, imageFile: null } : { ...OFFER_EMPTY });
  const [previewUrl, setPreviewUrl] = useState(offer?.imageUrl || "");
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set("imageFile", file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const createOfferMutation = useCreateOffer();
  const updateOfferMutation = useUpdateOffer();
  const saving = createOfferMutation.isPending || updateOfferMutation.isPending;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.value) { setError("Title and value required"); return; }
    if (form.appliesTo === "product" && !form.productId) { setError("Please select a product"); return; }
    if (form.appliesTo === "category" && !form.categoryId) { setError("Please select a category"); return; }
    setError("");
    try {
      let res;
      if (isEdit) {
        res = await updateOfferMutation.mutateAsync({ id: offer.id, form });
      } else {
        res = await createOfferMutation.mutateAsync(form);
      }
      onSaved(res.offer || form);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white admin-modal-bg rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-display text-base font-bold text-gray-900">{isEdit ? "Edit Offer" : "Add Offer"}</h3>
          <IconButton onClick={onClose} aria-label="Close"><X size={18} /></IconButton>
        </div>
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-2.5">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="field-label">Title *</label><input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Monsoon Sale" className="field-input" /></div>
            <div><label className="field-label">Description</label><textarea value={form.description || ""} onChange={(e) => set("description", e.target.value)} rows={2} className="field-input resize-none" placeholder="Short offer description" /></div>
            <div>
              <label className="field-label">Offer Image</label>
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={24} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="offer-file-input" />
                  <label htmlFor="offer-file-input" className="inline-flex items-center px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors">
                    Choose Image
                  </label>
                  <p className="text-[10px] text-gray-400 mt-1">Recommended: 600×300. Max: 3MB.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="field-label">Applies To</label>
                <Dropdown
                  value={form.appliesTo || "all"}
                  onChange={(val) => {
                    set("appliesTo", val);
                    if (val === "all") {
                      set("productId", "");
                      set("categoryId", "");
                    } else if (val === "product") {
                      set("categoryId", "");
                      set("minOrderValue", "");
                    } else if (val === "category") {
                      set("productId", "");
                      set("minOrderValue", "");
                    }
                  }}
                  options={[
                    { value: "all", label: "Store-wide (all)" },
                    { value: "product", label: "Specific Product" },
                    { value: "category", label: "Specific Category" }
                  ]}
                />
              </div>

              {form.appliesTo === "product" && (
                <div className="col-span-2">
                  <label className="field-label">Product *</label>
                  <Dropdown
                    value={form.productId || ""}
                    onChange={(val) => set("productId", val)}
                    placeholder="Select product"
                    options={products.map((p) => ({ value: p.id, label: p.nameEn }))}
                  />
                </div>
              )}

              {form.appliesTo === "category" && (
                <div className="col-span-2">
                  <label className="field-label">Category *</label>
                  <Dropdown
                    value={form.categoryId || ""}
                    onChange={(val) => set("categoryId", val)}
                    placeholder="Select category"
                    options={categories.map((c) => ({ value: c.id, label: c.nameEn }))}
                  />
                </div>
              )}

              <div>
                <label className="field-label">Offer Type</label>
                <Dropdown
                  value={form.offerType}
                  onChange={(val) => set("offerType", val)}
                  options={[
                    { value: "percentage", label: "Percentage (%)" },
                    { value: "flat", label: "Flat (₹)" }
                  ]}
                />
              </div>
              <div><label className="field-label">Value *</label><input type="number" value={form.value} onChange={(e) => set("value", e.target.value)} placeholder={form.offerType === "percentage" ? "10" : "100"} className="field-input" /></div>
              {/* Min Order is only meaningful for store-wide offers — a per-product
                  or per-category price reduction never depends on cart value, and
                  the backend rejects a nonzero value for those scopes. */}
              {form.appliesTo === "all" && (
                <div><label className="field-label">Min Order (₹)</label><input type="number" value={form.minOrderValue || ""} onChange={(e) => set("minOrderValue", e.target.value)} placeholder="0" className="field-input" /></div>
              )}
              <div><label className="field-label">Start Date</label><input type="date" value={form.startDate || ""} onChange={(e) => set("startDate", e.target.value)} className="field-input" /></div>
              <div><label className="field-label">End Date</label><input type="date" value={form.endDate || ""} onChange={(e) => set("endDate", e.target.value)} className="field-input" /></div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Toggle checked={form.isActive} onChange={() => set("isActive", !form.isActive)} />
              <span className="font-body text-sm text-gray-700">{form.isActive ? "Active" : "Inactive"}</span>
            </label>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <AdminButton variant="outline" onClick={onClose} type="button">Cancel</AdminButton>
              <AdminButton type="submit" disabled={saving}>
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : isEdit ? "Update" : "Add Offer"}
              </AdminButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function OfferManagement() {
  const [offerModal, setOfferModal] = useState(null); // null | { data }
  const [deleteOfferTarget, setDeleteOfferTarget] = useState(null);

  const { data: offers = [], isLoading: offersLoading } = useAdminOfferList();
  const { data: categories = [] } = useProductCategories();
  const { data: productsData } = useAdminProductList({ limit: 100 });
  const products = productsData?.products || [];

  const deleteOfferMutation = useDeleteOffer();

  const handleConfirmDeleteOffer = async () => {
    if (!deleteOfferTarget) return;
    try {
      await deleteOfferMutation.mutateAsync(deleteOfferTarget.id);
      setDeleteOfferTarget(null);
    } catch (err) {
      console.error("Failed to delete offer:", err);
      setDeleteOfferTarget(null);
    }
  };

  const OFFER_COLS = [
    { key: "title", label: "Name", render: (r) => <span className="font-body text-sm font-semibold text-gray-900">{r.title}</span> },
    {
      key: "scope", label: "Scope", render: (r) => (
        <span className="badge-gray">
          {r.appliesTo === "product" ? `Product: ${r.productName || "—"}`
            : r.appliesTo === "category" ? `Category: ${r.categoryName || "—"}`
              : "Store-wide"}
        </span>
      )
    },
    {
      key: "value", label: "Type & Value", render: (r) => (
        <span className="font-num text-sm font-bold text-gray-900">
          {r.offerType === "percentage" ? `${r.value}% off${r.maxDiscount ? `, max ₹${r.maxDiscount}` : ""}` : `₹${r.value} off`}
        </span>
      )
    },
    { key: "status", label: "Status", render: (r) => <StatusPill isActive={r.isActive} startDate={r.startDate} endDate={r.endDate} /> },
    {
      key: "action", label: "", width: "80px", render: (r) => (
        <div className="flex gap-1">
          <IconButton onClick={() => setOfferModal({ data: r })} variant="brand" aria-label="Edit offer"><Pencil size={15} /></IconButton>
          <IconButton onClick={() => setDeleteOfferTarget({ id: r.id, name: r.title })} variant="danger" aria-label="Delete offer"><Trash2 size={15} /></IconButton>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-8">
      <AdminPage
        title="Price-Reduction Offers"
        action={<AdminButton onClick={() => setOfferModal({ data: null })}><Plus size={14} /> Add Offer</AdminButton>}
      >
        <DataTable columns={OFFER_COLS} rows={offers} loading={offersLoading} emptyText="No offers yet." />
      </AdminPage>

      {offerModal && (
        <OfferModal
          offer={offerModal.data}
          categories={categories}
          products={products}
          onClose={() => setOfferModal(null)}
          onSaved={() => {}}
        />
      )}

      <ConfirmDialog
        open={!!deleteOfferTarget}
        title="Delete Offer?"
        message={`Are you sure you want to delete "${deleteOfferTarget?.name}"? This action cannot be undone.`}
        loading={deleteOfferMutation.isPending}
        onCancel={() => setDeleteOfferTarget(null)}
        onConfirm={handleConfirmDeleteOffer}
      />
    </div>
  );
}
