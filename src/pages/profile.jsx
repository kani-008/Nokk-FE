import { useState } from "react";
import {
  User, Lock, MapPin, Plus, Pencil, Trash2,
  Eye, EyeOff, Check, Loader2, X,
  Shield, Phone, Mail, ChevronRight,
} from "lucide-react";
import {
  useAddresses,
  useUpdateProfile,
  useUpdatePassword,
  useAddAddress,
  useUpdateAddress,
  useDeleteAddress,
  lookupPincode,
} from "../hookqueries/useProfile";
import { useAuthStore } from "../components/store/AuthStore.jsx";
import { useToast }     from "../components/useToast.jsx";
import Dropdown         from "../components/admin/Dropdown.jsx";

// ── Tabs ──────────────────────────────────────────────────────────
const TABS = [
  { key: "profile",   label: "Personal Info",  icon: User,   desc: "Name, email & phone"    },
  { key: "addresses", label: "My Addresses",   icon: MapPin, desc: "Saved delivery locations" },
  { key: "security",  label: "Password",       icon: Shield, desc: "Change your password"    },
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

const norm = (s) => String(s).toLowerCase().replace(/[\s&]+/g, "");

// ── Initials avatar ────────────────────────────────────────────────
function InitialsAvatar({ name, size = "lg" }) {
  const initials = (name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  const sz = size === "lg" ? "w-20 h-20 text-2xl" : "w-10 h-10 text-sm";
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-sandal-600 to-gray-800 flex items-center justify-center font-display font-bold text-white select-none shrink-0 ring-4 ring-white/20`}>
      {initials}
    </div>
  );
}

// ── Read-only info row ─────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-center gap-3 py-3.5 px-4 rounded-xl bg-gray-50 border border-gray-100">
      <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
        <Icon size={14} className="text-gray-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
        <p className={`text-sm font-semibold text-gray-800 truncate ${mono ? "font-mono" : ""}`}>
          {value || <span className="text-gray-400 font-normal">Not provided</span>}
        </p>
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
    <div className="group relative flex flex-col gap-3 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-sandal-300 hover:shadow-md transition-all duration-200">
      {/* Label badge */}
      {addr.label && (
        <span className="absolute top-4 right-4 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sandal-100 text-sandal-800 border border-sandal-200">
          {addr.label}
        </span>
      )}

      <div className="flex items-start gap-3 pr-16">
        <div className="w-9 h-9 rounded-xl bg-sandal-50 border border-sandal-100 flex items-center justify-center shrink-0">
          <MapPin size={15} className="text-sandal-700" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{addr.name}</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""},&nbsp;
            {addr.taluk && addr.taluk !== "NA" ? `${addr.taluk}, ` : ""}
            {addr.city}, {addr.state} – {addr.pincode}
          </p>
          <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
            <Phone size={10} /> {addr.phone}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-100 mt-auto">
        <button
          onClick={() => onEdit(addr)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 transition-colors cursor-pointer"
        >
          <Pencil size={12} /> Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-100 transition-colors cursor-pointer disabled:opacity-50"
        >
          {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          {deleting ? "Deleting…" : "Delete"}
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
    } catch { /* leave fields editable */ }
    finally { setPinLoading(false); }
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
          addressId: form.id, label: form.label || "Home",
          fullName: form.name, phone: form.phone,
          addressLine1: form.addressLine1, addressLine2: form.addressLine2 || "",
          taluk: form.taluk || "", city: form.city, state: form.state, pincode: form.pincode,
        });
        setSuccess("Address updated.");
      } else {
        res = await addAddressMutation.mutateAsync({
          label: "Home", fullName: form.name, phone: form.phone,
          addressLine1: form.addressLine1, addressLine2: form.addressLine2 || "",
          taluk: form.taluk || "", city: form.city, state: form.state, pincode: form.pincode,
          isDefault: false,
        });
        setSuccess("Address saved.");
      }
      onSave(res?.address || form);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to save address");
    }
  };

  return (
    <div className="rounded-2xl border-2 border-sandal-200 bg-sandal-50/30 p-5 sm:p-6 mb-6">
      {/* Form header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-sandal-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sandal-100 flex items-center justify-center">
            <MapPin size={14} className="text-sandal-700" />
          </div>
          <span className="font-semibold text-sm text-gray-900">
            {form.id ? "Edit Address" : "Add New Address"}
          </span>
        </div>
        <button type="button" onClick={onCancel} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
          <X size={15} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Full Name *</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Recipient name" className="field-input" />
        </div>
        <div>
          <label className="field-label">Phone *</label>
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="10-digit mobile" className="field-input" inputMode="numeric" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">Address Line 1 *</label>
          <input value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} placeholder="Flat, House no., Building, Company" className="field-input" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">Address Line 2 <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
          <input value={form.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} placeholder="Area, Street, Sector, Village" className="field-input" />
        </div>
        <div>
          <label className="field-label flex items-center justify-between">
            Pincode *
            {pinLoading && <span className="flex items-center gap-1 text-sandal-600 text-[10px] font-normal normal-case tracking-normal"><Loader2 size={10} className="animate-spin" /> Looking up…</span>}
          </label>
          <input value={form.pincode} onChange={(e) => handlePincodeChange(e.target.value)} placeholder="6-digit pincode" inputMode="numeric" className="field-input" />
        </div>
        <div>
          <label className="field-label">Taluk <span className="text-gray-400 normal-case font-normal">(auto-filled)</span></label>
          <input value={form.taluk} onChange={(e) => set("taluk", e.target.value)} placeholder="Taluk / Sub-district" className="field-input" />
        </div>
        <div>
          <label className="field-label">City / District *</label>
          <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City or district" className="field-input" />
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
        <div className="sm:col-span-2 flex items-center gap-3 pt-2 border-t border-sandal-100 mt-1">
          <button type="submit" disabled={saving} className="btn-md btn-primary rounded-xl shadow-sm">
            {saving
              ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
              : <><Check size={14} /> {form.id ? "Update Address" : "Save Address"}</>}
          </button>
          <button type="button" onClick={onCancel} className="btn-md btn-outline rounded-xl">Cancel</button>
        </div>
      </form>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
export default function Profile() {
  const { user: authUser, updateUser } = useAuthStore();
  const { setError, setSuccess, displayedError, displayedType, toastVisible } = useToast();

  const [tab, setTab] = useState("profile");
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

  const [editAddr, setEditAddr] = useState(null);
  const [pwForm,   setPwForm]   = useState({ current: "", newPw: "", confirm: "" });
  const [showPw,   setShowPw]   = useState({ c: false, n: false, cf: false });

  const displayName = authUser?.fullName || authUser?.name || "You";

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfileMutation.mutateAsync({ fullName: profile.fullName, phone: profile.phone });
      updateUser(res.user || { ...authUser, fullName: profile.fullName, phone: profile.phone });
      setSuccess("Profile updated successfully.");
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to save profile");
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { setError("New passwords don't match"); return; }
    if (pwForm.newPw.length < 6)         { setError("Password must be at least 6 characters"); return; }
    try {
      await updatePasswordMutation.mutateAsync({ currentPassword: pwForm.current, newPassword: pwForm.newPw });
      setSuccess("Password updated successfully.");
      setPwForm({ current: "", newPw: "", confirm: "" });
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to update password");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/60">
      {/* ── Toast ── */}
      <div className={`fixed top-4 right-4 z-50 max-w-xs sm:max-w-sm transition-all duration-300 ease-out ${
        toastVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
      }`}>
        {displayedError && (
          <div className={`flex items-start gap-3 bg-white shadow-xl border rounded-2xl px-4 py-3.5 text-sm ${
            displayedType === "success"
              ? "border-green-200 text-green-700"
              : "border-red-200 text-red-700"
          }`}>
            {displayedType === "success"
              ? <Check size={16} className="shrink-0 mt-0.5 text-green-500" />
              : <X size={16} className="shrink-0 mt-0.5 text-red-500" />}
            <p className="font-semibold leading-snug">{displayedError}</p>
          </div>
        )}
      </div>

      <div className="page-wrap py-6 sm:py-10">

        {/* ── Hero header ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-sandal-900 text-white mb-6">
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-sandal-400/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-sandal-500/8 blur-3xl pointer-events-none" />

          <div className="relative px-6 py-7 sm:px-10 sm:py-9">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <InitialsAvatar name={displayName} size="lg" />

              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-sandal-300/80 mb-1">My Account</p>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
                  {displayName}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                  {(authUser?.email) && (
                    <span className="flex items-center gap-1.5 text-xs text-sandal-200/80">
                      <Mail size={11} /> {authUser.email}
                    </span>
                  )}
                  {(authUser?.phone) && (
                    <span className="flex items-center gap-1.5 text-xs text-sandal-200/80">
                      <Phone size={11} /> +91 {authUser.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex sm:flex-col gap-4 sm:gap-2 sm:items-end shrink-0">
                <div className="text-center sm:text-right">
                  <p className="text-lg font-bold text-white leading-none">{addressesList.length}</p>
                  <p className="text-[10px] text-sandal-300/70 uppercase tracking-wide">Addresses</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-friendly bottom tab strip — only visible on mobile */}
          <div className="sm:hidden flex border-t border-white/10">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setEditAddr(null); }}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    active ? "text-sandal-300 bg-white/10" : "text-white/50 hover:text-white/80"
                  }`}
                >
                  <Icon size={15} />
                  {t.label.split(" ")[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main layout: sidebar + content ── */}
        <div className="flex gap-6 items-start">

          {/* ── Sidebar (desktop only) ── */}
          <aside className="hidden sm:flex flex-col w-64 shrink-0 gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 pt-2 pb-1.5">Account Settings</p>
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setEditAddr(null); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer group ${
                    active
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    active ? "bg-white/15" : "bg-gray-100 group-hover:bg-gray-200"
                  }`}>
                    <Icon size={14} className={active ? "text-sandal-300" : "text-gray-500"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${active ? "text-white" : ""}`}>{t.label}</p>
                    <p className={`text-[10px] truncate mt-0.5 ${active ? "text-sandal-300/80" : "text-gray-400"}`}>{t.desc}</p>
                  </div>
                  <ChevronRight size={14} className={`shrink-0 ${active ? "text-sandal-300" : "text-gray-300 group-hover:text-gray-400"}`} />
                </button>
              );
            })}
          </aside>

          {/* ── Content panel ── */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm">

            {/* ══ PROFILE TAB ══ */}
            {tab === "profile" && (
              <div>
                {/* Section header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
                    <User size={15} className="text-sandal-300" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-base text-gray-900">Personal Information</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Update your name and contact details</p>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Read-only info strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow icon={Mail}  label="Email Address" value={authUser?.email}  />
                    <InfoRow icon={Phone} label="Phone Number"  value={authUser?.phone ? `+91 ${authUser.phone}` : ""} mono />
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Editable Fields</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  {/* Edit form */}
                  <form onSubmit={handleProfileSave} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="field-label">Full Name</label>
                        <input
                          type="text"
                          value={profile.fullName}
                          onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                          placeholder="Your full name"
                          className="field-input"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="field-label">Phone Number</label>
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                          placeholder="10-digit mobile number"
                          className="field-input"
                          inputMode="numeric"
                          maxLength={10}
                        />
                      </div>
                    </div>
                    <div className="pt-2">
                      <button type="submit" disabled={saving} className="btn-md btn-primary rounded-xl shadow-sm">
                        {saving
                          ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                          : <><Check size={14} /> Save Changes</>}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ══ ADDRESSES TAB ══ */}
            {tab === "addresses" && (
              <div>
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
                      <MapPin size={15} className="text-sandal-300" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-base text-gray-900">Saved Addresses</h2>
                      <p className="text-xs text-gray-400 mt-0.5">{addressesList.length} saved location{addressesList.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  {editAddr === null && (
                    <button
                      onClick={() => setEditAddr("new")}
                      className="btn-sm btn-primary rounded-xl flex items-center gap-1.5"
                    >
                      <Plus size={13} /> Add New
                    </button>
                  )}
                </div>

                <div className="p-6 sm:p-8">
                  {/* Form */}
                  {editAddr !== null && (
                    <AddressForm
                      initial={editAddr === "new" ? null : editAddr}
                      onSave={() => setEditAddr(null)}
                      onCancel={() => setEditAddr(null)}
                      setError={setError}
                      setSuccess={setSuccess}
                    />
                  )}

                  {/* Address grid */}
                  {addrLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[...Array(2)].map((_, i) => <div key={i} className="h-36 rounded-2xl skeleton" />)}
                    </div>
                  ) : addressesList.length === 0 && editAddr === null ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <MapPin size={24} className="text-gray-400" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-sm text-gray-700">No addresses saved yet</p>
                        <p className="text-xs text-gray-400 mt-1">Add your first delivery address to speed up checkout</p>
                      </div>
                      <button onClick={() => setEditAddr("new")} className="btn-sm btn-primary rounded-xl">
                        <Plus size={13} /> Add Address
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {addressesList.map((a) => (
                        <AddressCard
                          key={a.id}
                          addr={a}
                          onEdit={(a) => setEditAddr(a)}
                          setError={setError}
                          setSuccess={setSuccess}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ SECURITY TAB ══ */}
            {tab === "security" && (
              <div>
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
                    <Shield size={15} className="text-sandal-300" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-base text-gray-900">Change Password</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Keep your account secure with a strong password</p>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  {/* Security tip */}
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-sandal-50 border border-sandal-100 mb-6">
                    <Lock size={14} className="text-sandal-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-sandal-800 leading-relaxed">
                      Use a mix of letters, numbers, and symbols. Your password should be at least 6 characters.
                    </p>
                  </div>

                  <form onSubmit={handlePasswordSave} className="space-y-4 max-w-sm">
                    {[
                      { key: "c",  label: "Current Password",     field: "current", val: pwForm.current },
                      { key: "n",  label: "New Password",          field: "newPw",   val: pwForm.newPw   },
                      { key: "cf", label: "Confirm New Password",  field: "confirm", val: pwForm.confirm },
                    ].map(({ key, label, field, val }) => (
                      <div key={key}>
                        <label className="field-label">{label}</label>
                        <div className="relative">
                          <input
                            type={showPw[key] ? "text" : "password"}
                            value={val}
                            onChange={(e) => setPwForm((f) => ({ ...f, [field]: e.target.value }))}
                            placeholder="••••••••"
                            className="field-input pr-10"
                            autoComplete={key === "c" ? "current-password" : "new-password"}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw((s) => ({ ...s, [key]: !s[key] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer p-1 rounded-md hover:bg-gray-100 transition-colors"
                          >
                            {showPw[key] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        {/* Match indicator for confirm field */}
                        {key === "cf" && pwForm.confirm.length > 0 && (
                          <p className={`text-[11px] mt-1.5 font-semibold ${
                            pwForm.newPw === pwForm.confirm ? "text-green-600" : "text-red-500"
                          }`}>
                            {pwForm.newPw === pwForm.confirm ? "✓ Passwords match" : "✗ Passwords don't match"}
                          </p>
                        )}
                      </div>
                    ))}

                    <div className="pt-3 border-t border-gray-100">
                      <button type="submit" disabled={pwSaving} className="btn-md btn-primary rounded-xl shadow-sm w-full sm:w-auto">
                        {pwSaving
                          ? <><Loader2 size={14} className="animate-spin" /> Updating…</>
                          : <><Shield size={14} /> Update Password</>}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
