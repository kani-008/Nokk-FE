import {
  CreditCard, Smartphone, Banknote, ArrowLeft, ChevronRight,
  Loader2, CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PAYMENT_METHODS = [
  {
    key:   "razorpay_upi",
    label: "UPI Payment",
    sub:   "Pay via GPay, PhonePe, Paytm, or any UPI app",
    icon:  <Smartphone size={20} />,
  },
  {
    key:   "razorpay",
    label: "Card Payment",
    sub:   "Pay via Credit/Debit cards, Net Banking, or Wallets",
    icon:  <CreditCard size={20} />,
  },
  {
    key:   "cod",
    label: "Cash on Delivery",
    sub:   "Pay when you receive",
    icon:  <Banknote size={20} />,
  },
];

export default function Payment({
  selected,
  onSelect,
  onBack,
  onPlaceOrder,
  amount,
  infoMessage = "",
  placing = false,
  error = "",
  placedOrderId = null,
}) {
  const navigate = useNavigate();

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
            Thank you for your purchase. Your order has been registered and is being processed.
          </p>
        </div>
        
        <button
          onClick={() => navigate("/my-orders", { state: { newOrderId: placedOrderId } })}
          className="btn-lg btn-primary w-full max-w-sm mt-2"
        >
          View My Orders
        </button>
      </div>
    );
  }

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
          </div>
        ))}
      </div>

      {/* error banner */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* nav buttons */}
      <div className="flex gap-2 sm:gap-3">
        {/* <button
          onClick={onBack}
          disabled={placing}
          className="btn-outline px-3 sm:px-5 py-2 text-xs sm:text-sm cursor-pointer whitespace-nowrap"
        >
          <ArrowLeft size={15} /> Back
        </button> */}
        <button
          onClick={onPlaceOrder}
          disabled={placing || !selected}
          className="btn-primary flex-1 px-4 sm:px-7 py-4 sm:py-3 text-xs sm:text-base whitespace-nowrap"
        >
          {placing ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Placing Order...
            </>
          ) : (
            `Place Order at ${new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            }).format(amount)}`
          )}
        </button>
      </div>
    </div>
  );
}