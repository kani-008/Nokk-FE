import { useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2, AlertTriangle } from "lucide-react";
import {
  useAdminOfferList,
  useAdminCouponList,
  useCreateOffer,
  useUpdateOffer,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteOffer,
  useDeleteCoupon
} from "../../hookqueries/useOffers";
import { useProductCategories, useAdminProductList } from "../../hookqueries/useProducts";
import {
  AdminPage, AdminButton,
} from "../../components/admin/AdminUI.jsx";
import DataTable from "../../components/admin/TableFormat.jsx";
import Toggle from "../../components/admin/Toggle.jsx";
import Dropdown from "../../components/admin/Dropdown.jsx";
import IconButton from "../../components/admin/IconButton.jsx";
import TabToggle from "../../components/admin/TabToggle.jsx";

const OFFER_EMPTY = { title: "", description: "", imageUrl: "", offerType: "percentage", value: "", code: "", minOrderValue: "", isActive: true, startDate: "", endDate: "", appliesTo: "all", productId: "", categoryId: "" };
const COUPON_EMPTY = { code: "", discountType: "percentage", discountValue: "", minOrderValue: "", maxUsageCount: "", maxUsesPerUser: "", isActive: true, expiresAt: "" };
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

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

// ── Offer modal ────────────────────────────────────────────────────────
function OfferModal({ offer, categories, products, onClose, onSaved }) {
  const isEdit = !!offer?.id;
  const [form, setForm] = useState(offer ? { ...offer } : { ...OFFER_EMPTY });
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-display text-base font-bold text-gray-900">{isEdit ? "Edit Offer" : "Add Offer"}</h3>
          <IconButton onClick={onClose} aria-label="Close"><X size={18} /></IconButton>
        </div>
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-2.5">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="field-label">Title *</label><input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Monsoon Sale" className="field-input" /></div>
            <div><label className="field-label">Description</label><textarea value={form.description || ""} onChange={(e) => set("description", e.target.value)} rows={2} className="field-input resize-none" placeholder="Short offer description" /></div>
            <div><label className="field-label">Image URL</label><input value={form.imageUrl || ""} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://…" className="field-input" /></div>
            
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
                    } else if (val === "category") {
                      set("productId", "");
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
              <div><label className="field-label">Coupon Code</label><input value={form.code || ""} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="MONSOON10" className="field-input font-num" /></div>
              <div><label className="field-label">Min Order (₹)</label><input type="number" value={form.minOrderValue || ""} onChange={(e) => set("minOrderValue", e.target.value)} placeholder="0" className="field-input" /></div>
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

// ── Coupon modal ───────────────────────────────────────────────────────
function CouponModal({ coupon, onClose, onSaved }) {
  const isEdit = !!coupon?.id;
  const [form, setForm] = useState(coupon ? { ...coupon } : { ...COUPON_EMPTY });
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const createCouponMutation = useCreateCoupon();
  const updateCouponMutation = useUpdateCoupon();
  const saving = createCouponMutation.isPending || updateCouponMutation.isPending;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.discountType !== "free_shipping" && (!form.code.trim() || !form.discountValue)) {
      setError("Code and discount value required");
      return;
    }
    if (form.discountType === "free_shipping" && !form.code.trim()) {
      setError("Code is required");
      return;
    }
    setError("");
    try {
      let res;
      if (isEdit) {
        res = await updateCouponMutation.mutateAsync({ id: coupon.id, form });
      } else {
        res = await createCouponMutation.mutateAsync(form);
      }
      onSaved(res.coupon || form);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-display text-base font-bold text-gray-900">{isEdit ? "Edit Coupon" : "Add Coupon"}</h3>
          <IconButton onClick={onClose} aria-label="Close"><X size={18} /></IconButton>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-2.5">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="field-label">Coupon Code *</label><input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="SAVE20" className="field-input font-num tracking-widest" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Type</label>
                <Dropdown
                  value={form.discountType}
                  onChange={(val) => {
                    set("discountType", val);
                    if (val === "free_shipping") {
                      set("discountValue", 0);
                    }
                  }}
                  options={[
                    { value: "percentage", label: "Percentage" },
                    { value: "flat", label: "Flat" },
                    { value: "free_shipping", label: "Free Shipping Only" }
                  ]}
                />
              </div>
              <div><label className="field-label">Value *</label><input type="number" value={form.discountValue} onChange={(e) => set("discountValue", e.target.value)} placeholder="20" className="field-input" /></div>
              <div><label className="field-label">Min Order (₹)</label><input type="number" value={form.minOrderValue || ""} onChange={(e) => set("minOrderValue", e.target.value)} placeholder="0" className="field-input" /></div>
              <div><label className="field-label">Max Uses</label><input type="number" value={form.maxUsageCount || ""} onChange={(e) => set("maxUsageCount", e.target.value)} placeholder="Unlimited" className="field-input" /></div>
              <div><label className="field-label">Max Uses Per User</label><input type="number" value={form.maxUsesPerUser || ""} onChange={(e) => set("maxUsesPerUser", e.target.value)} placeholder="Unlimited" className="field-input" /></div>
              <div className="col-span-2"><label className="field-label">Expires At</label><input type="date" value={form.expiresAt || ""} onChange={(e) => set("expiresAt", e.target.value)} className="field-input" /></div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Toggle checked={form.isActive} onChange={() => set("isActive", !form.isActive)} />
              <span className="font-body text-sm text-gray-700">{form.isActive ? "Active" : "Inactive"}</span>
            </label>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <AdminButton variant="outline" onClick={onClose} type="button">Cancel</AdminButton>
              <AdminButton type="submit" disabled={saving}>
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : isEdit ? "Update" : "Add Coupon"}
              </AdminButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ──════════════════════════════════════════════════════════════════════
export default function OfferManagement() {
  const [tab, setTab] = useState("offers");
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: "offer"|"coupon", id, name }

  const { data: offers = [], isLoading: offersLoading } = useAdminOfferList();
  const { data: coupons = [], isLoading: couponsLoading } = useAdminCouponList();
  const { data: catData = [] } = useProductCategories();
  const categories = catData;
  const { data: productsData } = useAdminProductList({ limit: 100 });
  const products = productsData?.products || [];
  const loading = offersLoading || couponsLoading;

  const deleteOfferMutation = useDeleteOffer();
  const deleteCouponMutation = useDeleteCoupon();
  const deleting = deleteOfferMutation.isPending || deleteCouponMutation.isPending;

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "offer") {
        await deleteOfferMutation.mutateAsync(deleteTarget.id);
      } else {
        await deleteCouponMutation.mutateAsync(deleteTarget.id);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error(`Failed to delete ${deleteTarget.type}:`, err);
      setDeleteTarget(null);
    }
  };

  const upsertOffer = () => {};
  const upsertCoupon = () => {};

  const OFFER_COLS = [
    { key: "title", label: "Title", render: (r) => <span className="font-body text-sm font-semibold text-gray-900">{r.title}</span> },
    { key: "offerType", label: "Type", render: (r) => <span className="badge-amber capitalize">{r.offerType}</span> },
    { key: "value", label: "Value", render: (r) => <span className="font-num text-sm font-bold text-gray-900">{r.offerType === "percentage" ? `${r.value}%` : `₹${r.value}`}</span> },
    { key: "code", label: "Code", render: (r) => r.code ? <span className="font-num text-xs bg-gray-100 px-2 py-0.5 rounded-lg">{r.code}</span> : <span className="text-gray-400">—</span> },
    { key: "endDate", label: "Expires", render: (r) => <span className="font-body text-xs text-gray-400">{fmtDate(r.endDate)}</span> },
    { key: "isActive", label: "Status", render: (r) => <span className={r.isActive ? "badge-green" : "badge-gray"}>{r.isActive ? "Active" : "Inactive"}</span> },
    {
      key: "action", label: "", width: "80px", render: (r) => (
        <div className="flex gap-1">
          <IconButton onClick={() => setModal({ type: "offer", data: r })} variant="brand" aria-label="Edit offer"><Pencil size={15} /></IconButton>
          <IconButton onClick={() => setDeleteTarget({ type: "offer", id: r.id, name: r.title })} variant="danger" aria-label="Delete offer"><Trash2 size={15} /></IconButton>
        </div>
      )
    },
  ];

  const COUPON_COLS = [
    { key: "code", label: "Code", render: (r) => <span className="font-num text-sm font-bold text-brand-900 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">{r.code}</span> },
    { key: "discountType", label: "Type", render: (r) => <span className="badge-amber capitalize">{r.discountType === "free_shipping" ? "Free Shipping" : r.discountType}</span> },
    { key: "discountValue", label: "Value", render: (r) => <span className="font-num text-sm font-bold text-gray-900">{r.discountType === "percentage" ? `${r.discountValue}%` : r.discountType === "free_shipping" ? "Free Shipping" : `₹${r.discountValue}`}</span> },
    { key: "minOrderValue", label: "Min Order", render: (r) => <span className="font-num text-sm text-gray-600">{r.minOrderValue > 0 ? `₹${r.minOrderValue}` : "None"}</span> },
    { key: "usageCount", label: "Used", render: (r) => <span className="font-num text-sm text-gray-600">{r.usageCount ?? 0}{r.maxUsageCount ? `/${r.maxUsageCount}` : ""}{r.maxUsesPerUser ? ` (Max ${r.maxUsesPerUser}/user)` : ""}</span> },
    { key: "expiresAt", label: "Expires", render: (r) => <span className="font-body text-xs text-gray-400">{fmtDate(r.expiresAt)}</span> },
    { key: "isActive", label: "Status", render: (r) => <span className={r.isActive ? "badge-green" : "badge-gray"}>{r.isActive ? "Active" : "Inactive"}</span> },
    {
      key: "action", label: "", width: "80px", render: (r) => (
        <div className="flex gap-1">
          <IconButton onClick={() => setModal({ type: "coupon", data: r })} variant="brand" aria-label="Edit coupon"><Pencil size={15} /></IconButton>
          <IconButton onClick={() => setDeleteTarget({ type: "coupon", id: r.id, name: r.code })} variant="danger" aria-label="Delete coupon"><Trash2 size={15} /></IconButton>
        </div>
      )
    },
  ];

  return (
    <AdminPage className="space-y-3">

      {/* Row 1 (mobile) / Left & Right side (desktop) */}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between w-full mb-4">
        {/* Tabs */}
        <TabToggle
          tabs={[
            { key: "offers",  label: `Offers (${offers.length})` },
            { key: "coupons", label: `Coupons (${coupons.length})` },
          ]}
          active={tab}
          onChange={setTab}
          tabClassName="om-tabs-fluid"
        />

        {/* Action Buttons */}
        <div className="flex gap-2 w-full sm:w-auto">
          <AdminButton
            variant="outline"
            onClick={() => setModal({ type: "coupon", data: null })}
            className="om-btn-fluid flex-1 sm:flex-none"
          >
            <Plus size={14} /> Coupon
          </AdminButton>
          <AdminButton
            onClick={() => setModal({ type: "offer", data: null })}
            className="om-btn-fluid flex-1 sm:flex-none"
          >
            <Plus size={14} /> Offer
          </AdminButton>
        </div>
      </div>

      {tab === "offers" && <DataTable columns={OFFER_COLS} rows={offers} loading={loading} emptyText="No offers yet." />}
      {tab === "coupons" && <DataTable columns={COUPON_COLS} rows={coupons} loading={loading} emptyText="No coupons yet." />}

      {modal?.type === "offer" && (
        <OfferModal
          offer={modal.data}
          categories={categories}
          products={products}
          onClose={() => setModal(null)}
          onSaved={upsertOffer}
        />
      )}
      {modal?.type === "coupon" && <CouponModal coupon={modal.data} onClose={() => setModal(null)} onSaved={upsertCoupon} />}

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.type === "coupon" ? "Coupon" : "Offer"}?`}
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </AdminPage>
  );
}