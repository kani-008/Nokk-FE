import { useState, useRef, useEffect } from "react";
import { X, Plus, Home, MapPin, MoreVertical, Pencil, Trash2, Check, Loader2 } from "lucide-react";
import { useAddresses, useAddAddress, useDeleteAddress, lookupPincode } from "../../hookqueries/useProfile";
import { Field, SavedAddressEditForm } from "./Address";
import { INDIAN_STATES } from "./statesList.js";
import { useAuthStore } from "../store/AuthStore";

const norm = (s) => String(s).toLowerCase().replace(/[\s&]+/g, "");

// ── Compact address row ────────────────────────────────────────────────
function AddressRow({ address, isSelected, onSelect, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const Icon = address.label?.toLowerCase() === "home" ? Home : MapPin;

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 border-b border-amber-50 last:border-0 cursor-pointer transition-colors ${
        isSelected ? "bg-brand-50" : "hover:bg-amber-50/60"
      }`}
      onClick={onSelect}
    >
      <Icon size={16} className={`mt-0.5 shrink-0 ${isSelected ? "text-brand-700" : "text-amber-400"}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-body text-sm font-semibold text-brand-900 leading-snug">
            {address.name}
          </p>
          {isSelected && (
            <span className="inline-block font-body text-[10px] font-bold text-brand-700 bg-brand-100 rounded px-1.5 py-0.5">
              Selected
            </span>
          )}
        </div>
        <p className="font-body text-xs text-amber-600 mt-0.5 leading-relaxed line-clamp-2">
          {address.addressLine1}
          {address.addressLine2 ? `, ${address.addressLine2}` : ""},{" "}
          {address.taluk && address.taluk !== "NA" ? `${address.taluk}, ` : ""}
          {address.city}, {address.state} – {address.pincode}
        </p>
      </div>

      {/* overflow menu */}
      <div ref={menuRef} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="p-1.5 text-amber-300 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Address options"
        >
          <MoreVertical size={16} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-100 rounded-xl shadow-lg z-10 py-1 overflow-hidden">
            <button
              onClick={() => { setMenuOpen(false); onEdit(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-body text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Pencil size={13} /> Edit
            </button>
            <button
              onClick={() => { setMenuOpen(false); onDelete(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-body text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── New address form (reuses Field + INDIAN_STATES from Address.jsx) ──
function AddNewForm({ onSaved, onCancel }) {
  const { user } = useAuthStore();
  const addMutation = useAddAddress();
  const saving = addMutation.isPending;

  const [form, setForm] = useState({
    name:         user?.fullName || user?.name || "",
    phone:        user?.phone || "",
    addressLine1: "",
    addressLine2: "",
    taluk:        "",
    city:         "",
    state:        "",
    pincode:      "",
  });
  const [errors,     setErrors]     = useState({});
  const [pinLoading, setPinLoading] = useState(false);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const handlePincodeChange = async (_, val) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 6);
    set("pincode", cleaned);
    if (cleaned.length !== 6) return;
    setPinLoading(true);
    try {
      const data = await lookupPincode(cleaned);
      const matchedState = INDIAN_STATES.find((s) => norm(s) === norm(data.state)) || data.state;
      setForm((f) => ({
        ...f,
        taluk: data.taluk && data.taluk !== "NA" ? data.taluk : f.taluk,
        city:  data.district || f.city,
        state: matchedState  || f.state,
      }));
    } catch { /* leave fields editable */ }
    finally { setPinLoading(false); }
  };

  const validate = () => {
    const e = {};
    if (!form.name?.trim())                              e.name         = "Required";
    if (!/^[6-9]\d{9}$/.test(form.phone?.trim()))       e.phone        = "Enter valid 10-digit number";
    if (!form.addressLine1?.trim())                      e.addressLine1 = "Required";
    if (!form.city?.trim())                              e.city         = "Required";
    if (!form.state?.trim())                             e.state        = "Required";
    if (!/^\d{6}$/.test(form.pincode?.trim()))           e.pincode      = "Enter valid 6-digit pincode";
    return e;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      const result = await addMutation.mutateAsync({
        label:        "Home",
        fullName:     form.name,
        phone:        form.phone,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2 || "",
        taluk:        form.taluk || "",
        city:         form.city,
        state:        form.state,
        pincode:      form.pincode,
        isDefault:    false,
      });
      // Map raw API response to the same shape as useAddresses() returns
      const saved = {
        id:           result.address.id,
        label:        result.address.label,
        name:         result.address.full_name,
        phone:        result.address.phone,
        addressLine1: result.address.address_line1,
        addressLine2: result.address.address_line2 || "",
        taluk:        result.address.taluk || "",
        city:         result.address.city,
        state:        result.address.state,
        pincode:      result.address.pincode,
        isDefault:    result.address.is_default,
      };
      onSaved(saved);
    } catch { /* error surfaces via mutation state */ }
  };

  return (
    <div className="border-t border-amber-100 px-4 pt-4 pb-5 bg-amber-50/30">
      <p className="font-body text-xs font-semibold text-amber-600 mb-3">New address</p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Full Name"      name="name"         placeholder="Recipient"          required half
          value={form.name}         onChange={(_, v) => set("name", v)}         error={errors.name} />
        <Field label="Phone"          name="phone"        type="tel" placeholder="10-digit" required half
          value={form.phone}        onChange={(_, v) => set("phone", v)}        error={errors.phone} />
        <Field label="Address Line 1" name="addressLine1" placeholder="House / Street"     required
          value={form.addressLine1} onChange={(_, v) => set("addressLine1", v)} error={errors.addressLine1} />
        <Field label="Address Line 2" name="addressLine2" placeholder="Area / Landmark"
          value={form.addressLine2} onChange={(_, v) => set("addressLine2", v)} />
        <Field label="Pincode"        name="pincode"      type="tel" placeholder="6 digits" required half
          loading={pinLoading}
          value={form.pincode}      onChange={handlePincodeChange}              error={errors.pincode} />
        <Field label="Taluk"          name="taluk"        placeholder="Auto-filled"          half
          value={form.taluk}        onChange={(_, v) => set("taluk", v)} />
        <Field label="City / District" name="city"        placeholder="District"            required half
          value={form.city}         onChange={(_, v) => set("city", v)}         error={errors.city} />
        <Field label="State"          name="state"        required half select
          value={form.state}        onChange={(_, v) => set("state", v)}        error={errors.state} />
      </div>

      {addMutation.isError && (
        <p className="font-body text-xs text-red-500 mt-2">
          {addMutation.error?.response?.data?.message || "Failed to save address. Please try again."}
        </p>
      )}

      <div className="flex gap-2 mt-4">
        <button onClick={handleSave} disabled={saving}
          className="btn-sm btn-primary flex items-center gap-1">
          {saving
            ? <><Loader2 size={13} className="animate-spin" /> Saving…</>
            : <><Check size={13} /> Save Address</>}
        </button>
        <button onClick={onCancel} className="btn-sm btn-outline flex items-center gap-1">
          <X size={13} /> Cancel
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// AddressPickerSheet — bottom sheet on mobile, centered modal on desktop
//
// Props:
//   open       {boolean}
//   onClose    {fn}
//   selectedId {number|null}   — id of the currently selected address
//   onSelect   {fn(address)}   — called when user picks an address; closes sheet
//   onSavedEdited {fn(updated)} — called when an existing address is edited
// ══════════════════════════════════════════════════════════════════════
export default function AddressPickerSheet({ open, onClose, selectedId, onSelect, onSavedEdited }) {
  const { data: addresses = [], isLoading } = useAddresses();
  const deleteMutation = useDeleteAddress();

  const [showAddForm, setShowAddForm]   = useState(false);
  const [editingId,   setEditingId]     = useState(null);

  if (!open) return null;

  const handleSelect = (address) => {
    onSelect(address);
    onClose();
  };

  const handleDelete = async (address) => {
    await deleteMutation.mutateAsync(address.id);
    // If we deleted the currently selected address, select the first remaining one
    if (address.id === selectedId) {
      const remaining = addresses.filter((a) => a.id !== address.id);
      if (remaining.length > 0) onSelect(remaining[0]);
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* sheet panel */}
      <div className="relative w-full sm:max-w-md max-h-[90vh] flex flex-col bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl">

        {/* drag pill (mobile) */}
        <div className="sm:hidden w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-1 shrink-0" />

        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <p className="font-body text-base font-bold text-brand-900">Select delivery address</p>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Saved addresses header + Add New */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <p className="font-body text-xs font-semibold text-amber-500 uppercase tracking-wide">
              Saved addresses
            </p>
            <button
              onClick={() => { setShowAddForm((v) => !v); setEditingId(null); }}
              className="flex items-center gap-1 font-body text-sm font-semibold text-brand-700 hover:text-brand-900 transition-colors"
            >
              <Plus size={15} /> Add New
            </button>
          </div>

          {/* address list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-amber-400">
              <Loader2 size={18} className="animate-spin mr-2" />
              <span className="font-body text-sm">Loading…</span>
            </div>
          ) : addresses.length === 0 ? (
            <p className="font-body text-sm text-amber-500 text-center py-6">No saved addresses yet.</p>
          ) : (
            <div>
              {addresses.map((addr) => (
                <div key={addr.id}>
                  <AddressRow
                    address={addr}
                    isSelected={addr.id === selectedId}
                    onSelect={() => handleSelect(addr)}
                    onEdit={() => setEditingId((id) => (id === addr.id ? null : addr.id))}
                    onDelete={() => handleDelete(addr)}
                  />
                  {editingId === addr.id && (
                    <div className="px-4 pb-4 bg-amber-50/40 border-b border-amber-50">
                      <SavedAddressEditForm
                        address={addr}
                        onSaved={(updated) => {
                          onSavedEdited(updated);
                          setEditingId(null);
                          // If this was the selected address, keep it selected with updated data
                          if (addr.id === selectedId) onSelect(updated);
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* new address form */}
          {showAddForm && (
            <AddNewForm
              onSaved={(newAddr) => {
                setShowAddForm(false);
                onSelect(newAddr);
                onClose();
              }}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {/* bottom safe area padding */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
