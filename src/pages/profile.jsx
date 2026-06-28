import { useState } from "react";
import { User, Lock, MapPin, Plus, Pencil, Trash2, Eye, EyeOff, Check, Loader2, AlertCircle, X } from "lucide-react";
import {
  useAddresses,
  useUpdateProfile,
  useUpdatePassword,
  useAddAddress,
  useUpdateAddress,
  useDeleteAddress,
  lookupPincode,
} from "../hooks/queries/useProfile";
import { useAuthStore } from "../components/store/AuthStore.jsx";
import { useToast }     from "../components/useToast.jsx";
import Dropdown         from "../components/admin/Dropdown.jsx";

import comboImg from "../assets/products/combo.jpg";

const PH_AVATAR = comboImg;

const TABS = [
  { key: "profile",   label: "Profile",   icon: User   },
  { key: "addresses", label: "Addresses", icon: MapPin },
  { key: "security",  label: "Security",  icon: Lock   },
];

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli","Daman & Diu",
  "Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry",
];

// ── Normalise state string for matching ────────────────────────────
const norm = (s) => String(s).toLowerCase().replace(/[\s&]+/g, "");

// ── Profile field ──────────────────────────────────────────────────
function Field({ label, name, type = "text", value, onChange, placeholder, readOnly, rightSlot }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="relative">
        <input
          type={type} name={name} value={value}
          onChange={onChange} placeholder={placeholder}
          readOnly={readOnly}
          className={`field-input ${readOnly ? "bg-gray-50 cursor-not-allowed" : ""} ${rightSlot ? "pr-10" : ""}`}
        />
        {rightSlot && <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</span>}
      </div>
    </div>
  );
}

// ── Address card ───────────────────────────────────────────────────
function AddressCard({ addr, onEdit, setError, setSuccess }) {
  const deleteAddressMutation = useDeleteAddress();
  const deleting = deleteAddressMutation.isPending;

  const handleDelete = async () => {
    if (!confirm("Delete this address?")) return;
    try {
      await deleteAddressMutation.mutateAsync(addr.id);
      setSuccess("Address deleted.");
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to delete address");
    }
  };

  return (
    <div className="card p-4 flex gap-4 items-start hover:border-sandal-300 transition-colors">
      <div className="p-2 rounded-xl bg-sandal-50 shrink-0 mt-0.5">
        <MapPin size={16} className="text-sandal-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm font-semibold text-amber-950">{addr.name}</p>
        <p className="font-body text-xs text-amber-800 mt-0.5 leading-relaxed">
          {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""},&nbsp;
          {addr.taluk && addr.taluk !== "NA" ? `${addr.taluk}, ` : ""}{addr.city}, {addr.state} – {addr.pincode}
        </p>
        <p className="font-body text-xs text-sandal-600 mt-0.5">{addr.phone}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => onEdit(addr)}
          className="p-1.5 text-amber-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 text-amber-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>
    </div>
  );
}

// ── Address form ───────────────────────────────────────────────────
const ADDR_EMPTY = {
  name: "", phone: "", addressLine1: "", addressLine2: "",
  taluk: "", city: "", state: "", pincode: "",
};

function AddressForm({ initial, onSave, onCancel, setError, setSuccess }) {
  const [form, setForm]       = useState(initial || ADDR_EMPTY);
  const [pinLoading, setPinLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handlePincodeChange = async (val) => {
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
    } catch {
      // pincode not found — leave fields editable, don't show error
    } finally {
      setPinLoading(false);
    }
  };

  const addAddressMutation    = useAddAddress();
  const updateAddressMutation = useUpdateAddress();
  const saving = addAddressMutation.isPending || updateAddressMutation.isPending;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.addressLine1 || !form.city || !form.state || !form.pincode) {
      setError("Please fill all required fields");
      return;
    }
    try {
      let res;
      if (form.id) {
        res = await updateAddressMutation.mutateAsync({
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
        setSuccess("Address updated.");
      } else {
        res = await addAddressMutation.mutateAsync({
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
        setSuccess("Address saved.");
      }
      onSave(res?.address || form);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to save address");
    }
  };

  return (
    <div className="card p-4 border-sandal-200 border-2 bg-sandal-50/20">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-sandal-100/60">
        <span className="font-body text-xs font-bold text-sandal-700 uppercase tracking-wide">
          {form.id ? "Edit Address" : "New Address"}
        </span>
        <button type="button" onClick={onCancel} className="text-sandal-400 hover:text-sandal-700">
          <X size={15} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
        {/* Name | Phone */}
        <div>
          <label className="field-label">Name *</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Recipient" className="field-input" />
        </div>
        <div>
          <label className="field-label">Phone *</label>
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="10-digit" className="field-input" inputMode="numeric" />
        </div>

        {/* Address Line 1 */}
        <div className="col-span-2">
          <label className="field-label">Address Line 1 *</label>
          <input value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} placeholder="House / Flat / Street" className="field-input" />
        </div>

        {/* Address Line 2 */}
        <div className="col-span-2">
          <label className="field-label">Address Line 2</label>
          <input value={form.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} placeholder="Area / Landmark (optional)" className="field-input" />
        </div>

        {/* Pincode | Taluk */}
        <div>
          <label className="field-label flex items-center gap-1">
            Pincode *
            {pinLoading && <Loader2 size={11} className="animate-spin text-sandal-400" />}
          </label>
          <input
            value={form.pincode}
            onChange={(e) => handlePincodeChange(e.target.value)}
            placeholder="6 digits"
            inputMode="numeric"
            className="field-input"
          />
        </div>
        <div>
          <label className="field-label">Taluk</label>
          <input value={form.taluk} onChange={(e) => set("taluk", e.target.value)} placeholder="Auto-filled" className="field-input" />
        </div>

        {/* City | State */}
        <div>
          <label className="field-label">City / District *</label>
          <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="District" className="field-input" />
        </div>
        <div>
          <label className="field-label">State *</label>
          <Dropdown
            value={form.state}
            onChange={(val) => set("state", val)}
            options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
            placeholder="Select state"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 col-span-2 pt-2">
          <button type="submit" disabled={saving} className="btn-md btn-primary">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> Save</>}
          </button>
          <button type="button" onClick={onCancel} className="btn-md btn-outline">Cancel</button>
        </div>
      </form>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
export default function Profile() {
  const { user: authUser, updateUser } = useAuthStore();
  const { setError, setSuccess, displayedError, displayedType, toastVisible } = useToast();

  const [tab,     setTab]     = useState("profile");
  const [profile, setProfile] = useState({
    fullName: authUser?.fullName || authUser?.name || "",
    email:    authUser?.email  || "",
    phone:    authUser?.phone  || "",
  });

  const updateProfileMutation  = useUpdateProfile();
  const updatePasswordMutation = useUpdatePassword();

  const { data: addressesList = [], isLoading: addrLoading } = useAddresses();

  const saving   = updateProfileMutation.isPending;
  const pwSaving = updatePasswordMutation.isPending;

  // null = list view, "new" = add form, addr object = edit form
  const [editAddr, setEditAddr] = useState(null);
  const [pwForm,   setPwForm]   = useState({ current: "", newPw: "", confirm: "" });
  const [showPw,   setShowPw]   = useState({ c: false, n: false, cf: false });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfileMutation.mutateAsync({ fullName: profile.fullName, phone: profile.phone });
      updateUser(res.user || { ...authUser, fullName: profile.fullName, phone: profile.phone });
      setSuccess("Profile updated.");
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to save profile");
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { setError("Passwords don't match"); return; }
    if (pwForm.newPw.length < 6)         { setError("Minimum 6 characters"); return; }
    try {
      await updatePasswordMutation.mutateAsync({ currentPassword: pwForm.current, newPassword: pwForm.newPw });
      setSuccess("Password updated.");
      setPwForm({ current: "", newPw: "", confirm: "" });
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to update password");
    }
  };

  return (
    <div className="page-wrap py-8 bg-sandal-50/30 min-h-screen">

      {/* Toast */}
      <div className={`fixed top-4 right-4 z-50 max-w-[calc(100vw-2rem)] sm:max-w-sm transition-all duration-300 ease-out ${
        toastVisible ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0 pointer-events-none"
      }`}>
        {displayedError && (
          <div className={`flex items-start gap-2.5 bg-white border shadow-lg font-body text-sm rounded-xl px-4 py-3.5 ${
            displayedType === "success"
              ? "border-green-200 shadow-green-900/5 text-green-700"
              : "border-red-200 shadow-red-900/5 text-red-700"
          }`}>
            {displayedType === "success"
              ? <Check size={17} className="shrink-0 mt-0.5 text-green-500" />
              : <AlertCircle size={17} className="shrink-0 mt-0.5 text-red-500" />}
            <p className="leading-snug">{displayedError}</p>
          </div>
        )}
      </div>

      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-amber-950 mb-8 tracking-tight border-b border-sandal-100 pb-3">
        My Account
      </h1>

      <div className="flex flex-col sm:flex-row gap-6">

        {/* Sidebar */}
        <div className="sm:w-56 shrink-0 space-y-2">
          <div className="card p-5 text-center mb-4 border border-sandal-100 bg-white">
            <div className="relative w-16 h-16 mx-auto mb-3">
              <img
                src={authUser?.avatarUrl || PH_AVATAR} alt="avatar"
                className="w-full h-full rounded-full object-cover bg-amber-50 border-2 border-sandal-200 shadow-sm"
                onError={(e) => { e.target.src = PH_AVATAR; }}
              />
            </div>
            <p className="font-body text-sm font-extrabold text-amber-950 truncate">
              {authUser?.fullName || authUser?.name}
            </p>
            <p className="font-body text-xs text-sandal-600 truncate mt-0.5">
              {authUser?.phone || authUser?.email}
            </p>
          </div>

          <div className="space-y-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setEditAddr(null); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl font-body text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    tab === t.key
                      ? "bg-sandal-600 text-white shadow-md shadow-sandal-900/10"
                      : "text-amber-850 hover:bg-sandal-100/60 hover:text-amber-900"
                  }`}
                >
                  <Icon size={16} /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 card p-5 sm:p-6 border border-sandal-100 bg-white shadow-sm">

          {/* ── Profile ── */}
          {tab === "profile" && (
            <div>
              <h2 className="font-display text-lg font-bold text-amber-950 mb-1">Personal Information</h2>
              <p className="font-body text-xs text-sandal-600 mb-6">Manage your contact details</p>
              <form onSubmit={handleProfileSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" name="fullName" value={profile.fullName}
                  onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))} placeholder="Your name" />
                <Field label="Email" type="email" value={profile.email} readOnly placeholder="Email cannot be changed" />
                <Field label="Phone" type="tel" value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="10-digit number" />
                <div className="sm:col-span-2 pt-2">
                  <button type="submit" disabled={saving} className="btn-md btn-primary">
                    {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Addresses ── */}
          {tab === "addresses" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-display text-lg font-bold text-amber-950">Saved Addresses</h2>
                  <p className="font-body text-xs text-sandal-600">Manage your delivery addresses</p>
                </div>
                {editAddr === null && (
                  <button onClick={() => setEditAddr("new")} className="btn-sm btn-outline flex items-center gap-1">
                    <Plus size={13} /> Add New
                  </button>
                )}
              </div>

              {/* Form — add or edit */}
              {editAddr !== null && (
                <div className="mb-4">
                  <AddressForm
                    initial={editAddr === "new" ? null : editAddr}
                    onSave={() => setEditAddr(null)}
                    onCancel={() => setEditAddr(null)}
                    setError={setError}
                    setSuccess={setSuccess}
                  />
                </div>
              )}

              {/* List */}
              {addrLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => <div key={i} className="card p-4 h-20 skeleton" />)}
                </div>
              ) : addressesList.length === 0 && editAddr === null ? (
                <div className="text-center py-12">
                  <MapPin size={36} className="text-sandal-300 mx-auto mb-3" />
                  <p className="font-body text-sm text-sandal-500">No saved addresses yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addressesList.map((a) => (
                    <AddressCard
                      key={a.id} addr={a}
                      onEdit={(a) => setEditAddr(a)}
                      setError={setError}
                      setSuccess={setSuccess}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Security ── */}
          {tab === "security" && (
            <div>
              <h2 className="font-display text-lg font-bold text-amber-950 mb-1">Change Password</h2>
              <p className="font-body text-xs text-sandal-600 mb-6">Keep your account secure</p>
              <form onSubmit={handlePasswordSave} className="space-y-4 max-w-sm">
                {[
                  { key: "c",  label: "Current Password", val: pwForm.current, field: "current" },
                  { key: "n",  label: "New Password",      val: pwForm.newPw,  field: "newPw"   },
                  { key: "cf", label: "Confirm Password",  val: pwForm.confirm,field: "confirm" },
                ].map(({ key, label, val, field }) => (
                  <div key={key}>
                    <label className="field-label">{label}</label>
                    <div className="relative">
                      <input
                        type={showPw[key] ? "text" : "password"}
                        value={val}
                        onChange={(e) => setPwForm((f) => ({ ...f, [field]: e.target.value }))}
                        placeholder="••••••••"
                        className="field-input pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((s) => ({ ...s, [key]: !s[key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sandal-400 hover:text-sandal-700 cursor-pointer"
                      >
                        {showPw[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                ))}
                <button type="submit" disabled={pwSaving} className="btn-md btn-primary w-full sm:w-auto">
                  {pwSaving ? <><Loader2 size={14} className="animate-spin" /> Updating…</> : "Update Password"}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
