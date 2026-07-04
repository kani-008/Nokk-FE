import { useState } from "react";
import {
  CreditCard,
  Smartphone,
  Banknote,
  Building2,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Lock,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import StepBar from "./StepBar";

export const PAYMENT_METHODS = [
  {
    key: "razorpay_upi",
    label: "UPI Payment",
    sub: "Pay via GPay, PhonePe, Paytm, or any UPI app",
    icon: <Smartphone size={20} />,
    settingsKey: "upiEnabled",
  },
  {
    key: "razorpay",
    label: "Card Payment",
    sub: "Pay via Credit/Debit cards",
    icon: <CreditCard size={20} />,
    settingsKey: "cardEnabled",
  },
  {
    key: "razorpay_netbanking",
    label: "Net Banking",
    sub: "Pay via Internet Banking from any Indian bank",
    icon: <Building2 size={20} />,
    settingsKey: "netbankingEnabled",
  },
  {
    key: "cod",
    label: "Cash on Delivery",
    sub: "Pay when you receive",
    icon: <Banknote size={20} />,
    settingsKey: "codEnabled",
  },
];

const rupee = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export default function Payment({
  selected,
  onSelect,
  onPlaceOrder,
  amount,
  totalMrp = 0,
  discount = 0,
  shipping = 0,
  infoMessage = "",
  placing = false,
  error = "",
  placedOrderId = null,
  onBack,
  paymentSettings = {},
}) {
  const navigate = useNavigate();
  const [priceDetailsOpen, setPriceDetailsOpen] = useState(false);

  // Filter payment methods based on admin settings toggles
  const visibleMethods = PAYMENT_METHODS.filter((m) => {
    // If no settings yet, show all (fail-open)
    if (!paymentSettings || Object.keys(paymentSettings).length === 0) return true;
    // If no settingsKey defined, always show
    if (!m.settingsKey) return true;
    // Only show when explicitly enabled (default true if key missing)
    return paymentSettings[m.settingsKey] !== false;
  });

  // ── Render success screen if order has been successfully placed ────
  if (placedOrderId) {
    return (
      <div className="card p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-600 animate-bounce">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-900">
            Order Placed Successfully!
          </h2>
          <p className="font-body text-sm text-amber-600 max-w-md">
            Thank you for your purchase. Your order has been registered and is
            being processed.
          </p>
        </div>

        <button
          onClick={() =>
            navigate("/my-orders", { state: { newOrderId: placedOrderId } })
          }
          className="btn-lg btn-primary w-full max-w-sm mt-2"
        >
          View My Orders
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Mobile-only Header (Step 3 of 3 / Payments / 100% Secure) */}
      <div className="md:hidden flex items-center justify-between gap-4 mb-4 pt-1">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 text-brand-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="font-body text-[10px] text-amber-500 font-semibold leading-none">
              Step 3 of 3
            </p>
            <h2 className="font-display text-lg font-bold text-brand-900 mt-0.5">
              Payments
            </h2>
          </div>
        </div>

        {/* 100% Secure badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 font-body text-[11px] font-bold">
          <Lock size={12} className="text-gray-400" />
          <span>100% Secure</span>
        </div>
      </div>

      {/* Collapsible price details for mobile view */}
      <div className="md:hidden mb-4 overflow-hidden border border-brand-100 rounded-2xl bg-brand-50 transition-all duration-500 ease-in-out">
        {/* Collapsible details (rendered at the top of the card) */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${priceDetailsOpen ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
            }`}
        >
          <div className="px-4 pt-4 pb-1 border-b border-brand-100/50">
            <div className="space-y-3.5 text-sm pb-3">
              <div className="flex justify-between font-body text-amber-700">
                <span>MRP (incl. of all taxes)</span>
                <span className="font-num">{rupee(totalMrp)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between font-body text-green-600">
                  <span>Discount</span>
                  <span className="font-num">−{rupee(discount)}</span>
                </div>
              )}

              <div className="flex justify-between font-body text-amber-700">
                <span>Delivery Charges</span>
                <span className={`font-num ${shipping === 0 ? "text-green-600 font-semibold" : ""}`}>
                  {shipping === 0 ? "FREE" : rupee(shipping)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Amount Row (always visible, acts as expand trigger, sits at the bottom when expanded) */}
        <button
          type="button"
          onClick={() => setPriceDetailsOpen(!priceDetailsOpen)}
          className="w-full flex items-center justify-between p-4 text-left cursor-pointer select-none focus:outline-none"
        >
          <div className="flex items-center gap-1.5 font-body text-sm font-bold text-brand-900">
            <span>Total Amount</span>
            <ChevronDown
              size={16}
              className={`text-brand-500 transition-transform duration-500 ${priceDetailsOpen ? "rotate-180" : ""
                }`}
            />
          </div>
          <span className="font-num text-lg font-extrabold text-brand-900">
            {rupee(amount)}
          </span>
        </button>
      </div>

      <div className="md:flex md:items-start md:gap-6 pb-28 md:pb-0">
        {/* ── LEFT COLUMN ─────────────────────────────────────── */}
        <div className="space-y-4 md:space-y-5 md:flex-1 md:min-w-0">
          {/* Step bar aligned to the left column on desktop */}
          <div className="card p-3.5 sm:p-5 hidden md:block">
            <StepBar current="payment" />
          </div>

          <div className="card p-5 sm:p-6">
            {/* header (desktop only, hidden on mobile) */}
            <div className="hidden md:flex items-center gap-2 mb-5">
              <CreditCard size={18} className="text-brand-700" />
              <h2 className="font-display text-lg font-bold text-brand-900">
                Payment Method
              </h2>
            </div>

            {infoMessage && (
              <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-800 font-body text-sm rounded-xl px-4 py-3">
                {infoMessage}
              </div>
            )}

            {/* method cards */}
            <div className="space-y-3 mb-6">
              {visibleMethods.map((m) => (
                <div key={m.key}>
                  <button
                    type="button"
                    onClick={() => onSelect(m.key)}
                    className={`w-full flex items-center gap-4 p-4 border-2 rounded-2xl text-left transition-colors ${selected === m.key
                        ? "border-brand-700 bg-brand-50"
                        : "border-amber-100 hover:border-amber-300 bg-white"
                      }`}
                  >
                    {/* radio dot */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selected === m.key
                          ? "border-brand-700 bg-brand-700"
                          : "border-amber-300"
                        }`}
                    >
                      {selected === m.key && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>

                    {/* icon */}
                    <span
                      className={
                        selected === m.key ? "text-brand-700" : "text-amber-400"
                      }
                    >
                      {m.icon}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <p className="font-body text-sm font-semibold text-brand-900">
                          {m.label}
                        </p>
                        {m.key === "cod" && (
                          <span className="inline-block font-body text-[10px] text-amber-600 font-semibold border border-amber-300 rounded px-1.5 py-0.5 whitespace-nowrap">
                            Additional Charge ₹20
                          </span>
                        )}
                      </div>
                      <p className="font-body text-xs text-amber-500">{m.sub}</p>
                    </div>
                  </button>
                </div>
              ))}
            </div>

            {/* error banner */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN — Price Details (sticky on desktop) ─── */}
        <div className="hidden md:block mt-4 md:mt-0 md:w-96 md:shrink-0">
          <div className="md:sticky md:top-[88px] space-y-4">
            {/* ── Price Details ── */}
            <div className="card p-4 sm:p-5">
              <h3 className="font-body text-sm font-bold text-brand-900 mb-4">
                Price Details
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between font-body text-amber-700">
                  <span>MRP</span>
                  <span className="font-num">{rupee(totalMrp)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between font-body text-green-600">
                    <span>Discount</span>
                    <span className="font-num">−{rupee(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between font-body text-amber-700">
                  <span>Delivery Charges</span>
                  <span
                    className={`font-num ${shipping === 0 ? "text-green-600 font-semibold" : ""
                      }`}
                  >
                    {shipping === 0 ? "FREE" : rupee(shipping)}
                  </span>
                </div>

                <div className="flex justify-between font-body font-bold text-brand-900 text-base border-t border-amber-100 pt-3">
                  <span>Total Amount</span>
                  <span className="font-num">{rupee(amount)}</span>
                </div>
              </div>
            </div>

            {/* ── Place Order Action Box (hidden on mobile, visible on desktop/tablet md+) ── */}
            <div className="hidden md:flex items-center justify-between bg-white border border-amber-100 rounded-2xl p-4 shadow-sm">
              <div>
                {discount > 0 && (
                  <p className="font-num text-xs text-amber-400 line-through leading-none mb-1">
                    {rupee(totalMrp + shipping)}
                  </p>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="font-num text-lg font-extrabold text-brand-900 leading-none">
                    {rupee(amount)}
                  </span>
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-gray-300 flex items-center justify-center text-[9px] text-gray-400 font-semibold cursor-help"
                    title="Inclusive of all taxes & shipping"
                  >
                    i
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onPlaceOrder}
                disabled={placing || !selected}
                className="btn-md btn-primary px-6 py-2.5 shadow-sm"
              >
                {placing ? "Placing..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile fixed bottom bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-amber-100 px-4 py-3 safe-bottom flex items-center justify-between gap-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div>
          {discount > 0 && (
            <p className="font-num text-xs text-amber-400 line-through leading-none">
              {rupee(totalMrp + shipping)}
            </p>
          )}
          <p className="font-num text-lg font-bold text-brand-900 leading-tight">
            {rupee(amount)}
          </p>
        </div>
        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={placing || !selected}
          className="btn-lg btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {placing ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Placing Order...
            </>
          ) : (
            "Place Order"
          )}
        </button>
      </div>
    </>
  );
}
