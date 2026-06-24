import { useState, useEffect } from "react";
import { User, Lock, MapPin, Plus, Pencil, Trash2, Eye, EyeOff, Check, Loader2, Navigation, AlertCircle } from "lucide-react";
import API from "../ApiCall/Api.jsx";
import { useAuthStore } from "../components/store/AuthStore.jsx";
import { useToast }     from "../components/useToast.jsx";

import comboImg from "../assets/products/combo.jpg";

const PH_AVATAR = comboImg;

const TABS = [
  { key: "profile",   label: "Profile",    icon: User   },
  { key: "addresses", label: "Addresses",  icon: MapPin },
  { key: "security",  label: "Security",   icon: Lock   },
];

// ── Field component ────────────────────────────────────────────────────
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

// ── Address card ───────────────────────────────────────────────────────
function AddressCard({ addr, onEdit, onDelete, setError, setSuccess }) {
  const { token } = useAuthStore();
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    if (!confirm("Delete this address?")) return;
    setDeleting(true);
    try {
      const response = await API.delete("/users/me/delete-address", {
        data: { addressId: addr.id }
      });
      console.log(response.data);
      setSuccess("Address deleted successfully!");
      onDelete(addr.id);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to delete address");
    } finally {
      setDeleting(false);
    }
  };
  return (
    <div className="card p-4 flex gap-4 items-start hover:border-sandal-300 transition-colors">
      <div className="p-2 rounded-xl bg-sandal-50 shrink-0 mt-0.5"><MapPin size={16} className="text-sandal-600" /></div>
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm font-semibold text-amber-950">{addr.name}</p>
        <p className="font-body text-xs text-amber-800 mt-0.5 leading-relaxed">
          {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""},&nbsp;
          {addr.city}, {addr.state} – {addr.pincode}
        </p>
        <p className="font-body text-xs text-sandal-600 mt-0.5">{addr.phone}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        <button onClick={() => onEdit(addr)} className="p-1.5 text-amber-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"><Pencil size={14} /></button>
        <button onClick={handleDelete} disabled={deleting} className="p-1.5 text-amber-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>
    </div>
  );
}

// ── Address form ───────────────────────────────────────────────────────
const ADDR_EMPTY = { name:"", phone:"", addressLine1:"", addressLine2:"", city:"", state:"", pincode:"" };
const STATES = ["Tamil Nadu","Karnataka","Kerala","Andhra Pradesh","Telangana","Maharashtra","Delhi","Others"];

function AddressForm({ initial, onSave, onCancel, setError, setSuccess }) {
  const { token } = useAuthStore();
  const [form,   setForm]   = useState(initial || ADDR_EMPTY);
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    setDetecting(true);

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
            const street = addr.road || addr.suburb || addr.neighbourhood || "";
            const house = addr.house_number || addr.building || "";
            const line1 = [house, street].filter(Boolean).join(", ");
            const city = addr.city || addr.town || addr.village || addr.county || addr.suburb || "";
            
            let state = addr.state || "";
            state = state.replace(/State of\s+/i, "");
            
            const pincode = addr.postcode || "";

            const normalize = (str) => String(str).toLowerCase().replace(/\s+/g, "");
            const matchedState = STATES.find((s) => normalize(s) === normalize(state));

            setForm((prev) => ({
              ...prev,
              addressLine1: line1 || prev.addressLine1,
              city: city || prev.city,
              state: matchedState || (state ? "Others" : prev.state),
              pincode: pincode.replace(/\s+/g, "") || prev.pincode,
            }));
            setSuccess("Location detected successfully!");
          } else {
            setError("Could not retrieve address details for this location");
          }
        } catch {
          setError("Failed to resolve address from coordinates");
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
        setError(msg);
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePincodeChange = async (val) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 6);
    set("pincode", cleaned);

    if (cleaned.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${cleaned}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          const city = po.District || po.Block || po.Name || "";
          const state = po.State || "";
          
          const normalize = (str) => String(str).toLowerCase().replace(/\s+/g, "");
          const matchedState = STATES.find((s) => normalize(s) === normalize(state));
          
          setForm((prev) => ({
            ...prev,
            city: city || prev.city,
            state: matchedState || (state ? "Others" : prev.state)
          }));
          setSuccess(`Pincode resolved: ${city}, ${state}`);
        }
      } catch {
        // fail silently
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.addressLine1 || !form.city || !form.state || !form.pincode) {
      setError("Please fill all required fields"); return;
    }
    setSaving(true);
    try {
      let res;
      if (form.id) {
        const response = await API.put("/users/me/update-address", { addressId: form.id, ...form });
        console.log(response.data);
        res = response.data;
        setSuccess("Address updated successfully!");
      } else {
        const response = await API.post("/users/me/add-address", form);
        console.log(response.data);
        res = response.data;
        setSuccess("Address added successfully!");
      }
      onSave(res.address || form);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-4 border-sandal-200 border-2 bg-sandal-50/20">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-sandal-100/60">
        <span className="font-body text-xs font-bold text-sandal-700 uppercase tracking-wide">Enter Address details:</span>
        <button
          type="button"
          disabled={detecting}
          onClick={handleDetectLocation}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-sandal-300 bg-sandal-100 hover:bg-sandal-200/70 text-sandal-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
        >
          {detecting ? (
            <Loader2 size={13} className="animate-spin text-sandal-600" />
          ) : (
            <Navigation size={13} className="text-sandal-600" />
          )}
          {detecting ? "Detecting…" : "Detect My Location"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
        <div><label className="field-label">Name *</label><input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Recipient" className="field-input" /></div>
        <div><label className="field-label">Phone *</label><input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="10-digit" className="field-input" /></div>
        <div className="col-span-2"><label className="field-label">Address Line 1 *</label><input value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} placeholder="Street / Flat" className="field-input" /></div>
        <div className="col-span-2"><label className="field-label">Address Line 2</label><input value={form.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} placeholder="Landmark" className="field-input" /></div>
        
        <div>
          <label className="field-label">Pincode *</label>
          <input
            value={form.pincode}
            onChange={(e) => handlePincodeChange(e.target.value)}
            placeholder="6 digits"
            className="field-input"
          />
        </div>
        <div><label className="field-label">City *</label><input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City" className="field-input" /></div>
        
        <div>
          <label className="field-label">State *</label>
          <select value={form.state} onChange={(e) => set("state", e.target.value)} className="field-input">
            <option value="">Select</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex items-end gap-2 col-span-2 pt-2">
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
  const { token, user: authUser, updateUser } = useAuthStore();
  const { setError, setSuccess, displayedError, displayedType, toastVisible } = useToast();
  const [tab,       setTab]       = useState("profile");
  const [profile,   setProfile]   = useState({ fullName: authUser?.fullName || authUser?.name || "", email: authUser?.email || "", phone: authUser?.phone || "" });
  const [saving,    setSaving]    = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [editAddr,  setEditAddr]  = useState(null); // null | "new" | addr object
  const [pwForm,    setPwForm]    = useState({ current: "", newPw: "", confirm: "" });
  const [showPw,    setShowPw]    = useState({ c: false, n: false, cf: false });
  const [pwSaving,  setPwSaving]  = useState(false);

  useEffect(() => {
    let active = true;
    if (tab !== "addresses") return;
    const timer = setTimeout(() => {
      if (active) setAddrLoading(true);
    }, 0);
    const fetchAddresses = async () => {
      try {
        const response = await API.get("/users/me/addresses");
        console.log(response.data);
        if (!active) return;
        setAddresses(response.data.addresses || []);
      } catch (err) {
        console.error("Failed to load addresses:", err);
      } finally {
        if (active) setAddrLoading(false);
      }
    };
    fetchAddresses();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [tab, token]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await API.put("/users/me/update", { fullName: profile.fullName, phone: profile.phone });
      console.log(response.data);
      const res = response.data;
      updateUser(res.user || { ...authUser, fullName: profile.fullName, phone: profile.phone });
      setSuccess("Profile information updated successfully!");
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { setError("Passwords don't match"); return; }
    if (pwForm.newPw.length < 6)         { setError("Minimum 6 characters required");  return; }
    setPwSaving(true);
    try {
      const response = await API.put("/users/me/password", { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      console.log(response.data);
      setSuccess("Password updated successfully!");
      setPwForm({ current: "", newPw: "", confirm: "" });
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to update password");
    } finally {
      setPwSaving(false);
    }
  };

  const handleAddrSaved = (addr) => {
    setAddresses((prev) => {
      const idx = prev.findIndex((a) => a.id === addr.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = addr; return n; }
      return [...prev, addr];
    });
    setEditAddr(null);
  };

  return (
    <div className="page-wrap py-8 bg-sandal-50/30 min-h-screen">
      
      {/* ── Toast (Red for Error, Green for Success) ── */}
      <div
        className={`fixed top-4 right-4 z-50 max-w-[calc(100vw-2rem)] sm:max-w-sm transition-all duration-300 ease-out ${
          toastVisible ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0 pointer-events-none"
        }`}
      >
        {displayedError && (
          <div
            className={`flex items-start gap-2.5 bg-white border shadow-lg font-body text-sm rounded-xl px-4 py-3.5 ${
              displayedType === "success"
                ? "border-green-200 shadow-green-900/5 text-green-700"
                : "border-red-200 shadow-red-900/5 text-red-700"
            }`}
          >
            {displayedType === "success" ? (
              <Check size={17} className="shrink-0 mt-0.5 text-green-500" />
            ) : (
              <AlertCircle size={17} className="shrink-0 mt-0.5 text-red-500" />
            )}
            <p className="leading-snug">{displayedError}</p>
          </div>
        )}
      </div>

      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-amber-950 mb-8 tracking-tight border-b border-sandal-100 pb-3">My Account</h1>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* sidebar */}
        <div className="sm:w-56 shrink-0 space-y-2">
          {/* avatar */}
          <div className="card p-5 text-center mb-4 border border-sandal-100 bg-white">
            <div className="relative w-16 h-16 mx-auto mb-3">
              <img
                src={authUser?.avatarUrl || PH_AVATAR} alt="avatar"
                className="w-full h-full rounded-full object-cover bg-amber-50 border-2 border-sandal-200 shadow-sm"
                onError={(e) => { e.target.src = PH_AVATAR; }}
              />
            </div>
            <p className="font-body text-sm font-extrabold text-amber-950 truncate">{authUser?.fullName || authUser?.name}</p>
            <p className="font-body text-xs text-sandal-600 truncate mt-0.5">{authUser?.phone || authUser?.email}</p>
          </div>
          
          <div className="space-y-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
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

        {/* content */}
        <div className="flex-1 card p-5 sm:p-6 border border-sandal-100 bg-white shadow-sm">

          {/* ── Profile ───────────────────────────────────────────── */}
          {tab === "profile" && (
            <div>
              <h2 className="font-display text-lg font-bold text-amber-950 mb-1">Personal Information</h2>
              <p className="font-body text-xs text-sandal-600 mb-6">Manage your contact details and account information</p>
              
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

          {/* ── Addresses ─────────────────────────────────────────── */}
          {tab === "addresses" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-display text-lg font-bold text-amber-950">Saved Addresses</h2>
                  <p className="font-body text-xs text-sandal-600">Manage your delivery and billing addresses</p>
                </div>
                {!editAddr && (
                  <button onClick={() => setEditAddr("new")} className="btn-sm btn-outline flex items-center gap-1">
                    <Plus size={13} /> Add New
                  </button>
                )}
              </div>
              {editAddr && (
                <div className="mb-4">
                  <AddressForm
                    initial={editAddr === "new" ? null : editAddr}
                    onSave={handleAddrSaved}
                    onCancel={() => setEditAddr(null)}
                    setError={setError}
                    setSuccess={setSuccess}
                  />
                </div>
              )}
              {addrLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => <div key={i} className="card p-4 h-20 skeleton" />)}
                </div>
              ) : addresses.length === 0 && !editAddr ? (
                <div className="text-center py-12">
                  <MapPin size={36} className="text-sandal-300 mx-auto mb-3" />
                  <p className="font-body text-sm text-sandal-500">No saved addresses yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((a) => (
                    <AddressCard key={a.id} addr={a}
                      onEdit={(a) => setEditAddr(a)}
                      onDelete={(id) => setAddresses((prev) => prev.filter((x) => x.id !== id))}
                      setError={setError}
                      setSuccess={setSuccess}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Security ──────────────────────────────────────────── */}
          {tab === "security" && (
            <div>
              <h2 className="font-display text-lg font-bold text-amber-950 mb-1">Change Password</h2>
              <p className="font-body text-xs text-sandal-600 mb-6">Update your password to keep your account secure</p>
              
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
                      <button type="button" onClick={() => setShowPw((s) => ({ ...s, [key]: !s[key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sandal-400 hover:text-sandal-700 cursor-pointer">
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