import { useState, useEffect, useRef } from "react";
import { Save, Loader2, Check, Store, Truck, IndianRupee, Bell, QrCode, Upload, Landmark, Palette, RotateCcw, ShoppingCart } from "lucide-react";
const getLocalStorage = (key, initialData) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }
  try {
    return JSON.parse(data);
  } catch {
    return initialData;
  }
};

const setLocalStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const getSettings = () => getLocalStorage("nok-mock-settings", {
  storeName: "Namma Oor Karuvattu Kadai",
  storeEmail: "hello@nammakadai.com",
  storePhone: "+91 98765 43210",
  freeShippingThreshold: 499,
  shippingCharge: 60,
  gstPercentage: 5
});

const getPaymentSettings = () => getLocalStorage("nok-mock-payment-settings", {
  upiId: "nammaoor@upi",
  payeeName: "Namma Oor Karuvattu Kadai",
  accountHolderName: "Namma Oor Store",
  accountNumber: "123456789012",
  ifscCode: "SBIN0001234",
  bankName: "State Bank of India",
  qrCodeUrl: ""
});

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

const settingsApi = {
  get: async () => {
    await delay();
    return { success: true, settings: getSettings() };
  },
  update: async (data) => {
    await delay();
    setLocalStorage("nok-mock-settings", data);
    return { success: true, settings: data };
  }
};

const paymentSettingsApi = {
  getAdmin: async () => {
    await delay();
    return { success: true, settings: getPaymentSettings() };
  },
  update: async (data) => {
    await delay();
    const current = getPaymentSettings();
    const updated = { ...current, ...data };
    setLocalStorage("nok-mock-payment-settings", updated);
    return { success: true, settings: updated };
  },
  uploadQr: async (file) => {
    await delay();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const settings = getPaymentSettings();
        settings.qrCodeUrl = reader.result;
        setLocalStorage("nok-mock-payment-settings", settings);
        resolve({ success: true, settings });
      };
      reader.onerror = () => {
        reject(new Error("Failed to read QR file"));
      };
      reader.readAsDataURL(file);
    });
  }
};
import { useAuthStore } from "../../components/store/AuthStore";
import { AdminPage, AdminCard, AdminButton } from "../../components/admin/AdminUI.jsx";
import { applyTheme, resetTheme, isValidHex } from "../../components/Theme.js";

const MAX_QR_BYTES = 2 * 1024 * 1024; // 2MB — matches the helper text

const DEFAULTS = {
  storeName: "NammaOorKaruvattuKadai",
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
  themeColor: "", // empty = use the palette defined in index.css
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

// curated brand presets — each is a single base colour the generator
// expands into a full 50–900 scale
const THEME_PRESETS = [
  { name: "Terracotta", hex: "#c2613a" },
  { name: "Saffron",    hex: "#d97706" },
  { name: "Ocean",      hex: "#0e7490" },
  { name: "Forest",     hex: "#15803d" },
  { name: "Indigo",     hex: "#4338ca" },
  { name: "Crimson",    hex: "#be123c" },
  { name: "Slate",      hex: "#475569" },
];

function SectionCard({ icon: Icon, title, children, className = "" }) {
  return (
    <AdminCard className={className}>
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-100">
        <div className="p-2 rounded-xl bg-brand-50"><Icon size={16} className="text-brand-700" /></div>
        <h3 className="font-display text-base font-bold text-gray-900">{title}</h3>
      </div>
      {children}
    </AdminCard>
  );
}

function Field({ label, name, type = "text", value, onChange, placeholder, unit, disabled }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="relative">
        {unit && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-num text-sm text-gray-500">{unit}</span>}
        <input
          type={type} name={name} value={value ?? ""}
          onChange={onChange} placeholder={placeholder}
          disabled={disabled}
          className={`field-input ${unit ? "pl-7" : ""} ${disabled ? "bg-gray-50 cursor-not-allowed opacity-60" : ""}`}
        />
      </div>
    </div>
  );
}

function ToggleRow({ label, sub, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={!!checked}
      className="w-full flex items-center justify-between py-3 border-b border-gray-50 last:border-0 text-left"
    >
      <div>
        <p className="font-body text-sm font-medium text-gray-900">{label}</p>
        {sub && <p className="font-body text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <span className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ml-4 ${checked ? "bg-brand-700" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </span>
    </button>
  );
}

// ── Theme / appearance section ─────────────────────────────────────────
function ThemeSection({ value, onChange }) {
  // local hex field so the admin can type freely before it's valid
  const [hexInput, setHexInput] = useState(value || "");

  useEffect(() => {
    setTimeout(() => {
      setHexInput(value || "");
    }, 0);
  }, [value]);

  const choose = (hex) => {
    onChange(hex);
    applyTheme(hex);          // live preview across the whole UI
  };

  const onHexType = (raw) => {
    setHexInput(raw);
    const v = raw.startsWith("#") ? raw : `#${raw}`;
    if (isValidHex(v)) choose(v);
  };

  const reset = () => {
    onChange("");
    setHexInput("");
    resetTheme();             // fall back to index.css palette
  };

  const active = value || "";

  return (
    <SectionCard icon={Palette} title="Theme & Appearance" className="lg:col-span-2">
      <p className="font-body text-sm text-gray-500 mb-4 -mt-1">
        Pick a brand colour for the storefront. Changes preview instantly and apply site-wide once saved.
      </p>

      {/* presets */}
      <div className="flex flex-wrap gap-2.5 mb-5">
        {THEME_PRESETS.map((p) => {
          const selected = active.toLowerCase() === p.hex.toLowerCase();
          return (
            <button
              key={p.hex}
              type="button"
              onClick={() => choose(p.hex)}
              title={p.name}
              className={`group flex flex-col items-center gap-1.5 ${selected ? "" : "opacity-90 hover:opacity-100"}`}
            >
              <span
                className={`w-9 h-9 rounded-full shadow-sm transition-transform group-hover:scale-110 ${selected ? "ring-2 ring-offset-2 ring-gray-900" : "ring-1 ring-black/5"}`}
                style={{ backgroundColor: p.hex }}
              />
              <span className="font-body text-[10px] text-gray-500">{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* custom + reset */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="field-label">Custom colour</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={isValidHex(active) ? active : "#c2613a"}
              onChange={(e) => choose(e.target.value)}
              className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer bg-white p-0.5"
              aria-label="Pick custom colour"
            />
            <input
              type="text"
              value={hexInput}
              onChange={(e) => onHexType(e.target.value)}
              placeholder="#c2613a"
              className="field-input w-32 font-num"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1.5 font-body text-sm text-gray-500 hover:text-gray-800 transition-colors mb-2.5"
        >
          <RotateCcw size={14} /> Reset to default
        </button>
      </div>

      {/* live preview */}
      <div className="mt-5 pt-5 border-t border-gray-100">
        <p className="font-body text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Preview</p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn-md btn-primary pointer-events-none">
            <ShoppingCart size={14} /> Add to Cart
          </button>
          <button type="button" className="btn-md btn-outline pointer-events-none">View</button>
          <span className="badge-amber">Best Seller</span>
          <span className="font-body text-sm font-semibold text-brand-700">Sample link</span>
          <span className="w-8 h-8 rounded-full bg-brand-800 inline-block" />
        </div>
        <p className="font-body text-[11px] text-gray-400 mt-3">
          Tip: very light colours can make white button text hard to read — darker, saturated tones work best as a primary.
        </p>
      </div>
    </SectionCard>
  );
}

// ══════════════════════════════════════════════════════════════════════
export default function Settings() {
  const { token }  = useAuthStore();
  const [form,    setForm]    = useState({ ...DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");

  const [payForm,    setPayForm]    = useState({ ...PAYMENT_DEFAULTS });
  const [payLoading, setPayLoading] = useState(true);
  const [paySaving,  setPaySaving]  = useState(false);
  const [paySaved,   setPaySaved]   = useState(false);
  const [payError,   setPayError]   = useState("");
  const [qrUploading, setQrUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    settingsApi.get()
      .then((r) => {
        const s = r.settings || {};
        setForm((f) => ({ ...f, ...s }));
        if (s.themeColor) applyTheme(s.themeColor); // restore saved theme on load
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // depends on token: if auth resolves after mount, this refetches with
  // the real token instead of silently firing with undefined
  useEffect(() => {
    if (!token) return;
    setTimeout(() => {
      setPayLoading(true);
    }, 0);
    paymentSettingsApi.getAdmin(token)
      .then((r) => setPayForm((f) => ({ ...f, ...(r.settings || {}) })))
      .catch(() => {})
      .finally(() => setPayLoading(false));
  }, [token]);

  const set  = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setE = (e)    => set(e.target.name, e.target.type === "number" ? Number(e.target.value) : e.target.value);

  const setPay  = (k, v) => setPayForm((f) => ({ ...f, [k]: v }));
  const setPayE = (e)    => setPay(e.target.name, e.target.value);

  const handleSave = async () => {
    setSaving(true); setSaved(false); setError("");
    try {
      await settingsApi.update(form, token);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { setError(e.message || "Failed to save settings"); }
    finally { setSaving(false); }
  };

  const handleSavePayment = async () => {
    setPaySaving(true); setPaySaved(false); setPayError("");
    try {
      await paymentSettingsApi.update(payForm, token);
      setPaySaved(true);
      setTimeout(() => setPaySaved(false), 3000);
    } catch (e) { setPayError(e.message || "Failed to save payment settings"); }
    finally { setPaySaving(false); }
  };

  const handleQrFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setPayError("Only PNG or JPG images are allowed");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_QR_BYTES) {
      setPayError("QR image must be 2MB or smaller");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setQrUploading(true); setPayError("");
    try {
      const r = await paymentSettingsApi.uploadQr(file, token);
      setPayForm((f) => ({ ...f, qrCodeUrl: r.settings?.qrCodeUrl || f.qrCodeUrl }));
    } catch (e) {
      setPayError(e.message || "Failed to upload QR code");
    } finally {
      setQrUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <AdminPage title="Settings">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 skeleton rounded-2xl" />)}
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title="Settings"
      sub="Configure your store preferences"
      action={
        <AdminButton onClick={handleSave} disabled={saving}>
          {saving  ? <><Loader2 size={14} className="animate-spin" /> Saving…</> :
           saved   ? <><Check   size={14} /> Saved!</>                           :
                     <><Save    size={14} /> Save Settings</>}
        </AdminButton>
      }
    >
      {error && <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-3">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Theme & Appearance (spans full width) */}
        <ThemeSection value={form.themeColor} onChange={(hex) => set("themeColor", hex)} />

        {/* Store Info */}
        <SectionCard icon={Store} title="Store Information">
          <div className="space-y-4">
            <Field label="Store Name"    name="storeName"    value={form.storeName}    onChange={setE} placeholder="NammaOor…" />
            <Field label="Support Email" name="storeEmail"   value={form.storeEmail}   onChange={setE} placeholder="hello@store.com" type="email" />
            <Field label="Phone"         name="storePhone"   value={form.storePhone}   onChange={setE} placeholder="+91 98765 43210" type="tel" />
            <div>
              <label className="field-label">Store Address</label>
              <textarea
                name="storeAddress" value={form.storeAddress || ""} onChange={setE}
                rows={2} placeholder="Full address…"
                className="field-input resize-none"
              />
            </div>
          </div>
        </SectionCard>

        {/* Shipping & Tax */}
        <SectionCard icon={Truck} title="Shipping & Tax">
          <div className="space-y-4">
            <Field label="Free Shipping Above"   name="freeShippingThreshold" type="number" value={form.freeShippingThreshold} onChange={setE} unit="₹" placeholder="499" />
            <Field label="Standard Delivery Fee" name="shippingCharge"        type="number" value={form.shippingCharge}        onChange={setE} unit="₹" placeholder="60"  />
            <Field label="GST Percentage"        name="gstPercentage"         type="number" value={form.gstPercentage}         onChange={setE} unit="%" placeholder="0"   />
          </div>
        </SectionCard>

        {/* Payment Methods */}
        <SectionCard icon={IndianRupee} title="Payment Methods">
          <div>
            <ToggleRow label="Cash on Delivery (COD)" sub="Allow customers to pay on delivery" checked={form.codEnabled}  onChange={() => set("codEnabled",  !form.codEnabled)}  />
            <ToggleRow label="UPI"                    sub="GPay, PhonePe, Paytm & more"          checked={form.upiEnabled}  onChange={() => set("upiEnabled",  !form.upiEnabled)}  />
            <ToggleRow label="Credit / Debit Card"    sub="Visa, Mastercard, RuPay"              checked={form.cardEnabled} onChange={() => set("cardEnabled", !form.cardEnabled)} />
          </div>
        </SectionCard>

        {/* Payment & UPI Receiving Details */}
        <SectionCard icon={Landmark} title="Payment & UPI Receiving Details">
          {payLoading ? (
            <div className="h-48 skeleton rounded-xl" />
          ) : (
            <div className="space-y-4">
              <Field
                label="Your UPI ID"
                name="upiId"
                value={payForm.upiId}
                onChange={setPayE}
                placeholder="yourstore@upi"
              />
              <Field
                label="Payee Name (shown to customer)"
                name="payeeName"
                value={payForm.payeeName}
                onChange={setPayE}
                placeholder="NammaOorKaruvattuKadai"
              />

              <div className="pt-2 border-t border-gray-100">
                <p className="font-body text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 mt-3">
                  Bank Details (admin only, not shown to customers)
                </p>
                <div className="space-y-4">
                  <Field
                    label="Account Holder Name"
                    name="accountHolderName"
                    value={payForm.accountHolderName}
                    onChange={setPayE}
                    placeholder="Full name on bank account"
                  />
                  <Field
                    label="Account Number"
                    name="accountNumber"
                    value={payForm.accountNumber}
                    onChange={setPayE}
                    placeholder="XXXXXXXXXXXX"
                  />
                  <Field
                    label="IFSC Code"
                    name="ifscCode"
                    value={payForm.ifscCode}
                    onChange={setPayE}
                    placeholder="ABCD0123456"
                  />
                  <Field
                    label="Bank Name"
                    name="bankName"
                    value={payForm.bankName}
                    onChange={setPayE}
                    placeholder="State Bank of India"
                  />
                </div>
              </div>

              {/* QR code upload + preview */}
              <div className="pt-2 border-t border-gray-100">
                <label className="field-label flex items-center gap-1.5">
                  <QrCode size={13} /> Payment QR Code
                </label>
                <div className="flex items-center gap-4 mt-1">
                  {payForm.qrCodeUrl ? (
                    <img
                      src={payForm.qrCodeUrl}
                      alt="UPI QR"
                      className="w-20 h-20 rounded-lg border border-gray-200 object-contain bg-white p-1"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-300">
                      <QrCode size={24} />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={handleQrFileChange}
                      className="hidden"
                      id="qr-upload-input"
                    />
                    <label
                      htmlFor="qr-upload-input"
                      className="btn-md btn-outline cursor-pointer inline-flex"
                    >
                      {qrUploading ? (
                        <><Loader2 size={14} className="animate-spin" /> Uploading…</>
                      ) : (
                        <><Upload size={14} /> {payForm.qrCodeUrl ? "Replace QR" : "Upload QR"}</>
                      )}
                    </label>
                    <p className="font-body text-xs text-gray-400 mt-1.5">PNG or JPG, max 2MB.</p>
                  </div>
                </div>
              </div>

              {payError && (
                <div className="bg-red-50 border border-red-200 text-red-700 font-body text-xs rounded-xl px-3 py-2.5">
                  {payError}
                </div>
              )}

              <AdminButton onClick={handleSavePayment} disabled={paySaving} className="w-full">
                {paySaving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> :
                 paySaved  ? <><Check size={14} /> Saved!</>                              :
                             <><Save size={14} /> Save Payment Details</>}
              </AdminButton>
            </div>
          )}
        </SectionCard>

        {/* Notifications */}
        <SectionCard icon={Bell} title="Order Notifications">
          <div>
            <ToggleRow label="Order Confirmed" sub="Notify customer when order is confirmed" checked={form.notifyOrderConfirmed} onChange={() => set("notifyOrderConfirmed", !form.notifyOrderConfirmed)} />
            <ToggleRow label="Order Shipped"   sub="Notify customer when order is shipped"   checked={form.notifyOrderShipped}   onChange={() => set("notifyOrderShipped",   !form.notifyOrderShipped)}   />
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="font-body text-xs text-gray-400">More notification types coming soon (SMS, WhatsApp).</p>
          </div>
        </SectionCard>

      </div>

      {/* bottom save bar */}
      <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-3.5">
        <p className="font-body text-sm text-gray-500">
          {saved ? <span className="text-green-600 font-semibold flex items-center gap-1.5"><Check size={14} /> All changes saved</span> : "Unsaved changes will be lost"}
        </p>
        <AdminButton onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save Settings</>}
        </AdminButton>
      </div>
    </AdminPage>
  );
}