import { useState, useMemo } from "react";
import {
  CreditCard, Smartphone, Banknote, ArrowLeft, ChevronRight,
  QrCode, Lock,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { usePaymentSettingsPublic } from "../../hookqueries/usePaymentSettings";


export const PAYMENT_METHODS = [
  {
    key:   "razorpay",
    label: "Pay Online (UPI / Card)",
    sub:   "Instant verification via Razorpay",
    icon:  <CreditCard size={20} />,
  },
  {
    key:   "upi",
    label: "UPI (Manual QR)",
    sub:   "Scan QR & submit Reference ID manually",
    icon:  <Smartphone size={20} />,
  },
  {
    key:   "cod",
    label: "Cash on Delivery",
    sub:   "Pay when you receive",
    icon:  <Banknote size={20} />,
  },
];

// ── UPI apps that support intent-link deep redirects on mobile ────────
// Each `buildLink` takes the receiver UPI string params and returns a
// scheme URL that the OS routes straight into the installed app.
// On desktop these links simply fail silently / show "open app?" — so
// we only render the button row prominently on mobile (see isMobile
// below) and lean on the QR code for desktop instead.
const UPI_APPS = [
  {
    key:   "gpay",
    label: "GPay",
    color: "#4285F4",
    buildLink: (p) => `tez://upi/pay?${p}`,
  },
  {
    key:   "phonepe",
    label: "PhonePe",
    color: "#5F259F",
    buildLink: (p) => `phonepe://pay?${p}`,
  },
  {
    key:   "paytm",
    label: "Paytm",
    color: "#00BAF2",
    buildLink: (p) => `paytmmp://pay?${p}`,
  },
];

// Generic upi:// link — fallback that lets the phone show its own
// "choose an app" sheet, used if a specific app scheme isn't installed.
function buildGenericUpiLink({ upiId, payeeName, amount, note }) {
  const params = new URLSearchParams({
    pa: upiId || "",
    pn: payeeName || "Store",
    am: amount ? String(amount) : "",
    cu: "INR",
    tn: note || "Order payment",
  });
  return params.toString();
}

// Simple UA-sniff — good enough to decide button vs QR emphasis.
// Not used for anything security-sensitive.
function useIsMobile() {
  const [isMobile] = useState(() => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    return /Android|iPhone|iPad|iPod/i.test(ua);
  });
  return isMobile;
}

// ══════════════════════════════════════════════════════════════════════
// PaymentStep
//
// Props:
//   selected     {string}  — "upi" | "card" | "cod"
//   onSelect     {fn}      — (key) => void
//   onBack       {fn}      — go back to address step
//   onNext       {fn}      — advance to review step
//   amount       {number}  — order total, used to pre-fill UPI intent amount
//   customerUpiId {string} — customer's own UPI ID (optional, reference only)
//   onCustomerUpiIdChange {fn}
//   infoMessage   {string} — cancellation message
// ══════════════════════════════════════════════════════════════════════
export default function Payment({
  selected,
  onSelect,
  onBack,
  onNext,
  amount,
  customerUpiId = "",
  onCustomerUpiIdChange = () => {},
  infoMessage = "",
}) {
  const isMobile = useIsMobile();

  const { data: receiverSettings = null, isLoading: loadingSettings } = usePaymentSettingsPublic();

  const upiQueryString = useMemo(() => {
    if (!receiverSettings?.upiId) return "";
    return buildGenericUpiLink({
      upiId:     receiverSettings.upiId,
      payeeName: receiverSettings.payeeName,
      amount,
      note:      "NammaOorKaruvattuKadai order",
    });
  }, [receiverSettings, amount]);

  // The actual string encoded into the QR — standard upi:// URI works
  // for any scanning app (GPay/PhonePe/Paytm/BHIM all understand it).
  const genericUpiUri = upiQueryString ? `upi://pay?${upiQueryString}` : "";

  return (
    <div className="card p-5 sm:p-6">
      {/* header */}
      <div className="flex items-center gap-2 mb-5">
        <CreditCard size={18} className="text-brand-700" />
        <h2 className="font-display text-lg font-bold text-brand-900">Payment Method</h2>
      </div>

      {infoMessage && (
        <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-800 font-body text-sm rounded-xl px-4 py-3">
          {infoMessage}
        </div>
      )}

      {/* method cards */}
      <div className="space-y-3 mb-6">
        {PAYMENT_METHODS.map((m) => (
          <div key={m.key}>
            <button
              onClick={() => onSelect(m.key)}
              className={`w-full flex items-center gap-4 p-4 border-2 rounded-2xl text-left transition-colors ${
                selected === m.key
                  ? "border-brand-700 bg-brand-50"
                  : "border-amber-100 hover:border-amber-300 bg-white"
              }`}
            >
              {/* radio dot */}
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                selected === m.key
                  ? "border-brand-700 bg-brand-700"
                  : "border-amber-300"
              }`}>
                {selected === m.key && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>

              {/* icon */}
              <span className={selected === m.key ? "text-brand-700" : "text-amber-400"}>
                {m.icon}
              </span>

              <div className="flex-1">
                <p className="font-body text-sm font-semibold text-brand-900">{m.label}</p>
                <p className="font-body text-xs text-amber-500">{m.sub}</p>
              </div>

              <ChevronRight size={16} className="text-amber-300 shrink-0" />
            </button>

            {/* ── Expanded UPI panel ──────────────────────────────── */}
            {m.key === "upi" && selected === "upi" && (
              <div className="mt-3 ml-1 p-4 sm:p-5 rounded-2xl border border-amber-100 bg-amber-50/40 space-y-5">

                {loadingSettings ? (
                  <div className="h-24 skeleton rounded-xl" />
                ) : !receiverSettings?.upiId ? (
                  <p className="font-body text-sm text-amber-600">
                    UPI payment isn't configured yet. Please choose another payment method or contact support.
                  </p>
                ) : (
                  <>
                    {/* Your UPI ID — optional, for reference/identification only.
                        Does NOT charge the customer directly; actual money
                        movement happens via the app redirect or QR scan below. */}
                    <div>
                      <label className="field-label">Your UPI ID (optional)</label>
                      <input
                        type="text"
                        value={customerUpiId}
                        onChange={(e) => onCustomerUpiIdChange(e.target.value)}
                        placeholder="yourname@upi"
                        className="field-input"
                      />
                      <p className="font-body text-xs text-amber-500 mt-1">
                        Just for our reference — pay using the app buttons or QR code below.
                      </p>
                    </div>

                    {/* Mobile: app buttons emphasized, QR collapsed below.
                        Desktop: QR emphasized, app buttons shown as secondary
                        since intent links can't open an app that isn't there. */}
                    {isMobile ? (
                      <>
                        <div>
                          <p className="font-body text-xs font-semibold text-brand-900 mb-2.5">
                            Pay with
                          </p>
                          <div className="grid grid-cols-3 gap-2.5">
                            {UPI_APPS.map((app) => (
                              <a
                                key={app.key}
                                href={app.buildLink(upiQueryString)}
                                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-amber-100 bg-white hover:border-amber-300 transition-colors"
                              >
                                <span
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-body text-xs font-bold"
                                  style={{ backgroundColor: app.color }}
                                >
                                  {app.label[0]}
                                </span>
                                <span className="font-body text-xs font-medium text-brand-900">{app.label}</span>
                              </a>
                            ))}
                          </div>
                        </div>

                        <details className="group">
                          <summary className="font-body text-xs text-brand-700 cursor-pointer hover:underline flex items-center gap-1">
                            <QrCode size={13} /> Or scan QR instead
                          </summary>
                          <div className="mt-3 flex flex-col items-center gap-2">
                            <QrPreview receiverSettings={receiverSettings} genericUpiUri={genericUpiUri} />
                          </div>
                        </details>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-col items-center gap-3">
                          <p className="font-body text-xs font-semibold text-brand-900">
                            Scan with any UPI app
                          </p>
                          <QrPreview receiverSettings={receiverSettings} genericUpiUri={genericUpiUri} />
                          <p className="font-body text-xs text-amber-500 text-center max-w-xs">
                            Open GPay, PhonePe, Paytm, or any UPI app on your phone and scan this code to pay ₹{amount}.
                          </p>
                        </div>

                        <details className="group border-t border-amber-100 pt-3">
                          <summary className="font-body text-xs text-brand-700 cursor-pointer hover:underline flex items-center gap-1">
                            On mobile? Tap to pay directly in-app
                          </summary>
                          <div className="grid grid-cols-3 gap-2.5 mt-3">
                            {UPI_APPS.map((app) => (
                              <a
                                key={app.key}
                                href={app.buildLink(upiQueryString)}
                                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-amber-100 bg-white hover:border-amber-300 transition-colors"
                              >
                                <span
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-body text-xs font-bold"
                                  style={{ backgroundColor: app.color }}
                                >
                                  {app.label[0]}
                                </span>
                                <span className="font-body text-xs font-medium text-brand-900">{app.label}</span>
                              </a>
                            ))}
                          </div>
                        </details>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════
          PAY ONLINE VIA GATEWAY — placeholder section
          ════════════════════════════════════════════════════════════
          Disabled "coming soon" cards for Razorpay / Cashfree style
          checkout. No SDK keys exist yet, so these are visual only.

          TO ACTIVATE LATER:
          1. npm install razorpay (backend) — create an order via
             Razorpay's Orders API, return order_id to frontend.
          2. npm install razorpay (or use <script> CDN) on frontend,
             open Razorpay Checkout modal with the order_id.
          3. Verify payment signature server-side in a webhook/callback
             before marking payment_status = 'paid'.
          4. Replace the `disabled` + "Coming Soon" badge below with
             a working onClick that calls your gateway init endpoint.
      ════════════════════════════════════════════════════════════ */}
      <div className="mb-6">
        <p className="font-body text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2.5">
          Pay Online via Gateway
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: "Razorpay", note: "Cards, UPI, Wallets, NetBanking" },
            { name: "Cashfree", note: "Cards, UPI, Wallets, NetBanking" },
          ].map((gw) => (
            <div
              key={gw.name}
              className="relative p-4 border-2 border-dashed border-amber-200 rounded-2xl bg-amber-50/30 opacity-60 cursor-not-allowed"
            >
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-body text-[10px] font-bold flex items-center gap-1">
                <Lock size={9} /> Coming Soon
              </span>
              <p className="font-body text-sm font-semibold text-brand-900">{gw.name}</p>
              <p className="font-body text-xs text-amber-500 mt-0.5">{gw.note}</p>
            </div>
          ))}
        </div>
      </div>



      {/* nav buttons */}
      <div className="flex gap-3">
        <button onClick={onBack} className="btn-md btn-outline">
          <ArrowLeft size={15} /> Back
        </button>
        <button onClick={onNext} className="btn-lg btn-primary flex-1">
          Continue to Review
        </button>
      </div>
    </div>
  );
}

// ── Shared QR block: admin-uploaded image takes priority, otherwise
//    render a live QR from the generic upi:// URI ───────────────────
function QrPreview({ receiverSettings, genericUpiUri }) {
  if (receiverSettings?.qrCodeUrl) {
    return (
      <img
        src={receiverSettings.qrCodeUrl}
        alt="UPI QR Code"
        className="w-44 h-44 rounded-xl border border-amber-200 bg-white p-2 object-contain"
      />
    );
  }
  if (genericUpiUri) {
    return (
      <div className="p-3 bg-white rounded-xl border border-amber-200">
        <QRCodeSVG value={genericUpiUri} size={160} />
      </div>
    );
  }
  return null;
}