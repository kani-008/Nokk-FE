import { useState, useEffect } from "react";
import {
  Plus, Pencil, Trash2, X, Image as ImageIcon,
  Eye, EyeOff, Loader2, Video,
} from "lucide-react";
import { bannerApi }    from "../../ApiCall/Api.jsx";
import { useAuthStore } from "../../components/store/AuthStore";
import {
  AdminPage, AdminButton, AdminCard,
} from "../../components/admin/AdminUI.jsx";

import comboImg from "../../assets/products/combo.jpg";

const PH = comboImg;

const EMPTY_FORM = { title: "", subtitle: "", imageUrl: "", videoUrl: "", linkUrl: "", sortOrder: 0, isActive: true };

// ── Banner form modal ──────────────────────────────────────────────────
function BannerModal({ banner, onClose, onSaved }) {
  const { token } = useAuthStore();
  const [form,   setForm]   = useState(banner ? { ...banner } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
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
          {/* preview */}
          <div className="w-full h-36 rounded-2xl overflow-hidden bg-gray-100 mb-5 border border-gray-200">
            {form.videoUrl ? (
              <video
                src={form.videoUrl}
                className="w-full h-full object-cover"
                muted autoPlay loop playsInline
                poster={form.imageUrl || undefined}
              />
            ) : form.imageUrl ? (
              <img
                src={form.imageUrl} alt="preview"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = PH; }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <ImageIcon size={28} className="text-gray-300" />
                <p className="font-body text-xs text-gray-400">Preview</p>
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
              <label className="field-label">Video URL <span className="text-gray-400 font-normal">(Supabase mp4)</span></label>
              <input type="url" value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://…/banner.mp4?token=…" className="field-input" />
            </div>
            <div>
              <label className="field-label">Image URL <span className="text-gray-400 font-normal">(fallback poster)</span></label>
              <input type="url" value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://…/banner.jpg?token=…" className="field-input" />
            </div>
            <div>
              <label className="field-label">Link URL</label>
              <input type="text" value={form.linkUrl} onChange={(e) => set("linkUrl", e.target.value)} placeholder="/products or https://… (where to link)" className="field-input" />
            </div>
            <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200 mt-2">
              <span className="font-body text-sm font-semibold text-gray-700">Active Status</span>
              <button
                type="button"
                onClick={() => set("isActive", !form.isActive)}
                aria-pressed={!!form.isActive}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  form.isActive ? "bg-brand-700" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    form.isActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
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
      {/* thumbnail */}
      <div className="relative h-36 bg-gray-100">
        {banner.videoUrl ? (
          <video
            src={banner.videoUrl}
            poster={banner.imageUrl || undefined}
            className="w-full h-full object-cover"
            muted autoPlay loop playsInline
          />
        ) : banner.imageUrl ? (
          <img
            src={banner.imageUrl} alt={banner.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = PH; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video size={32} className="text-gray-300" />
          </div>
        )}
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

// ── Overlay form modal ──────────────────────────────────────────────────
function OverlayModal({ overlay, onClose, onSaved }) {
  const [form, setForm] = useState(overlay ? { ...overlay } : { h1: "", p: "", linkUrl: "/products", isActive: true });
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.h1.trim()) { setError("Heading (h1) is required"); return; }
    if (!form.p.trim()) { setError("Paragraph (p) is required"); return; }
    
    const savedOverlay = overlay 
      ? { ...form }
      : { ...form, id: `ol-${Date.now()}` };
      
    onSaved(savedOverlay);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-modal-fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-modal-slide-up">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-display text-base font-bold text-gray-900">
            {overlay ? "Edit Text Overlay" : "Add Text Overlay"}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label">Heading overlay (h1) *</label>
              <input
                type="text"
                value={form.h1}
                onChange={(e) => set("h1", e.target.value)}
                placeholder="e.g. Authentic Dry Fish & Coastal Pickles"
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Paragraph overlay (p) *</label>
              <textarea
                value={form.p}
                onChange={(e) => set("p", e.target.value)}
                placeholder="e.g. Sourced directly from Rameswaram fishermen — traditionally sun-dried, naturally preserved."
                rows={3}
                className="field-input resize-none"
              />
            </div>
            <div>
              <label className="field-label">Link URL</label>
              <input
                type="text"
                value={form.linkUrl}
                onChange={(e) => set("linkUrl", e.target.value)}
                placeholder="e.g. /products or /offers"
                className="field-input"
              />
            </div>
            <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200 mt-2">
              <span className="font-body text-sm font-semibold text-gray-700">Active Status</span>
              <button
                type="button"
                onClick={() => set("isActive", !form.isActive)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  form.isActive ? "bg-brand-700" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    form.isActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <AdminButton variant="outline" onClick={onClose} type="button">Cancel</AdminButton>
              <AdminButton type="submit">Save Overlay</AdminButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Overlay card ────────────────────────────────────────────────────────
function OverlayCard({ overlay, onEdit, onDelete, onToggle }) {
  return (
    <div className={`bg-white border rounded-2xl p-5 flex flex-col justify-between transition-opacity ${overlay.isActive ? "border-gray-100" : "border-gray-100 opacity-60"}`}>
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="font-num text-[10px] uppercase font-bold text-sandal-600 bg-sandal-100 px-2 py-0.5 rounded">h1 & p overlay</span>
          <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full font-num ${
            overlay.isActive ? "bg-green-500 text-white" : "bg-gray-400 text-white"
          }`}>
            {overlay.isActive ? "Active" : "Inactive"}
          </div>
        </div>
        <h4 className="font-display text-gray-900 text-base font-bold leading-snug line-clamp-2">{overlay.h1}</h4>
        <p className="font-body text-gray-500 text-xs leading-relaxed line-clamp-3">{overlay.p}</p>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        <p className="font-body text-[11px] text-gray-400 truncate flex-1">
          Link: <span className="text-brand-700 font-medium">{overlay.linkUrl || "/products"}</span>
        </p>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onToggle(overlay.id)}
            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title={overlay.isActive ? "Deactivate" : "Activate"}
          >
            {overlay.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button
            onClick={() => onEdit(overlay)}
            className="p-1.5 text-gray-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(overlay.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={14} />
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
  
  const [activeTab, setActiveTab] = useState("videos");
  const [overlays, setOverlays] = useState([]);
  const [overlayModal, setOverlayModal] = useState(null); // null | "new" | overlay object

  // load banners from API
  useEffect(() => {
    setLoading(true);
    bannerApi.all(token)
      .then((r) => setBanners((r.banners || []).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  // load overlays from localStorage
  useEffect(() => {
    const DEFAULT_OVERLAYS = [
      {
        id: "ol-1",
        h1: "Authentic Dry Fish & Coastal Pickles",
        p: "Sourced directly from Rameswaram fishermen — traditionally sun-dried, naturally preserved.",
        linkUrl: "/products",
        isActive: true,
      },
      {
        id: "ol-2",
        h1: "Special Combo Packs Available",
        p: "Taste our curated coastal combo selections. Cleaned, prepped, and ready to cook.",
        linkUrl: "/products?category=combos",
        isActive: true,
      },
      {
        id: "ol-3",
        h1: "Free Shipping on Orders over ₹499",
        p: "Get fresh catch dry fish delivered to your doorstep across India with zero delivery fees.",
        linkUrl: "/offers",
        isActive: true,
      },
    ];

    const local = localStorage.getItem("nok-mock-text-overlays");
    if (local) {
      setOverlays(JSON.parse(local));
    } else {
      setOverlays(DEFAULT_OVERLAYS);
      localStorage.setItem("nok-mock-text-overlays", JSON.stringify(DEFAULT_OVERLAYS));
    }
  }, []);

  const saveOverlays = (next) => {
    setOverlays(next);
    localStorage.setItem("nok-mock-text-overlays", JSON.stringify(next));
  };

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

  const handleOverlaySaved = (item) => {
    let next;
    const idx = overlays.findIndex((o) => o.id === item.id);
    if (idx >= 0) {
      next = [...overlays];
      next[idx] = item;
    } else {
      next = [...overlays, item];
    }
    saveOverlays(next);
  };

  const handleOverlayDelete = (id) => {
    if (confirm("Delete this text overlay?")) {
      const next = overlays.filter((o) => o.id !== id);
      saveOverlays(next);
    }
  };

  const handleOverlayToggle = (id) => {
    const next = overlays.map((o) => o.id === id ? { ...o, isActive: !o.isActive } : o);
    saveOverlays(next);
  };

  const active   = banners.filter((b) => b.isActive).length;
  const inactive = banners.filter((b) => !b.isActive).length;

  const activeOverlays = overlays.filter((o) => o.isActive).length;
  const inactiveOverlays = overlays.filter((o) => !o.isActive).length;

  return (
    <AdminPage
      title="Banners"
      sub="Manage background videos and slide text overlays"
      action={
        activeTab === "videos" ? (
          <AdminButton onClick={() => setModal("new")}>
            <Plus size={15} /> Add Video
          </AdminButton>
        ) : (
          <AdminButton onClick={() => setOverlayModal("new")}>
            <Plus size={15} /> Add Overlay Text
          </AdminButton>
        )
      }
    >
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-150 mb-6">
        <button
          onClick={() => setActiveTab("videos")}
          className={`pb-2.5 px-4 font-body text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "videos"
              ? "border-brand-700 text-brand-900 font-bold"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Background Videos
        </button>
        <button
          onClick={() => setActiveTab("overlays")}
          className={`pb-2.5 px-4 font-body text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "overlays"
              ? "border-brand-700 text-brand-900 font-bold"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Slide Text Overlays
        </button>
      </div>

      {activeTab === "videos" ? (
        <>
          {/* summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <AdminCard className="text-center py-4">
              <p className="font-num text-2xl font-bold text-gray-900">{banners.length}</p>
              <p className="font-body text-xs text-gray-500 mt-1">Total Videos</p>
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
        </>
      ) : (
        <>
          {/* summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <AdminCard className="text-center py-4">
              <p className="font-num text-2xl font-bold text-gray-900">{overlays.length}</p>
              <p className="font-body text-xs text-gray-500 mt-1">Total Overlays</p>
            </AdminCard>
            <AdminCard className="text-center py-4">
              <p className="font-num text-2xl font-bold text-green-600">{activeOverlays}</p>
              <p className="font-body text-xs text-gray-500 mt-1">Active</p>
            </AdminCard>
            <AdminCard className="text-center py-4">
              <p className="font-num text-2xl font-bold text-gray-400">{inactiveOverlays}</p>
              <p className="font-body text-xs text-gray-500 mt-1">Inactive</p>
            </AdminCard>
          </div>

          {/* overlays grid */}
          {overlays.length === 0 ? (
            <AdminCard className="text-center py-16">
              <ImageIcon size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="font-body text-gray-400 text-sm">No text overlays configured. Add your first overlay.</p>
            </AdminCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {overlays.map((o) => (
                <OverlayCard
                  key={o.id}
                  overlay={o}
                  onEdit={(o) => setOverlayModal(o)}
                  onDelete={handleOverlayDelete}
                  onToggle={handleOverlayToggle}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* modal for banners */}
      {modal !== null && (
        <BannerModal
          banner={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {/* modal for overlays */}
      {overlayModal !== null && (
        <OverlayModal
          overlay={overlayModal === "new" ? null : overlayModal}
          onClose={() => setOverlayModal(null)}
          onSaved={handleOverlaySaved}
        />
      )}
    </AdminPage>
  );
}