import { useState, useEffect } from "react";
import {
  Plus, Pencil, Trash2, X, Image as ImageIcon,
  Eye, EyeOff, GripVertical, Loader2,
} from "lucide-react";
import { bannerApi }    from "../../ApiCall/Api.jsx";
import { useAuthStore } from "../../components/store/AuthStore";
import {
  AdminPage, AdminButton, AdminCard,
} from "../../components/admin/AdminUI.jsx";

const PH = "https://placehold.co/600x240/92400e/fef3c7?text=Banner";

const EMPTY_FORM = { title: "", subtitle: "", imageUrl: "", linkUrl: "", sortOrder: 0, isActive: true };

// ── Banner form modal ──────────────────────────────────────────────────
function BannerModal({ banner, onClose, onSaved }) {
  const { token } = useAuthStore();
  const [form,   setForm]   = useState(banner ? { ...banner } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim())    { setError("Title is required"); return; }
    if (!form.imageUrl.trim()) { setError("Image URL is required"); return; }
    setSaving(true);
    setError("");
    try {
      let res;
      if (banner?.id) res = await bannerApi.update(banner.id, form, token);
      else            res = await bannerApi.create(form, token);
      onSaved(res.banner || form);
      onClose();
    } catch (e) { setError(e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-display text-base font-bold text-gray-900">
            {banner ? "Edit Banner" : "Add Banner"}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {/* image preview */}
          <div className="w-full h-36 rounded-2xl overflow-hidden bg-gray-100 mb-5 border border-gray-200">
            {form.imageUrl ? (
              <img
                src={form.imageUrl} alt="preview"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = PH; }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <ImageIcon size={28} className="text-gray-300" />
                <p className="font-body text-xs text-gray-400">Image preview</p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label">Title *</label>
              <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Banner headline" className="field-input" />
            </div>
            <div>
              <label className="field-label">Subtitle</label>
              <input type="text" value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="Supporting text" className="field-input" />
            </div>
            <div>
              <label className="field-label">Image URL *</label>
              <input type="url" value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://…/banner.jpg" className="field-input" />
            </div>
            <div>
              <label className="field-label">Link URL</label>
              <input type="url" value={form.linkUrl} onChange={(e) => set("linkUrl", e.target.value)} placeholder="https://… (where to link)" className="field-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Sort Order</label>
                <input type="number" min={0} value={form.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} className="field-input" />
              </div>
              <div className="flex flex-col justify-end pb-0.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => set("isActive", !form.isActive)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${form.isActive ? "bg-brand-700" : "bg-gray-300"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${form.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="font-body text-sm text-gray-700">{form.isActive ? "Active" : "Inactive"}</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <AdminButton variant="outline" onClick={onClose} type="button">Cancel</AdminButton>
              <AdminButton type="submit" disabled={saving}>
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save Banner"}
              </AdminButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Banner card ────────────────────────────────────────────────────────
function BannerCard({ banner, onEdit, onDelete, onToggle }) {
  const { token } = useAuthStore();
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await bannerApi.update(banner.id, { ...banner, isActive: !banner.isActive }, token);
      onToggle(banner.id, !banner.isActive);
    } catch (e) { alert(e.message || "Failed"); }
    finally { setToggling(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete banner "${banner.title}"?`)) return;
    setDeleting(true);
    try {
      await bannerApi.remove(banner.id, token);
      onDelete(banner.id);
    } catch (e) { alert(e.message || "Failed to delete"); }
    finally { setDeleting(false); }
  };

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-opacity ${banner.isActive ? "border-gray-100" : "border-gray-100 opacity-60"}`}>
      {/* image */}
      <div className="relative h-36 bg-gray-100">
        <img
          src={banner.imageUrl || PH} alt={banner.title}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = PH; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="font-display text-white text-sm font-bold leading-snug line-clamp-1">{banner.title}</p>
          {banner.subtitle && <p className="font-body text-white/80 text-xs mt-0.5 line-clamp-1">{banner.subtitle}</p>}
        </div>
        {/* status pill */}
        <div className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full font-num ${
          banner.isActive ? "bg-green-500 text-white" : "bg-gray-400 text-white"
        }`}>
          {banner.isActive ? "Active" : "Inactive"}
        </div>
        {/* sort order */}
        <div className="absolute top-2 right-2 bg-black/40 text-white text-[10px] font-num px-1.5 py-0.5 rounded-md">
          #{banner.sortOrder ?? 0}
        </div>
      </div>

      {/* actions */}
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <p className="font-body text-xs text-gray-400 truncate flex-1">
          {banner.linkUrl ? (
            <a href={banner.linkUrl} target="_blank" rel="noreferrer" className="hover:text-brand-700 truncate block">
              {banner.linkUrl}
            </a>
          ) : "No link set"}
        </p>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleToggle}
            disabled={toggling}
            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title={banner.isActive ? "Deactivate" : "Activate"}
          >
            {banner.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
          <button
            onClick={() => onEdit(banner)}
            className="p-1.5 text-gray-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// BANNERS PAGE
// ══════════════════════════════════════════════════════════════════════
export default function BannerManagement() {
  const { token } = useAuthStore();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // null | "new" | banner object

  useEffect(() => {
    setLoading(true);
    bannerApi.all(token)
      .then((r) => setBanners((r.banners || []).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleSaved = (banner) => {
    setBanners((prev) => {
      const idx = prev.findIndex((b) => b.id === banner.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = banner; return next; }
      return [...prev, banner];
    });
  };

  const handleDelete = (id) => setBanners((prev) => prev.filter((b) => b.id !== id));

  const handleToggle = (id, isActive) =>
    setBanners((prev) => prev.map((b) => b.id === id ? { ...b, isActive } : b));

  const active   = banners.filter((b) => b.isActive).length;
  const inactive = banners.filter((b) => !b.isActive).length;

  return (
    <AdminPage
      title="Banners"
      sub="Manage homepage and promotional banners"
      action={
        <AdminButton onClick={() => setModal("new")}>
          <Plus size={15} /> Add Banner
        </AdminButton>
      }
    >
      {/* summary */}
      <div className="grid grid-cols-3 gap-4">
        <AdminCard className="text-center py-4">
          <p className="font-num text-2xl font-bold text-gray-900">{banners.length}</p>
          <p className="font-body text-xs text-gray-500 mt-1">Total</p>
        </AdminCard>
        <AdminCard className="text-center py-4">
          <p className="font-num text-2xl font-bold text-green-600">{active}</p>
          <p className="font-body text-xs text-gray-500 mt-1">Active</p>
        </AdminCard>
        <AdminCard className="text-center py-4">
          <p className="font-num text-2xl font-bold text-gray-400">{inactive}</p>
          <p className="font-body text-xs text-gray-500 mt-1">Inactive</p>
        </AdminCard>
      </div>

      {/* banner grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
              <div className="h-36 skeleton" />
              <div className="p-4 space-y-2">
                <div className="h-3 skeleton w-3/4" />
                <div className="h-3 skeleton w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : banners.length === 0 ? (
        <AdminCard className="text-center py-16">
          <ImageIcon size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="font-body text-gray-400 text-sm">No banners yet. Add your first banner.</p>
        </AdminCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {banners.map((b) => (
            <BannerCard
              key={b.id}
              banner={b}
              onEdit={(b) => setModal(b)}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* modal */}
      {modal !== null && (
        <BannerModal
          banner={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </AdminPage>
  );
}