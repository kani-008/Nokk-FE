import { useState, useEffect, useRef } from "react";
import {
  Save, Loader2, Check, Store, Truck, IndianRupee, Bell,
  QrCode, Upload, Landmark, Palette, RotateCcw, ShoppingCart,
  Camera, Share2, AtSign, MessageCircle, Clock, ShoppingBag,
  Globe, Crosshair,
} from "lucide-react";

import { AdminPage, AdminCard, AdminButton } from "../../components/admin/AdminUI.jsx";
import { applyTheme, resetTheme, isValidHex } from "../../components/Theme.js";
import {
  usePaymentSettingsAdmin,
  useUpdatePaymentSettings,
  useUploadQrCode
} from "../../hooks/queries/usePaymentSettings";

// ── localStorage helpers ───────────────────────────────────────────────
const getLS  = (key, def) => { try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; } };
const setLS  = (key, val) => localStorage.setItem(key, JSON.stringify(val));
const delay  = (ms = 120) => new Promise((r) => setTimeout(r, ms));

// ── mock API ───────────────────────────────────────────────────────────
const SETTINGS_KEY = "nok-mock-settings";

const DEFAULTS = {
  storeName: "Namma Oor Karuvattu Kadai",
  storeEmail: "",
  storePhone: "",
  storeAddress: "",
  freeShippingThreshold: 499,
  shippingCharge: 60,
  gstPercentage: 0,
  codEnabled: true,
  upiEnabled: true,
  cardEnabled: true,
  notifyOrderConfirmed: true,
  notifyOrderShipped: true,
  notifyReturnRequest: true,
  themeColor: "",
  bgColor: "",
  instagramUrl: "",
  facebookUrl: "",
  twitterUrl: "",
  whatsappNumber: "",
  websiteUrl: "",
  storeOpenTime: "09:00",
  storeCloseTime: "21:00",
  storeDays: "Mon – Sat",
  minOrderValue: 0,
  maxCartItems: 20,
};

const PAYMENT_DEFAULTS = {
  upiId: "",
  payeeName: "NammaOorKaruvattuKadai",
  accountHolderName: "",
  accountNumber: "",
  ifscCode: "",
  bankName: "",
  qrCodeUrl: "",
};

const settingsApi = {
  get:    async ()     => { await delay(); return { settings: getLS(SETTINGS_KEY, DEFAULTS) }; },
  update: async (data) => { await delay(); setLS(SETTINGS_KEY, data); return { settings: data }; },
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

function Field({ label, name, type = "text", value, onChange, placeholder, unit, disabled, rows }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="relative">
        {unit && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-num text-sm text-gray-500 pointer-events-none">{unit}</span>}
        {rows ? (
          <textarea name={name} value={value ?? ""} onChange={onChange} rows={rows}
            placeholder={placeholder} disabled={disabled}
            className={`field-input resize-none ${disabled ? "bg-gray-50 cursor-not-allowed opacity-60" : ""}`}
          />
        ) : (
          <input type={type} name={name} value={value ?? ""} onChange={onChange}
            placeholder={placeholder} disabled={disabled}
            className={`field-input ${unit ? "pl-7" : ""} ${disabled ? "bg-gray-50 cursor-not-allowed opacity-60" : ""}`}
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

// ── Social Links section ───────────────────────────────────────────────
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

// ══════════════════════════════════════════════════════════════════════
export default function Settings() {
  const [form,    setForm]    = useState({ ...DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");

  const [payForm,     setPayForm]     = useState({ ...PAYMENT_DEFAULTS });
  const [paySaved,    setPaySaved]    = useState(false);
  const [payError,    setPayError]    = useState("");
  const fileRef = useRef(null);

  const { data: paySettings, isLoading: payLoading, error: payQueryError } = usePaymentSettingsAdmin();

  useEffect(() => {
    if (paySettings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPayForm(paySettings);
    }
  }, [paySettings]);

  useEffect(() => {
    if (payQueryError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPayError("Failed to load payment details.");
    }
  }, [payQueryError]);

  const updatePaymentMutation = useUpdatePaymentSettings();
  const paySaving = updatePaymentMutation.isPending;

  const uploadQrMutation = useUploadQrCode();
  const qrUploading = uploadQrMutation.isPending;

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
  const setE = (e)    => set(e.target.name, e.target.type === "number" ? Number(e.target.value) : e.target.value);

  const setPay  = (k, v) => setPayForm((f) => ({ ...f, [k]: v }));
  const setPayE = (e)    => setPay(e.target.name, e.target.value);

  const handleSave = async () => {
    setSaving(true); setSaved(false); setError("");
    try {
      await settingsApi.update(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { setError(e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleSavePayment = async () => {
    setPaySaved(false); setPayError("");
    try {
      await updatePaymentMutation.mutateAsync(payForm);
      setPaySaved(true);
      setTimeout(() => setPaySaved(false), 3000);
    } catch (e) { setPayError(e.message || "Failed to save"); }
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) { setPayError("PNG or JPG only"); return; }
    if (file.size > 2 * 1024 * 1024) { setPayError("Max 2 MB"); return; }
    setPayError("");
    try {
      const r = await uploadQrMutation.mutateAsync(file);
      setPayForm((f) => ({ ...f, qrCodeUrl: r.qrCodeUrl || f.qrCodeUrl }));
    } catch (e) { setPayError(e.message); }
    finally { if (fileRef.current) fileRef.current.value = ""; }
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
      title="Settings"
      sub="Configure store preferences, appearance, and integrations"
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
            <Field label="Store Name"    name="storeName"    value={form.storeName}    onChange={setE} placeholder="NammaOor…" />
            <Field label="Support Email" name="storeEmail"   value={form.storeEmail}   onChange={setE} placeholder="hello@store.com" type="email" />
            <Field label="Phone"         name="storePhone"   value={form.storePhone}   onChange={setE} placeholder="+91 98765 43210" type="tel" />
            <Field label="Store Address" name="storeAddress" value={form.storeAddress} onChange={setE} placeholder="Full address…" rows={2} />
          </div>
        </SectionCard>

        {/* ── Store Hours ── */}
        <SectionCard icon={Clock} title="Store Hours" sub="Shown to customers on your store">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Opens at"  name="storeOpenTime"  type="time" value={form.storeOpenTime}  onChange={setE} />
              <Field label="Closes at" name="storeCloseTime" type="time" value={form.storeCloseTime} onChange={setE} />
            </div>
            <Field label="Working Days" name="storeDays" value={form.storeDays} onChange={setE} placeholder="Mon – Sat" />
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5 flex items-start gap-2">
              <Clock size={13} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="font-body text-xs text-amber-700">
                Hours are displayed on the storefront and help customers know when to expect responses.
              </p>
            </div>
          </div>
        </SectionCard>

        {/* ── Shipping & Tax ── */}
        <SectionCard icon={Truck} title="Shipping & Tax" sub="Delivery fees and tax configuration">
          <div className="space-y-4">
            <Field label="Free Shipping Above"   name="freeShippingThreshold" type="number" value={form.freeShippingThreshold} onChange={setE} unit="₹" placeholder="499" />
            <Field label="Standard Delivery Fee" name="shippingCharge"        type="number" value={form.shippingCharge}        onChange={setE} unit="₹" placeholder="60" />
            <Field label="GST Percentage"        name="gstPercentage"         type="number" value={form.gstPercentage}         onChange={setE} unit="%" placeholder="0" />
          </div>
        </SectionCard>

        {/* ── Cart & Order Rules ── */}
        <SectionCard icon={ShoppingBag} title="Cart & Order Rules" sub="Limits applied at checkout">
          <div className="space-y-4">
            <Field label="Minimum Order Value" name="minOrderValue" type="number" value={form.minOrderValue} onChange={setE} unit="₹" placeholder="0" />
            <Field label="Max Items per Cart"  name="maxCartItems"  type="number" value={form.maxCartItems}  onChange={setE} placeholder="20" />
            <div className="pt-1 border-t border-gray-100">
              <p className="font-body text-xs text-gray-400">Set to 0 for no minimum order value. Max items limit prevents bulk abuse.</p>
            </div>
          </div>
        </SectionCard>

        {/* ── Payment Methods ── */}
        <SectionCard icon={IndianRupee} title="Payment Methods" sub="Enable or disable checkout payment options">
          <div>
            <ToggleRow label="Cash on Delivery (COD)" sub="Allow customers to pay on delivery" checked={form.codEnabled}  onChange={() => set("codEnabled",  !form.codEnabled)}  />
            <ToggleRow label="UPI"                    sub="GPay, PhonePe, Paytm & more"        checked={form.upiEnabled}  onChange={() => set("upiEnabled",  !form.upiEnabled)}  />
            <ToggleRow label="Credit / Debit Card"    sub="Visa, Mastercard, RuPay"            checked={form.cardEnabled} onChange={() => set("cardEnabled", !form.cardEnabled)} />
          </div>
        </SectionCard>

        {/* ── UPI & Bank Details ── */}
        <SectionCard icon={Landmark} title="Payment & UPI Receiving Details" sub="Your receiving account details">
          {payLoading ? <div className="h-48 skeleton rounded-xl" /> : (
            <div className="space-y-4">
              <Field label="Your UPI ID"                name="upiId"              value={payForm.upiId}              onChange={setPayE} placeholder="yourstore@upi" />
              <Field label="Payee Name (shown to customer)" name="payeeName"      value={payForm.payeeName}          onChange={setPayE} placeholder="NammaOorKaruvattuKadai" />

              <div className="pt-2 border-t border-gray-100">
                <p className="font-body text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 mt-1">
                  Bank Details <span className="normal-case font-normal text-gray-400">(admin only)</span>
                </p>
                <div className="space-y-4">
                  <Field label="Account Holder Name" name="accountHolderName" value={payForm.accountHolderName} onChange={setPayE} placeholder="Full name on account" />
                  <Field label="Account Number"      name="accountNumber"     value={payForm.accountNumber}     onChange={setPayE} placeholder="XXXXXXXXXXXX" />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="IFSC Code"  name="ifscCode"  value={payForm.ifscCode}  onChange={setPayE} placeholder="ABCD0123456" />
                    <Field label="Bank Name"  name="bankName"  value={payForm.bankName}  onChange={setPayE} placeholder="SBI" />
                  </div>
                </div>
              </div>

              {/* QR upload */}
              <div className="pt-2 border-t border-gray-100">
                <label className="field-label flex items-center gap-1.5"><QrCode size={12} /> Payment QR Code</label>
                <div className="flex items-center gap-4 mt-1.5">
                  {payForm.qrCodeUrl ? (
                    <img src={payForm.qrCodeUrl} alt="UPI QR" className="w-20 h-20 rounded-xl border border-gray-200 object-contain bg-white p-1" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300">
                      <QrCode size={24} />
                    </div>
                  )}
                  <div>
                    <input ref={fileRef} type="file" accept="image/png,image/jpeg" onChange={handleQrUpload} className="hidden" id="qr-upload" />
                    <label htmlFor="qr-upload" className="btn-md btn-outline cursor-pointer inline-flex">
                      {qrUploading ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><Upload size={14} /> {payForm.qrCodeUrl ? "Replace QR" : "Upload QR"}</>}
                    </label>
                    <p className="font-body text-xs text-gray-400 mt-1.5">PNG or JPG, max 2 MB</p>
                  </div>
                </div>
              </div>

              {payError && <div className="bg-red-50 border border-red-200 text-red-700 font-body text-xs rounded-xl px-3 py-2.5">{payError}</div>}

              <AdminButton onClick={handleSavePayment} disabled={paySaving} className="w-full">
                {paySaving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> :
                 paySaved  ? <><Check size={14} /> Saved!</>                              :
                             <><Save size={14} /> Save Payment Details</>}
              </AdminButton>
            </div>
          )}
        </SectionCard>

        {/* ── Social & Contact Links ── */}
        <SectionCard icon={Globe} title="Social & Contact Links" sub="Displayed in footer and contact page">
          <div className="space-y-4">
            <SocialField icon={Camera}        label="Instagram"   name="instagramUrl"   value={form.instagramUrl}   onChange={setE} placeholder="https://instagram.com/yourstore" color="text-pink-500"  />
            <SocialField icon={Share2}        label="Facebook"   name="facebookUrl"    value={form.facebookUrl}    onChange={setE} placeholder="https://facebook.com/yourpage"  color="text-blue-600" />
            <SocialField icon={AtSign}        label="Twitter / X" name="twitterUrl"   value={form.twitterUrl}     onChange={setE} placeholder="https://x.com/yourhandle"        color="text-sky-500"  />
            <SocialField icon={MessageCircle} label="WhatsApp"   name="whatsappNumber" value={form.whatsappNumber} onChange={setE} placeholder="+91 98765 43210"                color="text-green-500"/>
            <SocialField icon={Globe}         label="Website"    name="websiteUrl"     value={form.websiteUrl}     onChange={setE} placeholder="https://yourstore.com"          color="text-gray-500" />
          </div>
        </SectionCard>

        {/* ── Notifications ── */}
        <SectionCard icon={Bell} title="Order Notifications" sub="Customer notification triggers">
          <div>
            <ToggleRow label="Order Confirmed"  sub="Notify customer when order is placed"    checked={form.notifyOrderConfirmed} onChange={() => set("notifyOrderConfirmed", !form.notifyOrderConfirmed)} />
            <ToggleRow label="Order Shipped"    sub="Notify customer when order is shipped"   checked={form.notifyOrderShipped}   onChange={() => set("notifyOrderShipped",   !form.notifyOrderShipped)}   />
            <ToggleRow label="Return Request"   sub="Alert admin when customer requests return" checked={form.notifyReturnRequest} onChange={() => set("notifyReturnRequest",  !form.notifyReturnRequest)}  />
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="font-body text-xs text-gray-400">SMS and WhatsApp notifications coming soon.</p>
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
