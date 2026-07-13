import { useState } from "react";
import { MapPin, Plus, ChevronDown, ChevronUp, ChevronRight, Pencil, X, Check, Loader2, Navigation, Trash2, ArrowLeft, Lock } from "lucide-react";
import { useUpdateAddress, useDeleteAddress, lookupPincode, detectAddressFromCoords } from "../../hookqueries/useProfile";
import Dropdown from "../admin/Dropdown.jsx";
import { INDIAN_STATES } from "./statesList.js";
import { useToast } from "../useToast";

const norm = (s) => String(s).toLowerCase().replace(/[\s&]+/g, "");

// ── Reusable grid field ────────────────────────────────────────────
export function Field({ label, name, type = "text", placeholder, required, half, select, value, onChange, error, loading }) {
  return (
    <div className={half ? "col-span-1" : "col-span-2"}>
      <label className="block font-body text-[12px] sm:text-xs font-semibold text-gray-600 mb-1 sm:mb-1.5 tracking-wide flex items-center gap-1">
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
          className={`${error ? "field-input-error" : "field-input"} px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm h-[38px] sm:h-[42px]`}
        />
      )}

      {error && <p className="font-body text-[11px] sm:text-xs text-red-500 mt-1">{error}</p>}
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
  const { setError, displayedError, displayedType, toastVisible } = useToast();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      console.log("Location not detected. Geolocation is not supported by this browser.");
      setError("location detector is currently not working use pin code to fill");
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
          console.log("Location not detected. API status code:", err.response?.status || "N/A", "error:", err.message);
          setError("location detector is currently not working use pin code to fill");
        } finally {
          setGeoLoading(false);
        }
      },
      (error) => {
        console.log("Location not detected. Geolocation error status code:", error.code, "message:", error.message);
        setError(error.code === 1
          ? "Location access blocked. Please allow location in your browser settings and try again."
          : "location detector is currently not working use pin code to fill");
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
    } catch (err) {
      console.error("[Pincode lookup failed]", err);
      setError("Pincode lookup failed. Please fill manually or try again.");
    }
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
    <div className="mt-3 border border-amber-200 rounded-xl p-3 bg-amber-50/40 relative">
      {/* Toast notification */}
      <div className={`fixed top-4 right-4 z-50 max-w-[calc(100vw-2rem)] sm:max-w-sm transition-all duration-300 ease-out ${toastVisible ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0 pointer-events-none"}`}>
        {displayedError && (
          <div className={`px-4 py-2.5 rounded-xl shadow-lg border text-sm font-body font-medium ${displayedType === "success" ? "border-green-200 bg-surface text-green-700 shadow-green-900/5" : "border-red-200 bg-surface text-red-700 shadow-red-900/5"}`}>
            {displayedError}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Name" name="name" placeholder="Recipient" required
          value={form.name} onChange={(_, v) => set("name", v)} />
        <Field label="Phone" name="phone" type="tel" placeholder="10-digit" required
          value={form.phone} onChange={(_, v) => set("phone", v)} />
        
        <Field label="Address Line 1" name="addressLine1" placeholder="House / Street" required
          value={form.addressLine1} onChange={(_, v) => set("addressLine1", v)} />
        <Field label="Address Line 2" name="addressLine2" placeholder="Area / Landmark"
          value={form.addressLine2} onChange={(_, v) => set("addressLine2", v)} />

        <Field label="Pincode" name="pincode" type="tel" placeholder="6 digits" required half
          loading={pinLoading}
          value={form.pincode} onChange={handlePincodeChange} />
        
        <div className="col-span-1 flex flex-col justify-end">
          <button
            type="button"
            disabled={geoLoading}
            onClick={handleDetectLocation}
            className="w-full bg-brand-800 hover:bg-brand-900 text-sandal-100 font-body text-[11px] sm:text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 h-[38px] sm:h-[42px] transition-all duration-200 disabled:opacity-50 cursor-pointer mb-[1px]"
          >
            {geoLoading ? (
              <><Loader2 size={13} className="animate-spin" /> Detecting…</>
            ) : (
              <><Navigation size={13} className="shrink-0" /> Use my location</>
            )}
          </button>
        </div>

        <Field label="Taluk" name="taluk" placeholder="Auto-filled" half
          value={form.taluk} onChange={(_, v) => set("taluk", v)} />
        <Field label="City / District" name="city" placeholder="District" required half
          value={form.city} onChange={(_, v) => set("city", v)} />
        
        <Field label="State" name="state" required select
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
function SavedAddressCard({ address, selected, onSelect, onSaved, onDelete }) {
  const [editing, setEditing] = useState(false);
  const deleteMutation = useDeleteAddress();
  const deleting = deleteMutation.isPending;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        await deleteMutation.mutateAsync(address.id);
        if (onDelete) {
          onDelete(address.id);
        }
      } catch (err) {
        console.error("Failed to delete address:", err);
      }
    }
  };

  return (
    <div className={`w-full text-left p-4 border-2 rounded-2xl transition-colors ${
      selected && !editing
        ? "border-brand-700 bg-brand-50"
        : "border-amber-100 hover:border-amber-300 bg-surface"
    }`}>
      <div className="flex items-start gap-3">
        {/* radio */}
        <button
          onClick={() => { onSelect(address); setEditing(false); }}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
            selected && !editing ? "border-brand-700 bg-brand-700" : "border-amber-300"
          }`}
        >
          {selected && !editing && <div className="w-2 h-2 rounded-full bg-surface" />}
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

        {/* edit / delete actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setEditing((v) => !v); }}
            className="p-1.5 text-amber-300 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors shrink-0"
            aria-label="Edit address"
          >
            {editing ? <X size={14} /> : <Pencil size={14} />}
          </button>
          
          {!editing && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 cursor-pointer"
              aria-label="Delete address"
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          )}
        </div>
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
//   onSaveNew       {fn}       — validates + promotes newAddress → selectedSaved
//   onNext          {fn}       — navigates to summary (only when selectedSaved set)
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
  onSaveNew,
  onNext,
  onBack,
}) {
  const [pinLoading, setPinLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const { setError, displayedError, displayedType, toastVisible } = useToast();

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      console.log("Location not detected. Geolocation is not supported by this browser.");
      setError("location detector is currently not working use pin code to fill");
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
          console.log("Location not detected. API status code:", err.response?.status || "N/A", "error:", err.message);
          setError("location detector is currently not working use pin code to fill");
        } finally {
          setGeoLoading(false);
        }
      },
      (error) => {
        console.log("Location not detected. Geolocation error status code:", error.code, "message:", error.message);
        setError(error.code === 1
          ? "Location access blocked. Please allow location in your browser settings and try again."
          : "location detector is currently not working use pin code to fill");
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
    } catch (err) {
      console.error("[Pincode lookup failed]", err);
      setError("Pincode lookup failed. Please fill manually or try again.");
    }
    finally { setPinLoading(false); }
  };

  return (
    <>
      {/* Toast notification */}
      <div className={`fixed top-4 right-4 z-50 max-w-[calc(100vw-2rem)] sm:max-w-sm transition-all duration-300 ease-out ${toastVisible ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0 pointer-events-none"}`}>
        {displayedError && (
          <div className={`px-4 py-2.5 rounded-xl shadow-lg border text-sm font-body font-medium ${displayedType === "success" ? "border-green-200 bg-surface text-green-700 shadow-green-900/5" : "border-red-200 bg-surface text-red-700 shadow-red-900/5"}`}>
            {displayedError}
          </div>
        )}
      </div>

      {/* Mobile-only Header (Step 1 of 3 / Add delivery address / 100% Secure) */}
      <div className="md:hidden flex items-center justify-between gap-4 mb-4 pt-1">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 text-brand-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="font-body text-[10px] text-amber-500 font-semibold leading-none">
              Step 1 of 3
            </p>
            <h2 className="font-display text-lg font-bold text-brand-900 mt-0.5">
              Add delivery address
            </h2>
          </div>
        </div>

        {/* 100% Secure badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 font-body text-[11px] font-bold">
          <Lock size={12} className="text-gray-400" />
          <span>100% Secure</span>
        </div>
      </div>

      {/* card — rounded and wrapped perfectly */}
      <div className="card p-3.5 sm:p-6">
        {/* saved addresses */}
        {savedAddresses.length > 0 && (
          <div className="space-y-3 mb-6">
            <h3 className="font-body text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Saved Addresses</h3>
            {savedAddresses.map((addr) => (
              <SavedAddressCard
                key={addr.id}
                address={addr}
                selected={selectedSaved?.id === addr.id}
                onSelect={(a) => onSelectSaved(a)}
                onSaved={(updated) => onSavedEdited(updated)}
                onDelete={(deletedId) => {
                  if (selectedSaved?.id === deletedId) {
                    onSelectSaved(null);
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* new address form */}
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <h3 className="font-body text-[11px] sm:text-sm font-bold text-amber-600 tracking-wider">Enter Address details:</h3>
          </div>

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
            
            <div className="col-span-1 flex flex-col justify-end">
              <button
                type="button"
                disabled={geoLoading}
                onClick={handleDetectLocation}
                className="w-full bg-brand-800 hover:bg-brand-900 text-sandal-100 font-body text-[11px] sm:text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 h-[38px] sm:h-[42px] transition-all duration-200 disabled:opacity-50 cursor-pointer mb-[1px]"
              >
                {geoLoading ? (
                  <><Loader2 size={13} className="animate-spin" /> Detecting…</>
                ) : (
                  <><Navigation size={13} className="shrink-0" /> Use my location</>
                )}
              </button>
            </div>

            <Field label="Taluk" name="taluk" placeholder="Auto-filled" half
              value={newAddress.taluk} onChange={onChangeNew} />
            <Field label="City / District" name="city" placeholder="District" required half
              value={newAddress.city} onChange={onChangeNew} error={errors.city} />

            <Field label="State" name="state" required select
              value={newAddress.state} onChange={onChangeNew} error={errors.state} />
          </div>
        </div>
    

      {/* ── Sticky bottom bar — fixed on mobile, inline on desktop ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-surface border-t border-amber-100 px-4 py-3 safe-bottom lg:static lg:bg-transparent lg:border-0 lg:px-0 lg:pt-4 lg:pb-0">
        {selectedSaved ? (
          <button
            onClick={onNext}
            className="btn-lg btn-primary w-full lg:w-auto flex items-center justify-center gap-2"
          >
            Continue <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={onSaveNew}
            className="btn-lg btn-primary w-full lg:w-auto flex items-center justify-center gap-2"
          >
            Save Address
          </button>
        )}
      </div>
    </>
  );
}
