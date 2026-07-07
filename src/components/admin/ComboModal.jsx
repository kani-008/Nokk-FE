/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { X, Loader2, Image as ImageIcon, Plus } from "lucide-react";
import {
  useCreateCombo,
  useUpdateCombo
} from "../../hookqueries/useCombos";
import { AdminButton } from "./AdminUI.jsx";
import IconButton from "./IconButton.jsx";
import ComboItemPicker from "./ComboItemPicker.jsx";
import Toggle from "./Toggle.jsx";

export const COMBO_EMPTY = {
  name: "",
  imageUrl: "",
  imageFiles: [],
  removeImageIds: [],
  comboPrice: "",
  isActive: true,
  startDate: "",
  endDate: "",
  items: []
};

export function computeStatus({ isActive, startDate, endDate }) {
  if (!isActive) return "Inactive";
  const now = new Date();
  if (endDate && new Date(endDate) < now) return "Expired";
  if (startDate && new Date(startDate) > now) return "Scheduled";
  return "Live";
}

export function StatusPill({ isActive, startDate, endDate }) {
  const status = computeStatus({ isActive, startDate, endDate });
  const cls = {
    Live: "badge-green",
    Scheduled: "badge-amber",
    Expired: "badge-gray",
    Inactive: "badge-gray",
  }[status];
  return <span className={cls}>{status}</span>;
}

export default function ComboModal({ combo, onClose, onSaved }) {
  const isEdit = !!combo?.id;
  
  const [form, setForm] = useState(
    combo
      ? { 
          ...combo, 
          imageFiles: [], 
          removeImageIds: [], 
          items: (combo.items || []).map((i) => ({ ...i })) 
        }
      : { ...COMBO_EMPTY }
  );
  
  const [stagedFiles, setStagedFiles] = useState([]); // Array of { file, previewUrl }
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const MAX_IMAGES = 5;
  const displayedSavedImages = (combo?.images || []).filter(img => !(form.removeImageIds || []).includes(img.id));
  const totalImageCount = displayedSavedImages.length + stagedFiles.length;

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const availableSlots = MAX_IMAGES - totalImageCount;
    const filesToStage = selectedFiles.slice(0, availableSlots);

    const nextStaged = [
      ...stagedFiles,
      ...filesToStage.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }))
    ];

    setStagedFiles(nextStaged);
    set("imageFiles", nextStaged.map(item => item.file));
  };

  const createComboMutation = useCreateCombo();
  const updateComboMutation = useUpdateCombo();
  const saving = createComboMutation.isPending || updateComboMutation.isPending;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.comboPrice) { setError("Name and combo price required"); return; }
    if (Number(form.comboPrice) <= 0) { setError("Combo price must be greater than 0"); return; }
    if (form.items.length < 2) { setError("Add at least 2 items to make a combo"); return; }
    setError("");
    try {
      let res;
      if (isEdit) {
        res = await updateComboMutation.mutateAsync({ id: combo.id, form });
      } else {
        res = await createComboMutation.mutateAsync(form);
      }
      onSaved(res.combo || form);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface admin-modal-bg rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-modal-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-display text-base font-bold text-gray-900">{isEdit ? "Edit Combo" : "Add Combo"}</h3>
          <IconButton onClick={onClose} aria-label="Close"><X size={18} /></IconButton>
        </div>
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-2.5">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="field-label">Name *</label><input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Dry Fish Duo" className="field-input" /></div>
            
            {/* Multi image section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="field-label mb-0">Combo Images</label>
                <span className="font-body text-xs text-gray-400">{totalImageCount}/{MAX_IMAGES}</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                {/* existing saved images */}
                {displayedSavedImages.map((img) => (
                  <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-200 group">
                    <img src={img.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                    {img.isPrimary && (
                      <span className="absolute bottom-1 left-1 font-body text-[9px] font-bold bg-brand-600 text-white px-1.5 py-0.5 rounded-md">Primary</span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        set("removeImageIds", [...(form.removeImageIds || []), img.id]);
                      }}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-500 text-white rounded-full transition-colors"
                      aria-label="Remove image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {/* staged new images */}
                {stagedFiles.map((s, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-dashed border-brand-300 group">
                    <img src={s.previewUrl} alt="" className="w-full h-full object-cover" />
                    {displayedSavedImages.length === 0 && idx === 0 && (
                      <span className="absolute bottom-1 left-1 font-body text-[9px] font-bold bg-brand-600 text-white px-1.5 py-0.5 rounded-md">Primary</span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const nextStaged = stagedFiles.filter((_, i) => i !== idx);
                        setStagedFiles(nextStaged);
                        set("imageFiles", nextStaged.map(item => item.file));
                      }}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-500 text-white rounded-full transition-colors"
                      aria-label="Remove image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {/* upload button thumbnail */}
                {totalImageCount < MAX_IMAGES && (
                  <label
                    htmlFor="combo-file-input"
                    className="aspect-square border-2 border-dashed border-gray-200 hover:border-brand-400 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors bg-gray-50 hover:bg-amber-50/20 group"
                  >
                    <Plus size={18} className="text-gray-400 group-hover:text-brand-600 transition-colors" />
                    <span className="font-body text-[10px] text-gray-400 group-hover:text-brand-600 transition-colors font-medium">Add Image</span>
                  </label>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="combo-file-input"
                disabled={totalImageCount >= MAX_IMAGES}
              />
              <p className="text-[10px] text-gray-400 mt-1">Up to 5 images total. Max 3MB per file.</p>
            </div>

            <ComboItemPicker items={form.items} onChange={(items) => set("items", items)} />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Combo Price (₹) *</label>
                <input type="number" value={form.comboPrice} onChange={(e) => set("comboPrice", e.target.value)} placeholder="350" className="field-input" />
              </div>
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
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : isEdit ? "Update" : "Add Combo"}
              </AdminButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
