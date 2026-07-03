/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { X, Loader2, Image as ImageIcon } from "lucide-react";
import {
  useCreateCombo,
  useUpdateCombo
} from "../../hookqueries/useCombos";
import { AdminButton } from "./AdminUI.jsx";
import IconButton from "./IconButton.jsx";
import ComboItemPicker from "./ComboItemPicker.jsx";
import Toggle from "./Toggle.jsx";

export const COMBO_EMPTY = { name: "", description: "", imageUrl: "", imageFile: null, comboPrice: "", isActive: true, startDate: "", endDate: "", items: [] };

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
      ? { ...combo, imageFile: null, items: (combo.items || []).map((i) => ({ ...i })) }
      : { ...COMBO_EMPTY }
  );
  const [previewUrl, setPreviewUrl] = useState(combo?.imageUrl || "");
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set("imageFile", file);
    setPreviewUrl(URL.createObjectURL(file));
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
      <div className="relative bg-white admin-modal-bg rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-display text-base font-bold text-gray-900">{isEdit ? "Edit Combo" : "Add Combo"}</h3>
          <IconButton onClick={onClose} aria-label="Close"><X size={18} /></IconButton>
        </div>
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-2.5">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="field-label">Name *</label><input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Dry Fish Duo" className="field-input" /></div>
            <div><label className="field-label">Description</label><textarea value={form.description || ""} onChange={(e) => set("description", e.target.value)} rows={2} className="field-input resize-none" placeholder="Short combo description" /></div>
            <div>
              <label className="field-label">Combo Image</label>
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={24} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="combo-file-input" />
                  <label htmlFor="combo-file-input" className="inline-flex items-center px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors">
                    Choose Image
                  </label>
                  <p className="text-[10px] text-gray-400 mt-1">Recommended: 600×300. Max: 3MB.</p>
                </div>
              </div>
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
