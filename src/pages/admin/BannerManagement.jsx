import { useState, useEffect, useRef } from "react";
import {
  Plus, Pencil, Trash2, X, Image as ImageIcon,
  Eye, EyeOff, Loader2, Video, Upload, Link as LinkIcon,
} from "lucide-react";
import API from "../../ApiCall/Api.jsx";
import {
  AdminPage, AdminButton, AdminCard,
} from "../../components/admin/AdminUI.jsx";
import comboImg from "../../assets/products/combo.jpg";

const PH = comboImg;

const EMPTY_FORM = { title: "", subtitle: "", imageUrl: "", videoUrl: "", isActive: true };

// responsive icon size: bigger on mobile, compact on desktop
const ICON_CLS = "w-5 h-5 sm:w-[15px] sm:h-[15px]";
// responsive touch target for the action buttons
const ACTION_BTN = "p-2.5 sm:p-1.5 rounded-lg transition-colors";

// ── File upload + URL field ────────────────────────────────────────────
// Kept outside BannerModal so React never remounts it mid-render.
function FileField({ kind, label, accept, inputRef, url, status, onUpload, onUrlChange }) {
  return (
    <div className="space-y-1.5">
      <label className="field-label block">{label}</label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={status === "uploading"}
          className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition-colors disabled:opacity-50 ${
            status === "done"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100"
          }`}
        >
          {status === "uploading"
            ? <><Loader2 size={14} className="animate-spin" /> Uploading…</>
            : status === "done"
            ? <><Upload size={14} /> Uploaded ✓</>
            : <><Upload size={14} /> Upload {kind === "video" ? "Video" : "Image"}</>
          }
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={onUpload}
        />
      </div>
      <div className="relative">
        <LinkIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="url"
          value={url}
          onChange={onUrlChange}
          placeholder={`Or paste ${kind} URL directly…`}
          className="field-input pl-8 font-mono text-xs"
        />
      </div>
    </div>
  );
}

// ── Banner form modal ──────────────────────────────────────────────────
function BannerModal({ banner, onClose, onSaved }) {
  const [form,     setForm]     = useState(banner ? { ...banner } : { ...EMPTY_FORM });
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  // "uploading" | "done" | null
  const [uploading, setUploading] = useState({ video: null, image: null });

  const videoInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleFileUpload = async (e, kind) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading((u) => ({ ...u, [kind]: "uploading" }));
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);
      const response = await API.post("/upload/banner", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log(response.data);
      const url = response.data.url;
      set(kind === "video" ? "videoUrl" : "imageUrl", url);
      setUploading((u) => ({ ...u, [kind]: "done" }));
    } catch (err) {
      setError(`${kind} upload failed: ${err.message}`);
      setUploading((u) => ({ ...u, [kind]: null }));
    }
    e.target.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.imageUrl)     { setError("Poster image is required — upload a file or paste a URL"); return; }
    setSaving(true);
    setError("");
    try {
      const res = banner?.id
        ? await API.put("/banners/update-banner", { id: banner.id, ...form })
        : await API.post("/banners/create-banner", form);
      console.log(res.data);
      onSaved(res.data.banner || form);
      onClose();
    } catch (err) { setError(err.response?.data?.message || err.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const isUploading = uploading.video === "uploading" || uploading.image === "uploading";

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
          {/* live preview */}
          <div className="w-full h-36 rounded-2xl overflow-hidden bg-gray-100 mb-5 border border-gray-200">
            {form.videoUrl ? (
              <video src={form.videoUrl} className="w-full h-full object-cover"
                muted autoPlay loop playsInline poster={form.imageUrl || undefined} />
            ) : form.imageUrl ? (
              <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover"
                onError={(e) => { e.target.src = PH; }} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <ImageIcon size={28} className="text-gray-300" />
                <p className="font-body text-xs text-gray-400">Preview appears here</p>
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
              <input type="text" value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Banner headline" className="field-input" />
            </div>
            <div>
              <label className="field-label">Subtitle</label>
              <input type="text" value={form.subtitle}
                onChange={(e) => set("subtitle", e.target.value)}
                placeholder="Supporting text" className="field-input" />
            </div>

            <FileField
              kind="video"
              label={<>Video <span className="text-gray-400 font-normal text-xs">(mp4 — background loop)</span></>}
              accept="video/mp4,video/*"
              inputRef={videoInputRef}
              url={form.videoUrl}
              status={uploading.video}
              onUpload={(e) => handleFileUpload(e, "video")}
              onUrlChange={(e) => { set("videoUrl", e.target.value); setUploading((u) => ({ ...u, video: null })); }}
            />

            <FileField
              kind="image"
              label={<>Poster Image * <span className="text-gray-400 font-normal text-xs">(shown instantly while video loads)</span></>}
              accept="image/jpeg,image/png,image/webp,image/*"
              inputRef={imageInputRef}
              url={form.imageUrl}
              status={uploading.image}
              onUpload={(e) => handleFileUpload(e, "image")}
              onUrlChange={(e) => { set("imageUrl", e.target.value); setUploading((u) => ({ ...u, image: null })); }}
            />

            <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
              <span className="font-body text-sm font-semibold text-gray-700">Active Status</span>
              <button
                type="button"
                onClick={() => set("isActive", !form.isActive)}
                aria-pressed={!!form.isActive}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  form.isActive ? "bg-brand-700" : "bg-gray-200"
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  form.isActive ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <AdminButton variant="outline" onClick={onClose} type="button">Cancel</AdminButton>
              <AdminButton type="submit" disabled={saving || isUploading}>
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
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await API.put("/banners/update-banner", { id: banner.id, isActive: !banner.isActive });
      onToggle(banner.id, !banner.isActive);
    } catch (e) { alert(e.response?.data?.message || e.message || "Failed"); }
    finally { setToggling(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete banner "${banner.title}"?`)) return;
    setDeleting(true);
    try {
      await API.delete("/banners/delete-banner", { data: { id: banner.id } });
      onDelete(banner.id);
    } catch (e) { alert(e.response?.data?.message || e.message || "Failed to delete"); }
    finally { setDeleting(false); }
  };

  // tapping the card body opens the editor
  const openEdit = () => onEdit(banner);

  return (
    <div
      onClick={openEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEdit(); } }}
      className={`bg-white border rounded-2xl overflow-hidden transition-opacity cursor-pointer ${banner.isActive ? "border-gray-100" : "border-gray-100 opacity-60"}`}
    >
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
      </div>

      {/* actions — stopPropagation so these don't trigger the card's edit */}
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); handleToggle(); }}
            disabled={toggling}
            className={`${ACTION_BTN} text-gray-400 hover:text-amber-600 hover:bg-amber-50`}
            title={banner.isActive ? "Deactivate" : "Activate"}
          >
            {toggling ? <Loader2 className={`${ICON_CLS} animate-spin`} /> : banner.isActive ? <EyeOff className={ICON_CLS} /> : <Eye className={ICON_CLS} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(banner); }}
            className={`${ACTION_BTN} text-gray-400 hover:text-brand-700 hover:bg-brand-50`}
            title="Edit"
          >
            <Pencil className={ICON_CLS} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            disabled={deleting}
            className={`${ACTION_BTN} text-gray-400 hover:text-red-500 hover:bg-red-50`}
            title="Delete"
          >
            {deleting ? <Loader2 className={`${ICON_CLS} animate-spin`} /> : <Trash2 className={ICON_CLS} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Overlay form modal ──────────────────────────────────────────────────
function OverlayModal({ overlay, bannerId, onClose, onSaved }) {
  const [form, setForm] = useState(
    overlay ? { heading: overlay.heading, subtext: overlay.subtext || "", isActive: overlay.isActive }
            : { heading: "", subtext: "", isActive: true }
  );
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.heading.trim()) { setError("Heading is required"); return; }
    setSaving(true);
    setError("");
    try {
      let res;
      if (overlay?.id) {
        res = await API.put("/btext/update-btext", { id: overlay.id, ...form });
      } else {
        res = await API.post("/btext/create-btext", { bannerId, ...form });
      }
      console.log(res.data);
      onSaved(res.data.btext);
      onClose();
    } catch (e) { setError(e.response?.data?.message || e.message || "Failed to save"); }
    finally { setSaving(false); }
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
              <label className="field-label">Heading *</label>
              <input
                type="text"
                value={form.heading}
                onChange={(e) => set("heading", e.target.value)}
                placeholder="e.g. Authentic Dry Fish & Coastal Pickles"
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Subtext</label>
              <textarea
                value={form.subtext}
                onChange={(e) => set("subtext", e.target.value)}
                placeholder="e.g. Sourced directly from Rameswaram fishermen — traditionally sun-dried, naturally preserved."
                rows={3}
                className="field-input resize-none"
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
              <AdminButton type="submit" disabled={saving}>
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save Overlay"}
              </AdminButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Overlay card ────────────────────────────────────────────────────────
function OverlayCard({ overlay, onEdit, onDelete, onToggled }) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await API.put("/btext/update-btext", { id: overlay.id, isActive: !overlay.isActive });
      onToggled(overlay.id, !overlay.isActive);
    } catch (e) { alert(e.response?.data?.message || e.message || "Failed"); }
    finally { setToggling(false); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this text overlay?")) return;
    setDeleting(true);
    try {
      await API.delete("/btext/delete-btext", { data: { id: overlay.id } });
      onDelete(overlay.id);
    } catch (e) { alert(e.response?.data?.message || e.message || "Failed to delete"); }
    finally { setDeleting(false); }
  };

  // tapping the card body opens the editor
  const openEdit = () => onEdit(overlay);

  return (
    <div
      onClick={openEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEdit(); } }}
      className={`bg-white border rounded-2xl p-5 flex flex-col justify-between transition-opacity cursor-pointer ${overlay.isActive ? "border-gray-100" : "border-gray-100 opacity-60"}`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="font-num text-[10px] uppercase font-bold text-sandal-600 bg-sandal-100 px-2 py-0.5 rounded">text overlay</span>
          <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full font-num ${
            overlay.isActive ? "bg-green-500 text-white" : "bg-gray-400 text-white"
          }`}>
            {overlay.isActive ? "Active" : "Inactive"}
          </div>
        </div>
        <h4 className="font-display text-gray-900 text-base font-bold leading-snug line-clamp-2">{overlay.heading}</h4>
        {overlay.subtext && <p className="font-body text-gray-500 text-xs leading-relaxed line-clamp-3">{overlay.subtext}</p>}
      </div>

      {/* actions — stopPropagation so these don't trigger the card's edit */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); handleToggle(); }}
          disabled={toggling}
          className={`${ACTION_BTN} text-gray-400 hover:text-amber-600 hover:bg-amber-50`}
          title={overlay.isActive ? "Deactivate" : "Activate"}
        >
          {toggling ? <Loader2 className={`${ICON_CLS} animate-spin`} /> : overlay.isActive ? <EyeOff className={ICON_CLS} /> : <Eye className={ICON_CLS} />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(overlay); }}
          className={`${ACTION_BTN} text-gray-400 hover:text-brand-700 hover:bg-brand-50`}
          title="Edit"
        >
          <Pencil className={ICON_CLS} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(); }}
          disabled={deleting}
          className={`${ACTION_BTN} text-gray-400 hover:text-red-500 hover:bg-red-50`}
          title="Delete"
        >
          {deleting ? <Loader2 className={`${ICON_CLS} animate-spin`} /> : <Trash2 className={ICON_CLS} />}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// BANNERS PAGE
// ══════════════════════════════════════════════════════════════════════
export default function BannerManagement() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // null | "new" | banner object

  const [activeTab,       setActiveTab]       = useState("videos");
  const [overlays,        setOverlays]        = useState([]);
  const [overlaysLoading, setOverlaysLoading] = useState(false);
  const [selectedBannerId, setSelectedBannerId] = useState(null);
  const [overlayModal,    setOverlayModal]    = useState(null); // null | "new" | overlay object

  // load banners from API
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) setLoading(true);
    }, 0);
    API.get("/banners/get-all")
      .then((r) => {
        if (!active) return;
        const sorted = (r.data.banners || []).sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
        setBanners(sorted);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  // load overlays from backend when a banner is selected
  useEffect(() => {
    let active = true;
    if (!selectedBannerId) {
      const timer = setTimeout(() => {
        if (active) setOverlays([]);
      }, 0);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }
    const timer = setTimeout(() => {
      if (active) setOverlaysLoading(true);
    }, 0);
    API.get(`/btext/get-for-banner?bannerId=${selectedBannerId}`)
      .then((r) => {
        if (!active) return;
        setOverlays(r.data.btexts || []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setOverlaysLoading(false);
      });
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [selectedBannerId]);

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

  // called after btextApi.create or btextApi.update succeeds inside OverlayModal
  const handleOverlaySaved = (item) => {
    setOverlays((prev) => {
      const idx = prev.findIndex((o) => o.id === item.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = item; return next; }
      return [...prev, item];
    });
  };

  // called after btextApi.remove succeeds inside OverlayCard
  const handleOverlayDelete = (id) =>
    setOverlays((prev) => prev.filter((o) => o.id !== id));

  // called after btextApi.update (toggle) succeeds inside OverlayCard
  const handleOverlayToggled = (id, isActive) =>
    setOverlays((prev) => prev.map((o) => o.id === id ? { ...o, isActive } : o));

  const active   = banners.filter((b) => b.isActive).length;
  const inactive = banners.filter((b) => !b.isActive).length;

  const activeOverlays   = overlays.filter((o) => o.isActive).length;
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
          <AdminButton onClick={() => setOverlayModal("new")} disabled={!selectedBannerId}>
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
          {/* banner selector */}
          <div className="mb-5">
            <label className="field-label mb-1.5 block">Select Banner</label>
            <select
              value={selectedBannerId ?? ""}
              onChange={(e) => setSelectedBannerId(e.target.value ? Number(e.target.value) : null)}
              className="field-input max-w-xs"
            >
              <option value="">— choose a banner —</option>
              {banners.map((b) => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
          </div>

          {/* summary */}
          {selectedBannerId && (
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
          )}

          {/* overlays grid */}
          {!selectedBannerId ? (
            <AdminCard className="text-center py-16">
              <ImageIcon size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="font-body text-gray-400 text-sm">Select a banner above to manage its text overlays.</p>
            </AdminCard>
          ) : overlaysLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-gray-100 p-5 animate-pulse space-y-3">
                  <div className="h-3 skeleton w-1/3" />
                  <div className="h-4 skeleton w-3/4" />
                  <div className="h-3 skeleton w-full" />
                </div>
              ))}
            </div>
          ) : overlays.length === 0 ? (
            <AdminCard className="text-center py-16">
              <ImageIcon size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="font-body text-gray-400 text-sm">No text overlays for this banner. Add one.</p>
            </AdminCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {overlays.map((o) => (
                <OverlayCard
                  key={o.id}
                  overlay={o}
                  onEdit={(o) => setOverlayModal(o)}
                  onDelete={handleOverlayDelete}
                  onToggled={handleOverlayToggled}
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
      {overlayModal !== null && selectedBannerId && (
        <OverlayModal
          overlay={overlayModal === "new" ? null : overlayModal}
          bannerId={selectedBannerId}
          onClose={() => setOverlayModal(null)}
          onSaved={handleOverlaySaved}
        />
      )}
    </AdminPage>
  );
}