import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Play,
  Upload,
  Loader2,
  Video,
  Image as ImageIcon,
  Link as LinkIcon,
} from "lucide-react";
import {
  useAdminCustomerVideoList,
  useCreateCustomerVideo,
  useUpdateCustomerVideo,
  useDeleteCustomerVideo,
  useUploadCustomerVideoFile,
} from "../../hookqueries/useActiveCustomerVideos";
import {
  AdminPage,
  AdminButton,
  AdminCard,
} from "../../components/admin/AdminUI.jsx";
import IconButton from "../../components/admin/IconButton.jsx";
import Toggle from "../../components/admin/Toggle.jsx";

const EMPTY_FORM = {
  customerName: "",
  caption: "",
  sortOrder: 0,
  isActive: true,
  videoUrl: "",
  posterUrl: "",
};

// ── File upload + URL field ────────────────────────────────────────────
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
      <label className="field-label block font-semibold text-gray-700">{label}</label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={status === "uploading"}
          className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition-colors disabled:opacity-50 cursor-pointer ${
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

function VideoModal({ video, onClose }) {
  const [form, setForm] = useState(video ? { ...video } : { ...EMPTY_FORM });
  const [uploading, setUploading] = useState({ video: null, poster: null });
  const [error, setError] = useState("");

  const videoInputRef = useRef(null);
  const posterInputRef = useRef(null);

  const uploadMutation = useUploadCustomerVideoFile();
  const createMutation = useCreateCustomerVideo();
  const updateMutation = useUpdateCustomerVideo();
  const saving = createMutation.isPending || updateMutation.isPending;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleFileUpload = async (e, kind) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading((u) => ({ ...u, [kind]: "uploading" }));
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await uploadMutation.mutateAsync(body);
      const url = res.url;
      set(kind === "video" ? "videoUrl" : "posterUrl", url);
      setUploading((u) => ({ ...u, [kind]: "done" }));
    } catch (err) {
      setError(`${kind} upload failed: ${err.message}`);
      setUploading((u) => ({ ...u, [kind]: null }));
    }
    e.target.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.videoUrl) {
      setError("Video is required — upload a file or paste a URL");
      return;
    }

    try {
      if (video) {
        await updateMutation.mutateAsync({
          id: video.id,
          ...form,
        });
      } else {
        await createMutation.mutateAsync(form);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save testimonial");
    }
  };

  const isUploading =
    uploading.video === "uploading" || uploading.poster === "uploading";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface admin-modal-bg rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col z-50">
        {/* header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-display text-base font-bold text-gray-900">
            {video ? "Edit Video Testimonial" : "Add Video Testimonial"}
          </h3>
          <IconButton onClick={onClose} aria-label="Close">
            <X size={18} />
          </IconButton>
        </div>

        {/* body */}
        <div className="p-4 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* left column: form fields (7 cols) */}
              <div className="md:col-span-7 space-y-6">
                <div>
                  <label className="field-label">Customer Name</label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={(e) => set("customerName", e.target.value)}
                    placeholder="e.g. Divya Krishnamurthy"
                    className="field-input"
                  />
                </div>

                <div>
                  <label className="field-label">Caption / Quote</label>
                  <textarea
                    value={form.caption}
                    onChange={(e) => set("caption", e.target.value)}
                    placeholder="Write a brief caption or quote here..."
                    rows={2}
                    className="field-input resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Sort Order</label>
                    <input
                      type="number"
                      value={form.sortOrder}
                      onChange={(e) => set("sortOrder", parseInt(e.target.value) || 0)}
                      className="field-input"
                    />
                  </div>
                  <div className="flex flex-col justify-end pb-2">
                    <label className="field-label mb-2">Is Active?</label>
                    <div className="flex items-center">
                      <Toggle
                        checked={form.isActive}
                        onChange={() => set("isActive", !form.isActive)}
                      />
                      <span className="ml-2 font-body text-sm text-gray-600">
                        {form.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Video File Upload */}
                <FileField
                  kind="video"
                  label="VIDEO (MP4 / WEBM — BACKGROUND LOOP) *"
                  accept="video/mp4,video/webm,video/*"
                  inputRef={videoInputRef}
                  url={form.videoUrl}
                  status={uploading.video}
                  onUpload={(e) => handleFileUpload(e, "video")}
                  onUrlChange={(e) => set("videoUrl", e.target.value)}
                />

                {/* Poster File Upload */}
                <FileField
                  kind="image"
                  label="POSTER IMAGE (SHOWN INSTANTLY WHILE VIDEO LOADS)"
                  accept="image/*"
                  inputRef={posterInputRef}
                  url={form.posterUrl}
                  status={uploading.poster}
                  onUpload={(e) => handleFileUpload(e, "poster")}
                  onUrlChange={(e) => set("posterUrl", e.target.value)}
                />
              </div>

              {/* right column: 9:16 aspect ratio preview (5 cols) */}
              <div className="md:col-span-5 flex flex-col items-center">
                <label className="field-label block w-full mb-1.5 text-center md:text-left">Live Preview</label>
                <div className="w-full max-w-[200px] aspect-[9/16] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 relative flex items-center justify-center shadow-inner">
                  {form.videoUrl ? (
                    <video
                      src={form.videoUrl}
                      className="w-full h-full object-cover animate-fade-in"
                      controls
                      preload="metadata"
                      playsInline
                      poster={form.posterUrl || undefined}
                    />
                  ) : form.posterUrl ? (
                    <img
                      src={form.posterUrl}
                      alt="preview"
                      className="w-full h-full object-cover animate-fade-in"
                    />
                  ) : (
                    <div className="p-4 flex flex-col items-center justify-center gap-2 text-center text-gray-400">
                      <Video size={32} />
                      <p className="font-body text-[11px] leading-snug">
                        9:16 preview appears here
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2  flex justify-end gap-3 bg-gray-50/50 -mx-6 -mb-6 p-4">
              <AdminButton
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={saving || isUploading}
              >
                Cancel
              </AdminButton>
              <AdminButton type="submit" disabled={saving || isUploading}>
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  "Save Customervideo"
                )}
              </AdminButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CustomerVideoManagement() {
  const { data: videos, isLoading } = useAdminCustomerVideoList();
  const deleteMutation = useDeleteCustomerVideo();
  const updateMutation = useUpdateCustomerVideo();

  const [modalVideo, setModalVideo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEdit = (video) => {
    setModalVideo(video);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setModalVideo(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer video testimonial?")) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      alert("Failed to delete video: " + err.message);
    }
  };

  const handleToggleActive = async (video) => {
    try {
      await updateMutation.mutateAsync({
        id: video.id,
        isActive: !video.isActive,
      });
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  return (
    <AdminPage
      action={
        <AdminButton onClick={handleAdd}>
          <Plus size={16} className="mr-1.5" />
          Add Video Testimonial
        </AdminButton>
      }
    >
      <AdminCard>
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 size={32} className="animate-spin text-brand-600" />
            <p className="font-body text-sm text-gray-500">Loading customer testimonials...</p>
          </div>
        ) : !videos || videos.length === 0 ? (
          <div className="py-20 text-center">
            <Video size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="font-body text-sm text-gray-500">No customer video testimonials uploaded yet.</p>
            <p className="font-body text-xs text-gray-400 mt-1">Upload files using the action button above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {videos.map((v) => (
              <div
                key={v.id}
                className="relative rounded-2xl overflow-hidden bg-gray-900 border border-sandal-100 shadow-md group flex flex-col"
              >
                {/* Video / Poster Wrapper */}
                <div className="relative aspect-[9/16] bg-black">
                  <video
                    src={v.videoUrl}
                    poster={v.posterUrl || ""}
                    className="w-full h-full object-cover"
                    controls
                    preload="metadata"
                    playsInline
                  />
                  
                  {/* Top Bar Actions */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(v)}
                      className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-700 flex items-center justify-center shadow transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="w-8 h-8 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center shadow transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-12 text-white pointer-events-none">
                    <h4 className="font-display text-sm font-bold truncate">
                      {v.customerName || "Anonymous"}
                    </h4>
                    <p className="font-body text-xs text-gray-300 line-clamp-2 mt-1 leading-snug">
                      {v.caption || "No caption provided"}
                    </p>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-surface border-t flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Toggle
                      checked={v.isActive}
                      onChange={() => handleToggleActive(v)}
                    />
                    <span className="font-body text-xs font-semibold text-gray-600">
                      {v.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <span className="font-num text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                    Order: {v.sortOrder}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {isModalOpen && (
        <VideoModal
          video={modalVideo}
          onClose={() => {
            setIsModalOpen(false);
            setModalVideo(null);
          }}
        />
      )}
    </AdminPage>
  );
}
