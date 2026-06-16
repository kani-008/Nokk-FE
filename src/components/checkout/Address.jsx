import { MapPin, Plus, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";

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
              label="City" name="city" placeholder="City"
              required half value={newAddress.city} onChange={onChangeNew} error={errors.city}
            />
            <Field
              label="State" name="state"
              required half select value={newAddress.state} onChange={onChangeNew} error={errors.state}
            />
            <Field
              label="Pincode" name="pincode" type="tel" placeholder="6-digit pincode"
              required half value={newAddress.pincode} onChange={onChangeNew} error={errors.pincode}
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