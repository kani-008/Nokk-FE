import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Save, Loader2, Check, Store, Truck, IndianRupee, Bell,
  Palette, RotateCcw, ShoppingCart,
  Camera, Share2, AtSign, MessageCircle, ShoppingBag,
  Globe, Crosshair, ShieldAlert, Megaphone,
  FileText, ArrowRight, ChevronRight, ArrowLeft, ExternalLink,
} from "lucide-react";
import { AdminPage, AdminCard, AdminButton } from "../../components/admin/AdminUI.jsx";
import { applyTheme, resetTheme, isValidHex } from "../../components/Theme.js";
import API from "../../ApiCall/Api.jsx";

const DEFAULTS = {
  storeDescription: "",
  storeEmail: "",
  storePhone: "",
  storeAddress: "",
  freeShippingThreshold: 499,
  shippingCharge: 60,
  codEnabled: true,
  upiEnabled: true,
  cardEnabled: true,
  netbankingEnabled: true,
  notifyOrderConfirmed: true,
  notifyOrderShipped: true,
  notifyReturnRequest: true,
  themeColor: "",
  bgColor: "",
  instagramUrl: "",
  facebookUrl: "",
  twitterUrl: "",
  youtubeUrl: "",
  whatsappNumber: "",
  websiteUrl: "",
  minOrderValue: 0,
  maxCartItems: 20,
  maintenanceMode: false,
  registrationsEnabled: true,
  announcementEnabled: false,
  announcementText: "",
  testimonialsEnabled: true,
};

const CATEGORIES = [
  { key: "store-info", icon: Store, title: "Store Information", sub: "Public-facing details shown to customers", type: "panel" },
  { key: "social-links", icon: Globe, title: "Social & Contact Links", sub: "Displayed in footer and contact page", type: "panel" },
  { key: "shipping", icon: Truck, title: "Shipping & Tax", sub: "Delivery fees — enforced at checkout", type: "panel" },
  { key: "cart-rules", icon: ShoppingBag, title: "Cart & Order Rules", sub: "Limits enforced at checkout and cart add", type: "panel" },
  { key: "payments", icon: IndianRupee, title: "Payment Methods", sub: "Enable or disable checkout payment options", type: "panel" },
  { key: "store-controls", icon: ShieldAlert, title: "Store Controls", sub: "Live switches that immediately affect the storefront", type: "panel" },
  { key: "notifications", icon: Bell, title: "Admin Event Notifications", sub: "Controls which events create entries in the admin notification log", type: "panel" },
  { key: "site-content", icon: FileText, title: "Site Content", sub: "Edit Terms & Conditions, Privacy Policy, and homepage content", type: "link" },
];

const settingsApi = {
  get: async () => {
    const res = await API.get("/settings/get-all");
    return { settings: res.data.settings || {} };
  },
  update: async (data) => {
    const res = await API.put("/settings/update", data);
    return { settings: res.data.settings || {} };
  },
};



// ── Colour helpers ─────────────────────────────────────────────────────
const hexToRgb = (hex = "") => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 255, g: 255, b: 255 };
};
const rgbToHex = (r, g, b) =>
  `#${[r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")}`;

// ── Shared UI primitives ───────────────────────────────────────────────
function SectionCard({ icon: Icon, title, sub, children, className = "" }) {
  return (
    <AdminCard className={className}>
      <div className="flex items-start gap-2.5 mb-5 pb-4 border-b border-gray-100">
        <div className="p-2 rounded-xl bg-brand-50 shrink-0 mt-0.5"><Icon size={16} className="text-brand-700" /></div>
        <div>
          <h3 className="font-display text-base font-bold text-gray-900 leading-snug">{title}</h3>
          {sub && <p className="font-body text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
      {children}
    </AdminCard>
  );
}

function Field({ label, name, type = "text", value, onChange, placeholder, unit, disabled, rows, ...rest }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="relative">
        {unit && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-num text-sm text-gray-500 pointer-events-none">{unit}</span>}
        {rows ? (
          <textarea name={name} value={value ?? ""} onChange={onChange} rows={rows}
            placeholder={placeholder} disabled={disabled}
            className={`field-input resize-none ${disabled ? "bg-gray-50 cursor-not-allowed opacity-60" : ""}`}
            {...rest}
          />
        ) : (
          <input
            type={type} name={name} value={value ?? ""}
            onChange={onChange}
            placeholder={placeholder} disabled={disabled}
            inputMode={type === "number" ? "numeric" : undefined}
            className={`field-input no-spinner ${unit ? "pl-7" : ""} ${disabled ? "bg-gray-50 cursor-not-allowed opacity-60" : ""}`}
            {...rest}
          />
        )}
      </div>
    </div>
  );
}

function ToggleRow({ label, sub, checked, onChange }) {
  return (
    <button type="button" onClick={onChange} aria-pressed={!!checked}
      className="w-full flex items-center justify-between py-3 border-b border-gray-50 last:border-0 text-left"
    >
      <div>
        <p className="font-body text-sm font-medium text-gray-900">{label}</p>
        {sub && <p className="font-body text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <span className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ml-4 ${checked ? "bg-brand-700" : "bg-gray-200"}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-surface rounded-full shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </span>
    </button>
  );
}

// Social Links section 
function SocialField({ icon: Icon, label, name, value, onChange, placeholder, color }) {
  return (
    <div>
      <label className="field-label flex items-center gap-1.5">
        <Icon size={12} className={color} /> {label}
      </label>
      <input type="url" name={name} value={value ?? ""} onChange={onChange}
        placeholder={placeholder} className="field-input"
      />
    </div>
  );
}


export default function Settings() {
  const [form,    setForm]    = useState({ ...DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    settingsApi.get()
      .then((r) => {
        setForm({ ...DEFAULTS, ...(r.settings || {}) });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set  = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  // For number inputs: keep as a clean string (no leading zeros) while editing.
  // Empty string = 0 — coerced to a number only when saving.
  const setE = (e) => {
    if (e.target.type === "number") {
      const raw = e.target.value;
      // Strip leading zeros but allow empty string (user mid-delete)
      const cleaned = raw === "" ? "" : String(Number(raw));
      set(e.target.name, cleaned);
    } else {
      set(e.target.name, e.target.value);
    }
  };

  // Coerce all number fields to actual numbers before saving (empty → 0)
  const coerceNumbers = (f) => {
    const numericKeys = [
      "freeShippingThreshold", "shippingCharge",
      "minOrderValue", "maxCartItems",
    ];
    const out = { ...f };
    numericKeys.forEach((k) => {
      out[k] = out[k] === "" || out[k] === null || out[k] === undefined
        ? 0
        : Number(out[k]);
    });
    return out;
  };

  const handleSave = async () => {
    setSaving(true); setSaved(false); setError("");
    const coercedForm = coerceNumbers(form);

    if (coercedForm.shippingCharge <= 0) {
      setError("Standard Delivery Fee (shippingCharge) must be greater than 0");
      setSaving(false);
      return;
    }
    if (!Number.isInteger(coercedForm.maxCartItems) || coercedForm.maxCartItems < 1) {
      setError("Max Items per Cart (maxCartItems) must be an integer greater than or equal to 1");
      setSaving(false);
      return;
    }
    if (coercedForm.freeShippingThreshold < 0) {
      setError("Free Shipping Above (freeShippingThreshold) cannot be negative");
      setSaving(false);
      return;
    }
    if (coercedForm.minOrderValue < 0) {
      setError("Minimum Order Value (minOrderValue) cannot be negative");
      setSaving(false);
      return;
    }
    if (coercedForm.themeColor && !isValidHex(coercedForm.themeColor)) {
      setError("Brand / Accent Colour must be a valid hex color");
      setSaving(false);
      return;
    }
    if (coercedForm.bgColor && !isValidHex(coercedForm.bgColor)) {
      setError("Page Background Colour must be a valid hex color");
      setSaving(false);
      return;
    }

    try {
      await settingsApi.update(coercedForm);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminPage title="Settings">
        <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-40 skeleton rounded-2xl" />)}</div>
      </AdminPage>
    );
  }

  const currentActive = activeCategory || "store-info";

  const renderCategoryCard = (key) => {
    switch (key) {
      case "store-info":
        return (
          <SectionCard icon={Store} title="Store Information" sub="Public-facing details shown to customers">
            <div className="space-y-4">
              <Field label="Store Description" name="storeDescription" value={form.storeDescription} onChange={setE} placeholder="Authentic dry fish and coastal pickles…" rows={3} />
              <Field label="Support Email" name="storeEmail"   value={form.storeEmail}   onChange={setE} placeholder="hello@store.com" type="email" />
              <Field label="Phone"         name="storePhone"   value={form.storePhone}   onChange={setE} placeholder="+91 98765 43210" type="tel" />
              <Field label="Store Address" name="storeAddress" value={form.storeAddress} onChange={setE} placeholder="Full address…" rows={2} />
            </div>
          </SectionCard>
        );
      case "social-links":
        return (
          <SectionCard icon={Globe} title="Social & Contact Links" sub="Displayed in footer and contact page">
            <div className="space-y-4">
              <SocialField icon={Camera}        label="Instagram"   name="instagramUrl"   value={form.instagramUrl}   onChange={setE} placeholder="https://instagram.com/yourstore" color="text-pink-500"  />
              <SocialField icon={Share2}        label="Facebook"    name="facebookUrl"    value={form.facebookUrl}    onChange={setE} placeholder="https://facebook.com/yourpage"  color="text-blue-600" />
              <SocialField icon={AtSign}        label="Twitter / X" name="twitterUrl"     value={form.twitterUrl}     onChange={setE} placeholder="https://x.com/yourhandle"        color="text-sky-500"  />
              <SocialField icon={MessageCircle} label="WhatsApp"    name="whatsappNumber" value={form.whatsappNumber} onChange={setE} placeholder="+91 98765 43210"                color="text-green-500"/>
              <SocialField icon={Globe}         label="YouTube"     name="youtubeUrl"     value={form.youtubeUrl}     onChange={setE} placeholder="https://youtube.com/@yourstore"  color="text-red-500"  />
              <SocialField icon={Globe}         label="Website"     name="websiteUrl"     value={form.websiteUrl}     onChange={setE} placeholder="https://yourstore.com"          color="text-gray-500" />
            </div>
          </SectionCard>
        );
      case "shipping":
        return (
          <SectionCard icon={Truck} title="Shipping & Tax" sub="Delivery fees — enforced at checkout">
            <div className="space-y-4">
              <Field label="Free Shipping Above"   name="freeShippingThreshold" type="number" value={form.freeShippingThreshold} onChange={setE} unit="₹" placeholder="499" min={0} />
              <Field label="Standard Delivery Fee" name="shippingCharge"        type="number" value={form.shippingCharge}        onChange={setE} unit="₹" placeholder="60" min={1} />
            </div>
          </SectionCard>
        );
      case "cart-rules":
        return (
          <SectionCard icon={ShoppingBag} title="Cart & Order Rules" sub="Limits enforced at checkout and cart add">
            <div className="space-y-4">
              <Field label="Minimum Order Value" name="minOrderValue" type="number" value={form.minOrderValue} onChange={setE} unit="₹" placeholder="0" min={0} />
              <Field label="Max Items per Cart"  name="maxCartItems"  type="number" value={form.maxCartItems}  onChange={setE} placeholder="20" min={1} />
              <div className="pt-1 border-t border-gray-100">
                <p className="font-body text-xs text-gray-400">
                  Set to 0 to disable the minimum order value. Max items is enforced server-side when adding to cart.
                </p>
              </div>
            </div>
          </SectionCard>
        );
      case "payments":
        return (
          <SectionCard icon={IndianRupee} title="Payment Methods" sub="Enable or disable checkout payment options">
            <div>
              <ToggleRow label="Cash on Delivery (COD)" sub="Allow customers to pay on delivery"              checked={form.codEnabled}         onChange={() => set("codEnabled",         !form.codEnabled)}         />
              <ToggleRow label="UPI"                    sub="GPay, PhonePe, Paytm & more"                     checked={form.upiEnabled}         onChange={() => set("upiEnabled",         !form.upiEnabled)}         />
              <ToggleRow label="Credit / Debit Card"    sub="Visa, Mastercard, RuPay"                         checked={form.cardEnabled}        onChange={() => set("cardEnabled",        !form.cardEnabled)}        />
              <ToggleRow label="Net Banking"            sub="Pay via Internet Banking from any Indian bank"   checked={form.netbankingEnabled}  onChange={() => set("netbankingEnabled",  !form.netbankingEnabled)}  />
            </div>
          </SectionCard>
        );
      case "store-controls":
        return (
          <SectionCard icon={ShieldAlert} title="Store Controls" sub="Live switches that immediately affect the storefront">
            <div>
              <ToggleRow
                label="Maintenance Mode"
                sub="Customer-facing site shows a maintenance page. Admin panel unaffected."
                checked={form.maintenanceMode}
                onChange={() => set("maintenanceMode", !form.maintenanceMode)}
              />
              <ToggleRow
                label="Allow New Registrations"
                sub="When disabled, the register page shows a pause message and the backend rejects sign-up API calls."
                checked={form.registrationsEnabled}
                onChange={() => set("registrationsEnabled", !form.registrationsEnabled)}
              />
              <ToggleRow
                label="Announcement Banner"
                sub="Shows a top strip in the navbar (desktop only). When off, the strip is removed."
                checked={form.announcementEnabled}
                onChange={() => set("announcementEnabled", !form.announcementEnabled)}
              />
              <ToggleRow
                label="Display Testimonials"
                sub="Show the 'What Our Customers Say' section on the homepage."
                checked={form.testimonialsEnabled}
                onChange={() => set("testimonialsEnabled", !form.testimonialsEnabled)}
              />
            </div>
            {form.maintenanceMode && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 flex items-start gap-2">
                <ShieldAlert size={13} className="text-red-500 mt-0.5 shrink-0" />
                <p className="font-body text-xs text-red-700 font-semibold">
                  Maintenance mode is ON — customers currently see a "We'll be back soon" page.
                </p>
              </div>
            )}
          </SectionCard>
        );
      case "notifications":
        return (
          <SectionCard icon={Bell} title="Admin Event Notifications" sub="Controls which events create entries in the admin notification log">
            <div>
              <ToggleRow label="New Order Placed"   sub="Create a notification when a customer places an order"         checked={form.notifyOrderConfirmed} onChange={() => set("notifyOrderConfirmed", !form.notifyOrderConfirmed)} />
              <ToggleRow label="Order Shipped"      sub="Create a notification when an order status is set to Shipped"  checked={form.notifyOrderShipped}   onChange={() => set("notifyOrderShipped",   !form.notifyOrderShipped)}   />
              <ToggleRow label="Replacement Request" sub="Create a notification when a customer requests a replacement" checked={form.notifyReturnRequest}  onChange={() => set("notifyReturnRequest",  !form.notifyReturnRequest)}  />
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="font-body text-xs text-gray-400">These toggle entries in the admin bell — not customer-facing SMS/email (coming soon).</p>
            </div>
          </SectionCard>
        );
      default:
        return null;
    }
  };

  return (
    <AdminPage
      title="Settings"
      action={
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-50 border border-green-200 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg animate-fade-in">
              <Check size={14} />
              <span className="hidden sm:inline">Saved Successfully</span>
            </span>
          )}
          <AdminButton
            variant="primary"
            onClick={handleSave}
            disabled={saving}
            className="cursor-pointer px-2.5 sm:px-4"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span className="hidden sm:inline ml-1.5">Saving…</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span className="hidden sm:inline ml-1.5">Save Settings</span>
              </>
            )}
          </AdminButton>
        </div>
      }
    >
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-3 mb-5">{error}</div>
      )}

      {/* ── DESKTOP LAYOUT (>= 1024px) ── */}
      <div className="hidden lg:grid grid-cols-12 gap-6 items-start">
        {/* Left Sidebar Menu */}
        <div className="col-span-4 bg-surface border border-gray-100 rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = currentActive === cat.key;
            if (cat.type === "link") {
              return (
                <Link
                  key={cat.key}
                  to="/admin/content"
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-gray-100 text-gray-500 shrink-0 mt-0.5">
                      <Icon size={16} />
                    </div>
                    <div>
                      <h4 className="font-display text-sm font-bold text-gray-800 leading-snug">{cat.title}</h4>
                      <p className="font-body text-[11px] text-gray-400 mt-0.5">{cat.sub}</p>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors shrink-0 ml-2" />
                </Link>
              );
            }

            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`group relative flex items-center justify-between p-3 pl-4 rounded-xl transition-all text-left cursor-pointer ${
                  isActive
                    ? "bg-brand-900 text-white shadow-sm ring-1 ring-brand-800"
                    : "hover:bg-gray-50 text-gray-800"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-3 bottom-3 w-1 bg-amber-400 rounded-r-md" />
                )}
                <div className="flex items-start gap-2.5">
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${isActive ? "bg-brand-800 text-white" : "bg-brand-50 text-brand-700"}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <h4 className={`font-display text-sm font-bold leading-snug ${isActive ? "text-white" : "text-gray-800"}`}>{cat.title}</h4>
                    <p className={`font-body text-[11px] mt-0.5 ${isActive ? "text-amber-200" : "text-gray-400"}`}>{cat.sub}</p>
                  </div>
                </div>
                <ChevronRight size={14} className={`shrink-0 ml-2 ${isActive ? "text-amber-300" : "text-gray-400"}`} />
              </button>
            );
          })}
        </div>

        {/* Right Active Panel */}
        <div className="col-span-8 flex flex-col gap-5">
          {renderCategoryCard(currentActive)}
        </div>
      </div>

      {/* ── MOBILE LAYOUT (< 1024px) ── */}
      <div className="lg:hidden">
        {activeCategory === null ? (
          /* Mobile settings home menu */
          <div className="bg-surface border border-gray-100 rounded-2xl p-3.5 flex flex-col gap-1 shadow-sm">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              if (cat.type === "link") {
                return (
                  <Link
                    key={cat.key}
                    to="/admin/content"
                    className="flex items-center justify-between p-3.5 rounded-xl active:bg-gray-50 border-b border-gray-50 last:border-0 text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-gray-100 text-gray-500 shrink-0 mt-0.5">
                        <Icon size={18} />
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-bold text-gray-800 leading-snug">{cat.title}</h4>
                        <p className="font-body text-[11px] text-gray-400 mt-0.5">{cat.sub}</p>
                      </div>
                    </div>
                    <ExternalLink size={16} className="text-gray-400 shrink-0 ml-2" />
                  </Link>
                );
              }

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className="flex items-center justify-between p-3.5 rounded-xl active:bg-gray-50 border-b border-gray-50 last:border-0 text-left w-full cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-brand-50 text-brand-700 shrink-0 mt-0.5">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h4 className="font-display text-sm font-bold text-gray-800 leading-snug">{cat.title}</h4>
                      <p className="font-body text-[11px] text-gray-400 mt-0.5">{cat.sub}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 shrink-0 ml-2" />
                </button>
              );
            })}
          </div>
        ) : (
          /* Mobile full-screen active panel view */
          <div className="space-y-4">
            {/* Header bar */}
            <div className="flex items-center gap-3 bg-surface border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 cursor-pointer"
                aria-label="Back to settings menu"
              >
                <ArrowLeft size={18} />
              </button>
              <h3 className="font-display text-sm font-bold text-gray-900">
                {CATEGORIES.find((c) => c.key === activeCategory)?.title}
              </h3>
            </div>

            {/* Panel Card */}
            <div>
              {renderCategoryCard(activeCategory)}
            </div>
          </div>
        )}
      </div>
    </AdminPage>
  );
}
