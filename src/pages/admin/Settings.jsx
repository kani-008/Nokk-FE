import { useState, useEffect, useRef } from "react";
import { Save, Loader2, Check, Store, Truck, IndianRupee, Bell, QrCode, Upload, Landmark } from "lucide-react";
import { settingsApi, paymentSettingsApi } from "../../ApiCall/Api.jsx";
import { useAuthStore } from "../../components/store/AuthStore";
import { AdminPage, AdminCard, AdminButton } from "../../components/admin/AdminUI.jsx";

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

function SectionCard({ icon: Icon, title, children }) {
  return (
    <AdminCard>
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
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="font-body text-sm font-medium text-gray-900">{label}</p>
        {sub && <p className="font-body text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <div onClick={onChange} className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors shrink-0 ml-4 ${checked ? "bg-brand-700" : "bg-gray-300"}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </div>
    </div>
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
      .then((r) => setForm((f) => ({ ...f, ...(r.settings || {}) })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    paymentSettingsApi.getAdmin(token)
      .then((r) => setPayForm((f) => ({ ...f, ...(r.settings || {}) })))
      .catch(() => {})
      .finally(() => setPayLoading(false));
  }, []);

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
      return;
    }
    setQrUploading(true); setPayError("");
    try {
      const r = await paymentSettingsApi.uploadQr(file, token);
      setPayForm((f) => ({ ...f, qrCodeUrl: r.settings.qrCodeUrl }));
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