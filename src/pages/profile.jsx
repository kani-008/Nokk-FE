import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  User, MapPin, Plus, Pencil, Trash2,
  Check, Loader2, X, ChevronRight, ChevronLeft, ArrowLeft,
  Phone, Mail, LogOut, Package, Heart,
  Tag, AlertTriangle, ShoppingCart, Ticket,
  UserX, UserMinus, Power,
} from "lucide-react";
import {
  useAddresses, useUpdateProfile,
  useAddAddress, useUpdateAddress, useDeleteAddress,
  lookupPincode,
} from "../hookqueries/useProfile";
import { usePublicCoupons }  from "../hookqueries/useOffers";
import { useAuthStore }      from "../components/store/AuthStore.jsx";
import { useWishlistStore }  from "../components/store/WishlistStore.jsx";
import { useToast }          from "../components/useToast.jsx";
import Dropdown              from "../components/admin/Dropdown.jsx";
import API                   from "../ApiCall/Api.jsx";

// ── Helpers ──────────────────────────────────────────────────────────
const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli","Daman & Diu",
  "Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry",
];
const norm = (s) => String(s).toLowerCase().replace(/[\s&]+/g, "");
const cap  = (s) => s ? s[0].toUpperCase() + s.slice(1) : "";

// ── Initials avatar ──────────────────────────────────────────────────
function Avatar({ name, size = "md" }) {
  const initials = (name || "U").trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  const sz = { sm: "w-9 h-9 text-xs", md: "w-12 h-12 text-sm", lg: "w-16 h-16 text-xl" }[size];
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-sandal-500 to-sandal-800 flex items-center justify-center font-bold text-white select-none shrink-0`}>
      {initials}
    </div>
  );
}

// ── Confirm modal ────────────────────────────────────────────────────
function ConfirmModal({ title, body, extra, onConfirm, onCancel, confirmLabel, danger = false, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${danger ? "bg-red-100" : "bg-amber-100"}`}>
            <AlertTriangle size={20} className={danger ? "text-red-600" : "text-amber-600"} />
          </div>
          <p className="font-semibold text-gray-900">{title}</p>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed mb-4">{body}</p>
        {extra}
        <div className="flex gap-2 mt-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-60 ${danger ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"}`}
          >
            {loading ? <Loader2 size={15} className="animate-spin mx-auto" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Address card ─────────────────────────────────────────────────────
function AddressCard({ addr, onEdit, setError, setSuccess }) {
  const del = useDeleteAddress();

  const handleDelete = async () => {
    if (!confirm("Remove this address?")) return;
    try {
      await del.mutateAsync(addr.id);
      setSuccess("Address removed.");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to remove address");
    }
  };

  return (
    <div className="relative flex flex-col gap-3 p-4 rounded-2xl bg-white border-2 border-gray-100 hover:border-sandal-200 hover:shadow-md transition-all duration-200">
      {/* badges */}
      <div className="absolute top-3 right-3 flex gap-1.5">
        {addr.isDefault && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">DEFAULT</span>
        )}
        {addr.label && !addr.isDefault && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sandal-100 text-sandal-800 border border-sandal-200 uppercase">{addr.label}</span>
        )}
      </div>

      {/* content */}
      <div className="flex items-start gap-3 pr-16">
        <div className="w-9 h-9 rounded-xl bg-sandal-50 border border-sandal-100 flex items-center justify-center shrink-0 mt-0.5">
          <MapPin size={15} className="text-sandal-700" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-gray-900">{addr.name}</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            {addr.addressLine1}
            {addr.addressLine2 ? `, ${addr.addressLine2}` : ""},&nbsp;
            {addr.taluk && addr.taluk !== "NA" ? `${addr.taluk}, ` : ""}
            {addr.city}, {addr.state}&nbsp;–&nbsp;{addr.pincode}
          </p>
          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
            <Phone size={10} /> {addr.phone}
          </p>
        </div>
      </div>

      {/* actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={() => onEdit(addr)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-sandal-700 hover:bg-sandal-50 border border-sandal-200 transition-colors cursor-pointer"
        >
          <Pencil size={12} /> Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={del.isPending}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 border border-red-100 transition-colors cursor-pointer disabled:opacity-50"
        >
          {del.isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          {del.isPending ? "Removing…" : "Remove"}
        </button>
      </div>
    </div>
  );
}

// ── Address form ─────────────────────────────────────────────────────
const ADDR_EMPTY = { name: "", phone: "", addressLine1: "", addressLine2: "", taluk: "", city: "", state: "", pincode: "" };

function AddressForm({ initial, onSave, onCancel, setError, setSuccess }) {
  const [form, setForm] = useState(initial || ADDR_EMPTY);
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
    } catch { /* leave editable */ }
    finally { setPinLoading(false); }
  };

  const addM    = useAddAddress();
  const updateM = useUpdateAddress();
  const saving  = addM.isPending || updateM.isPending;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.addressLine1 || !form.city || !form.state || !form.pincode) {
      setError("Please fill all required fields");
      return;
    }
    try {
      if (form.id) {
        await updateM.mutateAsync({
          addressId: form.id, label: form.label || "Home",
          fullName: form.name, phone: form.phone,
          addressLine1: form.addressLine1, addressLine2: form.addressLine2 || "",
          taluk: form.taluk || "", city: form.city, state: form.state, pincode: form.pincode,
        });
        setSuccess("Address updated.");
      } else {
        await addM.mutateAsync({
          label: "Home", fullName: form.name, phone: form.phone,
          addressLine1: form.addressLine1, addressLine2: form.addressLine2 || "",
          taluk: form.taluk || "", city: form.city, state: form.state, pincode: form.pincode,
          isDefault: false,
        });
        setSuccess("Address saved.");
      }
      onSave();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save address");
    }
  };

  return (
    <div className="rounded-2xl border-2 border-sandal-200 bg-gradient-to-br from-sandal-50/60 to-white p-5 mb-5">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-sandal-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sandal-100 flex items-center justify-center">
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
          <input value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile" className="field-input" inputMode="numeric" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">Address Line 1 *</label>
          <input value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} placeholder="Flat no., House, Building, Company" className="field-input" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">Address Line 2 <span className="text-gray-400 normal-case font-normal text-[11px]">(optional)</span></label>
          <input value={form.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} placeholder="Area, Street, Sector, Village" className="field-input" />
        </div>
        <div>
          <label className="field-label flex items-center justify-between">
            Pincode *
            {pinLoading && <span className="flex items-center gap-1 text-sandal-600 text-[10px] font-normal"><Loader2 size={10} className="animate-spin" /> Detecting…</span>}
          </label>
          <input value={form.pincode} onChange={(e) => handlePincodeChange(e.target.value)} placeholder="6-digit pincode" inputMode="numeric" className="field-input" />
        </div>
        <div>
          <label className="field-label">Taluk <span className="text-gray-400 normal-case font-normal text-[11px]">(auto-filled)</span></label>
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
        <div className="sm:col-span-2 flex items-center gap-3 pt-3 border-t border-sandal-100">
          <button type="submit" disabled={saving} className="btn-md btn-primary rounded-xl">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> {form.id ? "Update Address" : "Save Address"}</>}
          </button>
          <button type="button" onClick={onCancel} className="btn-md btn-outline rounded-xl">Cancel</button>
        </div>
      </form>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SIDEBAR NAV ITEM
// ══════════════════════════════════════════════════════════════════════
function SideNavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium border-l-[3px] transition-colors cursor-pointer ${
        active
          ? "bg-sandal-50 text-sandal-800 border-l-sandal-600 font-semibold"
          : "text-gray-600 border-l-transparent hover:bg-sandal-50 hover:text-sandal-800"
      }`}
    >
      <Icon size={15} className={active ? "text-sandal-600" : "text-gray-400"} />
      <span>{label}</span>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════
// PROFILE PAGE
// ══════════════════════════════════════════════════════════════════════
export default function Profile() {
  const navigate = useNavigate();
  const { user: authUser, updateUser, logout } = useAuthStore();
  const { setError, setSuccess, displayedError, displayedType, toastVisible } = useToast();
  const { ids: wishIds, toggle: wishToggle } = useWishlistStore();

  const [isMobile, setIsMobile] = useState(false);
  const [section, setSection] = useState("profile-info");

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && section === "menu") {
        setSection("profile-info");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [section]);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSection("menu");
    }
  }, []);

  // ── Profile form state ─────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    fullName: authUser?.fullName || authUser?.name || "",
    email:    authUser?.email   || "",
    phone:    authUser?.phone   || "",
    gender:   authUser?.gender  || "",
  });

  // Keep form in sync if authUser updates externally
  useEffect(() => {
    if (!editing) {
      setProfile({
        fullName: authUser?.fullName || authUser?.name || "",
        email:    authUser?.email   || "",
        phone:    authUser?.phone   || "",
        gender:   authUser?.gender  || "",
      });
    }
  }, [authUser, editing]);

  // ── Address state ──────────────────────────────────────────────────
  const [editAddr,    setEditAddr]    = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // ── Modal state ────────────────────────────────────────────────────
  const [modal, setModal]             = useState(null); // "deactivate" | "delete" | null
  const [deleteReason, setDeleteReason] = useState("");

  // ── Data queries ───────────────────────────────────────────────────
  const { data: addressesList = [], isLoading: addrLoading } = useAddresses();
  const { data: coupons = [],       isLoading: couponLoading } = usePublicCoupons();

  const { data: wishProducts = [], isLoading: wishLoading } = useQuery({
    queryKey: ["wishlist-products", wishIds?.join(",")],
    queryFn: async () => {
      if (!wishIds?.length) return [];
      const res = await API.get(`/products/get-all?ids=${wishIds.join(",")}`);
      return res.data.products || [];
    },
    enabled: section === "wishlist" && (wishIds?.length ?? 0) > 0,
    staleTime: 60_000,
  });

  // ── Mutations ──────────────────────────────────────────────────────
  const updateProfileMutation = useUpdateProfile();

  const deactivateMutation = useMutation({
    mutationFn: () => API.post("/users/me/deactivate"),
    onSuccess: () => { logout(); navigate("/login", { replace: true }); },
    onError:   (e) => setError(e.response?.data?.message || "Failed to deactivate account"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => API.post("/users/me/delete", { reason: deleteReason || null }),
    onSuccess: () => { logout(); navigate("/login", { replace: true }); },
    onError:   (e) => setError(e.response?.data?.message || "Failed to delete account"),
  });

  const saving = updateProfileMutation.isPending;
  const displayName = authUser?.fullName || authUser?.name || "You";

  // ── Handlers ───────────────────────────────────────────────────────
  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfileMutation.mutateAsync({
        fullName: profile.fullName,
        phone:    profile.phone,
        gender:   profile.gender || null,
      });
      updateUser(res.user || { ...authUser, ...profile });
      setSuccess("Profile updated.");
      setEditing(false);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save profile");
    }
  };

  const handleWishRemove = async (productId) => {
    try {
      await API.delete("/wishlist/remove-item", { data: { productId } });
      wishToggle(productId);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to remove");
    }
  };

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  // ── Sidebar sections ───────────────────────────────────────────────
  const NAV = [
    {
      group: "Account Settings",
      items: [
        { key: "profile-info", label: "Profile Information", icon: User },
        { key: "addresses",    label: "Manage Addresses",    icon: MapPin },
      ],
    },
    {
      group: "My Stuff",
      items: [
        { key: "coupons",  label: "My Coupons",  icon: Ticket },
        { key: "wishlist", label: "My Wishlist",  icon: Heart  },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-sandal-50">

      {/* ── Toast ── */}
      <div className={`fixed top-4 right-4 z-50 max-w-sm transition-all duration-300 ${toastVisible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0 pointer-events-none"}`}>
        {displayedError && (
          <div className={`flex items-start gap-3 bg-white shadow-2xl border rounded-2xl px-4 py-3.5 text-sm ${displayedType === "success" ? "border-green-200 text-green-700" : "border-red-200 text-red-700"}`}>
            {displayedType === "success" ? <Check size={16} className="shrink-0 mt-0.5" /> : <X size={16} className="shrink-0 mt-0.5" />}
            <span className="leading-snug">{displayedError}</span>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {modal === "deactivate" && (
        <ConfirmModal
          title="Deactivate Your Account"
          body="Your account will be paused. You can reactivate it anytime by logging in with your credentials. All your orders and data are preserved."
          onConfirm={() => deactivateMutation.mutate()}
          onCancel={() => setModal(null)}
          confirmLabel="Yes, Deactivate"
          loading={deactivateMutation.isPending}
        />
      )}
      {modal === "delete" && (
        <ConfirmModal
          danger
          title="Permanently Delete Account"
          body="All your personal data (name, phone, email) will be erased. Orders are kept for business records only. This cannot be undone."
          extra={
            <div className="mb-4">
              <label className="field-label mb-1">Why are you leaving? <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Let us know so we can improve…"
                rows={2}
                className="field-input resize-none text-sm"
              />
            </div>
          }
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => { setModal(null); setDeleteReason(""); }}
          confirmLabel="Delete My Account"
          loading={deleteMutation.isPending}
        />
      )}

      <div className="max-w-6xl mx-auto px-2 sm:px-6 pt-0 pb-10 md:py-10">
        <div className="flex flex-col md:flex-row gap-5 items-start">

          {/* ════════════════════════════════════════════════════════════
              LEFT SIDEBAR
          ════════════════════════════════════════════════════════════ */}
          {(!isMobile || section === "menu") && (
            <aside className="w-full md:w-[260px] shrink-0 flex flex-col gap-3">

            {/* User card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <Avatar name={displayName} size="md" />
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400 font-medium leading-none mb-1">Hello,</p>
                <p className="font-bold text-gray-900 text-sm sm:text-base leading-tight truncate">{displayName}</p>
              </div>
            </div>

            {/* My Orders */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <Link
                to="/my-orders"
                className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-gray-700 hover:bg-sandal-50 hover:text-sandal-800 transition-colors"
              >
                <Package size={16} className="text-sandal-600 shrink-0" />
                <span className="flex-1">My Orders</span>
                <ChevronRight size={14} className="text-gray-300" />
              </Link>
            </div>

            {/* Nav groups */}
            {NAV.map((group) => (
              <div key={group.group} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <p className="px-5 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {group.group}
                </p>
                {group.items.map((item) => (
                  <SideNavItem
                    key={item.key}
                    icon={item.icon}
                    label={item.label}
                    active={section === item.key}
                    onClick={() => setSection(item.key)}
                  />
                ))}
              </div>
            ))}

            {/* Logout */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-5 py-4 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          </aside>
          )}

          {/* ════════════════════════════════════════════════════════════
              RIGHT CONTENT
          ════════════════════════════════════════════════════════════ */}
          {(!isMobile || section !== "menu") && (
            <div className="flex-1 min-w-0">


            {/* ── Profile Information ─────────────────────────────────── */}
            {section === "profile-info" && (
              <div className="bg-white rounded-2xl md:border md:border-gray-100 md:shadow-sm">
                {/* header */}
                <div className="flex items-center justify-between px-4 py-4 md:px-6 md:py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    {isMobile && (
                      <button
                        type="button"
                        onClick={() => {
                          setSection("menu");
                          setEditing(false);
                        }}
                        className="p-1 hover:bg-sandal-100/50 rounded-lg transition-colors cursor-pointer text-gray-800"
                        aria-label="Back"
                      >
                        <ArrowLeft size={18} />
                      </button>
                    )}
                    <div>
                      <h2 className="font-bold text-gray-900 text-sm sm:text-base md:text-lg">Personal Information</h2>
                      {!isMobile && (
                        <p className="text-xs text-gray-400 mt-0.5">Update your name, contact details and gender</p>
                      )}
                    </div>
                  </div>
                  {!editing && (
                    <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-xs font-semibold text-sandal-700 hover:text-sandal-900 cursor-pointer">
                      <Pencil size={13} /> Edit
                    </button>
                  )}
                </div>

                <div className="p-6">
                  <form onSubmit={handleProfileSave} className="flex flex-col gap-5">
                    {/* Name row */}
                    <div className="flex items-center gap-3.5 pb-4 border-b border-gray-100/60 last:border-0">
                      <div className="w-9 h-9 rounded-xl bg-sandal-50 border border-sandal-100 flex items-center justify-center shrink-0">
                        <User size={15} className="text-sandal-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Full Name</p>
                        {editing ? (
                          <input
                            value={profile.fullName}
                            onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                            className="field-input mt-1"
                            placeholder="Your full name"
                          />
                        ) : (
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {profile.fullName || <span className="text-gray-400 font-normal">Not set</span>}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Phone row */}
                    <div className="flex items-center gap-3.5 pb-4 border-b border-gray-100/60 last:border-0">
                      <div className="w-9 h-9 rounded-xl bg-sandal-50 border border-sandal-100 flex items-center justify-center shrink-0">
                        <Phone size={15} className="text-sandal-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Phone Number</p>
                        {editing ? (
                          <input
                            value={profile.phone}
                            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                            className="field-input mt-1"
                            placeholder="10-digit mobile"
                            inputMode="numeric"
                          />
                        ) : (
                          <p className="font-semibold text-sm text-gray-900">
                            {profile.phone ? `+91 ${profile.phone}` : <span className="text-gray-400 font-normal">Not set</span>}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Email row */}
                    <div className="flex items-center gap-3.5 pb-4 border-b border-gray-100/60 last:border-0">
                      <div className="w-9 h-9 rounded-xl bg-sandal-50 border border-sandal-100 flex items-center justify-center shrink-0">
                        <Mail size={15} className="text-sandal-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Email Address</p>
                        {editing ? (
                          <input
                            value={profile.email}
                            disabled
                            className="field-input bg-gray-50 text-gray-400 cursor-not-allowed mt-1"
                          />
                        ) : (
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {profile.email || <span className="text-gray-400 font-normal">Not set</span>}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Gender row */}
                    <div className="flex items-center gap-3.5 pb-4 last:border-0">
                      <div className="w-9 h-9 rounded-xl bg-sandal-50 border border-sandal-100 flex items-center justify-center shrink-0">
                        <UserMinus size={15} className="text-sandal-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Gender</p>
                        {editing ? (
                          <div className="mt-1">
                            <Dropdown
                              value={profile.gender}
                              onChange={(val) => setProfile((p) => ({ ...p, gender: val }))}
                              options={[
                                { value: "male",   label: "Male"   },
                                { value: "female", label: "Female" },
                                { value: "other",  label: "Other"  },
                              ]}
                              placeholder="Select gender"
                            />
                          </div>
                        ) : (
                          <p className="font-semibold text-sm text-gray-900">
                            {profile.gender ? cap(profile.gender) : <span className="text-gray-400 font-normal">Not set</span>}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Form actions when editing */}
                    {editing && (
                      <div className="flex gap-3 pt-2 border-t border-gray-100">
                        <button type="submit" disabled={saving} className="btn-md btn-primary rounded-xl">
                          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> Save Changes</>}
                        </button>
                        <button type="button" onClick={() => setEditing(false)} className="btn-md btn-outline rounded-xl">Cancel</button>
                      </div>
                    )}

                    {/* ── Account actions ── */}
                    {!editing && (
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            onClick={() => setModal("deactivate")}
                            className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-transparent border-none transition-colors cursor-pointer"
                          >
                            <Power size={13} /> Deactivate Account
                          </button>
                          <button
                            type="button"
                            onClick={() => setModal("delete")}
                            className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold text-red-600 hover:text-red-700 bg-transparent border-none transition-colors cursor-pointer"
                          >
                            <UserX size={13} /> Delete Account
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
                          Deactivate pauses your account — you can restore it anytime by logging back in.
                          Delete permanently removes your personal data.
                        </p>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            )}

            {/* ── Manage Addresses ────────────────────────────────────── */}
            {section === "addresses" && (
              <div className="bg-white rounded-2xl md:border md:border-gray-100 md:shadow-sm">
                {/* header */}
                <div className="flex items-center justify-between px-4 py-4 md:px-6 md:py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    {isMobile && (
                      <button
                        type="button"
                        onClick={() => {
                          setSection("menu");
                          setShowAddForm(false);
                          setEditAddr(null);
                        }}
                        className="p-1 hover:bg-sandal-100/50 rounded-lg transition-colors cursor-pointer text-gray-800"
                        aria-label="Back"
                      >
                        <ArrowLeft size={18} />
                      </button>
                    )}
                    <div>
                      <h2 className="font-bold text-gray-900 text-sm sm:text-base md:text-lg">Manage Addresses</h2>
                      {!isMobile && (
                        <p className="text-xs text-gray-400 mt-0.5">Saved delivery locations used at checkout</p>
                      )}
                    </div>
                  </div>
                  {!showAddForm && !editAddr && (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-sandal-700 hover:text-sandal-900 cursor-pointer"
                    >
                      <Plus size={13} /> Add New
                    </button>
                  )}
                </div>
                <div className="p-6">
                  {/* Form */}
                  {(showAddForm || editAddr) && (
                    <AddressForm
                      key={editAddr?.id || "new"}
                      initial={editAddr}
                      setError={setError}
                      setSuccess={setSuccess}
                      onSave={() => { setEditAddr(null); setShowAddForm(false); }}
                      onCancel={() => { setEditAddr(null); setShowAddForm(false); }}
                    />
                  )}

                  {addrLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
                      <Loader2 size={18} className="animate-spin text-sandal-500" /> Loading addresses…
                    </div>
                  ) : addressesList.length === 0 && !showAddForm ? (
                    <div className="text-center py-14">
                      <div className="w-14 h-14 rounded-2xl bg-sandal-50 flex items-center justify-center mx-auto mb-3">
                        <MapPin size={24} className="text-sandal-300" />
                      </div>
                      <p className="text-sm font-semibold text-gray-500">No addresses saved yet</p>
                      <p className="text-xs text-gray-400 mt-1">Saved addresses appear here and speed up checkout</p>
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-sandal-700 hover:text-sandal-900 hover:underline cursor-pointer bg-transparent border-none"
                      >
                        <Plus size={13} /> Add your first address
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {addressesList.map((addr) => (
                        <AddressCard
                          key={addr.id}
                          addr={addr}
                          onEdit={(a) => { setEditAddr(a); setShowAddForm(false); }}
                          setError={setError}
                          setSuccess={setSuccess}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── My Coupons ──────────────────────────────────────────── */}
            {section === "coupons" && (
              <div className="bg-white rounded-2xl md:border md:border-gray-100 md:shadow-sm">
                {/* header */}
                <div className="flex items-center justify-between px-4 py-4 md:px-6 md:py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    {isMobile && (
                      <button
                        type="button"
                        onClick={() => setSection("menu")}
                        className="p-1 hover:bg-sandal-100/50 rounded-lg transition-colors cursor-pointer text-gray-800"
                        aria-label="Back"
                      >
                        <ArrowLeft size={18} />
                      </button>
                    )}
                    <div>
                      <h2 className="font-bold text-gray-900 text-sm sm:text-base md:text-lg">My Coupons</h2>
                      {!isMobile && (
                        <p className="text-xs text-gray-400 mt-0.5">Use these at checkout to save on your order</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {couponLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
                      <Loader2 size={18} className="animate-spin text-sandal-500" /> Loading coupons…
                    </div>
                  ) : coupons.length === 0 ? (
                    <div className="text-center py-14">
                      <div className="w-14 h-14 rounded-2xl bg-sandal-50 flex items-center justify-center mx-auto mb-3">
                        <Ticket size={24} className="text-sandal-300" />
                      </div>
                      <p className="text-sm font-semibold text-gray-500">No coupons available</p>
                      <p className="text-xs text-gray-400 mt-1">Check back later — new deals drop often!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {coupons.map((c) => (
                        <div key={c.id} className="relative rounded-2xl border-2 border-dashed border-sandal-200 bg-gradient-to-br from-sandal-50/60 to-white p-4 overflow-hidden">
                          {/* notch cutouts */}
                          <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-sandal-50 border-r-2 border-dashed border-sandal-200" />
                          <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-sandal-50 border-l-2 border-dashed border-sandal-200" />

                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2 bg-white border border-sandal-200 rounded-xl px-3 py-2 flex-1 min-w-0">
                              <Tag size={13} className="text-sandal-600 shrink-0" />
                              <span className="font-mono font-bold text-sandal-800 text-sm tracking-wider truncate select-all">{c.code}</span>
                            </div>
                            <span className="shrink-0 text-xs font-black text-white bg-sandal-600 rounded-xl px-3 py-2">
                              {c.discountType === "percentage"
                                ? `${c.discountValue}% OFF`
                                : c.discountType === "free_shipping"
                                ? "FREE SHIP"
                                : `₹${c.discountValue} OFF`}
                            </span>
                          </div>

                          {c.description && (
                            <p className="text-xs text-gray-600 mb-2 leading-relaxed">{c.description}</p>
                          )}

                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                            {c.minOrderValue > 0 && (
                              <span className="text-[10px] text-gray-400">
                                Min order ₹{c.minOrderValue}
                              </span>
                            )}
                            {c.expiresAt && (
                              <span className="text-[10px] text-gray-400">
                                Expires&nbsp;
                                {new Date(c.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── My Wishlist ──────────────────────────────────────────── */}
            {section === "wishlist" && (
              <div className="bg-white rounded-2xl md:border md:border-gray-100 md:shadow-sm">
                {/* header */}
                <div className="flex items-center justify-between px-4 py-4 md:px-6 md:py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    {isMobile && (
                      <button
                        type="button"
                        onClick={() => setSection("menu")}
                        className="p-1 hover:bg-sandal-100/50 rounded-lg transition-colors cursor-pointer text-gray-800"
                        aria-label="Back"
                      >
                        <ArrowLeft size={18} />
                      </button>
                    )}
                    <div>
                      <h2 className="font-bold text-gray-900 text-sm sm:text-base md:text-lg">My Wishlist</h2>
                      {!isMobile && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {wishIds?.length ? `${wishIds.length} item${wishIds.length > 1 ? "s" : ""} saved` : "Nothing saved yet"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {!wishIds?.length ? (
                    <div className="text-center py-14">
                      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3">
                        <Heart size={24} className="text-red-300" />
                      </div>
                      <p className="text-sm font-semibold text-gray-500">Your wishlist is empty</p>
                      <Link to="/products" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-sandal-700 hover:underline">
                        Browse products →
                      </Link>
                    </div>
                  ) : wishLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
                      <Loader2 size={18} className="animate-spin text-sandal-500" /> Loading wishlist…
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {wishProducts.map((product) => {
                        const price = product.salePrice || product.price || product.basePrice || 0;
                        const compare = product.comparePrice || product.mrp;
                        const img = product.imageUrls?.[0] || product.image_urls?.[0] || product.imageUrl;
                        return (
                          <div key={product.id} className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-sandal-200 hover:shadow-md transition-all duration-200">
                            {/* image */}
                            <div className="relative aspect-square bg-sandal-50 overflow-hidden">
                              {img ? (
                                <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package size={28} className="text-gray-200" />
                                </div>
                              )}
                              {/* remove btn */}
                              <button
                                onClick={() => handleWishRemove(product.id)}
                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 shadow border border-gray-100 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                                title="Remove"
                              >
                                <X size={13} />
                              </button>
                            </div>
                            {/* info */}
                            <div className="p-3 flex flex-col gap-1.5 flex-1">
                              <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">{product.name}</p>
                              <div className="flex items-baseline gap-1.5 mt-auto">
                                <span className="text-sm font-bold text-sandal-800">₹{parseFloat(price).toFixed(0)}</span>
                                {compare && parseFloat(compare) > parseFloat(price) && (
                                  <span className="text-[10px] line-through text-gray-400">₹{parseFloat(compare).toFixed(0)}</span>
                                )}
                              </div>
                              <Link
                                to={`/products/${product.id}`}
                                className="mt-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-sandal-600 text-white hover:bg-sandal-700 transition-colors"
                              >
                                <ShoppingCart size={11} /> View
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            </div>
          )}{/* end right content */}
        </div>
      </div>
    </div>
  );
}
