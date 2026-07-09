import { useState, useRef, useMemo, useEffect } from "react";

import {
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  EyeOff,
  Video,
  Image as ImageIcon,
  Loader2,
  Link as LinkIcon,
  Upload,
  Megaphone,
} from "lucide-react";
import {
  useAdminBanners,
  useBannerTextOverlays,
  useUploadBannerImage,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
  useCreateBannerText,
  useUpdateBannerText,
  useDeleteBannerText,
} from "../../hookqueries/useBanners";
import { useAdminOfferList } from "../../hookqueries/useOffers";
import {
  AdminPage,
  AdminButton,
  AdminCard,
} from "../../components/admin/AdminUI.jsx";
import Dropdown from "../../components/admin/Dropdown.jsx";
import IconButton from "../../components/admin/IconButton.jsx";
import TabToggle from "../../components/admin/TabToggle.jsx";
import Toggle from "../../components/admin/Toggle.jsx";
import API from "../../ApiCall/Api.jsx";
const PH = "";

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  imageUrl: "",
  videoUrl: "",
  isActive: true,
};

// responsive icon size: bigger on mobile, compact on desktop — used inside IconButton size="lg"
const ICON_CLS = "w-5 h-5 sm:w-[15px] sm:h-[15px]";

// ── File upload + URL field ────────────────────────────────────────────
// Kept outside BannerModal so React never remounts it mid-render.
function FileField({
  kind,
  label,
  accept,
  inputRef,
  url,
  status,
  onUpload,
  onUrlChange,
}) {
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
          {status === "uploading" ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Uploading…
            </>
          ) : status === "done" ? (
            <>
              <Upload size={14} /> Uploaded ✓
            </>
          ) : (
            <>
              <Upload size={14} /> Upload {kind === "video" ? "Video" : "Image"}
            </>
          )}
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
        <LinkIcon
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
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
  const [form, setForm] = useState(
    banner
      ? {
          ...EMPTY_FORM,
          ...banner,
          // DB rows can have null for optional fields; controlled inputs require "" not null
          title:    banner.title    ?? "",
          subtitle: banner.subtitle ?? "",
          imageUrl: banner.imageUrl ?? "",
          videoUrl: banner.videoUrl ?? "",
        }
      : { ...EMPTY_FORM }
  );
  const [uploading, setUploading] = useState({ video: null, image: null });

  const videoInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const uploadMutation = useUploadBannerImage();
  const createBannerMutation = useCreateBanner();
  const updateBannerMutation = useUpdateBanner();

  const saving =
    createBannerMutation.isPending || updateBannerMutation.isPending;
  const [error, setError] = useState("");

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
      const res = await uploadMutation.mutateAsync(body);
      const url = res.url;
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
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!form.imageUrl) {
      setError("Poster image is required — upload a file or paste a URL");
      return;
    }
    setError("");
    try {
      let res;
      if (banner?.id) {
        res = await updateBannerMutation.mutateAsync({
          id: banner.id,
          ...form,
        });
      } else {
        res = await createBannerMutation.mutateAsync(form);
      }
      onSaved(res.banner || form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save");
    }
  };

  const isUploading =
    uploading.video === "uploading" || uploading.image === "uploading";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface admin-modal-bg rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-display text-base font-bold text-gray-900">
            {banner ? "Edit Banner" : "Add Banner"}
          </h3>
          <IconButton onClick={onClose} aria-label="Close">
            <X size={18} />
          </IconButton>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {/* live preview */}
          <div className="w-full h-36 rounded-2xl overflow-hidden bg-gray-100 mb-5 border border-gray-200">
            {form.videoUrl ? (
              <video
                src={form.videoUrl}
                className="w-full h-full object-cover"
                muted
                autoPlay
                loop
                playsInline
                poster={form.imageUrl || undefined}
              />
            ) : form.imageUrl ? (
              <img
                src={form.imageUrl}
                alt="preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = PH;
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <ImageIcon size={28} className="text-gray-300" />
                <p className="font-body text-xs text-gray-400">
                  Preview appears here
                </p>
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
              <input
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Banner headline"
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Subtitle</label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => set("subtitle", e.target.value)}
                placeholder="Supporting text"
                className="field-input"
              />
            </div>

            <FileField
              kind="video"
              label={
                <>
                  Video{" "}
                  <span className="text-gray-400 font-normal text-xs">
                    (mp4 / webm — background loop)
                  </span>
                </>
              }
              accept="video/mp4,video/webm,video/*"
              inputRef={videoInputRef}
              url={form.videoUrl}
              status={uploading.video}
              onUpload={(e) => handleFileUpload(e, "video")}
              onUrlChange={(e) => {
                set("videoUrl", e.target.value);
                setUploading((u) => ({ ...u, video: null }));
              }}
            />

            <FileField
              kind="image"
              label={
                <>
                  Poster Image *{" "}
                  <span className="text-gray-400 font-normal text-xs">
                    (shown instantly while video loads)
                  </span>
                </>
              }
              accept="image/jpeg,image/png,image/webp,image/*"
              inputRef={imageInputRef}
              url={form.imageUrl}
              status={uploading.image}
              onUpload={(e) => handleFileUpload(e, "image")}
              onUrlChange={(e) => {
                set("imageUrl", e.target.value);
                setUploading((u) => ({ ...u, image: null }));
              }}
            />

            <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
              <span className="font-body text-sm font-semibold text-gray-700">
                Active Status
              </span>
              <button
                type="button"
                onClick={() => set("isActive", !form.isActive)}
                aria-pressed={!!form.isActive}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  form.isActive ? "bg-brand-700" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface shadow ring-0 transition duration-200 ease-in-out ${
                    form.isActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <AdminButton variant="outline" onClick={onClose} type="button">
                Cancel
              </AdminButton>
              <AdminButton type="submit" disabled={saving || isUploading}>
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving…
                  </>
                ) : (
                  "Save Banner"
                )}
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
  const toggleBannerMutation = useUpdateBanner();
  const deleteBannerMutation = useDeleteBanner();

  const toggling = toggleBannerMutation.isPending;
  const deleting = deleteBannerMutation.isPending;

  const handleToggle = async () => {
    try {
      await toggleBannerMutation.mutateAsync({
        id: banner.id,
        isActive: !banner.isActive,
      });
      onToggle(banner.id, !banner.isActive);
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Failed");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete banner "${banner.title}"?`)) return;
    try {
      await deleteBannerMutation.mutateAsync(banner.id);
      onDelete(banner.id);
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Failed to delete");
    }
  };

  // tapping the card body opens the editor
  const openEdit = () => onEdit(banner);

  return (
    <div
      onClick={openEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openEdit();
        }
      }}
      className={`bg-surface border rounded-2xl overflow-hidden transition-opacity cursor-pointer ${banner.isActive ? "border-gray-100" : "border-gray-100 opacity-60"}`}
    >
      {/* thumbnail */}
      <div className="relative h-36 bg-gray-100">
        {banner.videoUrl ? (
          <video
            src={banner.videoUrl}
            poster={banner.imageUrl || undefined}
            className="w-full h-full object-cover"
            muted
            autoPlay
            loop
            playsInline
          />
        ) : banner.imageUrl ? (
          <img
            src={banner.imageUrl}
            alt={banner.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = PH;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video size={32} className="text-gray-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="font-display text-white text-sm font-bold leading-snug line-clamp-1">
            {banner.title}
          </p>
          {banner.subtitle && (
            <p className="font-body text-white/80 text-xs mt-0.5 line-clamp-1">
              {banner.subtitle}
            </p>
          )}
        </div>
        {/* status pill */}
        <div
          className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full font-num ${
            banner.isActive
              ? "bg-green-500 text-white"
              : "bg-gray-400 text-white"
          }`}
        >
          {banner.isActive ? "Active" : "Inactive"}
        </div>
        {banner.offerName && (
          <div className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-1 shadow-sm">
            <span>🔗 {banner.offerName}</span>
          </div>
        )}
      </div>

      {/* actions — stopPropagation so these don't trigger the card's edit */}
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 shrink-0">
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            disabled={toggling}
            variant="amber"
            size="lg"
            title={banner.isActive ? "Deactivate" : "Activate"}
          >
            {toggling ? (
              <Loader2 className={`${ICON_CLS} animate-spin`} />
            ) : banner.isActive ? (
              <EyeOff className={ICON_CLS} />
            ) : (
              <Eye className={ICON_CLS} />
            )}
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onEdit(banner);
            }}
            variant="brand"
            size="lg"
            title="Edit"
          >
            <Pencil className={ICON_CLS} />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={deleting}
            variant="danger"
            size="lg"
            title="Delete"
          >
            {deleting ? (
              <Loader2 className={`${ICON_CLS} animate-spin`} />
            ) : (
              <Trash2 className={ICON_CLS} />
            )}
          </IconButton>
        </div>
      </div>
    </div>
  );
}

// ── Overlay form modal ──────────────────────────────────────────────────
function OverlayModal({ overlay, bannerId, onClose, onSaved }) {
  const [form, setForm] = useState(
    overlay
      ? {
          heading: overlay.heading,
          subtext: overlay.subtext || "",
          isActive: overlay.isActive,
        }
      : { heading: "", subtext: "", isActive: true },
  );

  const createBtextMutation = useCreateBannerText();
  const updateBtextMutation = useUpdateBannerText();

  const saving = createBtextMutation.isPending || updateBtextMutation.isPending;
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.heading.trim()) {
      setError("Heading is required");
      return;
    }
    setError("");
    try {
      let res;
      if (overlay?.id) {
        res = await updateBtextMutation.mutateAsync({
          id: overlay.id,
          bannerId,
          ...form,
        });
      } else {
        res = await createBtextMutation.mutateAsync({ bannerId, ...form });
      }
      onSaved(res.btext || form);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to save");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-modal-fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface admin-modal-bg rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-modal-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-display text-base font-bold text-gray-900">
            {overlay ? "Edit Text Overlay" : "Add Text Overlay"}
          </h3>
          <IconButton onClick={onClose} aria-label="Close">
            <X size={18} />
          </IconButton>
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
                placeholder="e.g. Sourced directly from coastal fishermen — traditionally sun-dried, naturally preserved."
                rows={3}
                className="field-input resize-none"
              />
            </div>
            <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200 mt-2">
              <span className="font-body text-sm font-semibold text-gray-700">
                Active Status
              </span>
              <button
                type="button"
                onClick={() => set("isActive", !form.isActive)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  form.isActive ? "bg-brand-700" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface shadow ring-0 transition duration-200 ease-in-out ${
                    form.isActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <AdminButton variant="outline" onClick={onClose} type="button">
                Cancel
              </AdminButton>
              <AdminButton type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving…
                  </>
                ) : (
                  "Save Overlay"
                )}
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
  const updateBtextMutation = useUpdateBannerText();
  const deleteBtextMutation = useDeleteBannerText();

  const toggling = updateBtextMutation.isPending;
  const deleting = deleteBtextMutation.isPending;

  const handleToggle = async () => {
    try {
      await updateBtextMutation.mutateAsync({
        id: overlay.id,
        bannerId: overlay.bannerId,
        isActive: !overlay.isActive,
      });
      onToggled(overlay.id, !overlay.isActive);
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Failed");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this text overlay?")) return;
    try {
      await deleteBtextMutation.mutateAsync({
        id: overlay.id,
        bannerId: overlay.bannerId,
      });
      onDelete(overlay.id);
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Failed to delete");
    }
  };

  // tapping the card body opens the editor
  const openEdit = () => onEdit(overlay);

  return (
    <div
      onClick={openEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openEdit();
        }
      }}
      className={`bg-surface border rounded-2xl p-5 flex flex-col justify-between transition-opacity cursor-pointer ${overlay.isActive ? "border-gray-100" : "border-gray-100 opacity-60"}`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="font-num text-[10px] uppercase font-bold text-sandal-600 bg-sandal-100 px-2 py-0.5 rounded">
            text overlay
          </span>
          <div
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full font-num ${
              overlay.isActive
                ? "bg-green-500 text-white"
                : "bg-gray-400 text-white"
            }`}
          >
            {overlay.isActive ? "Active" : "Inactive"}
          </div>
        </div>
        <h4 className="font-display text-gray-900 text-base font-bold leading-snug line-clamp-2">
          {overlay.heading}
        </h4>
        {overlay.subtext && (
          <p className="font-body text-gray-500 text-xs leading-relaxed line-clamp-3">
            {overlay.subtext}
          </p>
        )}
      </div>

      {/* actions — stopPropagation so these don't trigger the card's edit */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-1.5">
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          disabled={toggling}
          variant="amber"
          size="lg"
          title={overlay.isActive ? "Deactivate" : "Activate"}
        >
          {toggling ? (
            <Loader2 className={`${ICON_CLS} animate-spin`} />
          ) : overlay.isActive ? (
            <EyeOff className={ICON_CLS} />
          ) : (
            <Eye className={ICON_CLS} />
          )}
        </IconButton>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onEdit(overlay);
          }}
          variant="brand"
          size="lg"
          title="Edit"
        >
          <Pencil className={ICON_CLS} />
        </IconButton>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          disabled={deleting}
          variant="danger"
          size="lg"
          title="Delete"
        >
          {deleting ? (
            <Loader2 className={`${ICON_CLS} animate-spin`} />
          ) : (
            <Trash2 className={ICON_CLS} />
          )}
        </IconButton>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// BANNERS PAGE
// ══════════════════════════════════════════════════════════════════════
export default function BannerManagement() {
  const [modal, setModal] = useState(null); // null | "new" | banner object

  const [activeTab, setActiveTab] = useState("videos");
  const [selectedBannerId, setSelectedBannerId] = useState(null);
  const [overlayModal, setOverlayModal] = useState(null); // null | "new" | overlay object

  const { data: offers = [] } = useAdminOfferList();

  const [settings, setSettings] = useState({
    announcementEnabled: false,
    announcementText: "",
    announcement_offer_owner: "",
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [annText, setAnnText] = useState("");
  const [annEnabled, setAnnEnabled] = useState(false);
  const [annOwner, setAnnOwner] = useState("");

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await API.get("/settings/get-all");
      const s = res.data.settings || {};
      setSettings(s);
      setAnnText(s.announcementText || "");
      setAnnEnabled(!!s.announcementEnabled);
      setAnnOwner(s.announcement_offer_owner || "");
    } catch (e) {
      console.error(e);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveAnnouncement = async () => {
    setSettingsSaving(true);
    try {
      const payload = {
        announcementText: annText,
        announcementEnabled: annEnabled,
        announcement_offer_owner: annOwner,
      };
      const res = await API.put("/settings/update", payload);
      const s = res.data.settings || {};
      setSettings(s);
      setAnnText(s.announcementText || "");
      setAnnEnabled(!!s.announcementEnabled);
      setAnnOwner(s.announcement_offer_owner || "");
      alert("Announcement settings updated successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to update announcement settings.");
    } finally {
      setSettingsSaving(false);
    }
  };

  useEffect(() => {
    if (activeTab === "announcement") {
      fetchSettings();
    }
  }, [activeTab]);

  const owningOffer = useMemo(() => {
    return offers.find((o) => String(o.id) === String(annOwner));
  }, [offers, annOwner]);

  const { data: bannersData = [], isLoading: loading } = useAdminBanners();
  const banners = useMemo(() => {
    return [...bannersData].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  }, [bannersData]);

  const { data: overlaysData = [], isLoading: overlaysLoading } =
    useBannerTextOverlays(selectedBannerId);
  console.log("BannerManagement browser log [overlaysData]:", overlaysData);
  const overlays = overlaysData;

  const handleSaved = () => {};
  const handleDelete = () => {};
  const handleToggle = () => {};

  // called after btextApi.create or btextApi.update succeeds inside OverlayModal
  const handleOverlaySaved = () => {};

  // called after btextApi.remove succeeds inside OverlayCard
  const handleOverlayDelete = () => {};

  // called after btextApi.update (toggle) succeeds inside OverlayCard
  const handleOverlayToggled = () => {};

  const active = banners.filter((b) => b.isActive).length;
  const inactive = banners.filter((b) => !b.isActive).length;

  const activeOverlays = overlays.filter((o) => o.isActive).length;
  const inactiveOverlays = overlays.filter((o) => !o.isActive).length;

  return (
    <AdminPage className="space-y-3">
      {/* Unified Header Row — Tabs on the left, Actions on the right on desktop; stacked on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3 mb-6">
        {/* Tabs */}
        <TabToggle
          tabs={[
            { key: "videos", label: "Background Video" },
            { key: "overlays", label: "Slide Text Overlay" },
            { key: "announcement", label: "Announcement" },
          ]}
          active={activeTab}
          onChange={setActiveTab}
          tabClassName="bm-tabs-fluid"
        />

        {/* Actions (tab-dependent) */}
        {activeTab === "videos" ? (
          <div className="flex items-center justify-center sm:justify-end w-full sm:w-auto">
            <AdminButton
              onClick={() => setModal("new")}
              className="bm-btn-fluid w-full sm:w-auto"
            >
              <Plus size={14} /> Add Video
            </AdminButton>
          </div>
        ) : activeTab === "overlays" ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-64">
              <Dropdown
                value={selectedBannerId ? String(selectedBannerId) : ""}
                onChange={(val) =>
                  setSelectedBannerId(val ? Number(val) : null)
                }
                placeholder="— choose a banner —"
                options={[
                  { value: "", label: "— choose a banner —" },
                  ...banners.map((b) => ({
                    value: String(b.id),
                    label: b.title || `Banner #${b.id}`,
                  })),
                ]}
                className="w-full"
              />
            </div>
            <AdminButton
              onClick={() => setOverlayModal("new")}
              disabled={!selectedBannerId}
              className="bm-btn-fluid w-full sm:w-auto shrink-0"
            >
              <Plus size={14} /> Add Overlay
            </AdminButton>
          </div>
        ) : null}
      </div>

      {activeTab === "videos" && (
        <>
          {/* summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <AdminCard className="text-center py-4">
              <p className="font-num text-2xl font-bold text-gray-900">
                {banners.length}
              </p>
              <p className="font-body text-xs text-gray-500 mt-1">
                Total Videos
              </p>
            </AdminCard>
            <AdminCard className="text-center py-4">
              <p className="font-num text-2xl font-bold text-green-600">
                {active}
              </p>
              <p className="font-body text-xs text-gray-500 mt-1">Active</p>
            </AdminCard>
            <AdminCard className="text-center py-4">
              <p className="font-num text-2xl font-bold text-gray-400">
                {inactive}
              </p>
              <p className="font-body text-xs text-gray-500 mt-1">Inactive</p>
            </AdminCard>
          </div>

          {/* banner grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden border border-gray-100 animate-pulse"
                >
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
              <p className="font-body text-gray-400 text-sm">
                No banners yet. Add your first banner.
              </p>
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
      )}

      {activeTab === "overlays" && (
        <>
          {/* summary */}
          {selectedBannerId && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <AdminCard className="text-center py-4">
                <p className="font-num text-2xl font-bold text-gray-900">
                  {overlays.length}
                </p>
                <p className="font-body text-xs text-gray-500 mt-1">
                  Total Overlays
                </p>
              </AdminCard>
              <AdminCard className="text-center py-4">
                <p className="font-num text-2xl font-bold text-green-600">
                  {activeOverlays}
                </p>
                <p className="font-body text-xs text-gray-500 mt-1">Active</p>
              </AdminCard>
              <AdminCard className="text-center py-4">
                <p className="font-num text-2xl font-bold text-gray-400">
                  {inactiveOverlays}
                </p>
                <p className="font-body text-xs text-gray-500 mt-1">Inactive</p>
              </AdminCard>
            </div>
          )}

          {/* overlays grid */}
          {!selectedBannerId ? (
            <AdminCard className="text-center py-16">
              <ImageIcon size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="font-body text-gray-400 text-sm">
                Select a banner above to manage its text overlays.
              </p>
            </AdminCard>
          ) : overlaysLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-100 p-5 animate-pulse space-y-3"
                >
                  <div className="h-3 skeleton w-1/3" />
                  <div className="h-4 skeleton w-3/4" />
                  <div className="h-3 skeleton w-full" />
                </div>
              ))}
            </div>
          ) : overlays.length === 0 ? (
            <AdminCard className="text-center py-16">
              <ImageIcon size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="font-body text-gray-400 text-sm">
                No text overlays for this banner. Add one.
              </p>
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

      {activeTab === "announcement" && (
        <div className="space-y-6">
          <AdminCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone size={18} className="text-brand-800" />
              <h3 className="font-display text-base font-bold text-gray-900">
                Site Announcement Bar Settings
              </h3>
            </div>

            {settingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-amber-500" size={32} />
              </div>
            ) : (
              <div className="space-y-6 max-w-xl">
                {/* Enabled Toggle */}
                <div className="space-y-1.5">
                  <label className="field-label block font-semibold">
                    Announcement Status
                  </label>
                  <div className="flex items-center gap-3">
                    <Toggle
                      checked={annEnabled}
                      onChange={() => setAnnEnabled(!annEnabled)}
                    />
                    <span className="font-body text-sm text-gray-700 font-semibold">
                      {annEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Controls whether the top strip is visible to users on the
                    site.
                  </p>
                </div>

                {/* Announcement Text Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="field-label block font-semibold">
                      Announcement Text
                    </label>
                    {owningOffer && (
                      <div className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 shadow-sm">
                        <span>🔗 Driven by: {owningOffer.title}</span>
                      </div>
                    )}
                  </div>

                  {owningOffer && (
                    <p className="text-xs text-amber-600 font-body">
                      ⚠️ Note: Editing this text manually will detach it from
                      the offer, and future edits to that offer will not update
                      this banner.
                    </p>
                  )}

                  <textarea
                    value={annText}
                    onChange={(e) => {
                      setAnnText(e.target.value);
                      if (annOwner) {
                        setAnnOwner("");
                      }
                    }}
                    rows={2}
                    className="field-input resize-none"
                    placeholder="e.g. 🎉 Monsoon Sale — 20% off all products this weekend!"
                  />
                </div>

                {/* Save button */}
                <div>
                  <AdminButton
                    onClick={handleSaveAnnouncement}
                    disabled={settingsSaving}
                    className="w-full sm:w-auto"
                  >
                    {settingsSaving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Saving…
                      </>
                    ) : (
                      "Save Announcement"
                    )}
                  </AdminButton>
                </div>
              </div>
            )}
          </AdminCard>
        </div>
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
