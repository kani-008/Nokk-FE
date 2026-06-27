import { useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import {
  useAdminOfferList,
  useAdminCouponList,
  useSaveOffer,
  useSaveCoupon,
  useDeleteOffer,
  useDeleteCoupon
} from "../../hooks/queries/useOffers";
import {
  AdminPage, AdminButton,
} from "../../components/admin/AdminUI.jsx";
import DataTable from "../../components/admin/TableFormat.jsx";
import Toggle from "../../components/admin/Toggle.jsx";

const OFFER_EMPTY = { title: "", description: "", imageUrl: "", offerType: "percentage", value: "", code: "", minOrderValue: "", isActive: true, startDate: "", endDate: "" };
const COUPON_EMPTY = { code: "", discountType: "percentage", discountValue: "", minOrderValue: "", maxUsageCount: "", isActive: true, expiresAt: "" };
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";



// ── Offer modal ────────────────────────────────────────────────────────
function OfferModal({ offer, onClose, onSaved }) {
  const isEdit = !!offer?.id;
  const [form, setForm] = useState(offer ? { ...offer } : { ...OFFER_EMPTY });
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const saveOfferMutation = useSaveOffer();
  const saving = saveOfferMutation.isPending;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.value) { setError("Title and value required"); return; }
    setError("");
    try {
      const res = await saveOfferMutation.mutateAsync({ id: offer?.id, form });
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
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-2.5">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="field-label">Title *</label><input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Monsoon Sale" className="field-input" /></div>
            <div><label className="field-label">Description</label><textarea value={form.description || ""} onChange={(e) => set("description", e.target.value)} rows={2} className="field-input resize-none" placeholder="Short offer description" /></div>
            <div><label className="field-label">Image URL</label><input value={form.imageUrl || ""} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://…" className="field-input" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Offer Type</label>
                <select value={form.offerType} onChange={(e) => set("offerType", e.target.value)} className="field-input">
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
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

  const saveCouponMutation = useSaveCoupon();
  const saving = saveCouponMutation.isPending;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.discountValue) { setError("Code and discount value required"); return; }
    setError("");
    try {
      const res = await saveCouponMutation.mutateAsync({ id: coupon?.id, form });
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
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-2.5">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="field-label">Coupon Code *</label><input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="SAVE20" className="field-input font-num tracking-widest" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Type</label>
                <select value={form.discountType} onChange={(e) => set("discountType", e.target.value)} className="field-input">
                  <option value="percentage">Percentage</option>
                  <option value="flat">Flat</option>
                </select>
              </div>
              <div><label className="field-label">Value *</label><input type="number" value={form.discountValue} onChange={(e) => set("discountValue", e.target.value)} placeholder="20" className="field-input" /></div>
              <div><label className="field-label">Min Order (₹)</label><input type="number" value={form.minOrderValue || ""} onChange={(e) => set("minOrderValue", e.target.value)} placeholder="0" className="field-input" /></div>
              <div><label className="field-label">Max Uses</label><input type="number" value={form.maxUsageCount || ""} onChange={(e) => set("maxUsageCount", e.target.value)} placeholder="Unlimited" className="field-input" /></div>
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

// ══════════════════════════════════════════════════════════════════════
export default function OfferManagement() {
  const [tab, setTab] = useState("offers");
  const [modal, setModal] = useState(null);

  const { data: offers = [], isLoading: offersLoading } = useAdminOfferList();
  const { data: coupons = [], isLoading: couponsLoading } = useAdminCouponList();
  const loading = offersLoading || couponsLoading;

  const deleteOfferMutation = useDeleteOffer();
  const deleteCouponMutation = useDeleteCoupon();

  const handleDeleteOffer = async (id) => {
    if (!confirm("Delete this offer?")) return;
    try {
      await deleteOfferMutation.mutateAsync(id);
    } catch (err) {
      console.error("Failed to delete offer:", err);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await deleteCouponMutation.mutateAsync(id);
    } catch (err) {
      console.error("Failed to delete coupon:", err);
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
          <button onClick={() => setModal({ type: "offer", data: r })} className="p-1.5 text-gray-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg"><Pencil size={15} /></button>
          <button onClick={() => handleDeleteOffer(r.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
        </div>
      )
    },
  ];

  const COUPON_COLS = [
    { key: "code", label: "Code", render: (r) => <span className="font-num text-sm font-bold text-brand-900 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">{r.code}</span> },
    { key: "discountType", label: "Type", render: (r) => <span className="badge-amber capitalize">{r.discountType}</span> },
    { key: "discountValue", label: "Value", render: (r) => <span className="font-num text-sm font-bold text-gray-900">{r.discountType === "percentage" ? `${r.discountValue}%` : `₹${r.discountValue}`}</span> },
    { key: "minOrderValue", label: "Min Order", render: (r) => <span className="font-num text-sm text-gray-600">{r.minOrderValue > 0 ? `₹${r.minOrderValue}` : "None"}</span> },
    { key: "usageCount", label: "Used", render: (r) => <span className="font-num text-sm text-gray-600">{r.usageCount ?? 0}{r.maxUsageCount ? `/${r.maxUsageCount}` : ""}</span> },
    { key: "expiresAt", label: "Expires", render: (r) => <span className="font-body text-xs text-gray-400">{fmtDate(r.expiresAt)}</span> },
    { key: "isActive", label: "Status", render: (r) => <span className={r.isActive ? "badge-green" : "badge-gray"}>{r.isActive ? "Active" : "Inactive"}</span> },
    {
      key: "action", label: "", width: "80px", render: (r) => (
        <div className="flex gap-1">
          <button onClick={() => setModal({ type: "coupon", data: r })} className="p-1.5 text-gray-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg"><Pencil size={15} /></button>
          <button onClick={() => handleDeleteCoupon(r.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
        </div>
      )
    },
  ];

  return (
    <AdminPage
      action={
        <div className="flex gap-2">
          <AdminButton size="sm" variant="outline" onClick={() => setModal({ type: "coupon", data: null })}>
            <Plus size={14} /> Coupon
          </AdminButton>
          <AdminButton size="sm" onClick={() => setModal({ type: "offer", data: null })}>
            <Plus size={14} /> Offer
          </AdminButton>
        </div>
      }
    >
      {/* tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[{ key: "offers", label: `Offers (${offers.length})` }, { key: "coupons", label: `Coupons (${coupons.length})` }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`font-body text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "offers" && <DataTable columns={OFFER_COLS} rows={offers} loading={loading} emptyText="No offers yet." />}
      {tab === "coupons" && <DataTable columns={COUPON_COLS} rows={coupons} loading={loading} emptyText="No coupons yet." />}

      {modal?.type === "offer" && <OfferModal offer={modal.data} onClose={() => setModal(null)} onSaved={upsertOffer} />}
      {modal?.type === "coupon" && <CouponModal coupon={modal.data} onClose={() => setModal(null)} onSaved={upsertCoupon} />}
    </AdminPage>
  );
}