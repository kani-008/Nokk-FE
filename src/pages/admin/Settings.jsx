import { useState, useEffect } from "react";
import {
  Save, Loader2, Check, Store, Truck, IndianRupee, Bell,
  Palette, RotateCcw, ShoppingCart,
  Camera, Share2, AtSign, MessageCircle, ShoppingBag,
  Globe, Crosshair, ShieldAlert, Megaphone,
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
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </span>
    </button>
  );
}

// ── RGB Slider ─────────────────────────────────────────────────────────
const CH_META = {
  r: { label: "R", dot: "bg-red-500",   text: "text-red-500",   accent: "#ef4444" },
  g: { label: "G", dot: "bg-green-500", text: "text-green-500", accent: "#22c55e" },
  b: { label: "B", dot: "bg-blue-500",  text: "text-blue-500",  accent: "#3b82f6" },
};

function RGBSlider({ channel, value, baseRgb, onChange }) {
  const meta = CH_META[channel];

  // build a gradient that keeps the other two channels fixed while this one sweeps
  const from = rgbToHex(
    channel === "r" ? 0   : baseRgb.r,
    channel === "g" ? 0   : baseRgb.g,
    channel === "b" ? 0   : baseRgb.b,
  );
  const to = rgbToHex(
    channel === "r" ? 255 : baseRgb.r,
    channel === "g" ? 255 : baseRgb.g,
    channel === "b" ? 255 : baseRgb.b,
  );

  return (
    <div className="flex items-center gap-3">
      <span className={`font-num text-xs font-extrabold w-4 shrink-0 ${meta.text}`}>{meta.label}</span>
      <div className="relative flex-1 h-4 flex items-center">
        {/* gradient track */}
        <div
          className="absolute inset-x-0 h-2 rounded-full pointer-events-none"
          style={{ background: `linear-gradient(to right, ${from}, ${to})` }}
        />
        <input
          type="range" min={0} max={255} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ accentColor: meta.accent }}
          className="relative w-full h-2 rounded-full appearance-none bg-transparent cursor-pointer"
        />
      </div>
      <input
        type="number" min={0} max={255} value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(255, Number(e.target.value))))}
        className="w-14 text-center font-num text-xs border border-gray-200 rounded-lg py-1 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
      />
    </div>
  );
}

function RGBPicker({ label, value, onChange, defaultColor = "#ffffff" }) {
  const rgb = hexToRgb(value || defaultColor);

  const update = (ch, val) => {
    const next = { ...rgb, [ch]: val };
    onChange(rgbToHex(next.r, next.g, next.b));
  };

  const hexDisplay = value || defaultColor;

  return (
    <div className="space-y-3">
      {label && <p className="font-body text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>}

      <div className="flex items-start gap-4">
        {/* big swatch */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div
            className="w-14 h-14 rounded-xl border border-gray-200 shadow-sm cursor-pointer relative overflow-hidden"
            style={{ backgroundColor: hexDisplay }}
          >
            <input
              type="color"
              value={hexDisplay}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              title="Pick from colour wheel"
            />
          </div>
          <span className="font-num text-[10px] text-gray-400 uppercase">{hexDisplay}</span>
        </div>

        {/* sliders */}
        <div className="flex-1 space-y-2.5">
          <RGBSlider channel="r" value={rgb.r} baseRgb={rgb} onChange={(v) => update("r", v)} />
          <RGBSlider channel="g" value={rgb.g} baseRgb={rgb} onChange={(v) => update("g", v)} />
          <RGBSlider channel="b" value={rgb.b} baseRgb={rgb} onChange={(v) => update("b", v)} />
        </div>
      </div>

      {/* quick whites / neutrals */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        {["#ffffff", "#f9fafb", "#f1f5f4", "#faf7f0", "#fff8f0", "#f5f0ff", "#f0fff4"].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            title={c}
            style={{ backgroundColor: c }}
            className={`w-6 h-6 rounded-full border transition-transform hover:scale-110 ${value?.toLowerCase() === c ? "ring-2 ring-offset-1 ring-gray-700 border-gray-300" : "border-gray-200"}`}
          />
        ))}
        <span className="font-body text-[10px] text-gray-400 ml-1">Quick picks</span>
      </div>
    </div>
  );
}

// ── Theme & Appearance section ─────────────────────────────────────────
const THEME_PRESETS = [
  { name: "Terracotta", hex: "#c2613a" },
  { name: "Saffron",    hex: "#d97706" },
  { name: "Ocean",      hex: "#0e7490" },
  { name: "Forest",     hex: "#15803d" },
  { name: "Indigo",     hex: "#4338ca" },
  { name: "Crimson",    hex: "#be123c" },
  { name: "Slate",      hex: "#475569" },
];

function ThemeSection({ themeColor, bgColor, onChange }) {
  const [hexInput, setHexInput] = useState(themeColor || "");

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setHexInput(themeColor || ""); }, [themeColor]);

  const chooseBrand = (hex) => {
    onChange("themeColor", hex);
    applyTheme(hex);
  };

  const onHexType = (raw) => {
    setHexInput(raw);
    const v = raw.startsWith("#") ? raw : `#${raw}`;
    if (isValidHex(v)) chooseBrand(v);
  };

  const resetBrand = () => { onChange("themeColor", ""); setHexInput(""); resetTheme(); };

  const applyBg = (hex) => {
    onChange("bgColor", hex);
    document.documentElement.style.setProperty("--bg-page", hex);
  };

  const resetBg = () => {
    onChange("bgColor", "");
    document.documentElement.style.removeProperty("--bg-page");
  };

  return (
    <SectionCard icon={Palette} title="Theme & Appearance"
      sub="Customise your brand colour and page background. Changes preview live."
      className="lg:col-span-2"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* ── Brand / Accent colour ── */}
        <div>
          <p className="font-body text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
            <Crosshair size={13} className="text-brand-600" /> Brand / Accent Colour
          </p>

          {/* presets */}
          <div className="flex flex-wrap gap-3 mb-4">
            {THEME_PRESETS.map((p) => {
              const selected = themeColor?.toLowerCase() === p.hex.toLowerCase();
              return (
                <button key={p.hex} type="button" onClick={() => chooseBrand(p.hex)} title={p.name}
                  className={`group flex flex-col items-center gap-1 ${selected ? "" : "opacity-80 hover:opacity-100"}`}
                >
                  <span
                    className={`w-9 h-9 rounded-full shadow-sm transition-transform group-hover:scale-110 ${selected ? "ring-2 ring-offset-2 ring-gray-800" : "ring-1 ring-black/10"}`}
                    style={{ backgroundColor: p.hex }}
                  />
                  <span className="font-body text-[10px] text-gray-500">{p.name}</span>
                </button>
              );
            })}
          </div>

          {/* custom + reset */}
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="field-label">Custom hex</label>
              <div className="flex items-center gap-2">
                <input type="color"
                  value={isValidHex(themeColor) ? themeColor : "#c2613a"}
                  onChange={(e) => chooseBrand(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer bg-white p-0.5"
                />
                <input type="text" value={hexInput} onChange={(e) => onHexType(e.target.value)}
                  placeholder="#c2613a" className="field-input w-28 font-num"
                />
              </div>
            </div>
            <button type="button" onClick={resetBrand}
              className="flex items-center gap-1.5 font-body text-sm text-gray-400 hover:text-gray-700 transition-colors mb-2.5"
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>

          {/* preview strip */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="font-body text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Preview</p>
            <div className="flex flex-wrap items-center gap-2.5">
              <button type="button" className="btn-md btn-primary pointer-events-none text-xs">
                <ShoppingCart size={13} /> Add to Cart
              </button>
              <button type="button" className="btn-md btn-outline pointer-events-none text-xs">View</button>
              <span className="badge-amber text-[10px]">Best Seller</span>
              <span className="font-body text-sm font-semibold text-brand-700">Link</span>
              <span className="w-7 h-7 rounded-full bg-brand-800 inline-block" />
            </div>
          </div>
        </div>

        {/* ── Page Background colour ── */}
        <div>
          <p className="font-body text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
            <Palette size={13} className="text-brand-600" /> Page Background Colour
          </p>

          <RGBPicker
            value={bgColor}
            defaultColor="#faf7f0"
            onChange={applyBg}
          />

          <button type="button" onClick={resetBg}
            className="mt-3 flex items-center gap-1.5 font-body text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            <RotateCcw size={12} /> Reset to default
          </button>

          {/* bg preview */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="font-body text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Preview</p>
            <div
              className="rounded-xl p-4 border border-gray-200 transition-colors"
              style={{ backgroundColor: bgColor || "#faf7f0" }}
            >
              <p className="font-body text-xs text-gray-600 font-medium">Storefront background</p>
              <p className="font-body text-[10px] text-gray-400 mt-0.5">
                RGB ({hexToRgb(bgColor || "#faf7f0").r}, {hexToRgb(bgColor || "#faf7f0").g}, {hexToRgb(bgColor || "#faf7f0").b})
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
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

  useEffect(() => {
    settingsApi.get()
      .then((r) => {
        const s = { ...DEFAULTS, ...(r.settings || {}) };
        setForm(s);
        if (s.themeColor) applyTheme(s.themeColor);
        if (s.bgColor)    document.documentElement.style.setProperty("--bg-page", s.bgColor);
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
    // Clamp to respective minimums
    out.shippingCharge = Math.max(out.shippingCharge, 1);
    out.maxCartItems = Math.max(out.maxCartItems, 1);
    out.freeShippingThreshold = Math.max(out.freeShippingThreshold, 0);
    out.minOrderValue = Math.max(out.minOrderValue, 0);
    return out;
  };

  const handleSave = async () => {
    setSaving(true); setSaved(false); setError("");
    try {
      await settingsApi.update(coerceNumbers(form));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { setError(e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <AdminPage title="Settings">
        <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-40 skeleton rounded-2xl" />)}</div>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      action={
        <AdminButton onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> :
           saved  ? <><Check   size={14} /> Saved!</>                           :
                    <><Save    size={14} /> Save Settings</>}
        </AdminButton>
      }
    >
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Theme & Appearance (full width) ── */}
        <ThemeSection
          themeColor={form.themeColor}
          bgColor={form.bgColor}
          onChange={(k, v) => set(k, v)}
        />

        {/* ── Store Info ── */}
        <SectionCard icon={Store} title="Store Information" sub="Public-facing details shown to customers">
          <div className="space-y-4">
            <Field label="Store Description" name="storeDescription" value={form.storeDescription} onChange={setE} placeholder="Authentic dry fish and coastal pickles…" rows={3} />
            <Field label="Support Email" name="storeEmail"   value={form.storeEmail}   onChange={setE} placeholder="hello@store.com" type="email" />
            <Field label="Phone"         name="storePhone"   value={form.storePhone}   onChange={setE} placeholder="+91 98765 43210" type="tel" />
            <Field label="Store Address" name="storeAddress" value={form.storeAddress} onChange={setE} placeholder="Full address…" rows={2} />
          </div>
        </SectionCard>

        {/* ── Social & Contact Links ── */}
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

        {/* ── Shipping & Tax ── */}
        <SectionCard icon={Truck} title="Shipping & Tax" sub="Delivery fees — enforced at checkout">
          <div className="space-y-4">
            <Field label="Free Shipping Above"   name="freeShippingThreshold" type="number" value={form.freeShippingThreshold} onChange={setE} unit="₹" placeholder="499" min={0} />
            <Field label="Standard Delivery Fee" name="shippingCharge"        type="number" value={form.shippingCharge}        onChange={setE} unit="₹" placeholder="60" min={1} />
          </div>
        </SectionCard>

        {/* ── Cart & Order Rules ── */}
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

        {/* ── Payment Methods ── */}
        <SectionCard icon={IndianRupee} title="Payment Methods" sub="Enable or disable checkout payment options">
          <div>
            <ToggleRow label="Cash on Delivery (COD)" sub="Allow customers to pay on delivery"              checked={form.codEnabled}         onChange={() => set("codEnabled",         !form.codEnabled)}         />
            <ToggleRow label="UPI"                    sub="GPay, PhonePe, Paytm & more"                     checked={form.upiEnabled}         onChange={() => set("upiEnabled",         !form.upiEnabled)}         />
            <ToggleRow label="Credit / Debit Card"    sub="Visa, Mastercard, RuPay"                         checked={form.cardEnabled}        onChange={() => set("cardEnabled",        !form.cardEnabled)}        />
            <ToggleRow label="Net Banking"            sub="Pay via Internet Banking from any Indian bank"   checked={form.netbankingEnabled}  onChange={() => set("netbankingEnabled",  !form.netbankingEnabled)}  />
          </div>
        </SectionCard>

        {/* ── Store Controls ── */}
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


        {/* ── Notifications ── */}
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

      </div>

      {/* ── Bottom save bar ── */}
      <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-3.5">
        <p className="font-body text-sm text-gray-500">
          {saved
            ? <span className="text-green-600 font-semibold flex items-center gap-1.5"><Check size={14} /> All changes saved</span>
            : "Unsaved changes will be lost on refresh"}
        </p>
        <AdminButton onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save Settings</>}
        </AdminButton>
      </div>
    </AdminPage>
  );
}
