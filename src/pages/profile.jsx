import { useState, useEffect } from "react";
import { User, Phone, Mail, Lock, MapPin, Plus, Pencil, Trash2, Eye, EyeOff, Check, Loader2 } from "lucide-react";
import { userApi }      from "../ApiCall/Api.jsx";
import { useAuthStore } from "../components/store/AuthStore.jsx";

const PH_AVATAR = "https://placehold.co/80x80/92400e/fef3c7?text=U";

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
function AddressCard({ addr, onEdit, onDelete }) {
  const { token } = useAuthStore();
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    if (!confirm("Delete this address?")) return;
    setDeleting(true);
    try   { await userApi.deleteAddress(addr.id, token); onDelete(addr.id); }
    catch (e) { alert(e.message || "Failed"); }
    finally { setDeleting(false); }
  };
  return (
    <div className="card p-4 flex gap-4 items-start">
      <div className="p-2 rounded-xl bg-brand-50 shrink-0 mt-0.5"><MapPin size={16} className="text-brand-700" /></div>
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm font-semibold text-brand-900">{addr.name}</p>
        <p className="font-body text-xs text-amber-600 mt-0.5 leading-relaxed">
          {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""},&nbsp;
          {addr.city}, {addr.state} – {addr.pincode}
        </p>
        <p className="font-body text-xs text-amber-500 mt-0.5">{addr.phone}</p>
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

function AddressForm({ initial, onSave, onCancel }) {
  const { token } = useAuthStore();
  const [form,   setForm]   = useState(initial || ADDR_EMPTY);
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.addressLine1 || !form.city || !form.state || !form.pincode) {
      setErr("Please fill all required fields"); return;
    }
    setSaving(true); setErr("");
    try {
      let res;
      if (form.id) res = await userApi.updateAddress(form.id, form, token);
      else         res = await userApi.addAddress(form, token);
      onSave(res.address || form);
    } catch (e) { setErr(e.message || "Failed to save"); }
    finally { setSaving(false); }
  };
  return (
    <div className="card p-4 border-brand-200 border-2">
      {err && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-body rounded-xl px-4 py-2.5 mb-3">{err}</div>}
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
        <div><label className="field-label">Name *</label><input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Recipient" className="field-input" /></div>
        <div><label className="field-label">Phone *</label><input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="10-digit" className="field-input" /></div>
        <div className="col-span-2"><label className="field-label">Address Line 1 *</label><input value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} placeholder="Street / Flat" className="field-input" /></div>
        <div className="col-span-2"><label className="field-label">Address Line 2</label><input value={form.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} placeholder="Landmark" className="field-input" /></div>
        <div><label className="field-label">City *</label><input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City" className="field-input" /></div>
        <div>
          <label className="field-label">State *</label>
          <select value={form.state} onChange={(e) => set("state", e.target.value)} className="field-input">
            <option value="">Select</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div><label className="field-label">Pincode *</label><input value={form.pincode} onChange={(e) => set("pincode", e.target.value)} placeholder="6 digits" className="field-input" /></div>
        <div className="flex items-end gap-2 col-span-2">
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
  const [tab,       setTab]       = useState("profile");
  const [profile,   setProfile]   = useState({ fullName: authUser?.fullName || authUser?.name || "", email: authUser?.email || "", phone: authUser?.phone || "" });
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [profErr,   setProfErr]   = useState("");
  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [editAddr,  setEditAddr]  = useState(null); // null | "new" | addr object
  const [pwForm,    setPwForm]    = useState({ current: "", newPw: "", confirm: "" });
  const [showPw,    setShowPw]    = useState({ c: false, n: false, cf: false });
  const [pwSaving,  setPwSaving]  = useState(false);
  const [pwMsg,     setPwMsg]     = useState("");

  // load addresses when tab switches
  useEffect(() => {
    if (tab !== "addresses") return;
    setAddrLoading(true);
    userApi.addresses(token)
      .then((r) => setAddresses(r.addresses || []))
      .catch(() => {})
      .finally(() => setAddrLoading(false));
  }, [tab, token]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true); setSaved(false); setProfErr("");
    try {
      const res = await userApi.updateMe({ fullName: profile.fullName, phone: profile.phone }, token);
      updateUser(res.user || { ...authUser, fullName: profile.fullName, phone: profile.phone });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { setProfErr(e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg("Passwords don't match"); return; }
    if (pwForm.newPw.length < 6)         { setPwMsg("Minimum 6 characters");  return; }
    setPwSaving(true); setPwMsg("");
    try {
      await userApi.changePassword({ currentPassword: pwForm.current, newPassword: pwForm.newPw }, token);
      setPwMsg("Password updated successfully!");
      setPwForm({ current: "", newPw: "", confirm: "" });
    } catch (e) { setPwMsg(e.message || "Failed to update password"); }
    finally { setPwSaving(false); }
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
    <div className="page-wrap py-8">
      <h1 className="font-display text-2xl font-bold text-brand-900 mb-6">My Account</h1>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* sidebar */}
        <div className="sm:w-48 shrink-0 space-y-1">
          {/* avatar */}
          <div className="card p-4 text-center mb-3">
            <img
              src={authUser?.avatarUrl || PH_AVATAR} alt="avatar"
              className="w-16 h-16 rounded-full mx-auto mb-2 object-cover bg-amber-50 border-2 border-amber-100"
              onError={(e) => { e.target.src = PH_AVATAR; }}
            />
            <p className="font-body text-sm font-bold text-brand-900 truncate">{authUser?.fullName || authUser?.name}</p>
            <p className="font-body text-xs text-amber-500 truncate">{authUser?.phone || authUser?.email}</p>
          </div>
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-body text-sm font-medium transition-colors ${
                  tab === t.key ? "bg-brand-800 text-white" : "text-amber-800 hover:bg-amber-50"
                }`}
              >
                <Icon size={15} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* content */}
        <div className="flex-1 card p-5 sm:p-6">

          {/* ── Profile ───────────────────────────────────────────── */}
          {tab === "profile" && (
            <div>
              <h2 className="font-display text-lg font-bold text-brand-900 mb-5">Personal Information</h2>
              {profErr && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-body rounded-xl px-4 py-3 mb-4">{profErr}</div>}
              {saved   && <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-body rounded-xl px-4 py-3 mb-4 flex items-center gap-2"><Check size={14} /> Profile saved!</div>}
              <form onSubmit={handleProfileSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" name="fullName" value={profile.fullName}
                  onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))} placeholder="Your name" />
                <Field label="Email" type="email" value={profile.email} readOnly placeholder="Email cannot be changed" />
                <Field label="Phone" type="tel" value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="10-digit number" />
                <div className="sm:col-span-2">
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
                <h2 className="font-display text-lg font-bold text-brand-900">Saved Addresses</h2>
                {!editAddr && (
                  <button onClick={() => setEditAddr("new")} className="btn-sm btn-outline">
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
                  />
                </div>
              )}
              {addrLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => <div key={i} className="card p-4 h-20 skeleton" />)}
                </div>
              ) : addresses.length === 0 && !editAddr ? (
                <div className="text-center py-12">
                  <MapPin size={36} className="text-amber-200 mx-auto mb-3" />
                  <p className="font-body text-sm text-amber-500">No saved addresses yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((a) => (
                    <AddressCard key={a.id} addr={a}
                      onEdit={(a) => setEditAddr(a)}
                      onDelete={(id) => setAddresses((prev) => prev.filter((x) => x.id !== id))}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Security ──────────────────────────────────────────── */}
          {tab === "security" && (
            <div>
              <h2 className="font-display text-lg font-bold text-brand-900 mb-5">Change Password</h2>
              {pwMsg && (
                <div className={`text-sm font-body rounded-xl px-4 py-3 mb-4 ${
                  pwMsg.includes("success") ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
                }`}>{pwMsg}</div>
              )}
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-brand-700">
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