import { useState } from "react";
import { MapPin, Plus, ChevronDown, ChevronUp, ChevronRight, Loader2, Navigation } from "lucide-react";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli","Daman & Diu",
  "Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry",
];

// ── Reusable field inside the grid ─────────────────────────────────────
function Field({ label, name, type = "text", placeholder, required, half, select, value, onChange, error }) {
  return (
    <div className={half ? "col-span-1" : "col-span-2"}>
      <label className="field-label">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>

      {select ? (
        <select
          value={value || ""}
          onChange={(e) => onChange(name, e.target.value)}
          className={error ? "field-input-error" : "field-input"}
        >
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          className={error ? "field-input-error" : "field-input"}
        />
      )}

      {error && (
        <p className="font-body text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}

// ── Single saved address card ───────────────────────────────────────────
function SavedAddressCard({ address, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(address)}
      className={`w-full text-left p-4 border-2 rounded-2xl transition-colors ${
        selected
          ? "border-brand-700 bg-brand-50"
          : "border-amber-100 hover:border-amber-300 bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* radio dot */}
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
          selected ? "border-brand-700 bg-brand-700" : "border-amber-300"
        }`}>
          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>

        <div className="min-w-0">
          <p className="font-body text-sm font-semibold text-brand-900 leading-snug">
            {address.name}
          </p>
          <p className="font-body text-xs text-amber-600 mt-0.5 leading-relaxed">
            {address.addressLine1}
            {address.addressLine2 ? `, ${address.addressLine2}` : ""},&nbsp;
            {address.city}, {address.state} – {address.pincode}
          </p>
          <p className="font-body text-xs text-amber-500 mt-0.5">{address.phone}</p>
        </div>
      </div>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════
// AddressStep
//
// Props:
//   savedAddresses  {array}    — addresses loaded from API
//   selectedSaved   {object}   — currently selected saved address
//   onSelectSaved   {fn}       — (address) => void
//   showNewForm     {boolean}
//   onToggleNewForm {fn}       — () => void
//   newAddress      {object}   — new address form values
//   onChangeNew     {fn}       — (key, value) => void
//   errors          {object}   — per-field error strings
//   onNext          {fn}       — advance to payment step
// ══════════════════════════════════════════════════════════════════════
export default function Address({
  savedAddresses,
  selectedSaved,
  onSelectSaved,
  showNewForm,
  onToggleNewForm,
  newAddress,
  onChangeNew,
  errors,
  onNext,
}) {
  const [detecting, setDetecting] = useState(false);
  const [localErr, setLocalErr] = useState("");

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocalErr("Geolocation is not supported by your browser");
      return;
    }
    setDetecting(true);
    setLocalErr("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                "Accept-Language": "en"
              }
            }
          );
          if (!res.ok) throw new Error("Location lookup failed");
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const house = addr.house_number || addr.building || addr.house_name || addr.amenity || "";
            const street = addr.road || addr.street || addr.footway || addr.path || "";
            let line1 = [house, street].filter(Boolean).join(", ");
            if (!line1) {
              line1 = addr.neighbourhood || addr.suburb || addr.residential || "";
            }

            const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
            let state = addr.state || "";
            state = state.replace(/State of\s+/i, "");

            const pincode = addr.postcode ? addr.postcode.replace(/\s+/g, "") : "";

            if (line1 || city || pincode) {
              const normalize = (str) => String(str).toLowerCase().replace(/\s+/g, "");
              const matchedState = INDIAN_STATES.find((s) => normalize(s) === normalize(state));

              if (line1) onChangeNew("addressLine1", line1);

              const areaParts = [];
              if (addr.neighbourhood && addr.neighbourhood !== street) areaParts.push(addr.neighbourhood);
              if (addr.suburb && addr.suburb !== street && addr.suburb !== addr.neighbourhood) areaParts.push(addr.suburb);
              const line2 = areaParts.filter(Boolean).join(", ");
              if (line2) onChangeNew("addressLine2", line2);

              if (city) onChangeNew("city", city);
              if (matchedState) onChangeNew("state", matchedState);
              if (pincode) onChangeNew("pincode", pincode);
            } else {
              setLocalErr("Location detected, but could not resolve a precise address. Please enter details manually.");
            }
          } else {
            setLocalErr("Could not retrieve address details for this location");
          }
        } catch {
          setLocalErr("Failed to resolve address from coordinates");
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        let msg = "Failed to detect location";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location access denied. Please enable location permissions.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Location information is unavailable.";
        } else if (error.code === error.TIMEOUT) {
          msg = "Location request timed out.";
        }
        setLocalErr(msg);
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePincodeChange = async (name, val) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 6);
    onChangeNew("pincode", cleaned);

    if (cleaned.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${cleaned}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          const city = po.Name || po.Block || po.District || "";
          const state = po.State || "";
          
          const normalize = (str) => String(str).toLowerCase().replace(/\s+/g, "");
          const matchedState = INDIAN_STATES.find((s) => normalize(s) === normalize(state));
          
          if (city) onChangeNew("city", city);
          if (matchedState) onChangeNew("state", matchedState);
        }
      } catch {
        // fail silently
      }
    }
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
          {localErr && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-body rounded-xl px-4 py-2.5 mb-3">
              {localErr}
            </div>
          )}

          <div className="flex justify-between items-center mb-4 pb-2 border-b border-amber-100/50">
            <span className="font-body text-xs font-semibold text-amber-600">Enter Address details:</span>
            <button
              type="button"
              disabled={detecting}
              onClick={handleDetectLocation}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-brand-300 bg-brand-50 hover:bg-brand-100 text-brand-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {detecting ? (
                <Loader2 size={13} className="animate-spin text-brand-600" />
              ) : (
                <Navigation size={13} className="text-brand-600" />
              )}
              {detecting ? "Detecting…" : "Detect My Location"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Full Name" name="name" placeholder="Recipient name"
              required value={newAddress.name} onChange={onChangeNew} error={errors.name}
            />
            <Field
              label="Phone" name="phone" type="tel" placeholder="10-digit number"
              required value={newAddress.phone} onChange={onChangeNew} error={errors.phone}
            />
            <Field
              label="Address Line 1" name="addressLine1" placeholder="House / Flat / Street"
              required value={newAddress.addressLine1} onChange={onChangeNew} error={errors.addressLine1}
            />
            <Field
              label="Address Line 2" name="addressLine2" placeholder="Area / Landmark (optional)"
              value={newAddress.addressLine2} onChange={onChangeNew}
            />
            <Field
              label="Pincode" name="pincode" type="tel" placeholder="6-digit pincode"
              required half value={newAddress.pincode} onChange={handlePincodeChange} error={errors.pincode}
            />
            <Field
              label="City" name="city" placeholder="City"
              required half value={newAddress.city} onChange={onChangeNew} error={errors.city}
            />
            <Field
              label="State" name="state"
              required select value={newAddress.state} onChange={onChangeNew} error={errors.state}
            />
          </div>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!showNewForm && !selectedSaved}
        className="btn-lg btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue to Payment <ChevronRight size={16} />
      </button>
    </div>
  );
}