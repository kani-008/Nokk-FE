import { useState } from "react";
import { MapPin, Plus, ChevronDown, ChevronUp, ChevronRight, Pencil, X, Check, Loader2, Navigation } from "lucide-react";
import { useUpdateAddress, lookupPincode, detectAddressFromCoords } from "../../hookqueries/useProfile";
import Dropdown from "../admin/Dropdown.jsx";
import { INDIAN_STATES } from "./statesList.js";

const norm = (s) => String(s).toLowerCase().replace(/[\s&]+/g, "");

// ── Reusable grid field ────────────────────────────────────────────
export function Field({ label, name, type = "text", placeholder, required, half, select, value, onChange, error, loading }) {
  return (
    <div className={half ? "col-span-1" : "col-span-2"}>
      <label className="field-label flex items-center gap-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
        {loading  && <Loader2 size={11} className="animate-spin text-amber-400" />}
      </label>

      {select ? (
        <Dropdown
          value={value || ""}
          onChange={(val) => onChange(name, val)}
          options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
          placeholder="Select state"
          error={!!error}
        />
      ) : (
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          inputMode={type === "tel" ? "numeric" : undefined}
          className={error ? "field-input-error" : "field-input"}
        />
      )}

      {error && <p className="font-body text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ── Inline edit form for a saved address ──────────────────────────
export function SavedAddressEditForm({ address, onSaved, onCancel }) {
  const [form, setForm]           = useState({ ...address });
  const [pinLoading, setPinLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const updateMutation            = useUpdateAddress();
  const saving                    = updateMutation.isPending;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const details = await detectAddressFromCoords(latitude, longitude);
          
          if (details.pincode) set("pincode", details.pincode);
          if (details.city) set("city", details.city);
          if (details.taluk) set("taluk", details.taluk);
          const matchedState = INDIAN_STATES.find((s) => norm(s) === norm(details.state)) || details.state;
          if (matchedState) set("state", matchedState);
        } catch (err) {
          alert("Failed to detect location: " + err.message);
        } finally {
          setGeoLoading(false);
        }
      },
      (error) => {
        alert("Geolocation error: " + error.message);
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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
    } catch { /* not found — leave fields editable */ }
    finally { setPinLoading(false); }
  };

  const handleSave = async () => {
    try {
      const res = await updateMutation.mutateAsync({
        addressId:    form.id,
        label:        form.label || "Home",
        fullName:     form.name,
        phone:        form.phone,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2 || "",
        taluk:        form.taluk || "",
        city:         form.city,
        state:        form.state,
        pincode:      form.pincode,
      });
      onSaved(res?.address ? {
        id: res.address.id,
        name: res.address.full_name,
        phone: res.address.phone,
        addressLine1: res.address.address_line1,
        addressLine2: res.address.address_line2 || "",
        taluk: res.address.taluk || "",
        city: res.address.city,
        state: res.address.state,
        pincode: res.address.pincode,
        label: res.address.label,
        isDefault: res.address.is_default,
      } : form);
    } catch { /* error handled by parent or silent */ }
  };

  return (
    <div className="mt-3 border border-amber-200 rounded-xl p-3 bg-amber-50/40">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={geoLoading}
          onClick={handleDetectLocation}
          className="col-span-2 flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-900 border border-brand-200 hover:border-brand-300 rounded-lg px-3 py-1.5 bg-brand-50/50 w-fit transition-all duration-200 disabled:opacity-50 cursor-pointer"
        >
          {geoLoading ? (
            <><Loader2 size={12} className="animate-spin mr-1" /> Detecting…</>
          ) : (
            <><Navigation size={12} className="shrink-0" /> Detect my location</>
          )}
        </button>

        <Field label="Name" name="name" placeholder="Recipient" required half
          value={form.name} onChange={(_, v) => set("name", v)} />
        <Field label="Phone" name="phone" type="tel" placeholder="10-digit" required half
          value={form.phone} onChange={(_, v) => set("phone", v)} />
        <Field label="Address Line 1" name="addressLine1" placeholder="House / Street" required
          value={form.addressLine1} onChange={(_, v) => set("addressLine1", v)} />
        <Field label="Address Line 2" name="addressLine2" placeholder="Area / Landmark"
          value={form.addressLine2} onChange={(_, v) => set("addressLine2", v)} />
        <Field label="Pincode" name="pincode" type="tel" placeholder="6 digits" required half
          loading={pinLoading}
          value={form.pincode} onChange={handlePincodeChange} />
        <Field label="Taluk" name="taluk" placeholder="Auto-filled" half
          value={form.taluk} onChange={(_, v) => set("taluk", v)} />
        <Field label="City / District" name="city" placeholder="District" required half
          value={form.city} onChange={(_, v) => set("city", v)} />
        <Field label="State" name="state" required half select
          value={form.state} onChange={(_, v) => set("state", v)} />
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={handleSave} disabled={saving}
          className="btn-sm btn-primary flex items-center gap-1">
          {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Check size={13} /> Save</>}
        </button>
        <button onClick={onCancel} className="btn-sm btn-outline flex items-center gap-1">
          <X size={13} /> Cancel
        </button>
      </div>
    </div>
  );
}

// ── Saved address card (select + optional inline edit) ─────────────
function SavedAddressCard({ address, selected, onSelect, onSaved }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className={`w-full text-left p-4 border-2 rounded-2xl transition-colors ${
      selected && !editing
        ? "border-brand-700 bg-brand-50"
        : "border-amber-100 hover:border-amber-300 bg-white"
    }`}>
      <div className="flex items-start gap-3">
        {/* radio */}
        <button
          onClick={() => { onSelect(address); setEditing(false); }}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
            selected && !editing ? "border-brand-700 bg-brand-700" : "border-amber-300"
          }`}
        >
          {selected && !editing && <div className="w-2 h-2 rounded-full bg-white" />}
        </button>

        <div className="flex-1 min-w-0" onClick={() => { if (!editing) onSelect(address); }}>
          <p className="font-body text-sm font-semibold text-brand-900 leading-snug">
            {address.name}
          </p>
          <p className="font-body text-xs text-amber-600 mt-0.5 leading-relaxed">
            {address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""},&nbsp;
            {address.taluk && address.taluk !== "NA" ? `${address.taluk}, ` : ""}{address.city}, {address.state} – {address.pincode}
          </p>
          <p className="font-body text-xs text-amber-500 mt-0.5">{address.phone}</p>
        </div>

        {/* edit icon */}
        <button
          onClick={(e) => { e.stopPropagation(); setEditing((v) => !v); }}
          className="p-1.5 text-amber-300 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors shrink-0"
        >
          {editing ? <X size={14} /> : <Pencil size={14} />}
        </button>
      </div>

      {editing && (
        <SavedAddressEditForm
          address={address}
          onSaved={(updated) => { onSaved(updated); setEditing(false); onSelect(updated); }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// AddressStep
//
// Props:
//   savedAddresses  {array}
//   selectedSaved   {object}
//   onSelectSaved   {fn}       — (address) => void
//   onSavedEdited   {fn}       — (updated) => void  (update parent selection)
//   showNewForm     {boolean}
//   onToggleNewForm {fn}
//   newAddress      {object}   — form values (must include taluk)
//   onChangeNew     {fn}       — (key, value) => void
//   errors          {object}
//   onNext          {fn}
// ══════════════════════════════════════════════════════════════════════
export default function Address({
  savedAddresses,
  selectedSaved,
  onSelectSaved,
  onSavedEdited,
  showNewForm,
  onToggleNewForm,
  newAddress,
  onChangeNew,
  errors,
  onNext,
}) {
  const [pinLoading, setPinLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const details = await detectAddressFromCoords(latitude, longitude);
          
          if (details.pincode) onChangeNew("pincode", details.pincode);
          if (details.city) onChangeNew("city", details.city);
          if (details.taluk) onChangeNew("taluk", details.taluk);
          const matchedState = INDIAN_STATES.find((s) => norm(s) === norm(details.state)) || details.state;
          if (matchedState) onChangeNew("state", matchedState);
        } catch (err) {
          alert("Failed to detect location: " + err.message);
        } finally {
          setGeoLoading(false);
        }
      },
      (error) => {
        alert("Geolocation error: " + error.message);
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePincodeChange = async (name, val) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 6);
    onChangeNew("pincode", cleaned);
    if (cleaned.length !== 6) return;

    setPinLoading(true);
    try {
      const data = await lookupPincode(cleaned);
      const matchedState = INDIAN_STATES.find((s) => norm(s) === norm(data.state)) || data.state;
      if (data.taluk && data.taluk !== "NA") onChangeNew("taluk", data.taluk);
      if (data.district)  onChangeNew("city",  data.district);
      if (matchedState)   onChangeNew("state", matchedState);
    } catch { /* pincode not in directory — user fills manually */ }
    finally { setPinLoading(false); }
  };

  return (
    <div className="card p-5 sm:p-6">
      {/* header */}
      <div className="flex items-center gap-2 mb-5">
        <MapPin size={18} className="text-brand-700" />
        <h2 className="font-display text-lg font-bold text-brand-900">Delivery Address</h2>
      </div>

      {/* saved addresses */}
      {savedAddresses.length > 0 && (
        <div className="space-y-3 mb-5">
          {savedAddresses.map((addr) => (
            <SavedAddressCard
              key={addr.id}
              address={addr}
              selected={!showNewForm && selectedSaved?.id === addr.id}
              onSelect={(a) => onSelectSaved(a)}
              onSaved={(updated) => onSavedEdited(updated)}
            />
          ))}
        </div>
      )}

      {/* toggle new form */}
      <button
        onClick={onToggleNewForm}
        className="flex items-center gap-2 font-body text-sm text-brand-700 font-semibold mb-4 hover:text-brand-900 transition-colors"
      >
        <Plus size={16} />
        {savedAddresses.length > 0 ? "Use a different address" : "Add delivery address"}
        {showNewForm ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {/* new address form */}
      {showNewForm && (
        <div className="border border-amber-100 rounded-2xl p-4 mb-5 bg-brand-50">
          <div className="mb-4 pb-2 border-b border-amber-100/50">
            <span className="font-body text-xs font-semibold text-amber-600">Enter Address details:</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              disabled={geoLoading}
              onClick={handleDetectLocation}
              className="col-span-2 flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-900 border border-brand-200 hover:border-brand-300 rounded-lg px-3 py-1.5 bg-brand-50/50 w-fit transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {geoLoading ? (
                <><Loader2 size={12} className="animate-spin mr-1" /> Detecting…</>
              ) : (
                <><Navigation size={12} className="shrink-0" /> Detect my location</>
              )}
            </button>

            <Field label="Full Name" name="name" placeholder="Recipient name" required
              value={newAddress.name} onChange={onChangeNew} error={errors.name} />
            <Field label="Phone" name="phone" type="tel" placeholder="10-digit number" required
              value={newAddress.phone} onChange={onChangeNew} error={errors.phone} />
            <Field label="Address Line 1" name="addressLine1" placeholder="House / Flat / Street" required
              value={newAddress.addressLine1} onChange={onChangeNew} error={errors.addressLine1} />
            <Field label="Address Line 2" name="addressLine2" placeholder="Area / Landmark (optional)"
              value={newAddress.addressLine2} onChange={onChangeNew} />

            <Field label="Pincode" name="pincode" type="tel" placeholder="6-digit pincode" required half
              loading={pinLoading}
              value={newAddress.pincode} onChange={handlePincodeChange} error={errors.pincode} />
            <Field label="Taluk" name="taluk" placeholder="Auto-filled" half
              value={newAddress.taluk} onChange={onChangeNew} />

            <Field label="City / District" name="city" placeholder="District" required half
              value={newAddress.city} onChange={onChangeNew} error={errors.city} />
            <Field label="State" name="state" required half select
              value={newAddress.state} onChange={onChangeNew} error={errors.state} />
          </div>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!showNewForm && !selectedSaved}
        className="btn-lg btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue to Order Summary <ChevronRight size={16} />
      </button>
    </div>
  );
}
