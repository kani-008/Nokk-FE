import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  User, MapPin, Plus, Pencil, Trash2,
  Check, Loader2, X, ChevronRight, ChevronLeft, ArrowLeft,
  Phone, Mail, LogOut, Package, Heart,
  Tag, AlertTriangle, ShoppingCart, Ticket,
  UserX, UserMinus, Power, Navigation, Copy, MoreVertical,
} from "lucide-react";
import {
  useMyProfile, useAddresses, useUpdateProfile,
  useAddAddress, useUpdateAddress, useDeleteAddress,
  lookupPincode, detectAddressFromCoords,
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
  const [menuOpen, setMenuOpen] = useState(false);

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!confirm("Remove this address?")) return;
    try {
      await del.mutateAsync(addr.id);
      setSuccess("Address removed.");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to remove address");
    }
  };

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClose = () => setMenuOpen(false);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, [menuOpen]);

  return (
    <div className="relative flex flex-col gap-2 py-2.5 px-3.5 rounded-2xl bg-white border-2 border-gray-100 hover:border-sandal-200 hover:shadow-md transition-all duration-200">
      {/* 3-dot Menu */}
      <div className="absolute top-3 right-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          aria-label="Address options"
        >
          <MoreVertical size={16} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-1 w-28 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-10 animate-in fade-in slide-in-from-top-1 duration-100">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onEdit(addr);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-sandal-50 hover:text-sandal-800 flex items-center gap-1.5 cursor-pointer font-semibold"
            >
              <Pencil size={11} className="text-gray-400" /> Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={del.isPending}
              className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5 cursor-pointer font-semibold disabled:opacity-50"
            >
              {del.isPending ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} className="text-red-400" />}
              Remove
            </button>
          </div>
        )}
      </div>

      {/* content */}
      <div className="flex items-start gap-3 pr-10">
        <div className="w-9 h-9 rounded-xl bg-sandal-50 border border-sandal-100 flex items-center justify-center shrink-0 mt-0.5">
          <MapPin size={15} className="text-sandal-700" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-gray-900 leading-snug">{addr.name}</p>
            {addr.isDefault && (
              <span className="px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-bold bg-green-100 text-green-700 border border-green-200 tracking-wider">DEFAULT</span>
            )}
          </div>
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
    </div>
  );
}

// ── Address form ─────────────────────────────────────────────────────
const ADDR_EMPTY = { name: "", phone: "", addressLine1: "", addressLine2: "", taluk: "", city: "", state: "", pincode: "" };

function AddressForm({ initial, onSave, onCancel, setError, setSuccess }) {
  const [form, setForm] = useState(initial || ADDR_EMPTY);
  const [pinLoading, setPinLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
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

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
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
          setError("location detector is currently not working use pin code to fill");
        } finally {
          setGeoLoading(false);
        }
      },
      (error) => {
        setError("location detector is currently not working use pin code to fill");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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
    <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 mb-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sandal-100 flex items-center justify-center">
            <MapPin size={14} className="text-sandal-700" />
          </div>
          <span className="font-semibold text-sm text-gray-900">
            {form.id ? "Edit Address" : "Add New Address"}
          </span>
        </div>
        <button type="button" onClick={onCancel} className="w-7 h-7 rounded-lg hover:bg-gray-200/50 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
          <X size={15} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
        <div className="col-span-1">
          <label className="block font-body text-[12px] sm:text-xs font-semibold text-gray-600 mb-1 sm:mb-1.5 tracking-wide flex items-center gap-1">
            Name <span className="text-red-400 ml-0.5">*</span>
          </label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Recipient" className="field-input px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm h-[38px] sm:h-[42px]" />
        </div>
        <div className="col-span-1">
          <label className="block font-body text-[12px] sm:text-xs font-semibold text-gray-600 mb-1 sm:mb-1.5 tracking-wide flex items-center gap-1">
            Phone <span className="text-red-400 ml-0.5">*</span>
          </label>
          <input value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit" className="field-input px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm h-[38px] sm:h-[42px]" inputMode="numeric" />
        </div>
        <div className="col-span-2">
          <label className="block font-body text-[12px] sm:text-xs font-semibold text-gray-600 mb-1 sm:mb-1.5 tracking-wide flex items-center gap-1">
            Address Line 1 <span className="text-red-400 ml-0.5">*</span>
          </label>
          <input value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} placeholder="House / Street" className="field-input px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm h-[38px] sm:h-[42px]" />
        </div>
        <div className="col-span-2">
          <label className="block font-body text-[12px] sm:text-xs font-semibold text-gray-600 mb-1 sm:mb-1.5 tracking-wide flex items-center gap-1">
            Address Line 2 <span className="text-gray-400 normal-case font-normal text-[11px]">(optional)</span>
          </label>
          <input value={form.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} placeholder="Area / Landmark" className="field-input px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm h-[38px] sm:h-[42px]" />
        </div>
        <div className="col-span-1">
          <label className="block font-body text-[12px] sm:text-xs font-semibold text-gray-600 mb-1 sm:mb-1.5 tracking-wide flex items-center gap-1">
            Pincode <span className="text-red-400 ml-0.5">*</span>
            {pinLoading && <Loader2 size={11} className="animate-spin text-amber-400" />}
          </label>
          <input value={form.pincode} onChange={(e) => handlePincodeChange(e.target.value)} placeholder="6 digits" inputMode="numeric" className="field-input px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm h-[38px] sm:h-[42px]" />
        </div>
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
        <div className="col-span-1">
          <label className="block font-body text-[12px] sm:text-xs font-semibold text-gray-600 mb-1 sm:mb-1.5 tracking-wide flex items-center gap-1">
            Taluk <span className="text-gray-400 normal-case font-normal text-[11px]">(auto-filled)</span>
          </label>
          <input value={form.taluk} onChange={(e) => set("taluk", e.target.value)} placeholder="Auto-filled" className="field-input px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm h-[38px] sm:h-[42px]" />
        </div>
        <div className="col-span-1">
          <label className="block font-body text-[12px] sm:text-xs font-semibold text-gray-600 mb-1 sm:mb-1.5 tracking-wide flex items-center gap-1">
            City / District <span className="text-red-400 ml-0.5">*</span>
          </label>
          <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="District" className="field-input px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm h-[38px] sm:h-[42px]" />
        </div>
        <div className="col-span-2">
          <label className="block font-body text-[12px] sm:text-xs font-semibold text-gray-600 mb-1 sm:mb-1.5 tracking-wide flex items-center gap-1">
            State <span className="text-red-400 ml-0.5">*</span>
          </label>
          <Dropdown
            value={form.state}
            onChange={(val) => set("state", val)}
            options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
            placeholder="Select state"
            className="!h-[38px] sm:!h-[42px]"
          />
        </div>
        <div className="col-span-2 flex items-center gap-3 pt-3 border-t border-sandal-100">
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

  // Fetch fresh profile (picks up gender for existing logged-in sessions)
  const { data: freshProfile } = useMyProfile();
  useEffect(() => {
    if (freshProfile) updateUser(freshProfile);
  }, [freshProfile]);

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
  const [copiedCode, setCopiedCode] = useState(null);

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
        email:    profile.email,
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

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setSuccess("Coupon code copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

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

      <div className="max-w-6xl mx-auto px-2 sm:px-6 pt-3 pb-10 md:py-10">
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
            <div className="flex-1 min-w-0 w-full">


            {/* ── Profile Information ─────────────────────────────────── */}
            {section === "profile-info" && (
              <div className="bg-white rounded-2xl md:border md:border-gray-100 md:shadow-sm">
                {/* header */}
                <div className="flex items-center justify-between px-4 py-4 md:px-6 md:py-4">
                  <div className="flex items-center gap-2.5">
                    {isMobile && (
                      <button
                        type="button"
                        onClick={() => {
                          setSection("menu");
                          setEditing(false);
                        }}
                        className="p-1 -pl-2 hover:bg-sandal-100/50 rounded-lg transition-colors cursor-pointer text-gray-800"
                        aria-label="Back"
                      >
                        <ArrowLeft size={18} />
                      </button>
                    )}
                    <div>
                      <h2 className="font-bold text-gray-900  sm:text-base md:text-lg">Personal Information</h2>
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
                            className="field-input !py-1.5 !px-3 mt-1"
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
                            className="field-input !py-1.5 !px-3 mt-1"
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
                            onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                            className="field-input !py-1.5 !px-3 mt-1"
                            placeholder="Your email address"
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
                              className="!h-9 !py-1 !px-3 text-sm"
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
                    <div className="pt-4 mt-2">
                      <div className="flex flex-row flex-nowrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setModal("deactivate")}
                          className="flex items-center gap-1 py-1.5 pr-12 text-[11px] sm:text-xs font-semibold text-amber-700 hover:text-amber-800 bg-transparent border-none transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Power size={13} className="shrink-0" /> Deactivate Account
                        </button>
                        <button
                          type="button"
                          onClick={() => setModal("delete")}
                          className="flex items-center gap-1 py-1.5 px-1 text-[11px] sm:text-xs font-semibold text-red-600 hover:text-red-800 bg-transparent border-none transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <UserX size={13} className="shrink-0" /> Delete Account
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2 text-center leading-relaxed">
                        Deactivate pauses your account — restore anytime by logging in.
                        Delete permanently removes data.
                      </p>
                    </div>
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
                      <h2 className="font-bold text-gray-900  sm:text-base md:text-lg">Manage Addresses</h2>
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
                <div className="p-4 sm:p-6">
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
                      <h2 className="font-bold text-gray-900  sm:text-base md:text-lg">My Coupons</h2>
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
                            <div className="flex items-center justify-between gap-2 bg-white border border-sandal-200 rounded-xl px-3 py-2 flex-1 min-w-0">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Tag size={13} className="text-sandal-600 shrink-0" />
                                <span className="font-mono font-bold text-sandal-800 text-sm tracking-wider truncate select-all">{c.code}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(c.code)}
                                className="p-1 hover:bg-sandal-50 rounded-lg text-gray-400 hover:text-sandal-700 transition-colors cursor-pointer shrink-0"
                                title="Copy code"
                              >
                                {copiedCode === c.code ? (
                                  <Check size={13} className="text-green-600 animate-in fade-in duration-200" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
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
              <div className="flex flex-col gap-3">
                {/* header */}
                <div className="flex items-center justify-between px-4 py-4 md:px-6 md:py-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
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
                      <h2 className="font-bold text-gray-900 text-[11px] sm:text-base md:text-lg">My Wishlist</h2>
                      {!isMobile && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {wishIds?.length ? `${wishIds.length} item${wishIds.length > 1 ? "s" : ""} saved` : "Nothing saved yet"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
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
                    <div className="flex flex-col divide-y divide-amber-100/50">
                      {wishProducts.map((product) => {
                        const firstV = product.variants?.[0];
                        const price = firstV?.price ?? product.minPrice ?? 0;
                        const compare = firstV?.comparePrice ?? product.minComparePrice ?? 0;
                        const img = product.primaryImage;
                        const weight = firstV?.weightLabel;
                        return (
                          <Link
                            key={product.id}
                            to={`/products/${product.slug}`}
                            className="flex gap-4 items-center py-3.5 first:pt-0 last:pb-0 group cursor-pointer hover:bg-sandal-50/40 px-2 rounded-xl transition-colors"
                          >
                            {/* image */}
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-sandal-50 shrink-0 block">
                              {img ? (
                                <img src={img} alt={product.nameEn} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package size={20} className="text-gray-300" />
                                </div>
                              )}
                            </div>

                            {/* info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-body text-xs sm:text-sm font-semibold text-brand-900 line-clamp-1 leading-snug group-hover:text-sandal-800 transition-colors">
                                {product.nameEn}
                              </p>
                              {product.nameTa && (
                                <p className="font-tamil text-[10px] sm:text-[11px] text-amber-500 mt-0.5">
                                  {product.nameTa}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1">
                                <span className="font-num text-xs sm:text-sm font-bold text-sandal-800">
                                  ₹{parseFloat(price).toFixed(0)}
                                </span>
                                {compare && parseFloat(compare) > parseFloat(price) && (
                                  <span className="font-num text-[10px] sm:text-xs line-through text-gray-400">
                                    ₹{parseFloat(compare).toFixed(0)}
                                  </span>
                                )}
                                {weight && (
                                  <span className="font-body text-[10px] sm:text-xs text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-md">
                                    {weight}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* action column */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className="hidden sm:inline-flex items-center gap-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-sandal-600 text-white group-hover:bg-sandal-700 transition-colors"
                              >
                                <ShoppingCart size={11} /> View
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleWishRemove(product.id);
                                }}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </Link>
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
